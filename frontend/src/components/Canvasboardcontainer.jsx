import { jsPDF } from "jspdf";

import useClassRoom from "../hooks/useClassRoom";
import useCanvas from "../hooks/useCanvas";
import useVideoCall from "../hooks/useVideoCall";

import ClassHeader from "./ClassHeader";
import CanvasBoard from "./CanvasBoard";
import CanvasToolbar from "./CanvasToolbar";
import ParticipantsPanel from "./ParticipantsPanel";
import NotificationsPanel from "./NotificationsPanel";
import VideoCallPanel from "./VideoCallPanel";

export default function CanvasBoardContainer({ color, tool, brushSize }) {
  // ─── Classroom session & permissions ────────────────────────────────────────
  const {
    classId, userId, userName, isTeacher, isAllowedToDraw,
    handRaised, classUsers, notifications, selectedStudents, teacherNotes,
    updateNotifications,
    startRaiseHand, handleToggleDrawPermission, handleApproveAttendance,
    toggleSelectedStudent, handleSendNotes, handleLogout, handleEndClass,
  } = useClassRoom();

  // ─── Video call ──────────────────────────────────────────────────────────────
  const {
    micOn, cameraOn, localVideoRef, remoteStreams, remoteVideoRefs,
    toggleMic, toggleCamera,
  } = useVideoCall({ classId, userId, userName, classUsers });

  // ─── Canvas drawing ──────────────────────────────────────────────────────────
  const {
    canvasRef, canvasContainerRef, textInputRef,
    canvasSize, pages, currentPage, selectedArea,
    showTextInput, textInput, textPosition,
    setTextInput,
    startDrawing, draw, stopDrawing,
    handleTextSubmit, handleTextKeyDown,
    undo, redo, clearBoard, downloadBoard, downloadAllPagesAsPdf,
    goToPage, addNewPage,
  } = useCanvas({ classId, color, tool, brushSize, isAllowedToDraw });

  // ─── Share Helpers ───────────────────────────────────────────────────────────
  const sendPdfToWhatsApp = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const pdf = new jsPDF({
      orientation: canvas.width >= canvas.height ? "landscape" : "portrait",
      unit: "px",
      format: [canvas.width, canvas.height],
    });
    pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, canvas.width, canvas.height);
    pdf.save("whiteboard-notes.pdf");
    window.open(
      `https://wa.me/?text=${encodeURIComponent("PDF downloaded. Please attach 'whiteboard-notes.pdf' and send it.")}`,
      "_blank"
    );
  };

  const sendLinkToWhatsApp = () => {
    window.open(
      `https://wa.me/?text=${encodeURIComponent("Join my class here: " + window.location.href)}`,
      "_blank"
    );
  };

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="h-full flex flex-col bg-gray-100">
      {/* Top Header */}
      <ClassHeader
        userName={userName}
        classId={classId}
        isTeacher={isTeacher}
        isAllowedToDraw={isAllowedToDraw}
        micOn={micOn}
        cameraOn={cameraOn}
        handRaised={handRaised}
        selectedStudents={selectedStudents}
        onToggleMic={toggleMic}
        onToggleCamera={toggleCamera}
        onRaiseHand={startRaiseHand}
        onSendNotes={handleSendNotes}
        onEndClass={handleEndClass}
      />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden p-4 gap-4">
        {/* Canvas Area */}
        <div className="flex-1 flex flex-col bg-white rounded-xl shadow-sm overflow-hidden">
          <CanvasBoard
            canvasRef={canvasRef}
            canvasContainerRef={canvasContainerRef}
            textInputRef={textInputRef}
            canvasSize={canvasSize}
            selectedArea={selectedArea}
            showTextInput={showTextInput}
            textInput={textInput}
            textPosition={textPosition}
            color={color}
            brushSize={brushSize}
            tool={tool}
            isAllowedToDraw={isAllowedToDraw}
            onPointerDown={startDrawing}
            onPointerMove={draw}
            onPointerUp={stopDrawing}
            onPointerLeave={stopDrawing}
            onPointerCancel={stopDrawing}
            onTextChange={setTextInput}
            onTextSubmit={handleTextSubmit}
            onTextKeyDown={handleTextKeyDown}
          />

          <CanvasToolbar
            canvasRef={canvasRef}
            pages={pages}
            currentPage={currentPage}
            onUndo={undo}
            onRedo={redo}
            onClearBoard={clearBoard}
            onDownloadBoard={downloadBoard}
            onDownloadPdf={downloadAllPagesAsPdf}
            onPrevPage={() => goToPage(currentPage - 1)}
            onNextPage={() => goToPage(currentPage + 1)}
            onAddPage={addNewPage}
            onSendPdfToWhatsApp={sendPdfToWhatsApp}
            onShareLink={sendLinkToWhatsApp}
            onLogout={handleLogout}
          />
        </div>

        {/* Right Sidebar */}
        <aside className="w-80 space-y-4 overflow-y-auto">
          <ParticipantsPanel
            classUsers={classUsers}
            userId={userId}
            isTeacher={isTeacher}
            selectedStudents={selectedStudents}
            toggleSelectedStudent={toggleSelectedStudent}
            handleToggleDrawPermission={handleToggleDrawPermission}
            handleApproveAttendance={handleApproveAttendance}
          />

          {isTeacher && (
            <div className="bg-white rounded-xl shadow-sm p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-1">Attendance Criteria</h3>
              <p className="text-xs text-gray-500">Attendance is marked only when class duration ≥ 10 minutes.</p>
            </div>
          )}

          <NotificationsPanel
            notifications={notifications}
            teacherNotes={teacherNotes}
            isTeacher={isTeacher}
          />

          <VideoCallPanel
            cameraOn={cameraOn}
            localVideoRef={localVideoRef}
            remoteStreams={remoteStreams}
            classUsers={classUsers}
            userId={userId}
            userName={userName}
          />
        </aside>
      </div>
    </div>
  );
}