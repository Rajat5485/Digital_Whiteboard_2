import Attendance from "../models/Attendance.js";
import Note from "../models/Note.js";
import Board from "../models/Board.js";
import User from "../models/User.js";
import mongoose from "mongoose";
import { sendAttendanceEmail, sendNotesEmail } from "../utils/mailer.js";

const classSessions = {};

const getClassUsers = (classId) => {
  return Object.values(classSessions[classId] || {});
};

const broadcastUserList = (io, classId) => {
  io.to(classId).emit("update-user-list", {
    users: getClassUsers(classId),
  });
};

const initializeSocket = (io) => {
  io.on("connection", (socket) => {
    console.log("✅ User connected:", socket.id);

    /* JOIN CLASS */
    socket.on("join-class", async ({ classId, userId, userName, role }) => {
      try {
        socket.join(classId);

        // Check if user is already logged in elsewhere in this class session
        if (classSessions[classId]) {
          const existingSession = Object.values(classSessions[classId]).find(
            (u) => u.userId === userId && u.socketId !== socket.id
          );
          if (existingSession) {
            console.log(`⚠️ User ${userId} already active in class ${classId}. Evicting old socket: ${existingSession.socketId}`);
            // Send warning to old socket client
            io.to(existingSession.socketId).emit("duplicate-login");
            // Force disconnect the old socket connection
            const oldSocket = io.sockets.sockets.get(existingSession.socketId);
            if (oldSocket) {
              oldSocket.disconnect(true);
            }
            delete classSessions[classId][existingSession.socketId];
          }
        }

        socket.data = {
          classId,
          userId,
          userName: userName || "Anonymous",
          role: role || "student",
          canDraw: role === "teacher",
          handRaised: false,
          micOn: false,
          cameraOn: false,
          attendanceApproved: false,
          joinedAt: new Date(),
        };

        if (!classSessions[classId]) {
          classSessions[classId] = {};
        }

        classSessions[classId][socket.id] = {
          socketId: socket.id,
          ...socket.data,
        };

        // Load existing board data from MongoDB
        let board = await Board.findOne({ classId });
        if (!board) {
          board = await Board.create({ classId, strokes: [] });
        }
        socket.emit("load-board", board.strokes);

        io.to(classId).emit("user-joined", {
          userId,
          userName: socket.data.userName,
          role: socket.data.role,
        });

        broadcastUserList(io, classId);

      } catch (err) {
        console.error("❌ Join error:", err);
      }
    });

    /* DRAW (permission safe) */
    socket.on("draw", async ({ classId, data, pageIndex }) => {
      const user = classSessions[classId]?.[socket.id];
      if (!user || (!user.canDraw && user.role !== "teacher")) {
        return socket.emit("draw-not-allowed");
      }

      socket.to(classId).emit("receive-draw", { ...data, pageIndex });
      
      // Save to MongoDB with pageIndex
      await Board.findOneAndUpdate(
        { classId },
        { $push: { strokes: { type: "draw", pageIndex: pageIndex || 0, ...data } } }
      );
    });

    /* DRAW SHAPE */
    socket.on("draw-shape", async (data) => {
      const { classId, pageIndex } = data;
      const user = classSessions[classId]?.[socket.id];
      if (!user || (!user.canDraw && user.role !== "teacher")) return;

      socket.to(classId).emit("receive-shape", data);
      await Board.findOneAndUpdate(
        { classId },
        { $push: { strokes: { type: "shape", pageIndex: pageIndex || 0, ...data } } }
      );
    });

    /* DRAW TEXT */
    socket.on("draw-text", async (data) => {
      const { classId, pageIndex } = data;
      const user = classSessions[classId]?.[socket.id];
      if (!user || (!user.canDraw && user.role !== "teacher")) return;

      socket.to(classId).emit("receive-text", data);
      await Board.findOneAndUpdate(
        { classId },
        { $push: { strokes: { type: "text", pageIndex: pageIndex || 0, ...data } } }
      );
    });

    /* BUCKET FILL */
    socket.on("bucket-fill", async (data) => {
      const { classId, pageIndex } = data;
      const user = classSessions[classId]?.[socket.id];
      if (!user || (!user.canDraw && user.role !== "teacher")) return;

      socket.to(classId).emit("receive-bucket-fill", data);
      await Board.findOneAndUpdate(
        { classId },
        { $push: { strokes: { type: "bucket-fill", pageIndex: pageIndex || 0, ...data } } }
      );
    });

    /* FILL AREA */
    socket.on("fill-area", async (data) => {
      const { classId, pageIndex } = data;
      const user = classSessions[classId]?.[socket.id];
      if (!user || (!user.canDraw && user.role !== "teacher")) return;

      socket.to(classId).emit("receive-fill-area", data);
      await Board.findOneAndUpdate(
        { classId },
        { $push: { strokes: { type: "fill-area", pageIndex: pageIndex || 0, ...data } } }
      );
    });

    /* CLEAR */
    socket.on("clear-board", async ({ classId, pageIndex }) => {
      const user = classSessions[classId]?.[socket.id];
      if (!user || (!user.canDraw && user.role !== "teacher")) {
        return socket.emit("draw-not-allowed");
      }

      io.to(classId).emit("receive-clear", { pageIndex });
      // Remove only strokes for this page
      await Board.findOneAndUpdate(
        { classId }, 
        { $pull: { strokes: { pageIndex: pageIndex || 0 } } }
      );
    });

    /* END CLASS */
    socket.on("end-class", async (classId) => {
      const user = classSessions[classId]?.[socket.id];
      if (!user || user.role !== "teacher") return;

      await Board.findOneAndDelete({ classId });
      io.to(classId).emit("class-ended");
    });

    /* TOGGLE DRAW PERMISSION */
    socket.on("toggle-draw-permission", ({ classId, targetSocketId, allowed }) => {
      const user = classSessions[classId]?.[socket.id];
      if (!user || user.role !== "teacher") return;

      if (classSessions[classId][targetSocketId]) {
        classSessions[classId][targetSocketId].canDraw = allowed;
        io.to(targetSocketId).emit("draw-permission-changed", { allowed });
        io.to(classId).emit("permission-updated", {
          userName: classSessions[classId][targetSocketId].userName,
          allowed,
        });
        broadcastUserList(io, classId);
      }
    });

    /* RAISE HAND */
    socket.on("raise-hand", ({ classId, raised }) => {
      const user = classSessions[classId]?.[socket.id];
      if (!user) return;

      user.handRaised = raised;
      io.to(classId).emit("hand-raised-notification", {
        userName: user.userName,
        raised,
      });
      broadcastUserList(io, classId);
    });

    /* APPROVE ATTENDANCE */
    socket.on("approve-attendance", async ({ classId, targetSocketId }) => {
      const user = classSessions[classId]?.[socket.id];
      if (!user || user.role !== "teacher") return;

      if (classSessions[classId][targetSocketId]) {
        const studentSession = classSessions[classId][targetSocketId];
        studentSession.attendanceApproved = true;
        
        // Notify student (standard alert)
        io.to(targetSocketId).emit("attendance-approved", {
          message: "Your attendance has been approved by the teacher.",
        });

        // Share attendance like notes (it will appear in their Teacher Notes tab)
        io.to(targetSocketId).emit("receive-notes", {
          from: user.userName,
          notes: "Your attendance has been marked as Present by the teacher.",
        });

        broadcastUserList(io, classId);

        let studentDoc = null;
        let teacherDoc = null;

        // Add student to the attendance list in database
        try {
          studentDoc = await User.findOne({ userId: studentSession.userId });
          teacherDoc = await User.findOne({ userId: user.userId });

          if (studentDoc && mongoose.Types.ObjectId.isValid(classId)) {
            const today = new Date().toISOString().split("T")[0];
            let attendance = await Attendance.findOne({
              user: studentDoc._id,
              classId: classId,
              date: today
            });

            if (!attendance) {
              attendance = await Attendance.create({
                user: studentDoc._id,
                classId: classId,
                date: today,
                joinTime: studentSession.joinedAt || new Date(),
                activeTime: 0,
                tabActiveDuration: 0,
                minimumTimeMet: true,
                marked: true,
                approved: true,
                minimumTimeRequired: 600
              });
            } else {
              attendance.marked = true;
              attendance.approved = true;
              attendance.minimumTimeMet = true;
              await attendance.save();
            }
            console.log(`✅ Attendance saved/updated in database for student: ${studentDoc.name}`);
          }
        } catch (dbErr) {
          console.error("❌ Failed to save approved attendance in DB:", dbErr);
        }

        // Send email to student notifying them of approval
        if (studentDoc && teacherDoc) {
          try {
            const subject = `Attendance Approved - ${new Date().toLocaleDateString()}`;
            const text = `Hello ${studentDoc.name},\n\nYour attendance for today's session has been approved by your teacher, ${teacherDoc.name} (${teacherDoc.email}).\n\nStatus: Present\n\nBest regards,\nDigital Whiteboard System`;
            await sendNotesEmail(studentDoc.email, subject, text, null, null, teacherDoc.email, teacherDoc.name);
            console.log(`✅ Attendance approval email sent to student ${studentDoc.email}`);
          } catch (mailErr) {
            console.error("❌ Failed to email student attendance approval:", mailErr);
          }
        }

        // Send email to teacher
        try {
          if (teacherDoc) {
            const allUsers = getClassUsers(classId);
            const presentStudents = allUsers
              .filter(u => u.role === "student" && u.attendanceApproved)
              .map(u => u.userName);
            
            await sendAttendanceEmail(teacherDoc.email, teacherDoc.name, presentStudents);
          }
        } catch (err) {
          console.error("Failed to process attendance email:", err);
        }
      }
    });

    /* SEND NOTES */
    socket.on("send-notes-to-selected", async ({ classId, notes, recipientUserIds }) => {
      const user = classSessions[classId]?.[socket.id];
      if (!user || user.role !== "teacher") return;

      // Find socket IDs for the recipient user IDs (active in current session)
      const recipients = Object.values(classSessions[classId]).filter(u => recipientUserIds.includes(u.userId));
      recipients.forEach(r => {
        io.to(r.socketId).emit("receive-notes", { from: user.userName, notes });
      });

      // Email and save notes
      try {
        const teacherDoc = await User.findOne({ userId: user.userId });
        if (!teacherDoc) {
          console.error("❌ Teacher not found in DB");
          return;
        }

        const studentDocs = await User.find({ userId: { $in: recipientUserIds } });
        const studentEmails = studentDocs.map(s => s.email).filter(Boolean);

        // Save Note to MongoDB
        await Note.create({
          classId: classId,
          teacher: teacherDoc._id,
          content: notes,
          recipients: studentDocs.map(s => s._id),
          sent: true,
          sentAt: new Date()
        });
        console.log("✅ Notes stored in database");

        // Send Email to each student
        if (studentEmails.length > 0) {
          const subject = `Notes from your teacher ${teacherDoc.name}`;
          const text = `Hello,\n\nYour teacher, ${teacherDoc.name} (${teacherDoc.email}), has sent you the following notes:\n\n---\n${notes}\n---\n\nBest regards,\nDigital Whiteboard System`;
          
          for (const email of studentEmails) {
            await sendNotesEmail(email, subject, text, null, null, teacherDoc.email, teacherDoc.name);
          }
          console.log(`✅ Notes emailed to ${studentEmails.length} students from teacher ${teacherDoc.email}`);
        }
      } catch (err) {
        console.error("❌ Failed to process and email notes:", err);
      }
    });

    /* WebRTC Signaling */
    socket.on("webrtc-offer", ({ classId, to, offer }) => {
      // Find the target socketId by userId
      const targetUser = Object.values(classSessions[classId] || {}).find(u => u.userId === to);
      if (targetUser) {
        io.to(targetUser.socketId).emit("webrtc-offer", { from: socket.data.userId, offer });
      }
    });

    socket.on("webrtc-answer", ({ classId, to, answer }) => {
      const targetUser = Object.values(classSessions[classId] || {}).find(u => u.userId === to);
      if (targetUser) {
        io.to(targetUser.socketId).emit("webrtc-answer", { from: socket.data.userId, answer });
      }
    });

    socket.on("ice-candidate", ({ classId, to, candidate }) => {
      const targetUser = Object.values(classSessions[classId] || {}).find(u => u.userId === to);
      if (targetUser) {
        io.to(targetUser.socketId).emit("ice-candidate", { from: socket.data.userId, candidate });
      }
    });

    socket.on("media-state", ({ classId, micOn, cameraOn }) => {
      const user = classSessions[classId]?.[socket.id];
      if (user) {
        user.micOn = micOn;
        user.cameraOn = cameraOn;
        broadcastUserList(io, classId);
      }
    });

    /* DISCONNECT */
    socket.on("disconnect", () => {
      const { classId } = socket.data || {};

      if (classId && classSessions[classId]) {
        delete classSessions[classId][socket.id];
        broadcastUserList(io, classId);
      }

      console.log("❌ User disconnected:", socket.id);
    });
  });
};

export default initializeSocket;