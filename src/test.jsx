import React, { useRef, useEffect, useState, useCallback } from 'react'
// import {storage,imageRef, db} from "../firebase";
import './site.css';
import { ImEyedropper, ImFileText } from "react-icons/im";
import { BiPencil } from "react-icons/bi";
import { checkPointInsideBox, createRectangle } from '../Utils/Editor';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { Space, Switch } from 'antd';

const ClickMode = { "GetColor": 1, "Erase": 2, "SetText": 3, "ChoosePolygon": 4 };

export default function Canvas(props) {
    const { width, height, imageToShow, textToShow, imgElement } = props;
    const { pageId } = useParams();
    const navigate = useNavigate();
    console.log('Image url: ', imageToShow);
    const canvasRef = useRef(null);
    const canvasOriRef = useRef(null);
    const rectangleCanvasRef = useRef(null);

    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [clickMode, setClickMode] = useState(ClickMode.GetColor);
    const [color, setColor] = useState({ r: 0, g: 0, b: 0 });
    const [isPainting, setIsPainting] = useState(false);
    const [brushPixel, setBrushPixel] = useState(5);
    const [drawList, setDrawList] = useState([]);

    const [selecting, setSelecting] = useState(false);
    const [selectionPoints, setSelectionPoints] = useState([]);
    const [currentPointIndex, setCurrentPointIndex] = useState(0);
    const [isTranslateMode, setIsTranslateMode] = useState(false);
    const [chooseTranslate, setChooseTranslate] = useState(true);
    const [selection, setSelection] = useState({
        startX: 0,
        startY: 0,
        endX: 0,
        endY: 0
    });

    const [extractedText, setExtractedText] = useState('');
    const [isRectangleVisible, setIsRectangleVisible] = useState(false);
    const [translatedRectangle, setIsTranslatedRectangle] = useState(null);

    const startSelectionMode = () => {
        if (ClickMode.ChoosePolygon === clickMode) {
            setSelectionPoints([]);
            setCurrentPointIndex(0);
            console.log(selectionPoints)
            setSelecting(false);
            setClickMode(ClickMode.GetColor);
            return;
        }
        setClickMode(ClickMode.ChoosePolygon)
        const canvas = rectangleCanvasRef.current;
        const context = canvas.getContext('2d');
        context.strokeStyle = `rgb(255,0,0)`;
        setSelecting(true);
        console.log("start selection mode");
        setSelectionPoints([]);
        setCurrentPointIndex(0);
    }

    const erasePoint = (originalMousePosition, newMousePosition) => {
        console.log("draw line");
        if (!rectangleCanvasRef.current || clickMode !== ClickMode.Erase) {
            return;
        }
        console.log("gogogog");
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        if (context) {
            context.strokeStyle = 'white';
            context.lineJoin = 'round';
            context.lineWidth = brushPixel;
            setDrawList(drawList);
            context.beginPath();
            context.moveTo(originalMousePosition.x, originalMousePosition.y);
            context.lineTo(newMousePosition.x, newMousePosition.y);
            context.closePath();
            context.stroke();
        }
    };

    const erase = useCallback(
        (event) => {
            if (isPainting) {
                const newMousePosition = getCoordinates(event);
                if (mousePosition && newMousePosition) {
                    erasePoint(mousePosition, newMousePosition);
                    setMousePosition(newMousePosition);
                }
            }
        },
        [isPainting, mousePosition]
    );

    const exitErase = useCallback(() => {
        setIsPainting(false);
    }, []);

    const getCoordinates = (event) => {
        const { pageX, pageY } = event;
        const canvas = rectangleCanvasRef.current;
        const canvasRect = canvas.getBoundingClientRect();
        const x = pageX - canvasRect.left;
        const y = pageY - canvasRect.top;
        return { x, y };
    };

    const startErase = useCallback((event) => {
        const coordinates = getCoordinates(event);
        if (coordinates) {
            setIsPainting(true);
            setMousePosition(coordinates);
        }
    }, []);




    const drawRedLine = (point1, point2, color) => {
        if (!rectangleCanvasRef.current) {
            return;
        }
        const canvas = rectangleCanvasRef.current;
        const context = canvas.getContext('2d');
        if (context) {
            context.strokeStyle = color; // Set the stroke color to red
            context.lineJoin = 'round';
            context.lineWidth = 2;
            // setDrawList(drawList); // Remove or modify this line if it's not needed for red lines
            context.beginPath();
            context.moveTo(point1.x, point1.y);
            context.lineTo(point2.x, point2.y);
            context.closePath();
            context.stroke();
        }
    };

    const clearRectangleCanvas = () => {
        if (rectangleCanvasRef && rectangleCanvasRef.current) {
            const ctx = rectangleCanvasRef.current.getContext('2d');
            ctx.clearRect(0, 0, rectangleCanvasRef.current.width, rectangleCanvasRef.current.height);
        }
    };
    function handleToggleTranslate() {
        console.log(canvasRef);
        console.log("handleToggleTranslate", isTranslateMode);
        setIsTranslateMode(!isTranslateMode);
        // setChooseTranslate(!chooseTranslate);
        console.log("Choose Translate", chooseTranslate)
        if (chooseTranslate) {
            setChooseTranslate(false);
            // drawRectangle(points1, points2, 'red', 1, rectangleCanvasRef);
            for (let rect in translatedRectangle) {
                rect = translatedRectangle[rect];
                console.log("rect", rect);
                const point1 = {
                    x: rect.points[0] - 3,
                    y: rect.points[1] - 3
                }
                const point2 = {
                    x: rect.points[2] + 3,
                    y: rect.points[3] + 3
                }
                drawRectangle(point1, point2, 'red', 1, rectangleCanvasRef);
            }
        } else {
            setChooseTranslate(true);
            clearRectangleCanvas();            // rectangleCanvasRef document.createElement("canvas");
        }
    }

    const addSelectionPoint = useCallback(
        (event) => {
            if (clickMode == ClickMode.ChoosePolygon) {
                console.log("adding point");
                const coordinates = getCoordinates(event);
                console.log("Current mouse click", coordinates);
                setSelectionPoints(prevPoints => {
                    prevPoints[currentPointIndex] = coordinates;
                    return prevPoints;
                });
                console.log("Selection points", selectionPoints);
                setCurrentPointIndex(prevIndex => prevIndex + 1);
                if (currentPointIndex > 0) {
                    drawRedLine(selectionPoints[currentPointIndex - 1], coordinates, 'red');
                }
            }
        }, [selecting, getCoordinates]);
    const getRectangleTranslate = useCallback(
        (event) => {
            const coordinates = getCoordinates(event);
            console.log("Current mouse click getRectangleTranslate", coordinates);
            const chooseRectangle = checkPointInsideBox(coordinates, translatedRectangle);
            if (chooseRectangle != -1) {
                console.log("chooseRectangle", translatedRectangle[chooseRectangle].translated);
                document.getElementById("userInput").value = translatedRectangle[chooseRectangle].translated;
                let rect = translatedRectangle[chooseRectangle].points;
                let points = createRectangle(rect[0], rect[1], rect[2], rect[3]);
                console.log("points", points);
                setSelectionPoints(points);

            }

        }
    )
    // useEffect(() => {
    //     if (imgElement) {
    //         console.log(imgElement);
    //         const canvas = canvasRef.current;
    //         const ctx = canvas.getContext("2d");
    //         ctx.drawImage(imgElement, 0, 0, width, height);
    //         console.log("Image shape", width, height);

    //         const canvasOri = canvasOriRef.current;
    //         const ctxOri = canvasOri.getContext("2d");
    //         ctxOri.drawImage(imgElement, 0, 0, width - 100, height - 10);

    //     }
    // }, [imgElement]);
    useEffect(() => {
        const fetchImageData = async () => {
            try {
                const response = await fetch(`http://localhost:8001/pages/${pageId}/translate`);
                const data = await response.json();
                // console.log("Image data", data);
                if (data) {
                    const img = new Image();
                    img.src = data;

                    img.onload = () => {
                        const canvas = canvasRef.current;
                        const ctx = canvas.getContext("2d");
                        ctx.drawImage(img, 0, 0, width, height);
                        console.log("Image shape", width, height);


                    };
                } else {
                    drawFallbackImage();
                }
            } catch (error) {
                console.error('Error fetching image data:', error);
                drawFallbackImage();
            }
        };

        const drawFallbackImage = () => {
            if (imgElement) {
                console.log(imgElement);
                const canvas = canvasRef.current;
                const ctx = canvas.getContext("2d");
                ctx.drawImage(imgElement, 0, 0, width, height);
                console.log("Image shape", width, height);

                const canvasOri = canvasOriRef.current;
                const ctxOri = canvasOri.getContext("2d");
                ctxOri.drawImage(imgElement, 0, 0, width - 100, height - 10);
            }
        };
        if (imgElement) {
            const canvasOri = canvasOriRef.current;
            const ctxOri = canvasOri.getContext("2d");
            ctxOri.drawImage(imgElement, 0, 0, width - 100, height - 10);
        }
        fetchImageData();
    }, [imgElement]);

    useEffect(() => {
        console.log("useEffect startErase");
        if (!rectangleCanvasRef.current) {
            return;
        }
        const canvas = rectangleCanvasRef.current;
        canvas.addEventListener('mousedown', startErase);
        return () => {
            canvas.removeEventListener('mousedown', startErase);
        };
    }, [startErase]);

    useEffect(() => {
        if (!rectangleCanvasRef.current) {
            return;
        }
        const canvas = rectangleCanvasRef.current;
        canvas.addEventListener('mousemove', erase);
        return () => {
            canvas.removeEventListener('mousemove', erase);
        };
    }, [erase]);

    useEffect(() => {
        if (!canvasRef.current) {
            return;
        }
        const canvas = rectangleCanvasRef.current;
        canvas.addEventListener('mouseup', exitErase);
        canvas.addEventListener('mouseleave', exitErase);
        return () => {
            canvas.removeEventListener('mouseup', exitErase);
            canvas.removeEventListener('mouseleave', exitErase);
        };
    }, [exitErase]);
    useEffect(() => {
        if (!rectangleCanvasRef.current) return;
        const canvas = rectangleCanvasRef.current;
        canvas.addEventListener("click", addSelectionPoint);
        return () => {
            canvas.removeEventListener("click", addSelectionPoint);
        };
    }, [addSelectionPoint]);

    useEffect(() => {
        console.log("Chhose translate", chooseTranslate);
        if (!rectangleCanvasRef.current || chooseTranslate) return;
        if (clickMode === ClickMode.SetText) return;
        const canvas = rectangleCanvasRef.current;
        canvas.addEventListener("click", getRectangleTranslate);
        return () => {
            canvas.removeEventListener("click", getRectangleTranslate);
        };
    }, [chooseTranslate]);


    useEffect(() => {
        if (!translatedRectangle) {
            setSelectionPoints([]);
            console.log("translatedRectangle", width, height);
            const fetchTranslatedData = async (imgPath) => {
                
                try {
                    console.log(process.env.REACT_APP_API_TRANSLATE)
                    const path = imageToShow
                    const response = await axios.post(`http://localhost:8000/translate`, { path, width, height });
                    setIsTranslatedRectangle(response.data);
                } catch (error) {
                    console.log("Error when fetchTranslatedData", error);
                }
                return []
            }
            const fetchData = async () => {
                await fetchTranslatedData(imageToShow);
            }
            fetchData();
        }
    }, [width, height, imageToShow, translatedRectangle]);
    const canvasDrawHandler = (e) => {
        const canvas = rectangleCanvasRef.current;
        const ctx = canvas.getContext("2d");
        const rect = canvas.getBoundingClientRect();
        const newPos = {
            x: e.nativeEvent.clientX - rect.left,
            y: e.nativeEvent.clientY - rect.top,
        };
        console.log("Click mode", clickMode);
        let coordinates = getCoordinates(e);
        if (clickMode === ClickMode.GetColor) {
            const imgData = ctx.getImageData(newPos.x, newPos.y, 1, 1);
            console.log(imgData.data);
            setColor({ r: imgData.data[0], g: imgData.data[1], b: imgData.data[2] });
        } else if (clickMode === ClickMode.SetText) {

            const ctx2 = canvasRef.current.getContext("2d");
            var input = document.getElementById("userInput").value;
            console.log("input", input);
            var fontInput = document.getElementById("fontInput").value;
            var fontSizeInput = document.getElementById("fontSizeInput").value;
            // setColor('black');
            console.log("fontInput", fontInput);
            ctx2.fillStyle = 'black';
            ctx2.font = fontSizeInput + '' + fontInput;
            // ctx2.fillText(input, coordinates.x, coordinates.y);
            var lineheight = 15;
            var lines = input.split('\n');

            for (var i = 0; i < lines.length; i++)
                ctx2.fillText(lines[i], coordinates.x, coordinates.y + (i * lineheight));
            setClickMode(ClickMode.GetColor);
        }
        // else if (clickMode === ClickMode.Draw) {
        //     setIsPainting(true);
        // }
    };
    function iconControl() {
        if (clickMode === 1) {
            return <ImEyedropper size={50} />
        }
        if (clickMode === 2) {
            return <BiPencil size={50} />
        }
        if (clickMode === 3) {
            return <ImEyedropper size={50} />
        }
        if (clickMode === 4) {
            return <ImFileText size={50} />
        }
    }

    function cancelHandler() {
        navigate(-1);
    }
    function saveHandle() {
        saveCanvasImage(canvasRef.current, pageId);

    }
    return (
        <div id="container">
            <div class="canvasImage" style={{ position: 'relative', display: 'inline-block' }}>
                <h3 class="h3-ori">Original image </h3>
                <canvas
                    // onClick={canvasDrawHandler}
                    ref={canvasOriRef} width={width} height={height}
                    style={{ position: 'absolute', top: 50, left: 0 }}
                />


            </div>
            <div class="canvasImage" style={{ position: 'relative', display: 'inline-block' }}>
                <h3>Edit image </h3>
                <canvas
                    onClick={canvasDrawHandler}
                    ref={canvasRef} width={width} height={height}
                    style={{ position: 'absolute', top: 50, left: 10 }}
                />
                <canvas
                    onClick={canvasDrawHandler}
                    ref={rectangleCanvasRef} width={width} height={height}
                    style={{ position: 'absolute', top: 50, left: 10 }}
                />

            </div>
            <div class="optionsBanner">
                <div class="buttons">
                    {/* <button id="getColorBtn" onClick={() => setClickMode(ClickMode.GetColor)}>Get Color</button> */}
                    <button id="drawBtn" onClick={() => setClickMode(ClickMode.Erase)}>Erase</button>
                    <button id="choosePolygon" onClick={() => startSelectionMode()}>Choose Polygon</button>
                    <button id="fillWhite" onClick={() => fillSelection(selectionPoints, canvasRef)}>Fill white</button>
                    {/* <button id="save" onClick={() => saveCanvasImage(canvasRef.current)}>Save</button> */}
                </div>
                <div class="buttons">
                    {/* <label class="toggle">
                        <input type="checkbox" name="toggleSwitch" checked={isTranslateMode} onChange={handleToggleTranslate} />
                        <span class="slider"></span>
                        <span className="labels" data-on={isTranslateMode ? 'OFF' : 'ON'} data-off={isTranslateMode ? 'ON' : 'OFF'}>
                        </span>
                    </label> */}
                    <Switch checkedChildren="ON" unCheckedChildren="OFF" defaultChecked={false} onChange={handleToggleTranslate} />

                    <text>Translate Mode</text>
                </div>
                {/* #ccc; */}
                <br />
                {
                    iconControl()
                }
                <br />

                <div class="settings">
                    <select class="brushSize" value={brushPixel} onChange={(e) => setBrushPixel(e.target.value)}>
                        <option value={10}>10px</option>
                        <option value={20}>20px</option>
                        <option value={30}>30px</option>
                        <option value={40}>40px</option>
                        <option value={50}>50px</option>
                    </select>
                    {/* <button id="uploadChanged" onClick={uploadHandler}>Upload changed</button> */}

                    <button id="setTextBtn" onClick={() => setClickMode(ClickMode.SetText)}>Set Text</button>
                </div>
                {/* <input type="text" id="userInput" /> */}
                <textarea id="userInput" name="userInput"
                    rows="5" cols="50">
                    ...
                </textarea>

                <div class="textSettings">
                    <br />
                    <select name="fonts" id="fontInput">
                        <option value="Arial">Arial</option>
                        <option value="Georgia">Georgia</option>
                        <option value="Papyrus">Papyrus</option>
                    </select>
                    <select name="fontSize" id="fontSizeInput">
                        <option value="8px ">8px</option>
                        <option value="10px ">10px</option>
                        <option value="20px ">20px</option>
                        <option value="30px ">30px</option>
                        <option value="40px ">40px</option>
                        <option value="50px ">50px</option>
                    </select>
                </div>
                <div>
                    <div style={{ display: 'inline-block' }}>
                        <button type="button" className="submit-btn" onClick={saveHandle}>Save</button>
                        <button type="button" className="clear-btn" onClick={cancelHandler}>Cancel</button>
                    </div>
                </div>
            </div>
        </div>
    )
}
const drawRectangle = (point1, point2, color, lineWidth, targetCanvasRef) => {
    let x1 = point1.x;
    let y1 = point1.y;
    let x2 = point2.x;
    let y2 = point2.y;
    if (x1 > x2) {
        let temp = x1;
        x1 = x2;
        x2 = temp;
    }
    if (y1 > y2) {
        let temp = y1;
        y1 = y2;
        y2 = temp;
    }
    const canvas = targetCanvasRef.current;
    const context = canvas.getContext('2d');
    console.log("drawRectangle", color);
    context.strokeStyle = color; // Set the stroke color to red
    context.lineJoin = 'round';
    context.lineWidth = lineWidth;
    // setDrawList(drawList); // Remove or modify this line if it's not needed for red lines
    context.beginPath();
    context.moveTo(x1, y1);
    context.lineTo(x2, y1);
    context.lineTo(x2, y2);
    context.lineTo(x1, y2);
    context.lineTo(x1, y1);
    context.closePath();
    context.stroke();

};

const fillSelection = (points, targetCanvasRef) => {

    console.log("filling selection");
    console.log(points);

    if (!targetCanvasRef.current || points.length < 3) {
        return;
    }

    const canvas = targetCanvasRef.current;
    const context = canvas.getContext('2d');

    context.beginPath();
    context.moveTo(points[0].x, points[0].y);

    points.forEach((point) => {
        context.lineTo(point.x, point.y);
    });

    context.closePath();
    context.fillStyle = 'white';
    context.fill();

    // Draw white lines between points
    context.strokeStyle = 'white';
    context.lineWidth = 3; // Make sure the brushPixel value is defined
    context.lineJoin = 'round';
    context.stroke();
};




async function saveCanvasImage(canvas, pageId) {

    // Get the base64 encoded string of the current canvas
    const imageBase64 = canvas.toDataURL('image/png');

    // // Create a download link element
    // const downloadLink = document.createElement('a');
    // downloadLink.href = imageBase64;
    // downloadLink.download = 'canvas-image.png';

    // // Trigger the download by simulating a click event
    // downloadLink.click();
    const response = await axios.post('http://localhost:8001/pages/translate/', {
        translate_version: imageBase64,
        page_id: pageId
    });
    if (response.status === 200) {
        console.log("Save success");
    } else {
        console.log("Save failed");
    }
}

function saveEditImage(canvas) {
    // Get the base64 encoded string of the current canvas
    const imageBase64 = canvas.toDataURL('image/png');

    // Set the endpoint URL
    const endpointUrl = 'xxx/yy';

    // Set the headers for the Axios request
    const headers = {
        'Content-Type': 'image/png;base64'
    };

    // Send a PUT request to the API endpoint with the base64-encoded image data
    axios.put(endpointUrl, imageBase64, { headers: headers })
        .then(response => {
            console.log('Image updated successfully!');
        })
        .catch(error => {
            console.error('Error updating image: ' + error);
        });
}
