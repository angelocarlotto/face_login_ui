
"use client";
import { React, useEffect, useState, useCallback, useRef } from "react";
import Webcam from "react-webcam";
import styles from "../page.module.css";


export default function SelfRegistration({ searchParams }) {

    const selectDevices = useRef(null);
    const [devices, setDevices] = useState([]);
    const webcamRef = useRef(null);
    const [webCamImagePreview, setWebCamImagePreview] = useState();
    const [clientIpAddress, setClientIpAddress] = useState('');
    const [listFacesLastRecognized, setListFacesLastRecognized] = useState([]);
    const [deviceId, setDeviceId] = useState({});
    const [dataTable, setDataTable] = useState([]);
    const [qtdRequestes, setqtdRequestes] = useState(0);
    const [qtdResponses, setqtdResponses] = useState(0);
    const [api_url, setapi_url] = useState(searchParams.api_url);
    const [defaultHigth, setDefaultHigth] = useState(300);
    const [defaultWidth, setDefaultWidth] = useState(400);
    const [nameNewFace, setNameNewFace] = useState("");
    const [statusSubmition, setstatusSubmition] = useState();
    let controller = new AbortController();
    const [enviromentName, setEnviromentName] = useState(
        searchParams.enviroment_name
    );

    const recognizeFace = async (imageSrc = None, clientIpAddressAux, enviromentNameAux, apiURLAux,nameNewFaceAux) => {
        try {
            setqtdRequestes(prev => prev + 1);
            setstatusSubmition("sending....");
            const response = await fetch(
                `${apiURLAux}/api/recognize_face?key_enviroment_url=${enviromentNameAux}&ipaddress=${clientIpAddressAux}`,
                {
                    body: JSON.stringify({
                        imageToRecognize: imageSrc,
                        nameNewFace: nameNewFaceAux
                    }),

                    method: "POST",
                    headers: {
                        "Content-type": "application/json; charset=UTF-8",
                    },
                    signal: controller.signal
                }
            );
            setqtdResponses(prev => prev + 1);
            if (!response.ok) {
                //throw new Error("Failed to fetch data");
                setstatusSubmition("error");
            }
            else {
                const data = await response.json();
                setstatusSubmition(data.lastRegonizedFaces.length>0?"Sucess on registration":"Please try Again. Registration not completed.");
                setListFacesLastRecognized(data.lastRegonizedFaces);
                setDataTable(data.faces_know);
            }

        } catch (error) {
            console.error(error);
            setstatusSubmition("catch error");
        }
    };
    const sendPicture = async (e, clientIpAddressAux, enviromentNameAux, apiURLAux, nameNewFaceAux) => {
        setstatusSubmition("sending....");
        const input = document.getElementById("imageToRecognize");

        let data2 = new FormData();
        const createXHR = () => new XMLHttpRequest();
        for (const file of input.files) {
            data2.append("files", file, file.name);
        }

        data2.append("nameNewFace", nameNewFaceAux)
        try {
            setqtdRequestes(prev => prev + 1);
            const response = await fetch(
                `${apiURLAux}/api/recognize_face?key_enviroment_url=${enviromentNameAux}&ipaddress=${clientIpAddressAux}`,
                {
                    body: data2,
                    createXHR,
                    method: "POST",
                }
            );
            setqtdResponses(prev => prev + 1);
            if (!response.ok) {
                setstatusSubmition("error");
            }
            setstatusSubmition("Done");
            const data = await response.json();

            setListFacesLastRecognized(data.lastRegonizedFaces);
            setDataTable(data.faces_know);

            setstatusSubmition(data.lastRegonizedFaces.length>0?"Sucess on registration":"Please try Again. Registration not completed.");

            //console.log(data);
        } catch (error) {
            console.error(error);
            setstatusSubmition("catch error");
        }
    };


    const triggerChange = () => {
        if (selectDevices.current) {
            // Create and dispatch a new change event
            const event = new Event('change', { bubbles: true });
            selectDevices.current.dispatchEvent(event);
        }
    };
    const handleDevices = useCallback(
        mediaDevices => {
            setDevices(mediaDevices.filter(({ kind }) => kind === "videoinput"))
            triggerChange()
        },
        [setDevices]
    );

    useEffect(
        () => {
            navigator.mediaDevices.enumerateDevices().then(handleDevices);
        },
        [handleDevices]
    );

    const onDeviceChange = (e) => {
        let device = devices.find((item) => item.deviceId == e.target.value);
        if (device != undefined) {
            let capabilities = device.getCapabilities();
            let maxHeight = capabilities.height.max;
            let maxWidth = capabilities.width.max;
            let proportion = 200 / maxWidth;
            let ratioAux = maxWidth / maxHeight;
            setDefaultWidth(Number(maxWidth * proportion * ratioAux).toFixed(2));
            setDefaultHigth(Number(maxHeight * proportion * ratioAux).toFixed(2));

        }
        setDeviceId(e.target.value);
    }

    const onClickCheckIn = async (clientIpAddressAux, enviromentNameAux, apiURLAux,nameNewFaceAux) => {
        const imageSrc = webcamRef.current.getScreenshot({
            width: defaultWidth,
            height: defaultHigth
        });

        setWebCamImagePreview(imageSrc);
        await recognizeFace(imageSrc, clientIpAddressAux, enviromentNameAux, apiURLAux,nameNewFaceAux);
    }

    return (
        <>
            <div style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", gap: "1rem", flex: 0 }}>
                    <fieldset >
                        <legend><h2>WebCam Monitor</h2></legend>
                        <div style={{ display: "flex", gap: "0.2rem", paddingBottom: "1rem" }}>
                            <select ref={selectDevices} onChange={onDeviceChange}>
                                {devices.map((device, key) => (
                                    <option key={key} value={device.deviceId}>
                                        {device.label}
                                    </option>

                                ))}
                            </select>



                        </div>
                        <div >
                            <div>
                                <Webcam audio={false}
                                    ref={webcamRef}
                                    style={{ backgroundColor: "red" }}
                                    videoConstraints={{
                                        deviceId: deviceId,
                                        facingMode: "user",
                                    }}
                                    screenshotFormat="image/jpeg"
                                    width={defaultWidth}
                                    height={defaultHigth}
                                    screenshotQuality={1}
                                    mirrored={true}
                                />

                            </div>
                            <fieldset style={{ width: "100%", display: "flex", gap: "0.2rem", flexDirection: "column" }}>
                                <legend><h3> Register New User</h3></legend>
                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                    <label htmlFor="inputNameNewUser">Name new user</label>
                                    <input id="inputNameNewUser" value={nameNewFace} onChange={(e) => setNameNewFace(e.target.value)} placeholder="name new user"></input>
                                </div>
                                <input type="file" id="imageToRecognize" onChange={(e) => { setWebCamImagePreview(URL.createObjectURL(e.target.files[0])); }} multiple></input>
                                <div style={{ display: "flex", gap: "1rem" }}>
                                    <button onClick={(e) => sendPicture(e, clientIpAddress, enviromentName, api_url, nameNewFace)} disabled={!webCamImagePreview}>Register New From File</button>
                                    <button onClick={async () => onClickCheckIn(clientIpAddress, enviromentName, api_url,nameNewFace)}>Register New From Web Cam</button>
                                </div>
                                <div>
                                    <h1>{statusSubmition}</h1>
                                </div>
                            </fieldset>

                            {webCamImagePreview && (
                                <div style={{ position: "relative" }} >
                                    <img
                                        src={webCamImagePreview}
                                        alt="screenshot"
                                        height={defaultHigth}
                                        width={defaultWidth}
                                        style={{ backgroundColor: "green" }}
                                    />
                                    {listFacesLastRecognized.map(({ uuid, location }) => {
                                        let [top, right, bottom, left] = location;
                                        let faceDetected = dataTable.find((e) => e.uuid == uuid);
                                        let objPrincipal = dataTable.find((e) => e.uuid == faceDetected.principal_uuid);
                                        let objectList = dataTable.filter((face) => face.principal_uuid == objPrincipal.uuid);
                                        return (
                                            objPrincipal && <div
                                                key={objPrincipal.uuid}
                                                className={styles.dynamic_box}
                                                style={

                                                    {
                                                        position: "absolute",
                                                        top: `${top}px`,
                                                        left: `${left}px`,
                                                        width: `${right - left}px`,
                                                        height: `${bottom - top}px`,

                                                    }}
                                            >
                                                <span style={{
                                                    color: "red"
                                                    , backgroundColor: "white"
                                                    , position: "relative"

                                                    , fontSize: "0.8rem"
                                                    , top: -20
                                                }}> {objPrincipal.name} - {objectList.reduce((acc, item) => acc + item.qtd, 0)}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </fieldset>
                    <div style={{ backgroundColor: "black" }}>a</div>
                </div>
                {listFacesLastRecognized.map((e, i, a) => {

                    return (<div key={i}>{e.uuid}</div>)
                })}
            </div>
        </>);
}