import { useRef, useState, useEffect } from "react";
import socket from "../services/socket";

export default function CanvasBoard({ color, tool, brushSize }) {

  const canvasRef = useRef(null);

  const [drawing, setDrawing] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);

  const [history, setHistory] = useState([]);
  const [redoStack, setRedoStack] = useState([]);

  useEffect(() => {

    socket.on("receive-draw", (data) => {
      drawLine(data.x, data.y, data.color, data.tool, data.brushSize);
    });

    return () => socket.off("receive-draw");

  }, []);

  const startDrawing = (e) => {

    const x = e.nativeEvent.offsetX;
    const y = e.nativeEvent.offsetY;

    setStartX(x);
    setStartY(y);

    const ctx = canvasRef.current.getContext("2d");

    ctx.beginPath();
    ctx.moveTo(x, y);

    setDrawing(true);

  };

  const draw = (e) => {

    if (!drawing) return;

    const x = e.nativeEvent.offsetX;
    const y = e.nativeEvent.offsetY;

    if (
      tool === "pencil" ||
      tool === "marker" ||
      tool === "highlighter" ||
      tool === "eraser"
    ) {

      drawLine(x, y, color, tool, brushSize);

      socket.emit("draw", { x, y, color, tool, brushSize });

    }

  };

  const stopDrawing = (e) => {

    if (!drawing) return;

    const ctx = canvasRef.current.getContext("2d");

    const x = e.nativeEvent.offsetX;
    const y = e.nativeEvent.offsetY;

    if (tool === "rectangle") {
      ctx.strokeRect(startX, startY, x - startX, y - startY);
    }

    if (tool === "circle") {

      const radius = Math.sqrt(
        Math.pow(x - startX, 2) + Math.pow(y - startY, 2)
      );

      ctx.beginPath();
      ctx.arc(startX, startY, radius, 0, 2 * Math.PI);
      ctx.stroke();

    }

    if (tool === "line") {

      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(x, y);
      ctx.stroke();

    }

    if (tool === "arrow") {

      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(x, y);
      ctx.stroke();

    }

    setDrawing(false);
    saveState();

  };

  const drawLine = (x, y, color, tool, brushSize) => {

    const ctx = canvasRef.current.getContext("2d");

    ctx.lineWidth = brushSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.globalAlpha = 1;

    if (tool === "pencil") ctx.strokeStyle = color;

    if (tool === "marker") {
      ctx.strokeStyle = color;
      ctx.lineWidth = brushSize * 2;
    }

    if (tool === "highlighter") {
      ctx.strokeStyle = color;
      ctx.globalAlpha = 0.3;
    }

    if (tool === "eraser") ctx.strokeStyle = "white";

    ctx.lineTo(x, y);
    ctx.stroke();

  };

  const saveState = () => {

    const canvas = canvasRef.current;
    const data = canvas.toDataURL();

    setHistory(prev => [...prev, data]);
    setRedoStack([]);

  };

  const undo = () => {

    if (history.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const newHistory = [...history];
    const lastState = newHistory.pop();

    setHistory(newHistory);
    setRedoStack(prev => [...prev, lastState]);

    const img = new Image();

    if (newHistory.length === 0) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    img.src = newHistory[newHistory.length - 1];

    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
    };

  };

  const redo = () => {

    if (redoStack.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const newRedo = [...redoStack];
    const state = newRedo.pop();

    setRedoStack(newRedo);
    setHistory(prev => [...prev, state]);

    const img = new Image();
    img.src = state;

    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
    };

  };

  const clearBoard = () => {

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();

    setHistory([]);
    setRedoStack([]);

  };

  const downloadBoard = () => {

    const canvas = canvasRef.current;

    const link = document.createElement("a");

    link.download = "whiteboard.png";
    link.href = canvas.toDataURL();

    link.click();

  };

  const cursorStyle =
    tool === "eraser" ? "not-allowed" :
    tool === "pencil" ? "crosshair" :
    tool === "marker" ? "crosshair" :
    tool === "highlighter" ? "crosshair" :
    "default";

  return (

    <div className="flex flex-col items-center">

      <canvas
        ref={canvasRef}
        width={1000}
        height={600}
        style={{ cursor: cursorStyle }}
        className="bg-white rounded-xl shadow-lg"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
      />

      <div className="flex gap-3 mt-4">

        <button onClick={undo} className="px-4 py-2 bg-blue-500 text-white rounded-lg">Undo</button>

        <button onClick={redo} className="px-4 py-2 bg-green-500 text-white rounded-lg">Redo</button>

        <button onClick={downloadBoard} className="px-4 py-2 bg-purple-600 text-white rounded-lg">Download</button>

        <button onClick={clearBoard} className="px-4 py-2 bg-red-500 text-white rounded-lg">Clear</button>

      </div>

    </div>

  );

}