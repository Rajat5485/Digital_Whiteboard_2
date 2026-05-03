import { useState, useEffect, useCallback } from "react";
import socket from "../services/socket";

export default function useClassRoom() {
  const [classId, setClassId] = useState(null);
  const [userId, setUserId] = useState(null);
  const [userName, setUserName] = useState("User");
  const [userRole, setUserRole] = useState("student");
  const [canDraw, setCanDraw] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  const [classUsers, setClassUsers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [teacherNotes, setTeacherNotes] = useState([]);

  const isTeacher = userRole === "teacher";
  const isAllowedToDraw = canDraw || isTeacher;

  const updateNotifications = useCallback((message) => {
    setNotifications((prev) => [message, ...prev].slice(0, 8));
  }, []);

  const handleLogout = useCallback(() => {
    ["userId", "userName", "userRole", "classId"].forEach((k) => localStorage.removeItem(k));
    window.location.href = "/";
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlClassId = params.get("classId");
    const storedClassId = urlClassId || localStorage.getItem("classId") || "default-class";
    if (urlClassId) localStorage.setItem("classId", urlClassId);
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

    socket.on("update-user-list", ({ users }) => {
      setClassUsers(users || []);
      const current = users?.find((u) => u.userId === storedUserId);
      if (current) {
        setCanDraw(Boolean(current.canDraw || current.role === "teacher"));
        setHandRaised(Boolean(current.handRaised));
        setUserRole(current.role || storedUserRole);
        setUserName(current.userName || storedUserName);
      }
    });

    socket.on("draw-permission-changed", ({ allowed }) => {
      setCanDraw(Boolean(allowed || storedUserRole === "teacher"));
      updateNotifications(allowed ? "Teacher allowed you to draw." : "Teacher revoked your draw permission.");
    });

    socket.on("permission-notification", ({ message }) => updateNotifications(message));
    socket.on("permission-updated", ({ userName: targetName, allowed }) => {
      updateNotifications(`${targetName} ${allowed ? "can draw now." : "cannot draw now."}`);
    });
    socket.on("draw-not-allowed", () => updateNotifications("You do not have permission to draw yet."));
    socket.on("receive-notes", ({ from, notes }) => {
      const message = `${from}: ${notes}`;
      setTeacherNotes((prev) => [message, ...prev].slice(0, 10));
      updateNotifications(`Teacher notes received: ${notes}`);
    });
    socket.on("user-joined", ({ userName: joinedName }) => updateNotifications(`${joinedName} joined the class.`));
    socket.on("hand-raised-notification", ({ userName: studentName }) => updateNotifications(`${studentName} raised hand.`));
    socket.on("attendance-approved", ({ message }) => updateNotifications(message || "Attendance approved."));
    socket.on("class-ended", () => {
      alert("The teacher has ended the class session.");
      handleLogout();
    });

    return () => {
      socket.off("update-user-list");
      socket.off("draw-permission-changed");
      socket.off("permission-notification");
      socket.off("permission-updated");
      socket.off("draw-not-allowed");
      socket.off("receive-notes");
      socket.off("user-joined");
      socket.off("hand-raised-notification");
      socket.off("attendance-approved");
      socket.off("class-ended");
    };
  }, [updateNotifications, handleLogout]);

  const startRaiseHand = useCallback(() => {
    const nextState = !handRaised;
    setHandRaised(nextState);
    if (classId) socket.emit("raise-hand", { classId, userId, userName, raised: nextState });
    updateNotifications(nextState ? "Hand raised." : "Hand lowered.");
  }, [handRaised, classId, userId, userName, updateNotifications]);

  const handleToggleDrawPermission = useCallback((targetSocketId, allowed, targetName) => {
    if (!classId || !isTeacher) return;
    socket.emit("toggle-draw-permission", { classId, targetSocketId, allowed });
    updateNotifications(`${allowed ? "Allowed" : "Revoked"} drawing for ${targetName}.`);
  }, [classId, isTeacher, updateNotifications]);

  const handleApproveAttendance = useCallback((targetSocketId, targetName) => {
    if (!classId || !isTeacher) return;
    socket.emit("approve-attendance", { classId, targetSocketId });
    updateNotifications(`Attendance approved for ${targetName}.`);
  }, [classId, isTeacher, updateNotifications]);

  const toggleSelectedStudent = useCallback((studentUserId) => {
    setSelectedStudents((prev) =>
      prev.includes(studentUserId) ? prev.filter((id) => id !== studentUserId) : [...prev, studentUserId]
    );
  }, []);

  const handleSendNotes = useCallback(() => {
    const notes = window.prompt("Enter notes to send:");
    if (!notes?.trim() || !classId || selectedStudents.length === 0) {
      if (selectedStudents.length === 0) alert("Please select students to send notes to.");
      return;
    }
    socket.emit("send-notes-to-selected", { classId, notes: notes.trim(), recipientUserIds: selectedStudents });
    updateNotifications("Notes sent to selected students.");
    setSelectedStudents([]);
  }, [classId, selectedStudents, updateNotifications]);

  const handleEndClass = useCallback(() => {
    if (!classId || !isTeacher) return;
    if (window.confirm("Are you sure you want to end the class? All board data will be deleted.")) {
      socket.emit("end-class", classId);
    }
  }, [classId, isTeacher]);

  return {
    classId, userId, userName, userRole, isTeacher, isAllowedToDraw,
    canDraw, handRaised, classUsers, notifications, selectedStudents,
    teacherNotes, updateNotifications,
    startRaiseHand, handleToggleDrawPermission, handleApproveAttendance,
    toggleSelectedStudent, handleSendNotes, handleLogout, handleEndClass,
  };
}