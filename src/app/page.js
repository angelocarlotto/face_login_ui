"use client";
import Image from "next/image";
import styles from "./page.module.css";
import Webcam from "react-webcam";
import React, { useEffect, useCallback, useState, useRef } from "react";
const videoConstraints = {
  width: 1280,
  height: 720,
  facingMode: "user",
};

export default function Home() {
  const sendPicture = async (e) => {
    setstatusSubmition("sending....")
    const input = document.getElementById('file2');
    
    let data2 = new FormData();
    data2.append("key_enviroment","angelo42_env")
    const createXHR = () => new XMLHttpRequest()
    for (const file of input.files) {
      data2.append('files',file,file.name)
    }
    try {
      const response = await fetch("http://127.0.0.1:5000/api/recognizeFace", {
        body:  data2,
        createXHR,
        method: "POST",
        
      });
      if (!response.ok) {
        throw new Error("Failed to fetch data");
      }
      setstatusSubmition("Done")
      const data = await response.json();
      setqtdFound(data.qtdFaceDetected);
      setDataTable(data.faces_know);
      
      console.log(data);
    } catch (error) {
      console.error(error);
    }
  };
  const handleFile = (event) => {
    //this.setState({ ...this.state, [e.target.name]: e.target.files[0] });
    console.log(event);
    if (event.target.files && event.target.files[0]) {
      setImage2(URL.createObjectURL(event.target.files[0]));
    }
  };

  const update_face_name = async (new_name, uuid) => {
    /*setDataTable(
      dataTable.map((item) => {
        if (item.uuid == uuid) {
          item.name = new_name;
        }
        return item;
      })
    );
    */
    try {
      const response = await fetch(
        "http://127.0.0.1:5000/api/update_face_name",
        {
          body: JSON.stringify({ uuid, new_name,key_enviroment:"angelo42_env" }),

          method: "POST",
          headers: {
            "Content-type": "application/json; charset=UTF-8",
          },
        }
      );
      if (!response.ok) {
        throw new Error("Failed to fetch data");
      }

      const data = await response.json();
      setDataTable(data);
    } catch (error) {
      console.error(error);
    }
  };

  const recognizeFace = async (imageSrc = None) => {
    try {
      const response = await fetch("http://127.0.0.1:5000/api/recognizeFace", {
        body: JSON.stringify({ face42: imageSrc,key_enviroment:"angelo42_env" }),

        method: "POST",
        headers: {
          "Content-type": "application/json; charset=UTF-8",
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch data");
      }

      const data = await response.json();
      setqtdFound(data.qtdFaceDetected);
      setDataTable(data.faces_know);
      console.log(data);
    } catch (error) {
      console.error(error);
    }
  };
  const [dataTable, setDataTable] = useState([]);
  const [image2, setImage2] = useState();
  const [statusSubmition, setstatusSubmition] = useState();

  const [image, setImage] = useState();
  const [qtdFound, setqtdFound] = useState();

  const webcamRef = useRef(null);
  const capture = useCallback(async () => {
    const imageSrc = webcamRef.current.getScreenshot();
    setImage(imageSrc);
    await recognizeFace(imageSrc);
  }, [webcamRef]);

  return (
    <>
      <h1>Attendance by Face Login</h1>
      <Webcam
        audio={false}
        height={200}
        ref={webcamRef}
        screenshotFormat="image/jpeg"
        width={300}
        videoConstraints={videoConstraints}
      />
      <br />
      <button onClick={capture}>
        Click to know how many faces there are:<h1> {qtdFound}</h1>
      </button>

      <br />
      <br />

      <form
        action="http://127.0.0.1:5000/api/recognizeFace"
        method="POST"
        encType="multipart/form-data"
      >
        <input type="file" onChange={handleFile} name="file2"   id="file2"/>
        <img src={image2} alt="preview" width={200} />
        {/* <input type="hidden" name="image2" value={image2} /> */}
        {/* <input type="submit" name="submit2" value="Send pic" /> */}
      </form>
      <button onClick={sendPicture}>Send picture:{statusSubmition}</button>
      <br />

      <br />
      {image && <Image src={image} alt="screenshot" height={200} width={300} />}
      <table border={1}>
        <thead>
          <tr>
            <th>#</th>
            <th>uuid</th>
            <th>face_detected</th>
            <th>new name</th>
            <th>qtd</th>
            <th>first_detected</th>
            <th>last_detected</th>
            
          </tr>
        </thead>
        <tbody>
          {dataTable.length > 0 &&
            dataTable.sort((a,b)=>new Date(b.last_detected)-new Date(a.last_detected)).map(function (object, i) {
              return (
                <>
                  <tr key={object.short_uuid}>
                    <td>{i}-{object.index}</td>
                    <td>{object.short_uuid}</td>
                    <td><img src={object.encoded64_last_pic} alt={object.last_know_shot} width={50}/></td>
                    <td>
                      <input
                        type="text"
                        onChange={(e) =>
                          update_face_name(e.target.value, object.uuid)
                        }
                        value={object.name}
                      />
                    </td>
                    <td>{object.qtd}</td>
                    <td> {object.first_detected}</td>
                    <td>{object.last_detected}</td>
                    
                  </tr>
                </>
              ); //<ObjectRow obj={object} key={i} />;
            })}
        </tbody>
      </table>
    </>
  );
}
