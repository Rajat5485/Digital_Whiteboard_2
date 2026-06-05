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
import TeacherControlPanel from "./TeacherControlPanel";
import StudentAttendancePanel from "./StudentAttendancePanel";

export default function CanvasBoardContainer({
  color, tool, brushSize,
  showToolbar, setShowToolbar,
  showChat, setShowChat,
  showParticipants, setShowParticipants
}) {
  // ─── Classroom session & permissions ────────────────────────────────────────
  const {
    classId, userId, userName, isTeacher, isAllowedToDraw,
    handRaised, classUsers, notifications, selectedStudents, teacherNotes,
    updateNotifications,
    hasSentNotes, setHasSentNotes,
    hasSentAttendance, setHasSentAttendance,
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
      setHasSentNotes(true);
    } catch (err) {
      console.error("WhatsApp share failed:", err);
      // Final fallback
      alert("Sharing failed. Please use the 'Download PDF' button instead.");
    }
  };

  const sendPdfByEmail = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let requestBody = {};

    if (selectedStudents.length > 0) {
      const confirmSend = window.confirm(`Do you want to email these whiteboard notes to the ${selectedStudents.length} selected students?`);
      if (confirmSend) {
        requestBody = { recipientUserIds: selectedStudents };
      } else {
        const email = prompt("Enter recipient email address:");
        if (!email) return;
        requestBody = { toEmail: email };
      }
    } else {
      const email = prompt("Enter recipient email address:");
      if (!email) return;
      requestBody = { toEmail: email };
    }

    try {
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

      const pdfBase64 = pdf.output("datauristring");
      const token = localStorage.getItem("token");
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5001";
      const res = await fetch(`${apiUrl}/api/mail/send-notes`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...requestBody,
          subject: "Whiteboard Notes",
          text: `Hello,\n\nPlease find the attached whiteboard notes from the session.\n\nBest regards,\nDigital Whiteboard System`,
          attachment: pdfBase64,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        alert("Email sent successfully!");
        setHasSentNotes(true);
      } else {
        alert("Failed to send email: " + data.message);
      }
    } catch (err) {
      console.error("Email share failed:", err);
      alert("An error occurred while sending the email.");
    }
  };

  const sendLinkByEmail = async () => {
    const email = prompt("Enter recipient email address:");
    if (!email) return;

    const inviteUrl = classId 
      ? `${window.location.origin}/?classId=${classId}` 
      : window.location.origin;

    try {
      const token = localStorage.getItem("token");
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5001";
      const res = await fetch(`${apiUrl}/api/mail/send-notes`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          toEmail: email,
          subject: "Classroom Invitation",
          text: `Hello,\n\nYou have been invited to join a digital whiteboard session.\n\nJoin here: ${inviteUrl}\n\nBest regards,\nDigital Whiteboard System`,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        alert("Invitation sent successfully!");
        setHasSentNotes(true);
      } else {
        alert("Failed to send invitation: " + data.message);
      }
    } catch (err) {
      console.error("Email share failed:", err);
      alert("An error occurred while sending the email.");
    }
  };


  const sendLinkToWhatsApp = () => {
    // Share the base URL (login page) instead of the current board URL
    const inviteUrl = classId 
      ? `${window.location.origin}/?classId=${classId}` 
      : window.location.origin;

    window.open(
      `https://wa.me/?text=${encodeURIComponent(inviteUrl)}`,
      "_blank"
    );
    setHasSentNotes(true);
  };

  const generateAttendancePdfBlob = async () => {
    try {
      const token = localStorage.getItem("token");
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5001";
      const response = await fetch(`${apiUrl}/api/attendance?classId=${classId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) {
        throw new Error("Failed to fetch attendance records");
      }
      const records = await response.json();

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "pt",
        format: "a4",
      });

      // Header
      pdf.setFontSize(22);
      pdf.setTextColor(40, 53, 147); // Dark Indigo
      pdf.setFont("helvetica", "bold");
      pdf.text("Classroom Attendance Report", 40, 60);

      // Class Details
      pdf.setFontSize(10);
      pdf.setTextColor(100, 116, 139); // Slate Gray
      pdf.setFont("helvetica", "normal");
      
      const className = records[0]?.classId?.name || "Digital Classroom";
      const classCode = records[0]?.classId?.code || classId;
      pdf.text(`Classroom Name: ${className}`, 40, 85);
      pdf.text(`Classroom Code / ID: ${classCode}`, 40, 100);
      pdf.text(`Date Generated: ${new Date().toLocaleString()}`, 40, 115);

      pdf.setLineWidth(1);
      pdf.setDrawColor(226, 232, 240); // border-gray-200
      pdf.line(40, 130, 550, 130);

      // Table headers
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(51, 65, 85);
      pdf.text("Student Name", 45, 150);
      pdf.text("Email", 180, 150);
      pdf.text("Active Time", 360, 150);
      pdf.text("Status", 480, 150);

      pdf.line(40, 160, 550, 160);

      // Rows
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(71, 85, 105);
      
      let y = 180;
      if (!records || records.length === 0) {
        pdf.text("No attendance records found for this class.", 45, y);
      } else {
        records.forEach((record) => {
          if (y > 780) {
            pdf.addPage();
            y = 50;
            // Draw table headers again
            pdf.setFont("helvetica", "bold");
            pdf.setTextColor(51, 65, 85);
            pdf.text("Student Name", 45, y);
            pdf.text("Email", 180, y);
            pdf.text("Active Time", 360, y);
            pdf.text("Status", 480, y);
            pdf.line(40, y + 10, 550, y + 10);
            pdf.setFont("helvetica", "normal");
            pdf.setTextColor(71, 85, 105);
            y += 30;
          }

          const studentName = record.user?.name || "Unknown";
          const studentEmail = record.user?.email || "N/A";
          
          const activeSec = record.tabActiveDuration || 0;
          const activeMin = Math.floor(activeSec / 60);
          const activeText = `${activeMin}m ${activeSec % 60}s`;

          const status = record.marked ? "Present" : "Absent";

          // Shorten strings to fit columns
          const displayName = studentName.length > 20 ? studentName.substring(0, 18) + ".." : studentName;
          const displayEmail = studentEmail.length > 28 ? studentEmail.substring(0, 25) + ".." : studentEmail;

          pdf.text(displayName, 45, y);
          pdf.text(displayEmail, 180, y);
          pdf.text(activeText, 360, y);
          
          if (record.marked) {
            pdf.setTextColor(21, 128, 61); // Green-700
            pdf.text(status, 480, y);
          } else {
            pdf.setTextColor(185, 28, 28); // Red-700
            pdf.text(status, 480, y);
          }
          pdf.setTextColor(71, 85, 105); // Reset

          y += 20;
        });
      }

      return pdf;
    } catch (err) {
      console.error("PDF generation failed:", err);
      throw err;
    }
  };

  const sendAttendancePdfToWhatsApp = async () => {
    try {
      const pdf = await generateAttendancePdfBlob();
      const pdfBlob = pdf.output("blob");
      const pdfFile = new File([pdfBlob], "attendance-report.pdf", { type: "application/pdf" });

      if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
        await navigator.share({
          files: [pdfFile],
          title: "Attendance Report",
          text: "Here is the classroom attendance report!",
        });
        console.log("Attendance shared successfully via Web Share API");
      } else {
        pdf.save("attendance-report.pdf");
        alert("Attendance PDF downloaded! \n\nDirect file sharing is not supported by your browser. Please attach the downloaded 'attendance-report.pdf' manually in the WhatsApp window that opens next.");
        
        const waMessage = encodeURIComponent("I'm sharing the classroom attendance report with you. (Please attach the 'attendance-report.pdf' file you just downloaded)");
        window.open(`https://wa.me/?text=${waMessage}`, "_blank");
      }
      setHasSentAttendance(true);
    } catch (err) {
      console.error("WhatsApp share failed:", err);
      alert("Sharing failed. Please try again.");
    }
  };

  const sendAttendancePdfByEmail = async () => {
    let requestBody = {};

    if (selectedStudents.length > 0) {
      const confirmSend = window.confirm(`Do you want to email the attendance report to the ${selectedStudents.length} selected students?`);
      if (confirmSend) {
        requestBody = { recipientUserIds: selectedStudents };
      } else {
        const email = prompt("Enter recipient email address:");
        if (!email) return;
        requestBody = { toEmail: email };
      }
    } else {
      const email = prompt("Enter recipient email address:");
      if (!email) return;
      requestBody = { toEmail: email };
    }

    try {
      const pdf = await generateAttendancePdfBlob();
      const pdfBase64 = pdf.output("datauristring");

      const token = localStorage.getItem("token");
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5001";
      const res = await fetch(`${apiUrl}/api/mail/send-notes`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...requestBody,
          subject: "Classroom Attendance Report",
          text: `Hello,\n\nPlease find the attached classroom attendance report from the session.\n\nBest regards,\nDigital Whiteboard System`,
          attachment: pdfBase64,
          filename: "attendance-report.pdf",
        }),
      });

      const data = await res.json();
      if (res.ok) {
        alert("Attendance report email sent successfully!");
        setHasSentAttendance(true);
      } else {
        alert("Failed to send email: " + data.message);
      }
    } catch (err) {
      console.error("Email share failed:", err);
      alert("An error occurred while sending the email.");
    }
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
        showToolbar={showToolbar}
        setShowToolbar={setShowToolbar}
        showChat={showChat}
        setShowChat={setShowChat}
        showParticipants={showParticipants}
        setShowParticipants={setShowParticipants}
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
            onLogout={handleLogout}
          />

        </div>

        {/* Right Sidebar */}
        {showParticipants && (
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
              <TeacherControlPanel
                classId={classId}
                selectedStudents={selectedStudents}
                sendPdfToWhatsApp={sendPdfToWhatsApp}
                sendPdfByEmail={sendPdfByEmail}
                sendLinkToWhatsApp={sendLinkToWhatsApp}
                sendLinkByEmail={sendLinkByEmail}
                handleSendNotes={handleSendNotes}
                sendAttendancePdfToWhatsApp={sendAttendancePdfToWhatsApp}
                sendAttendancePdfByEmail={sendAttendancePdfByEmail}
                handleEndClass={handleEndClass}
              />
            )}

            {!isTeacher && (
              <StudentAttendancePanel classId={classId} />
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
        )}
      </div>
    </div>
  );
}