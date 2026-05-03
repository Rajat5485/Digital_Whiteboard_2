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
  const sendPdfToWhatsApp = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      // 1. Generate PDF from all pages (similar to downloadAllPagesAsPdf)
      const currentSnapshot = canvas.toDataURL("image/png");
      const snapshots = pages
        .map((page, i) => (i === currentPage ? currentSnapshot : page.snapshot))
        .filter(Boolean);

      if (snapshots.length === 0) {
        alert("No notes available to share.");
        return;
      }

      const pdf = new jsPDF({
        orientation: canvas.width >= canvas.height ? "landscape" : "portrait",
        unit: "px",
        format: [canvas.width, canvas.height],
      });

      snapshots.forEach((snapshot, i) => {
        if (i !== 0) {
          pdf.addPage(
            [canvas.width, canvas.height],
            canvas.width >= canvas.height ? "landscape" : "portrait"
          );
        }
        pdf.addImage(snapshot, "PNG", 0, 0, canvas.width, canvas.height, undefined, "FAST");
      });

      // 2. Create a File object from the PDF
      const pdfBlob = pdf.output("blob");
      const pdfFile = new File([pdfBlob], "whiteboard-notes.pdf", { type: "application/pdf" });

      // 3. Try Web Share API (Best for Mobile & Modern Browsers)
      if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
        await navigator.share({
          files: [pdfFile],
          title: "Whiteboard Notes",
          text: "Here are the notes from today's class!",
        });
        console.log("Notes shared successfully via Web Share API");
      } else {
        // 4. Fallback for Desktop/Unsupported Browsers
        pdf.save("whiteboard-notes.pdf");
        alert("PDF generated and downloaded! \n\nDirect file sharing is not supported by your browser. Please attach the downloaded 'whiteboard-notes.pdf' manually in the WhatsApp window that opens next.");
        
        const waMessage = encodeURIComponent("I'm sharing my whiteboard notes with you. (Please attach the 'whiteboard-notes.pdf' file you just downloaded)");
        window.open(`https://wa.me/?text=${waMessage}`, "_blank");
      }
    } catch (err) {
      console.error("WhatsApp share failed:", err);
      // Final fallback
      alert("Sharing failed. Please use the 'Download PDF' button instead.");
    }
  };

  const sendLinkToWhatsApp = () => {
    // Share the base URL (login page) instead of the current board URL
    const inviteUrl = `${window.location.origin}/?classId=${classId}`;
    window.open(
      `https://wa.me/?text=${encodeURIComponent("Join my class here: " + inviteUrl)}`,
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