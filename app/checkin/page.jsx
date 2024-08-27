"use client";
import ImageNext from "next/image";
import { React, useEffect, useState, useCallback, useRef } from "react";
import Webcam from "react-webcam";
import { useQRCode } from 'next-qrcode';
import styles from "../page.module.css";
//store the original fetch

export default function CheckIn({ searchParams }) {
    const { Canvas } = useQRCode();
    const [apiIsRunningMessage, setAPIIsRunningMessage] = useState(
        "your api is NOT running"
    ); const [previewFileUploadImage, setPreviewFileUploadImage] = useState();
    let controller = new AbortController();

    const [nameNewFace, setNameNewFace] = useState("");
    const [qtdRequestes, setqtdRequestes] = useState(0);
    const [qtdResponses, setqtdResponses] = useState(0);
    const [statusSubmition, setstatusSubmition] = useState();
    const [dataTable, setDataTable] = useState([]);
    const [searchedTimeOut, setSearchedTimeOut] = useState(null);
    const [apiIsRunning, setapiIsRunning] = useState(false);
    const [defaultHigth, setDefaultHigth] = useState(300);
    const [defaultWidth, setDefaultWidth] = useState(400);
    const [imageRatio, setImageRatio] = useState(null);
    const [listFacesLastRecognized, setqtdFound] = useState([]);
    const [frequencyRefreshImage, setFrequencyRefreshImage] = useState(1000);
    const [timerPrintScreen, setTimerPrintScreen] = useState(null);
    const [startTimer, setStartTimer] = useState(false);
    const [deviceId, setDeviceId] = useState({});
    const [devices, setDevices] = useState([]);
    const selectDevices = useRef(null);
    const webcamRef = useRef(null);
    const [webCamImagePreview, setWebCamImagePreview] = useState();
    const [clientIpAddress, setClientIpAddress] = useState('');

    const [api_url, setapi_url] = useState(searchParams.api_url);
    const [enviromentName, setEnviromentName] = useState(
        searchParams.enviroment_name
    );
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


    useEffect(() => {
        const fetchData = async () => {
            setqtdRequestes(prev => prev + 1);
            let response = await fetch(`https://api.ipify.org?format=json`);
            setqtdResponses(prev => prev + 1);
            if (response.ok) {
                response.json().then((response) => {
                    setClientIpAddress(response.ip);
                });
            }
        };

        fetchData().catch(console.error);
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            setqtdRequestes(prev => prev + 1);
            let response = await fetch(`${api_url}/api/hi?ipaddress=${clientIpAddress}`); //.then((response) => {
            setapiIsRunning(response.ok);
            setqtdResponses(prev => prev + 1);
            if (response.ok) {
                response.json().then((response) => {
                    setAPIIsRunningMessage(response);
                });
            }
        };

        fetchData().catch(console.error);
    }, [clientIpAddress]);


    useEffect(() => {
        clearInterval(timerPrintScreen);

        if (!startTimer) {
            controller.abort();
            controller = new AbortController();
        }
        if (startTimer)
            setTimerPrintScreen(setInterval(async () => {
                await onClickCheckIn(clientIpAddress, enviromentName, api_url);
            }, frequencyRefreshImage))
    }
        ,
        [startTimer, frequencyRefreshImage, clientIpAddress, enviromentName, api_url]
    );



    const onDeviceChange = (e) => {
        let device = devices.find((item) => item.deviceId == e.target.value);
        if (device != undefined) {
            let capabilities = device.getCapabilities();
            let maxHeight = capabilities.height.max;
            let maxWidth = capabilities.width.max;
            let proportion = 200 / maxWidth;
            let ratioAux = maxWidth / maxHeight;
            setImageRatio(ratioAux);
            setDefaultWidth(Number(maxWidth * proportion * ratioAux).toFixed(2));
            setDefaultHigth(Number(maxHeight * proportion * ratioAux).toFixed(2));

        }
        setDeviceId(e.target.value);
    }

    const onClickCheckIn = async (clientIpAddressAux, enviromentNameAux, apiURLAux) => {
        const imageSrc = webcamRef.current.getScreenshot({
            width: defaultWidth,
            height: defaultHigth
        });

        setWebCamImagePreview(imageSrc);
        await recognizeFace(imageSrc, clientIpAddressAux, enviromentNameAux, apiURLAux);
    }

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



    async function deleteFace(uuid, clientIpAddressAux, enviromentNameAux, apiURLAux) {
        try {
            setqtdRequestes(prev => prev + 1);
            const response = await fetch(
                `${apiURLAux}/api/delete_face?key_enviroment_url=${enviromentNameAux}&ipaddress=${clientIpAddressAux}`,
                {
                    body: JSON.stringify({
                        uuid,

                    }),

                    method: "DELETE",
                    headers: {
                        "Content-type": "application/json; charset=UTF-8",
                    },
                }
            );
            setqtdResponses(prev => prev + 1);
            if (!response.ok) {
                throw new Error("Failed to fetch data");
            }

            const data = await response.json();
            setDataTable(data);
        } catch (error) {
            console.error(error);
        }
    }
    const update_face_name = async (e, new_name, uuid, clientIpAddressAux, enviromentNameAux, apiURLAux) => {
        clearTimeout(searchedTimeOut);
        let obj = dataTable.find((e) => e.uuid == uuid);
        obj.name = new_name;
        setSearchedTimeOut(
            setTimeout(async () => {
                await updateFaceName(uuid, new_name, clientIpAddressAux, enviromentNameAux, apiURLAux);
            }, 500)
        );
    };
    const mergeTwoFaces = async (e, uuid, clientIPAddressAux, enviromentAux, apiURLAux) => {
        try {
            setqtdRequestes(prev => prev + 1);
            const response = await fetch(
                `${apiURLAux}/api/bind_to_principal_face?key_enviroment_url=${enviromentAux}&ipaddress=${clientIPAddressAux}`,
                {
                    body: JSON.stringify({
                        uuidPrincipal: e.target.value,
                        uuid: uuid
                    }),

                    method: "POST",
                    headers: {
                        "Content-type": "application/json; charset=UTF-8",
                    },
                }
            );
            setqtdResponses(prev => prev + 1);
            if (!response.ok) {
                throw new Error("Failed to fetch data");
            }

            const data = await response.json();
            setDataTable(data);
        } catch (error) {
            console.error(error);
        }
    }
    async function updateFaceName(uuid, new_name, clientIpAddressAux, enviromentNameAux, apiURLAux) {
        try {
            setqtdRequestes(prev => prev + 1);
            const response = await fetch(
                `${apiURLAux}/api/update_face_name?key_enviroment_url=${enviromentNameAux}&ipaddress=${clientIpAddressAux}`,
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
            setqtdResponses(prev => prev + 1);
            if (!response.ok) {
                throw new Error("Failed to fetch data");
            }

            const data = await response.json();
            setDataTable(data);
        } catch (error) {
            console.error(error);
        }
    }
    const downloadCSV = (clientIpAddressAux, enviromentNameAux, apiURLAux) => {
        setqtdRequestes(prev => prev + 1);
        fetch(`${apiURLAux}/api/download_csv?key_enviroment_url=${enviromentNameAux}&ipaddress=${clientIpAddressAux}`)  // URL do endpoint Flask
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
        setqtdResponses(prev => prev + 1);
    };
    const saveDataBase = async (clientIpAddressAux, enviromentNameAux, apiURLAux) => {
        setqtdRequestes(prev => prev + 1);
        const response = await fetch(
            `${apiURLAux}/api/save?key_enviroment_url=${enviromentNameAux}&ipaddress=${clientIpAddressAux}`
            , { method: "POST" });
        setqtdResponses(prev => prev + 1);
        if (!response.ok) {
            throw new Error("Failed to fetch data");
        }

        const data = await response.json();
    };
    const loadDataBase = async (clientIpAddressAux, enviromentNameAux, apiURLAux) => {
        setqtdRequestes(prev => prev + 1);
        const response = await fetch(
            `${apiURLAux}/api/load?key_enviroment_url=${enviromentNameAux}&ipaddress=${clientIpAddressAux}`
        );
        setqtdResponses(prev => prev + 1);
        if (!response.ok) {
            throw new Error("Failed to fetch data");
        }

        const data = await response.json();

        setDataTable(data);
    };

    const loadDataBaseFromMemory = async (clientIpAddressAux, enviromentNameAux, apiURLAux) => {
        setqtdRequestes(prev => prev + 1);
        const response = await fetch(
            `${apiURLAux}/api/load_from_memory?key_enviroment_url=${enviromentNameAux}&ipaddress=${clientIpAddressAux}`
        );
        setqtdResponses(prev => prev + 1);
        if (!response.ok) {
            throw new Error("Failed to fetch data");
        }

        const data = await response.json();

        setDataTable(data);
    };
    const recognizeFace = async (imageSrc = None, clientIpAddressAux, enviromentNameAux, apiURLAux) => {
        try {
            setqtdRequestes(prev => prev + 1);
            const response = await fetch(
                `${apiURLAux}/api/recognize_face?key_enviroment_url=${enviromentNameAux}&ipaddress=${clientIpAddressAux}`,
                {
                    body: JSON.stringify({
                        imageToRecognize: imageSrc,
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
            }
            else {
                const data = await response.json();

                setqtdFound(data.lastRegonizedFaces);
                setDataTable(data.faces_know);
            }

        } catch (error) {
            console.error(error);
        }
    };


    return (
        <>
            <style jsx>{`

            table{
            width:100%}
        table, th, tr, td {
         border: 1px solid
        }
      `}</style>

            <div style={{ backgroundColor: "blue", paddingLeft: "3rem", padding: "3rem", overflow: "scroll" }}>
                <h1>Smart Attendance by Face Login</h1>
                <div style={{ display: "flex", flexDirection: "row", gap: "0.2rem", flexGrow: "1", justifyContent: "space-between" }}>
                    <fieldset style={{ backgroundColor: "red", padding: "2rem", display: "flex", flexDirection: "row", gap: "0.2rem" }}>
                        <legend><h1> Instructions</h1></legend>

                        <div>
                            <strong>
                                A case of study to create a API using python+Flask and a Front End using
                                NextJs
                            </strong>
                            <h3>Disclaimer:</h3>
                            <div>
                                To this interface works, all you have to do is run this comand line:
                                <p>
                                    <code>
                                        docker run --rm -p 5001:5000
                                        angelocarlotto/face_recognition_api:latest
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
                                <p> <strong>Request/Responses:</strong>{qtdRequestes}/{qtdResponses} </p>
                            </div>
                        </div>

                    </fieldset>
                    <fieldset style={{ minWidth: "20rem", padding: "2rem", color: "black", backgroundColor: "yellow" }}>
                        <legend><h1> To Do</h1></legend>
                        <ol>
                            <li>
                                Anti spoofing
                            </li>
                            <li>
                                IoT(ESP32) integration
                            </li>
                            <li>
                                capability to make request and a face is recognized
                            </li>
                            <li>
                                load data from server on page enter/accessed
                            </li>
                            <li>
                                persist data autoside container, so data not lost when constainer is shutdown
                            </li>
                            <li>
                                Merge faces, so several faces become one
                            </li>
                            <li>
                                QrCode + Self registration
                            </li>
                            <li>
                                Sections inside an inviroment. Where enviroment could represent a whole company, and a sections can represent only one meeting. Or the enviroment represent a whole college and a section representc a course secrion, example: introduction_python
                            </li>
                        </ol>
                    </fieldset>
                </div>
                <div style={{ display: "flex", flexDirection: "row", gap: "0.2rem", flexGrow: "1", justifyContent: "space-between" }}>
                    <fieldset>
                        <legend><h2>WebCam Monitor</h2></legend>
                        <div style={{ display: "flex", gap: "0.2rem", paddingBottom: "1rem" }}>
                            <select ref={selectDevices} onChange={onDeviceChange}>
                                {devices.map((device, key) => (
                                    <option key={key} value={device.deviceId}>
                                        {device.label}
                                    </option>

                                ))}
                            </select>

                            <button onClick={async () => onClickCheckIn(clientIpAddress, enviromentName, api_url)}>CheckIn</button>

                            <label htmlFor="checkBoxStartTimer" >Automatic update</label>
                            <input id="checkBoxStartTimer" type="checkbox" value={startTimer} onChange={(e) => setStartTimer(e.target.checked)} />
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
                                        let obj = dataTable.find((e) => e.uuid == uuid);
                                        return (
                                            obj && <div
                                                key={uuid}
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

                                                    , fontSize: "10px"
                                                    , top: -20
                                                }}> {obj.name} - {obj.qtd}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </fieldset>
                    <fieldset style={{ minWidth: "30rem" }}>
                        <legend><h2>Controls and Configuration...</h2></legend>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem", justifyContent: "space-between" }}>
                            <div style={{ display: "flex", justifyContent: "start" }}>
                                <label><strong >Api Status:</strong> </label>
                                <p>status????</p>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <label htmlFor="inputDefaultWidth">Default Width x Height</label>
                                <input id="inputDefaultWidth" type="number" placeholder="any number" value={defaultWidth} onChange={(e) => { setDefaultWidth(Number(e.target.value).toFixed(2)); setDefaultHigth(Number(e.target.value / (imageRatio)).toFixed(2)) }}></input>
                                <label >vs</label>
                                <input id="inputDefaultHeigth" type="number" placeholder="any number" value={defaultHigth} onChange={(e) => { setDefaultHigth(Number(e.target.value).toFixed(2)); setDefaultWidth(Number(e.target.value * imageRatio).toFixed(2)) }}></input>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <label htmlFor="inputClientID">Client Ip Adress</label>
                                <input id="inputClientID" readOnly={true} placeholder="0.0.0.0" value={clientIpAddress} onChange={(e) => setClientIpAddress(e.target.value)}></input>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <label htmlFor="inputEnviroment">Enviroment</label>
                                <input id="inputEnviroment" placeholder="any value" value={enviromentName} onChange={(e) => setEnviromentName(e.target.value)}></input>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <label htmlFor="inputAPIURL">API URL</label>
                                <input id="inputAPIURL" placeholder="http://0.0.0.0:5000" value={api_url} onChange={(e) => setapi_url(e.target.value)}></input>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <label htmlFor="inputFrequencyImageRefresh">Frequency Image Refresh</label>
                                <input id="inputFrequencyImageRefresh" placeholder="41" type="number" value={frequencyRefreshImage} onChange={(e) => setFrequencyRefreshImage(e.target.value)}></input>
                                <select onChange={(e) => setFrequencyRefreshImage(1000 / e.target.value)}>
                                    <option value={1}>1fps</option>
                                    <option value={5}>5fps</option>
                                    <option value={10}>10fps</option>
                                    <option value={20}>20fps</option>
                                    <option value={24}>24fps</option>
                                    <option value={25}>25fps</option>
                                    <option value={29}>29fps</option>
                                    <option value={30}>30fps</option>
                                    <option value={48}>48fps</option>
                                    <option value={50}>50fps</option>
                                    <option value={59}>59fps</option>
                                    <option value={60}>60fps</option>
                                </select>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <button onClick={() => saveDataBase(clientIpAddress, enviromentName, api_url)}>Save(Persist the enviroment data on disk)</button>
                                <button onClick={() => loadDataBase(clientIpAddress, enviromentName, api_url)}>Load (Load the enviroment data on disk)</button>
                                <button onClick={() => loadDataBaseFromMemory(clientIpAddress, enviromentName, api_url)}>Load from Memory</button>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <button onClick={() => downloadCSV(clientIpAddress, enviromentName, api_url)}>Download CSV report</button>
                            </div>
                            <fieldset style={{ width: "100%", display: "flex", gap: "0.2rem", flexDirection: "column" }}>
                                <legend><h3> Register New User</h3></legend>
                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                    <label htmlFor="inputNameNewUser">Name new user</label>
                                    <input id="inputNameNewUser" value={nameNewFace} onChange={(e) => setNameNewFace(e.target.value)} placeholder="name new user"></input>
                                </div>
                                <input type="file" id="imageToRecognize" onChange={(e) => { setWebCamImagePreview(URL.createObjectURL(e.target.files[0])); setPreviewFileUploadImage(URL.createObjectURL(e.target.files[0])); }} multiple></input>
                                <img alt="preview image" src={previewFileUploadImage} height={defaultHigth} width={defaultHigth} />
                                <button onClick={(e) => sendPicture(e, clientIpAddress, enviromentName, api_url, nameNewFace)}>Register New:{statusSubmition}</button>
                            </fieldset>

                            <Canvas
                                text={`https://${window.location.host}/checkin?api_url=${api_url}&enviroment_name=${enviromentName}`}
                                options={{
                                    errorCorrectionLevel: 'M',
                                    margin: 3,
                                    scale: 4,
                                    width: 200,
                                    color: {
                                        dark: '#010599FF',
                                        light: '#FFBF60FF',
                                    },
                                }}
                            />
                        </div>
                    </fieldset>
                </div>
                <fieldset>
                    <legend><h2>List Faces Recognized</h2></legend>
                    <table >
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>UUID</th>
                                <th>Image</th>
                                <th>new Name</th>
                                <th>Qtd</th>
                                <th>first_detected</th>
                                <th>last_detected</th>
                                <th>Main Face</th>
                                <th>Grouping Faces</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {dataTable.length > 0 && (<>{
                                new Set(dataTable.map(e => e.pricipal_uuid)).keys().toArray().map((key, i, a) => {
                                    let object = dataTable.find((face) => face.uuid == key);
                                    let objectList = dataTable.filter((face) => face.pricipal_uuid == key);

                                    const result = objectList.reduce((acc, record) => {
                                        // Parse dates using the Date constructor
                                        const firstDate = new Date(record.first_detected);
                                        const lastDate = new Date(record.last_detected);

                                        // Update earliest date
                                        if (!acc.earliest || firstDate < acc.earliest) {
                                            acc.earliest = firstDate;
                                        }

                                        // Update latest date
                                        if (!acc.latest || lastDate > acc.latest) {
                                            acc.latest = lastDate;
                                        }

                                        return acc;
                                    }, {});
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
                                                        update_face_name(e, e.target.value, object.uuid, clientIpAddress, enviromentName, api_url)
                                                    }
                                                    value={object.name}
                                                />
                                            </td>
                                            <td>{objectList.reduce((a, b) => a + b.qtd, 0)}</td>
                                            <td> {result.latest.toLocaleTimeString()}</td>
                                            <td>{result.latest.toLocaleTimeString()}</td>
                                            <td>
                                                <select defaultValue={object.pricipal_uuid} onChange={async (e) => await mergeTwoFaces(e, object.uuid, clientIpAddress, enviromentName, api_url)}>
                                                    <option >Select...</option>
                                                    {dataTable.filter((e) => e.uuid != object.uuid).map(function (objectAux, i) {
                                                        return (<option key={objectAux.uuid} value={objectAux.uuid}> {objectAux.name}-{objectAux.short_uuid}</option>);
                                                    })
                                                    }
                                                </select>
                                            </td>
                                            <td> {objectList.length - 1}</td>
                                            <td> <button onClick={async (e) =>
                                                await deleteFace(object.uuid, clientIpAddress, enviromentName, api_url)
                                            }>Delete</button></td>

                                        </tr>
                                    );
                                })
                            }</>)}

                        </tbody>

                        <tfoot>

                        </tfoot>
                    </table>
                </fieldset>
            </div>
        </>
    );

}