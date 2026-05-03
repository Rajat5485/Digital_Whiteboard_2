import { useRef, useState, useEffect, useCallback } from "react";
import socket from "../services/socket";
import { jsPDF } from "jspdf";

export default function useCanvas({ classId, color, tool, brushSize, isAllowedToDraw }) {
  const canvasRef = useRef(null);
  const canvasContainerRef = useRef(null);
  const lastLocalPointRef = useRef({ x: null, y: null });
  const activePointerIdRef = useRef(null);
  const isRemoteDrawRef = useRef(false);

  const [drawing, setDrawing] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);
  const [canvasSize, setCanvasSize] = useState({ width: 1000, height: 600 });
  const [pages, setPages] = useState([{ id: 1, snapshot: null }]);
  const [currentPage, setCurrentPage] = useState(0);
  const [history, setHistory] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [selectedArea, setSelectedArea] = useState(null);
  const [textSelecting, setTextSelecting] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [textPosition, setTextPosition] = useState({ x: 0, y: 0, width: 100, height: 20 });
  const [showTextInput, setShowTextInput] = useState(false);
  const textInputRef = useRef(null);

  // ─── Drawing Primitives ────────────────────────────────────────────────────

  const drawLine = useCallback((fromX, fromY, toX, toY, lineColor, drawTool, size) => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = size;
    ctx.globalAlpha = 1;
    if (drawTool === "marker") { ctx.strokeStyle = lineColor; ctx.lineWidth = size * 2; }
    else if (drawTool === "highlighter") { ctx.strokeStyle = lineColor; ctx.globalAlpha = 0.3; }
    else if (drawTool === "eraser") { ctx.strokeStyle = "white"; }
    else { ctx.strokeStyle = lineColor; }
    ctx.stroke();
    ctx.globalAlpha = 1;
  }, []);

  const drawText = useCallback((x, y, text, textColor, fontSize) => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.font = `${Math.max(14, Number(fontSize) * 4)}px 'DM Sans', sans-serif`;
    ctx.fillStyle = textColor;
    ctx.globalAlpha = 1;
    ctx.fillText(text, x, y);
    ctx.globalAlpha = 1;
  }, []);

  const drawShape = useCallback((sX, sY, eX, eY, shapeType, shapeColor, shapeSize) => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.strokeStyle = shapeColor;
    ctx.fillStyle = shapeColor;
    ctx.lineWidth = shapeSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.globalAlpha = 1;

    if (shapeType === "rectangle") {
      ctx.strokeRect(sX, sY, eX - sX, eY - sY);
    } else if (shapeType === "fill-rectangle") {
      ctx.fillRect(sX, sY, eX - sX, eY - sY);
      ctx.strokeRect(sX, sY, eX - sX, eY - sY);
    } else if (shapeType === "circle" || shapeType === "fill-circle") {
      const radius = Math.sqrt(Math.pow(eX - sX, 2) + Math.pow(eY - sY, 2));
      ctx.beginPath();
      ctx.arc(sX, sY, radius, 0, 2 * Math.PI);
      if (shapeType === "fill-circle") ctx.fill();
      ctx.stroke();
    } else if (shapeType === "line" || shapeType === "arrow") {
      ctx.beginPath();
      ctx.moveTo(sX, sY);
      ctx.lineTo(eX, eY);
      ctx.stroke();
      if (shapeType === "arrow") {
        const angle = Math.atan2(eY - sY, eX - sX);
        const len = 18;
        ctx.beginPath();
        ctx.moveTo(eX, eY);
        ctx.lineTo(eX - len * Math.cos(angle - Math.PI / 6), eY - len * Math.sin(angle - Math.PI / 6));
        ctx.moveTo(eX, eY);
        ctx.lineTo(eX - len * Math.cos(angle + Math.PI / 6), eY - len * Math.sin(angle + Math.PI / 6));
        ctx.stroke();
      }
    } else if (shapeType === "triangle" || shapeType === "fill-triangle") {
      ctx.beginPath();
      ctx.moveTo(sX, eY);
      ctx.lineTo((sX + eX) / 2, sY);
      ctx.lineTo(eX, eY);
      ctx.closePath();
      if (shapeType === "fill-triangle") ctx.fill();
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }, []);

  const floodFill = useCallback((startFX, startFY, fillColor) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const startPos = (startFY * canvas.width + startFX) * 4;
    const [startR, startG, startB, startA] = [data[startPos], data[startPos + 1], data[startPos + 2], data[startPos + 3]];
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = 1; tempCanvas.height = 1;
    const tempCtx = tempCanvas.getContext("2d");
    tempCtx.fillStyle = fillColor;
    tempCtx.fillRect(0, 0, 1, 1);
    const fd = tempCtx.getImageData(0, 0, 1, 1).data;
    const [fillR, fillG, fillB, fillA] = [fd[0], fd[1], fd[2], fd[3]];
    if (startR === fillR && startG === fillG && startB === fillB && startA === fillA) return;
    const stack = [[startFX, startFY]];
    const visited = new Set();
    while (stack.length > 0) {
      const [x, y] = stack.pop();
      const pos = (y * canvas.width + x) * 4;
      if (x < 0 || x >= canvas.width || y < 0 || y >= canvas.height || visited.has(`${x},${y}`)) continue;
      if (data[pos] === startR && data[pos+1] === startG && data[pos+2] === startB && data[pos+3] === startA) {
        data[pos] = fillR; data[pos+1] = fillG; data[pos+2] = fillB; data[pos+3] = fillA;
        visited.add(`${x},${y}`);
        stack.push([x+1,y],[x-1,y],[x,y+1],[x,y-1]);
      }
    }
    ctx.putImageData(imageData, 0, 0);
  }, []);

  // ─── State Management ───────────────────────────────────────────────────────

  const updateCurrentPageSnapshot = useCallback((snapshot) => {
    setPages((prev) => prev.map((page, i) => i === currentPage ? { ...page, snapshot } : page));
  }, [currentPage]);

  const drawSnapshotOnCanvas = useCallback((snapshot) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!snapshot) return;
    const img = new Image();
    img.onload = () => ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    img.src = snapshot;
  }, []);

  const saveState = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const data = canvas.toDataURL();
    setHistory((prev) => [...prev, data]);
    setRedoStack([]);
    updateCurrentPageSnapshot(data);
  }, [updateCurrentPageSnapshot]);

  const saveStateDebounced = useRef(null);
  const saveStateWithDebounce = useCallback(() => {
    if (saveStateDebounced.current) clearTimeout(saveStateDebounced.current);
    saveStateDebounced.current = setTimeout(() => {
      saveState();
    }, 1000);
  }, [saveState]);

  // ─── Socket Listeners ───────────────────────────────────────────────────────

  useEffect(() => {
    socket.on("receive-draw", (data) => {
      isRemoteDrawRef.current = true;
      drawLine(data.fromX, data.fromY, data.x, data.y, data.color, data.tool, data.brushSize);
      isRemoteDrawRef.current = false;
      saveStateWithDebounce();
    });
    socket.on("receive-shape", (data) => {
      isRemoteDrawRef.current = true;
      drawShape(data.startX, data.startY, data.endX, data.endY, data.tool, data.color, data.brushSize);
      isRemoteDrawRef.current = false;
      saveStateWithDebounce();
    });
    socket.on("receive-text", (data) => {
      isRemoteDrawRef.current = true;
      drawText(data.x, data.y, data.text, data.color, data.brushSize);
      isRemoteDrawRef.current = false;
      saveStateWithDebounce();
    });
    socket.on("receive-bucket-fill", (data) => {
      isRemoteDrawRef.current = true;
      floodFill(data.x, data.y, data.color);
      isRemoteDrawRef.current = false;
      saveStateWithDebounce();
    });
    socket.on("receive-fill-area", (data) => {
      isRemoteDrawRef.current = true;
      const ctx = canvasRef.current?.getContext("2d");
      if (ctx) { ctx.fillStyle = data.color; ctx.fillRect(data.x, data.y, data.width, data.height); }
      isRemoteDrawRef.current = false;
      saveStateWithDebounce();
    });
    socket.on("receive-clear", () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
      saveState();
    });
    socket.on("load-board", (strokes) => {
      isRemoteDrawRef.current = true;
      strokes.forEach((s) => {
        if (s.type === "draw") drawLine(s.fromX, s.fromY, s.x, s.y, s.color, s.tool, s.brushSize);
        else if (s.type === "shape") drawShape(s.startX, s.startY, s.endX, s.endY, s.tool, s.color, s.brushSize);
        else if (s.type === "text") drawText(s.x, s.y, s.text, s.color, s.brushSize);
        else if (s.type === "bucket-fill") floodFill(s.x, s.y, s.color);
        else if (s.type === "fill-area") {
          const ctx = canvasRef.current?.getContext("2d");
          if (ctx) { ctx.fillStyle = s.color; ctx.fillRect(s.x, s.y, s.width, s.height); }
        }
      });
      isRemoteDrawRef.current = false;
      saveState();
    });
    return () => {
      socket.off("receive-draw");
      socket.off("receive-shape");
      socket.off("receive-text");
      socket.off("receive-bucket-fill");
      socket.off("receive-fill-area");
      socket.off("receive-clear");
      socket.off("load-board");
    };
  }, [drawLine, drawShape, drawText, floodFill, saveState, saveStateWithDebounce]);

  // ─── Canvas Resize ──────────────────────────────────────────────────────────

  useEffect(() => {
    const container = canvasContainerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;
    const resizeCanvas = () => {
      const nextWidth = Math.max(700, Math.floor(container.clientWidth - 16));
      const nextHeight = Math.max(420, Math.floor(container.clientHeight - 16));
      if (nextWidth === canvas.width && nextHeight === canvas.height) return;
      const previous = canvas.toDataURL();
      const img = new Image();
      img.onload = () => {
        canvas.width = nextWidth;
        canvas.height = nextHeight;
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, nextWidth, nextHeight);
        if (previous) ctx.drawImage(img, 0, 0, nextWidth, nextHeight);
        setCanvasSize({ width: nextWidth, height: nextHeight });
      };
      img.src = previous;
    };
    resizeCanvas();
    const observer = new ResizeObserver(resizeCanvas);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const snapshot = pages[currentPage]?.snapshot;
    if (snapshot) {
      drawSnapshotOnCanvas(snapshot);
    }
    // Only clear history/redo on actual page change, not on snapshot updates
  }, [currentPage]);

  // Restore on mount or permission change if canvas is empty
  useEffect(() => {
    if (pages[currentPage]?.snapshot) {
      drawSnapshotOnCanvas(pages[currentPage].snapshot);
    }
  }, [isAllowedToDraw]);

  useEffect(() => { setSelectedArea(null); }, [tool]);

  // ─── Pointer Events ─────────────────────────────────────────────────────────

  const startDrawing = useCallback((e) => {
    if (!isAllowedToDraw) return;
    const pointerId = e.nativeEvent.pointerId;
    if (canvasRef.current && pointerId != null) {
      canvasRef.current.setPointerCapture?.(pointerId);
      activePointerIdRef.current = pointerId;
    }
    const x = e.nativeEvent.offsetX;
    const y = e.nativeEvent.offsetY;

    if (tool === "text") {
      setTextSelecting(true); setStartX(x); setStartY(y);
      setTextPosition({ x, y, width: 100, height: 20 }); setDrawing(true); return;
    }
    if (tool === "select") { setStartX(x); setStartY(y); setDrawing(true); return; }
    if (tool === "fill") {
      if (selectedArea) {
        const ctx = canvasRef.current?.getContext("2d");
        if (ctx) {
          ctx.fillStyle = color;
          ctx.fillRect(selectedArea.x, selectedArea.y, selectedArea.width, selectedArea.height);
          if (classId) socket.emit("fill-area", { classId, ...selectedArea, color });
          saveState();
        }
      }
      return;
    }
    if (tool === "bucket") {
      floodFill(x, y, color);
      if (classId) socket.emit("bucket-fill", { classId, x, y, color });
      saveState();
      return;
    }
    setStartX(x); setStartY(y);
    lastLocalPointRef.current = { x, y };
    canvasRef.current?.getContext("2d")?.beginPath();
    canvasRef.current?.getContext("2d")?.moveTo(x, y);
    setDrawing(true);
  }, [isAllowedToDraw, tool, selectedArea, color, classId, floodFill, saveState]);

  const draw = useCallback((e) => {
    if (!drawing || !isAllowedToDraw) return;
    const x = e.nativeEvent.offsetX;
    const y = e.nativeEvent.offsetY;
    const previous = lastLocalPointRef.current;
    if (["pencil", "marker", "highlighter", "eraser"].includes(tool)) {
      if (previous.x === null) { lastLocalPointRef.current = { x, y }; return; }
      drawLine(previous.x, previous.y, x, y, color, tool, brushSize);
      if (classId) socket.emit("draw", { classId, data: { fromX: previous.x, fromY: previous.y, x, y, color, tool, brushSize } });
      lastLocalPointRef.current = { x, y };
    }
    if (tool === "text" && textSelecting) {
      setTextPosition({ x: Math.min(startX, x), y: Math.min(startY, y), width: Math.max(Math.abs(x - startX), 50), height: Math.max(Math.abs(y - startY), 20) });
    }
  }, [drawing, isAllowedToDraw, tool, color, brushSize, classId, drawLine, textSelecting, startX, startY]);

  const stopDrawing = useCallback((e) => {
    if (!drawing) return;
    const pointerId = e.nativeEvent.pointerId ?? activePointerIdRef.current;
    if (canvasRef.current && pointerId != null && canvasRef.current.hasPointerCapture?.(pointerId)) {
      canvasRef.current.releasePointerCapture(pointerId);
    }
    activePointerIdRef.current = null;
    const x = e.nativeEvent.offsetX;
    const y = e.nativeEvent.offsetY;
    if (["rectangle","fill-rectangle","circle","fill-circle","triangle","fill-triangle","line","arrow"].includes(tool)) {
      drawShape(startX, startY, x, y, tool, color, brushSize);
      if (classId) socket.emit("draw-shape", { classId, startX, startY, endX: x, endY: y, tool, color, brushSize });
    }
    if (tool === "text" && textSelecting) {
      setTextSelecting(false); setShowTextInput(true); setTextInput("");
      setTimeout(() => textInputRef.current?.focus(), 0);
    }
    if (tool === "select") {
      const width = Math.abs(x - startX);
      const height = Math.abs(y - startY);
      setSelectedArea(width > 5 && height > 5 ? { x: Math.min(startX, x), y: Math.min(startY, y), width, height } : null);
    }
    setDrawing(false);
    lastLocalPointRef.current = { x: null, y: null };
    if (!isRemoteDrawRef.current) saveState();
  }, [drawing, tool, startX, startY, color, brushSize, classId, drawShape, textSelecting, saveState]);

  // ─── Text Input ─────────────────────────────────────────────────────────────

  const handleTextSubmit = useCallback(() => {
    if (textInput.trim()) {
      drawText(textPosition.x, textPosition.y, textInput.trim(), color, brushSize);
      if (classId) socket.emit("draw-text", { classId, x: textPosition.x, y: textPosition.y, text: textInput.trim(), color, brushSize });
      saveState();
    }
    setShowTextInput(false); setTextInput("");
  }, [textInput, textPosition, color, brushSize, classId, drawText, saveState]);

  const handleTextKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleTextSubmit(); }
    else if (e.key === "Escape") { setShowTextInput(false); setTextInput(""); }
  };

  // ─── Board Controls ──────────────────────────────────────────────────────────

  const undo = useCallback(() => {
    if (history.length === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const newHistory = [...history];
    const last = newHistory.pop();
    setHistory(newHistory); setRedoStack((prev) => [...prev, last]);
    if (newHistory.length === 0) { ctx.clearRect(0, 0, canvas.width, canvas.height); updateCurrentPageSnapshot(null); return; }
    const img = new Image();
    img.src = newHistory[newHistory.length - 1];
    img.onload = () => { ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.drawImage(img, 0, 0); updateCurrentPageSnapshot(img.src); };
  }, [history, updateCurrentPageSnapshot]);

  const redo = useCallback(() => {
    if (redoStack.length === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const newRedo = [...redoStack];
    const state = newRedo.pop();
    setRedoStack(newRedo); setHistory((prev) => [...prev, state]);
    const img = new Image();
    img.src = state;
    img.onload = () => { ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.drawImage(img, 0, 0); updateCurrentPageSnapshot(state); };
  }, [redoStack, updateCurrentPageSnapshot]);

  const clearBoard = useCallback(() => {
    if (!isAllowedToDraw) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    setHistory([]); setRedoStack([]); updateCurrentPageSnapshot(null);
    if (classId) socket.emit("clear-board", classId);
  }, [isAllowedToDraw, classId, updateCurrentPageSnapshot]);

  const downloadBoard = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = "whiteboard.png";
    link.href = canvas.toDataURL();
    link.click();
  }, []);

  const downloadAllPagesAsPdf = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const currentSnapshot = canvas.toDataURL("image/png");
    const snapshots = pages.map((page, i) => (i === currentPage ? currentSnapshot : page.snapshot)).filter(Boolean);
    if (snapshots.length === 0) { alert("No notes available to export."); return; }
    const pdf = new jsPDF({ orientation: canvas.width >= canvas.height ? "landscape" : "portrait", unit: "px", format: [canvas.width, canvas.height] });
    snapshots.forEach((snapshot, i) => {
      if (i !== 0) pdf.addPage([canvas.width, canvas.height], canvas.width >= canvas.height ? "landscape" : "portrait");
      pdf.addImage(snapshot, "PNG", 0, 0, canvas.width, canvas.height, undefined, "FAST");
    });
    pdf.save("whiteboard-notes.pdf");
  }, [pages, currentPage]);

  const goToPage = useCallback((nextPage) => {
    if (nextPage < 0 || nextPage >= pages.length) return;
    if (canvasRef.current) updateCurrentPageSnapshot(canvasRef.current.toDataURL());
    setCurrentPage(nextPage);
  }, [pages.length, updateCurrentPageSnapshot]);

  const addNewPage = useCallback(() => {
    if (canvasRef.current) updateCurrentPageSnapshot(canvasRef.current.toDataURL());
    setPages((prev) => [...prev, { id: prev.length + 1, snapshot: null }]);
    setCurrentPage(pages.length);
  }, [pages.length, updateCurrentPageSnapshot]);

  return {
    canvasRef, canvasContainerRef, textInputRef,
    drawing, canvasSize, pages, currentPage, history, redoStack,
    selectedArea, showTextInput, textInput, textPosition,
    setTextInput,
    startDrawing, draw, stopDrawing,
    handleTextSubmit, handleTextKeyDown,
    undo, redo, clearBoard, downloadBoard, downloadAllPagesAsPdf,
    goToPage, addNewPage,
  };
}