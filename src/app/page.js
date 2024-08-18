"use client";
import ImageNext from "next/image";
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
  const [refreshImageTimeOut, setRefreshImageTimeOut] = useState(null);
  const [refreshImageTimeOutInterval, setRefreshImageTimeOutInterval] =
    useState(1000);
  const [dataTable, setDataTable] = useState([]);
  const [clientIpAddress, setClientIpAddress] = useState('');
  const [previewFileUploadImage, setPreviewFileUploadImage] = useState();
  const [statusSubmition, setstatusSubmition] = useState();
  const [webCamImagePreview, setWebCamImagePreview] = useState();
  const [apiIsRunning, setapiIsRunning] = useState(false);
  const [enableRefreshImageTimer, setEnableRefreshImageTimer] = useState(false);
  const [apiIsRunningMessage, setAPIIsRunningMessage] = useState(
    "your api is NOT running"
  );
  const [listFacesLastRecognized, setqtdFound] = useState([]);
  const [api_url, setapi_url] = useState(searchParams.api_url);
  const webcamRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      
      let response = await fetch(`https://api.ipify.org?format=json`); //.then((response) => {
      if (response.ok) {
        response.json().then((response) => {
          //console.log(response);
          setClientIpAddress(response.ip);
        });
      }
    };

    fetchData().catch(console.error);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      
      let response = await fetch(`${api_url}/api/hi?ipaddress=${clientIpAddress}`); //.then((response) => {
      setapiIsRunning(response.ok);
      if (response.ok) {
        response.json().then((response) => {
          //console.log(response);
          setAPIIsRunningMessage(response);
        });
      }
    };

    fetchData().catch(console.error);
  }, [clientIpAddress]);

  const downloadCSV = (clientIpAddress2) => {
    fetch(`${api_url}/api/download_csv?key_enviroment_url=${enviromentName}&ipaddress=${clientIpAddress2}`)  // URL do endpoint Flask
      .then(response => {
        if (!response.ok) {
          throw new Error('Erro ao fazer download do arquivo');
        }
        return response.blob();  // Converte a resposta para um blob
      })
      .then(blob => {
        // Criar uma URL temporária para o blob
        const url = window.URL.createObjectURL(blob);
        // Criar um elemento de âncora (link)
        const a = document.createElement('a');
        a.href = url;
        a.download = `data_${enviromentName}.csv`;  // Nome do arquivo para download
        document.body.appendChild(a);  // Anexa o link ao documento
        a.click();  // Simula um clique no link
        a.remove();  // Remove o link do documento
      })
      .catch(error => {
        console.error('Erro:', error);
      });
  };
  const sendPicture = async (e,clientIpAddress2) => {
    setstatusSubmition("sending....");
    const input = document.getElementById("imageToRecognize");

    let data2 = new FormData();
    const createXHR = () => new XMLHttpRequest();
    for (const file of input.files) {
      data2.append("files", file, file.name);
    }
    try {
      const response = await fetch(
        `${api_url}/api/recognize_face?key_enviroment_url=${enviromentName}&ipaddress=${clientIpAddress2}`,
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

      setqtdFound(data.lastRegonizedFaces);
      setDataTable(data.faces_know);

      //console.log(data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleFile = (event) => {
    //this.setState({ ...this.state, [e.target.name]: e.target.files[0] });
    //console.log(event);
    if (event.target.files && event.target.files[0]) {
      setPreviewFileUploadImage(URL.createObjectURL(event.target.files[0]));
    }
  };

  async function updateFaceName(uuid, new_name,clientIpAddress2) {
    try {
      // console.log(enviromentName);
      const response = await fetch(
        `${api_url}/api/update_face_name?key_enviroment_url=${enviromentName}&ipaddress=${clientIpAddress2}`,
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

  useEffect(() => {
    if (enableRefreshImageTimer) {
      let intervalRef = setInterval(async () => {
        await capture(clientIpAddress);
      }, refreshImageTimeOutInterval);
      setRefreshImageTimeOut(intervalRef);
      console.log("enabled");
    } else {
      console.log("dis-enabled");
      clearTimeout(refreshImageTimeOut);
    }
  }, [enableRefreshImageTimer,clientIpAddress]);

  const update_face_name = async (e, new_name, uuid,clientIpAddress2) => {
    clearTimeout(searchedTimeOut);
    let obj = dataTable.find((e) => e.uuid == uuid);
    obj.name = new_name;
    setSearchedTimeOut(
      setTimeout(async () => {
        await updateFaceName(uuid, new_name,clientIpAddress2);
      }, 500)
    );
  };
  const saveDataBase = async (clientIpAddress2) => {
    const response = await fetch(
      `${api_url}/api/save?key_enviroment_url=${enviromentName}&ipaddress=${clientIpAddress2}`
    );
    if (!response.ok) {
      throw new Error("Failed to fetch data");
    }

    const data = await response.json();
    // console.log(data);
  };
  const loadDataBase = async (clientIpAddress2) => {
    const response = await fetch(
      `${api_url}/api/load?key_enviroment_url=${enviromentName}&ipaddress=${clientIpAddress2}`
    );
    if (!response.ok) {
      throw new Error("Failed to fetch data");
    }

    const data = await response.json();
    //console.log(data);

    setDataTable(data);
  };
  const recognizeFace = async (imageSrc = None,clientIpAddress2) => {
    try {
      //console.log(enviromentName);
      const response = await fetch(
        `${api_url}/api/recognize_face?key_enviroment_url=${enviromentName}&ipaddress=${clientIpAddress2}`,
        {
          body: JSON.stringify({
            imageToRecognize: imageSrc,
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

      setqtdFound(data.lastRegonizedFaces);
      setDataTable(data.faces_know);

      var c = document.getElementById("myCanvas");
      var ctx = c.getContext("2d");
      var image = new Image();
      image.src = imageSrc;
      //console.log(data.lastRegonizedFaces);

      image.onload = function () {
        ctx.reset();
        data.lastRegonizedFaces.forEach((face) => {
          ctx.drawImage(this, 0, 0);
          ctx.font = "30px Arial";
          ctx.lineWidth = "2";
          ctx.fillStyle = "red";
          let obj = data.faces_know.find((e) => e.uuid == face.uuid);
          //(top, right, bottom, left)
          //fillRect(x=top, y=left, width= right - left, height= bottom-top)
          let [top, right, bottom, left] = face.location;
          ctx.rect(left, top, right - left, bottom - top);
          ctx.fillText(`${obj.name} - ${obj.qtd}`, left, top);
        });
        ctx.stroke();
      };
    } catch (error) {
      console.error(error);
    }
  };
  function getCursorPosition(canvas, event) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    //console.log("x: " + x + " y: " + y, event, canvas);
    return { x: x, y: y };
  }
  const drawPoint = (e) => {
    var c = document.getElementById("myCanvas");
    var ctx = c.getContext("2d");
    ctx.font = "50px Arial";
    let { x, y } = getCursorPosition(c, e);
    ctx.strokeText(`(${e.clientX},${e.clientY})`, x, y);
    ctx.arc(x, y, 20, 0, 2 * Math.PI);
    ctx.stroke();
  };
  const capture = useCallback(async (clientIpAddress2) => {
    const imageSrc = webcamRef.current.getScreenshot({
      width: 360,
      height: 202.5,
    });

    setWebCamImagePreview(imageSrc);
    await recognizeFace(imageSrc,clientIpAddress2);
  }, [webcamRef]);

  return (
    <>
      <h1>Attendance by Face Login</h1>

      <h2>
        A case of study to create a API using python+Flask and a Front End using
        NextJs
      </h2>
      <h3>Disclaimer:</h3>
      <div>
        To this interface works, all you have to do is run this comand line:
        <p>
          <code>
            docker run --rm -p 5001:5000
            angelocarlotto/face_recognition_api:v0.1
          </code>
        </p>
        <p> and then on your browser go to URL</p>
        <p>
          <code>
            https://face-login-ui.vercel.app/?api_url=http://127.0.0.1:5001&enviroment_name=enviromentNew
          </code>
        </p>
      </div>
      <div style={{ display: "flex" }}>
        <h2>API Status:</h2>
        <div
          style={{
            color: apiIsRunning ? "green" : "red",
            alignContent: "center",
          }}
        >
          {apiIsRunningMessage}
        </div>
      </div>
      <div style={{display:"flex"}}>
        <h2>Client IP Adress:</h2>
        <p>{clientIpAddress}</p>
      </div>
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
            setEnviromentName(e.target.value);
            // console.log(enviromentName);
          }}
        />
        <label>{enviromentName}</label>
      </div>
      <Webcam
        className={styles.video}
        audio={false}
        width={360}
        ref={webcamRef}
        screenshotQuality={1}
        mirrored={true}
        screenshotFormat="image/jpeg"
        videoConstraints={videoConstraints}
      // style={{width:360, height:202.5,  backgroundColor: "red" }}
      />
      <br />
      <button onClick={()=>saveDataBase(clientIpAddress)}>
        Save to <strong> {enviromentName}</strong>
      </button>
      <button onClick={()=>loadDataBase(clientIpAddress)}>
        Load from <strong> {enviromentName}</strong>
      </button>
      <div style={{ display: "flex" }}>
        <label htmlFor="setTimerEnable">
          Set timer {enableRefreshImageTimer ? "true" : "false"}
        </label>

        <input
          onChange={(e) => setEnableRefreshImageTimer(e.target.checked)}
          type="checkbox"
          name="setTimerEnable"
          id="setTimerEnable"
        />

        <div>
          <input
            type="range"
            id="volume"
            name="volume"
            min="100"
            max="2000"
            step={100}
            onChange={(e) => setRefreshImageTimeOutInterval(e.target.value)}
          />
          <label htmlFor="volume">
            Refresh Interval:{refreshImageTimeOutInterval}
          </label>
        </div>
      </div>
      <button onClick={()=>downloadCSV(clientIpAddress)}>Download Data TO CSV</button>
      <br />
      <button onClick={async()=>capture(clientIpAddress)} style={{color:"red"}}>
       ➡️➡️➡️ Click to know how many faces there are:⬅️⬅️⬅️
        <h1> {listFacesLastRecognized.length}</h1>
      </button>

      <br />
      <br />

      <form
        action={`${api_url}/api/recognize_face?key_enviroment_url=${enviromentName}&ipaddress=${clientIpAddress}`}
        method="POST"
        encType="multipart/form-data"
      >
        <input
          type="file"
          onChange={handleFile}
          name="imageToRecognize"
          id="imageToRecognize"
          multiple
        />

        <img
          className={styles.video}
          src={previewFileUploadImage}
          alt="preview"
          width={360}
        />
        {/* <input type="submit" name="submit2" value="Send pic" /> */}
      </form>
      <button onClick={(e)=>sendPicture(e,clientIpAddress)}>Send picture:{statusSubmition}</button>
      <br />

      <br />
      {webCamImagePreview && (
        <div className={styles.image_container}>
          <ImageNext
            src={webCamImagePreview}
            alt="screenshot"
            height={202.5}
            width={360}
            className={styles.video}
          />
          {listFacesLastRecognized.map(({ uuid, location }) => {
            let [top, right, bottom, left] = location;
            let obj = dataTable.find((e) => e.uuid == uuid);
            return (
              //(top[0], right[1], bottom[2], left[3])
              //fillRect(x=top, y=left, width= right - left, height= bottom-top)
              <div
                key={uuid}
                className={styles.dynamic_box}
                style={{
                  top: `${top}px`,
                  left: `${left}px`,
                  width: `${right - left}px`,
                  height: `${bottom - top}px`,
                }}
              >
                {obj.name}
              </div>
            );
          })}
        </div>
      )}

      <canvas
        id="myCanvas"
        width="360"
        height="202.5"
        onClick={drawPoint}
      // style={{ width: 360, height: 202.5, backgroundColor: "red" }}
      ></canvas>

      <table border={1}>
        <thead>
          <tr key={"asd22"}>
            <th>#</th>
            <th>uuid</th>
            <th>face_detected</th>
            <th>new name</th>
            <th>qtd</th>
            <th>first_detected</th>
            <th>last_detected</th>
            <th>Replicates</th>
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
                  <tr key={object.uuid}>
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
                          update_face_name(e, e.target.value, object.uuid,clientIpAddress)
                        }
                        value={object.name}
                      />
                    </td>
                    <td>{object.qtd}</td>
                    <td> {object.first_detected}</td>
                    <td>{object.last_detected}</td>
                    <td>

                      <select>
                        {dataTable.map(function (object, i) {

                          return (<option key={i} value={object.short_uuid}> {object.name}-{object.short_uuid}</option>);
                        })
                        }
                      </select>

                    </td>
                  </tr>
                ); //<ObjectRow obj={object} key={i} />;
              })}
        </tbody>
      </table>
    </>
  );
}
