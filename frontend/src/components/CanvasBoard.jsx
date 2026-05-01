import { useRef, useState, useEffect } from "react";
import socket from "../services/socket";
import { jsPDF } from "jspdf";
import useWebRTC from "../hooks/useWebRTC";

export default function CanvasBoard({
  color,
  tool,
  brushSize,
  showToolbar,
  showChat,
}) {
  const canvasRef = useRef(null);
  const canvasContainerRef = useRef(null);
  const lastLocalPointRef = useRef({ x: null, y: null });
  const mediaStreamRef = useRef(null);

  const [drawing, setDrawing] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);
  const [canvasSize, setCanvasSize] = useState({ width: 1000, height: 600 });
  const [pages, setPages] = useState([{ id: 1, snapshot: null }]);
  const [currentPage, setCurrentPage] = useState(0);

  const [history, setHistory] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [classId, setClassId] = useState(null);
  const [userId, setUserId] = useState(null);
  const [userName, setUserName] = useState("User");
  const [userRole, setUserRole] = useState("student");
  const [canDraw, setCanDraw] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  const [classUsers, setClassUsers] = useState([]);
  const [micOn, setMicOn] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [teacherNotes, setTeacherNotes] = useState([]);
  
  // WebRTC state
  const localVideoRef = useRef(null);
  const remoteVideoRefs = useRef(new Map());
  
  const isTeacher = userRole === "teacher";
  const isAllowedToDraw = canDraw || isTeacher;
  const isRemoteDrawRef = useRef(false);

  // Initialize WebRTC
  const { localStream, remoteStreams, createOffer } = useWebRTC(
    classId,
    userId,
    userName,
    mediaStreamRef.current
  );

  const updateNotifications = (message) => {
    setNotifications((prev) => [message, ...prev].slice(0, 8));
  };

  const updateCurrentPageSnapshot = (snapshot) => {
    setPages((prev) =>
      prev.map((page, index) =>
        index === currentPage ? { ...page, snapshot } : page
      )
    );
  };

  const drawSnapshotOnCanvas = (snapshot) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!snapshot) return;

    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
    img.src = snapshot;
  };

  const drawLine = (fromX, fromY, toX, toY, color, tool, brushSize) => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = brushSize;
    ctx.globalAlpha = 1;

    if (tool === "pencil") ctx.strokeStyle = color;
    else if (tool === "marker") {
      ctx.strokeStyle = color;
      ctx.lineWidth = brushSize * 2;
    } else if (tool === "highlighter") {
      ctx.strokeStyle = color;
      ctx.globalAlpha = 0.3;
    } else if (tool === "eraser") {
      ctx.strokeStyle = "white";
    } else {
      ctx.strokeStyle = color;
    }

    ctx.stroke();
    ctx.globalAlpha = 1;
  };

  const drawText = (x, y, text, textColor, fontSize) => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.font = `${Math.max(14, Number(fontSize) * 4)}px Inter, sans-serif`;
    ctx.fillStyle = textColor;
    ctx.globalAlpha = 1;
    ctx.fillText(text, x, y);
    ctx.globalAlpha = 1;
  };

  const drawShape = (startX, startY, endX, endY, shapeType, shapeColor, shapeSize) => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;

    ctx.strokeStyle = shapeColor;
    ctx.fillStyle = shapeColor;
    ctx.lineWidth = shapeSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.globalAlpha = 1;

    if (shapeType === "rectangle") {
      ctx.strokeRect(startX, startY, endX - startX, endY - startY);
    } else if (shapeType === "fill-rectangle") {
      ctx.fillRect(startX, startY, endX - startX, endY - startY);
      ctx.strokeRect(startX, startY, endX - startX, endY - startY);
    } else if (shapeType === "circle") {
      const radius = Math.sqrt(
        Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2)
      );
      ctx.beginPath();
      ctx.arc(startX, startY, radius, 0, 2 * Math.PI);
      ctx.stroke();
    } else if (shapeType === "line" || shapeType === "arrow") {
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
    } else if (shapeType === "triangle") {
      ctx.beginPath();
      ctx.moveTo(startX, endY);
      ctx.lineTo((startX + endX) / 2, startY);
      ctx.lineTo(endX, endY);
      ctx.closePath();
      ctx.stroke();
    }

    ctx.globalAlpha = 1;
  };

  useEffect(() => {
    const storedClassId = localStorage.getItem("classId") || "default-class";
    let storedUserId = localStorage.getItem("userId");
    const storedUserName = localStorage.getItem("userName") || "User";
    const storedUserRole = localStorage.getItem("userRole") || "student";

    if (!storedUserId) {
      storedUserId = `guest-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      localStorage.setItem("userId", storedUserId);
    }

    setClassId(storedClassId);
    setUserId(storedUserId);
    setUserName(storedUserName);
    setUserRole(storedUserRole);
    setCanDraw(storedUserRole === "teacher");

    socket.emit("join-class", {
      classId: storedClassId,
      userId: storedUserId,
      userName: storedUserName,
      role: storedUserRole,
    });

    socket.on("receive-draw", (data) => {
      isRemoteDrawRef.current = true;
      drawLine(data.fromX, data.fromY, data.x, data.y, data.color, data.tool, data.brushSize);
      isRemoteDrawRef.current = false;
    });

    socket.on("receive-shape", (data) => {
      isRemoteDrawRef.current = true;
      drawShape(data.startX, data.startY, data.endX, data.endY, data.tool, data.color, data.brushSize);
      isRemoteDrawRef.current = false;
    });

    socket.on("receive-text", (data) => {
      isRemoteDrawRef.current = true;
      drawText(data.x, data.y, data.text, data.color, data.brushSize);
      isRemoteDrawRef.current = false;
    });

    socket.on("receive-clear", () => {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    });

    socket.on("update-user-list", ({ users }) => {
      setClassUsers(users);
      const current = users.find((user) => user.userId === storedUserId);
      if (current) {
        setCanDraw(current.canDraw || current.role === "teacher");
        setHandRaised(Boolean(current.handRaised));
        setUserRole(current.role || storedUserRole);
        setUserName(current.userName || storedUserName);
      }
    });

    socket.on("draw-permission-changed", ({ allowed }) => {
      setCanDraw(allowed || isTeacher);
      updateNotifications(allowed ? "You can draw now." : "Draw permission revoked.");
    });

    socket.on("draw-not-allowed", () => {
      updateNotifications("You do not have permission to draw yet.");
    });

    socket.on("receive-notes", ({ from, notes }) => {
      const message = `${from}: ${notes}`;
      setTeacherNotes((prev) => [message, ...prev].slice(0, 10));
      updateNotifications(`Teacher notes received: ${notes}`);
    });

    socket.on("user-joined", ({ userName: name }) => {
      updateNotifications(`${name} joined the class.`);
    });

    return () => {
      socket.off("receive-draw");
      socket.off("receive-shape");
      socket.off("receive-text");
      socket.off("receive-clear");
      socket.off("update-user-list");
      socket.off("draw-permission-changed");
      socket.off("draw-not-allowed");
      socket.off("receive-notes");
      socket.off("user-joined");
    };
  }, []);

  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Initiate WebRTC connections with other users
  useEffect(() => {
    if (!classId || !userId || classUsers.length === 0) return;

    classUsers.forEach((user) => {
      if (user.userId !== userId && user.cameraOn) {
        // Create offer for each user with camera on
        createOffer(user.userId);
      }
    });
  }, [classUsers, classId, userId, createOffer]);

  // Setup remote video streams
  useEffect(() => {
    remoteStreams.forEach((streams, remoteUserId) => {
      const stream = streams[0];
      if (!stream) return;

      let videoRef = remoteVideoRefs.current.get(remoteUserId);
      if (!videoRef) {
        const video = document.createElement("video");
        video.autoplay = true;
        video.playsinline = true;
        video.muted = false;
        remoteVideoRefs.current.set(remoteUserId, video);
        videoRef = video;
      }

      if (videoRef.srcObject !== stream) {
        videoRef.srcObject = stream;
      }
    });

    // Clean up disconnected users
    remoteVideoRefs.current.forEach((videoRef, remoteUserId) => {
      if (!remoteStreams.has(remoteUserId)) {
        videoRef.srcObject = null;
        remoteVideoRefs.current.delete(remoteUserId);
      }
    });
  }, [remoteStreams]);

  useEffect(() => {
    const container = canvasContainerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

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
      if (previous) {
        ctx.drawImage(img, 0, 0, nextWidth, nextHeight);
      }
      setCanvasSize({ width: nextWidth, height: nextHeight });
    };

    img.src = previous;
  }, [showToolbar, showChat]);

  useEffect(() => {
    drawSnapshotOnCanvas(pages[currentPage]?.snapshot || null);
    setHistory([]);
    setRedoStack([]);
  }, [currentPage]);

  const startDrawing = (e) => {
    if (!isAllowedToDraw) {
      updateNotifications("Teacher permission is required to draw.");
      return;
    }

    const x = e.nativeEvent.offsetX;
    const y = e.nativeEvent.offsetY;

    if (tool === "text") {
      const text = window.prompt("Enter text");
      if (text && text.trim()) {
        drawText(x, y, text.trim(), color, brushSize);
        if (classId) {
          socket.emit("draw-text", { classId, x, y, text: text.trim(), color, brushSize });
        }
        if (!isRemoteDrawRef.current) {
          updateCurrentPageSnapshot(canvasRef.current.toDataURL());
          saveState();
        }
      }
      return;
    }

    setStartX(x);
    setStartY(y);
    lastLocalPointRef.current = { x, y };

    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
    }

    setDrawing(true);
  };

  const draw = (e) => {
    if (!drawing || !isAllowedToDraw) return;

    const x = e.nativeEvent.offsetX;
    const y = e.nativeEvent.offsetY;
    const previous = lastLocalPointRef.current;

    if (
      tool === "pencil" ||
      tool === "marker" ||
      tool === "highlighter" ||
      tool === "eraser"
    ) {
      if (previous.x === null || previous.y === null) {
        lastLocalPointRef.current = { x, y };
        return;
      }

      drawLine(previous.x, previous.y, x, y, color, tool, brushSize);

      if (classId) {
        socket.emit("draw", {
          classId,
          data: {
            fromX: previous.x,
            fromY: previous.y,
            x,
            y,
            color,
            tool,
            brushSize,
          },
        });
      }

      lastLocalPointRef.current = { x, y };
    }
  };

  const stopDrawing = (e) => {
    if (!drawing) return;

    const x = e.nativeEvent.offsetX;
    const y = e.nativeEvent.offsetY;

    if (
      tool === "rectangle" ||
      tool === "fill-rectangle" ||
      tool === "circle" ||
      tool === "triangle" ||
      tool === "line" ||
      tool === "arrow"
    ) {
      drawShape(startX, startY, x, y, tool, color, brushSize);
      if (classId) {
        socket.emit("draw-shape", {
          classId,
          startX,
          startY,
          endX: x,
          endY: y,
          tool,
          color,
          brushSize,
        });
      }
    }

    setDrawing(false);
    lastLocalPointRef.current = { x: null, y: null };

    if (!isRemoteDrawRef.current) {
      saveState();
    }
  };

  const saveState = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const data = canvas.toDataURL();

    setHistory((prev) => [...prev, data]);
    setRedoStack([]);
    updateCurrentPageSnapshot(data);
  };

  const undo = () => {
    if (history.length === 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const newHistory = [...history];
    const lastState = newHistory.pop();

    setHistory(newHistory);
    setRedoStack((prev) => [...prev, lastState]);

    const img = new Image();
    if (newHistory.length === 0) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    img.src = newHistory[newHistory.length - 1];
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      updateCurrentPageSnapshot(newHistory[newHistory.length - 1]);
    };
  };

  const redo = () => {
    if (redoStack.length === 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const newRedo = [...redoStack];
    const state = newRedo.pop();

    setRedoStack(newRedo);
    setHistory((prev) => [...prev, state]);

    const img = new Image();
    img.src = state;
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      updateCurrentPageSnapshot(state);
    };
  };

  const clearBoard = () => {
    if (!isAllowedToDraw) {
      updateNotifications("Teacher permission is required to clear the board.");
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();

    setHistory([]);
    setRedoStack([]);
    updateCurrentPageSnapshot(null);

    if (classId) {
      socket.emit("clear-board", classId);
    }
  };

  const downloadBoard = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement("a");
    link.download = "whiteboard.png";
    link.href = canvas.toDataURL();
    link.click();
  };

  const downloadAllPagesAsPdf = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const currentSnapshot = canvas.toDataURL("image/png");
    const snapshots = pages.map((page, index) => {
      if (index === currentPage) return currentSnapshot;
      return page.snapshot;
    });

    const validSnapshots = snapshots.filter(Boolean);
    if (validSnapshots.length === 0) {
      alert("No notes available to export.");
      return;
    }

    const pdf = new jsPDF({
      orientation: canvas.width >= canvas.height ? "landscape" : "portrait",
      unit: "px",
      format: [canvas.width, canvas.height],
    });

    validSnapshots.forEach((snapshot, index) => {
      if (index !== 0) {
        pdf.addPage([canvas.width, canvas.height], canvas.width >= canvas.height ? "landscape" : "portrait");
      }
      pdf.addImage(snapshot, "PNG", 0, 0, canvas.width, canvas.height, undefined, "FAST");
    });

    pdf.save("whiteboard-notes.pdf");
  };

  const goToPage = (nextPage) => {
    if (nextPage < 0 || nextPage >= pages.length) return;
    const canvas = canvasRef.current;
    if (canvas) {
      updateCurrentPageSnapshot(canvas.toDataURL());
    }
    setCurrentPage(nextPage);
  };

  const addNewPage = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      updateCurrentPageSnapshot(canvas.toDataURL());
    }
    setPages((prev) => [...prev, { id: prev.length + 1, snapshot: null }]);
    setCurrentPage(pages.length);
  };

  const startRaiseHand = () => {
    const nextState = !handRaised;
    setHandRaised(nextState);
    if (classId) {
      socket.emit("raise-hand", { classId, raised: nextState });
    }
  };

  const handleToggleDrawPermission = (socketId, allowed) => {
    if (!classId) return;
    socket.emit("toggle-draw-permission", { classId, targetSocketId: socketId, allowed });
  };

  const handleApproveAttendance = (socketId) => {
    if (!classId) return;
    socket.emit("approve-attendance", { classId, targetSocketId: socketId });
  };

  const handleSendNotes = () => {
    const notes = window.prompt("Enter notes to send:");
    if (!notes?.trim() || !classId || selectedStudents.length === 0) {
      if (selectedStudents.length === 0) {
        alert("Please select students to send notes to.");
      }
      return;
    }
    socket.emit("send-notes-to-selected", { classId, notes: notes.trim(), recipientUserIds: selectedStudents });
    updateNotifications("Notes sent to selected students.");
    setSelectedStudents([]);
  };

  const updateMediaStream = async (nextMic, nextCamera) => {
    try {
      if (nextMic || nextCamera) {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: nextMic,
          video: nextCamera,
        });
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        }
        mediaStreamRef.current = stream;
      } else if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }
    } catch (error) {
      console.warn("Media access failed", error);
      updateNotifications("Unable to access microphone or camera.");
      setMicOn(false);
      setCameraOn(false);
    }
  };

  const toggleMic = async () => {
    const next = !micOn;
    setMicOn(next);
    if (classId) {
      socket.emit("media-state", { classId, micOn: next, cameraOn });
    }
    await updateMediaStream(next, cameraOn);
  };

  const toggleCamera = async () => {
    const next = !cameraOn;
    setCameraOn(next);
    if (classId) {
      socket.emit("media-state", { classId, micOn, cameraOn: next });
    }
    await updateMediaStream(micOn, next);
  };

  const cursorStyle = isAllowedToDraw ?
    tool === "eraser" ? "not-allowed" :
    tool === "pencil" ? "crosshair" :
    tool === "marker" ? "crosshair" :
    tool === "highlighter" ? "crosshair" :
    tool === "text" ? "text" :
    "default"
    : "not-allowed";

  return (
    <div className="h-full flex flex-col">
      {/* Top Control Bar */}
      <div className="bg-white border-b shadow-sm p-3 flex flex-wrap gap-2 items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">{userName}</h2>
          <p className="text-xs text-gray-500">Class: {classId}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={toggleMic}
            className={`px-3 py-2 text-xs font-semibold rounded-lg ${micOn ? "bg-green-600" : "bg-gray-400"} text-white hover:opacity-90`}
          >
            {micOn ? "🎤 Mic On" : "🎤 Mic Off"}
          </button>
          <button
            onClick={toggleCamera}
            className={`px-3 py-2 text-xs font-semibold rounded-lg ${cameraOn ? "bg-green-600" : "bg-gray-400"} text-white hover:opacity-90`}
          >
            {cameraOn ? "📹 Camera On" : "📹 Camera Off"}
          </button>
          {!isTeacher && (
            <button
              onClick={startRaiseHand}
              className={`px-3 py-2 text-xs font-semibold rounded-lg ${handRaised ? "bg-amber-600" : "bg-gray-400"} text-white hover:opacity-90`}
            >
              {handRaised ? "✋ Lower Hand" : "✋ Raise Hand"}
            </button>
          )}
          {isTeacher && (
            <button
              onClick={handleSendNotes}
              className="px-3 py-2 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:opacity-90"
            >
              📝 Notes ({selectedStudents.length})
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col">
          <canvas
            ref={canvasRef}
            width={canvasSize.width}
            height={canvasSize.height}
            style={{ cursor: cursorStyle }}
            className="flex-1 bg-white"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
          />

          {/* Bottom Action Bar */}
          <div className="bg-gray-50 border-t p-3 flex flex-wrap gap-2 justify-center">
            <button onClick={undo} className="px-3 py-2 text-xs font-semibold rounded-lg bg-gray-300 text-gray-800 hover:bg-gray-400">↶ Undo</button>
            <button onClick={redo} className="px-3 py-2 text-xs font-semibold rounded-lg bg-gray-300 text-gray-800 hover:bg-gray-400">↷ Redo</button>
            <button onClick={clearBoard} className="px-3 py-2 text-xs font-semibold rounded-lg bg-red-500 text-white hover:bg-red-600">🗑️ Clear</button>
            <button onClick={downloadBoard} className="px-3 py-2 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700">💾 Download</button>
            <button onClick={downloadAllPagesAsPdf} className="px-3 py-2 text-xs font-semibold rounded-lg bg-purple-600 text-white hover:bg-purple-700">📄 PDF</button>
            <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 0} className="px-3 py-2 text-xs font-semibold rounded-lg bg-gray-300 text-gray-800 hover:bg-gray-400 disabled:opacity-50">← Prev</button>
            <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage >= pages.length - 1} className="px-3 py-2 text-xs font-semibold rounded-lg bg-gray-300 text-gray-800 hover:bg-gray-400 disabled:opacity-50">Next →</button>
            <button onClick={addNewPage} className="px-3 py-2 text-xs font-semibold rounded-lg bg-green-600 text-white hover:bg-green-700">+ New Page</button>
            <span className="px-3 py-2 text-xs font-semibold text-gray-700">Page {currentPage + 1}/{pages.length}</span>
          </div>
        </div>

        {/* Right Sidebar */}
        <aside className="w-80 ml-4 space-y-4 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Participants ({classUsers.length})</h3>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {classUsers.length === 0 && (
                <p className="text-sm text-gray-500">No participants.</p>
              )}
              {classUsers.map((user) => (
                <div key={user.socketId} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{user.userName}</p>
                    <p className="text-xs text-gray-500">{user.role === "teacher" ? "Teacher" : "Student"}</p>
                  </div>
                  <div className="flex gap-1">
                    {user.canDraw && <span className="text-xs text-green-600">✓</span>}
                    {user.handRaised && <span className="text-xs text-amber-600">✋</span>}
                    {user.micOn && <span className="text-xs text-blue-600">🎤</span>}
                    {user.cameraOn && <span className="text-xs text-purple-600">📹</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {isTeacher && (
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Attendance Criteria</h3>
              <p className="text-xs text-gray-600">
                Attendance marks only if class duration ≥ 10 minutes
              </p>
            </div>
          )}

          <div className="bg-white rounded-lg shadow-sm p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Notifications</h3>
            <div className="space-y-2 text-sm text-gray-600 max-h-32 overflow-y-auto">
              {notifications.length === 0 && <p className="text-gray-500">No activity.</p>}
              {notifications.slice(0, 5).map((note, index) => (
                <div key={index} className="text-xs">{note}</div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Video Call</h3>
            <div className="space-y-4">
              {cameraOn && (
                <div className="aspect-video bg-black rounded-lg overflow-hidden relative">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-2 left-2 bg-black bg-opacity-60 px-2 py-1 rounded text-xs text-white">
                    {userName} (You)
                  </div>
                </div>
              )}

              {!cameraOn && (
                <div className="aspect-video bg-gray-200 rounded-lg flex items-center justify-center">
                  <p className="text-sm text-gray-500">Your camera is off</p>
                </div>
              )}

              {remoteStreams.size > 0 && (
                <div className="grid grid-cols-1 gap-2">
                  {Array.from(remoteStreams.entries()).map(([remoteUserId]) => {
                    const remoteUser = classUsers.find((u) => u.userId === remoteUserId);
                    const videoRef = remoteVideoRefs.current.get(remoteUserId);

                    return (
                      <div key={remoteUserId} className="aspect-video bg-black rounded-lg overflow-hidden relative">
                        {videoRef && (
                          <video
                            ref={(el) => {
                              if (el && videoRef) {
                                el.srcObject = videoRef.srcObject;
                              }
                            }}
                            autoPlay
                            playsInline
                            className="w-full h-full object-cover"
                          />
                        )}
                        <div className="absolute bottom-2 left-2 bg-black bg-opacity-60 px-2 py-1 rounded text-xs text-white">
                          {remoteUser?.userName || remoteUserId}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {remoteStreams.size === 0 && cameraOn && (
                <div className="text-center py-4">
                  <p className="text-xs text-gray-500">Waiting for other users to turn on camera...</p>
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}










