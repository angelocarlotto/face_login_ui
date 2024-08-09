"use client";
import Image from "next/image";
import styles from "./page.module.css";

import Webcam from "react-webcam";
import { useEffect, useCallback, useState, useRef } from "react";
const videoConstraints = {
  width: 1280,
  height: 720,
  facingMode: "user",
};

export default function Home({ searchParams }) {
  //const router = useRouter();
  const [enviromentName, setEnviromentName] = useState(
    searchParams.enviroment_name
  );
  const [searchedTimeOut, setSearchedTimeOut] = useState(null);
  const [dataTable, setDataTable] = useState([]);
  const [image2, setImage2] = useState();
  const [statusSubmition, setstatusSubmition] = useState();
  const [image, setImage] = useState();
  const [apiIsRunning, setapiIsRunning] = useState(false);
  const [apiIsRunningMessage, setapiIsRunningMessage] = useState(
    "your api is NOT running"
  );
  const [qtdFound, setqtdFound] = useState();
  const [api_url, setapi_url] = useState(searchParams.api_url);
  const webcamRef = useRef(null);
  useEffect(() => {
    fetch(`${api_url}/api/hi`).then((response) => {
      setapiIsRunning(response.ok);
      if (response.ok) {
        response.json().then((response) => {
          console.log(response);
          setapiIsRunningMessage(response);
        });
      }
    });
  }, []);

  const sendPicture = async (e) => {
    //const { arg1 } = router.query; // 'arg1' will be 'value1'

    setstatusSubmition("sending....");
    const input = document.getElementById("file2");

    let data2 = new FormData();
    const createXHR = () => new XMLHttpRequest();
    for (const file of input.files) {
      data2.append("files", file, file.name);
    }
    try {
      const response = await fetch(
        `${api_url}/api/recognizeFace?key_enviroment_url=${enviromentName}`,
        {
          body: data2,
          createXHR,
          method: "POST",
        }
      );
      if (!response.ok) {
        throw new Error("Failed to fetch data");
      }
      setstatusSubmition("Done");
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

  async function newFunction(uuid, new_name) {
    try {
      console.log(enviromentName);
      const response = await fetch(
        `${api_url}/api/update_face_name?key_enviroment_url=${enviromentName}`,
        {
          body: JSON.stringify({
            uuid,
            new_name,
          }),

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
  }

  const update_face_name = async (e, new_name, uuid) => {
    clearTimeout(searchedTimeOut);
    let obj = dataTable.find((e) => e.uuid == uuid);
    obj.name = new_name;
    setSearchedTimeOut(
      setTimeout(async () => {
        await newFunction(uuid, new_name);
      }, 500)
    );
  };
  const saveDataBase = async () => {
    const response = await fetch(
      `${api_url}/api/save?key_enviroment_url=${enviromentName}`
    );
    if (!response.ok) {
      throw new Error("Failed to fetch data");
    }

    const data = await response.json();
    console.log(data);
  };
  const loadDataBase = async () => {
    const response = await fetch(
      `${api_url}/api/load?key_enviroment_url=${enviromentName}`
    );
    if (!response.ok) {
      throw new Error("Failed to fetch data");
    }

    const data = await response.json();
    console.log(data);

    setDataTable(data);
  };
  const recognizeFace = async (imageSrc = None) => {
    try {
      console.log(enviromentName);
      const response = await fetch(
        `${api_url}/api/recognizeFace?key_enviroment_url=${enviromentName}`,
        {
          body: JSON.stringify({
            face42: imageSrc,
          }),

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
      setqtdFound(data.qtdFaceDetected);
      setDataTable(data.faces_know);
      console.log(data);
    } catch (error) {
      console.error(error);
    }
  };

  const capture = useCallback(async () => {
    console.log(api_url);
    const imageSrc = webcamRef.current.getScreenshot();
    setImage(imageSrc);
    await recognizeFace(imageSrc);
  }, [webcamRef]);

  return (
    <>
      <h1>Attendance by Face Login</h1>

      <h2>
        A case of study to create a API using python+Flask and a Front End using
        NextJs
      </h2>
      <h2>API Status:</h2>
      <p>{apiIsRunning ? <p style={{ color: "green" }}> {apiIsRunningMessage}</p> : <p style={{ color: "red" }}>{apiIsRunningMessage}</p>}</p>
      {!apiIsRunning && (
        <>
          <br></br>{" "}
          <p style={{ color: "red" }}>
            on your URL you must have two arguments:api_url( a valid endpoint to
            your running API) and enviroment_name(any value)
          </p>
        </>
      )}

      <div>
        <label>Name of The Enviroment:</label>
        <input
          type="text"
          value={enviromentName}
          onChange={(e) => {
            console.log(e.target.value);
            setEnviromentName(e.target.value);
            console.log(enviromentName);
          }}
        />
        <label>{enviromentName}</label>
      </div>
      <Webcam
        audio={false}
        height={200}
        ref={webcamRef}
        screenshotFormat="image/jpeg"
        width={300}
        videoConstraints={videoConstraints}
      />
      <br />
      <button onClick={saveDataBase}>Save to {enviromentName}</button>
      <button onClick={loadDataBase}>Load from {enviromentName}</button>
      <br />
      <button onClick={capture}>
        Click to know how many faces there are:<h1> {qtdFound}</h1>
      </button>

      <br />
      <br />

      <form
        action="http://127.0.0.1:5001/api/recognizeFace?key_enviroment_url=angelo42_env"
        method="POST"
        encType="multipart/form-data"
      >
        <input type="file" onChange={handleFile} name="file2" id="file2" />
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
            dataTable
              .sort(
                (a, b) => new Date(b.last_detected) - new Date(a.last_detected)
              )
              .map(function (object, i) {
                return (
                  <>
                    <tr key={object.short_uuid}>
                      <td>
                        {i}-{object.index}
                      </td>
                      <td>{object.short_uuid}</td>
                      <td>
                        <img
                          src={object.encoded64_last_pic}
                          alt={object.last_know_shot}
                          width={50}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          onChange={(e) =>
                            update_face_name(e, e.target.value, object.uuid)
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
