import Attendance from "../models/Attendance.js";
import Note from "../models/Note.js";

const classSessions = {};

const getClassUsers = (classId) => {
  return Object.values(classSessions[classId] || {}).map((user) => ({
    socketId: user.socketId,
    userId: user.userId,
    userName: user.userName,
    role: user.role,
    canDraw: user.canDraw,
    handRaised: user.handRaised,
    micOn: user.micOn,
    cameraOn: user.cameraOn,
    attendanceApproved: user.attendanceApproved,
    joinedAt: user.joinedAt,
  }));
};

const broadcastUserList = (io, classId) => {
  io.to(classId).emit("update-user-list", {
    users: getClassUsers(classId),
  });
};

const initializeSocket = (io) => {

  io.on("connection", (socket) => {

    console.log("User connected:", socket.id);

    /* JOIN CLASSROOM */
    socket.on("join-class", async ({ classId, userId, userName, role }) => {
      try {
        socket.join(classId);

        socket.data.classId = classId;
        socket.data.userId = userId;
        socket.data.userName = userName || "Anonymous";
        socket.data.role = role || "student";
        socket.data.canDraw = socket.data.role === "teacher";
        socket.data.handRaised = false;
        socket.data.micOn = false;
        socket.data.cameraOn = false;
        socket.data.attendanceApproved = false;
        socket.data.joinedAt = new Date();

        if (!classSessions[classId]) {
          classSessions[classId] = {};
        }

        classSessions[classId][socket.id] = {
          socketId: socket.id,
          userId: socket.data.userId,
          userName: socket.data.userName,
          role: socket.data.role,
          canDraw: socket.data.canDraw,
          handRaised: socket.data.handRaised,
          micOn: socket.data.micOn,
          cameraOn: socket.data.cameraOn,
          attendanceApproved: socket.data.attendanceApproved,
          joinedAt: socket.data.joinedAt,
        };

        console.log(`User ${userId} joined class ${classId}`);

        // Remove automatic attendance marking
        // const today = new Date().toISOString().split("T")[0];
        // const existing = await Attendance.findOne({
        //   user: userId,
        //   classId: classId,
        //   date: today,
        // });

        // if (!existing) {
        //   await Attendance.create({
        //     user: userId,
        //     classId: classId,
        //     date: today,
        //     joinTime: new Date(),
        //   });
        // }

        io.to(classId).emit("user-joined", {
          userId,
          userName: socket.data.userName,
          role: socket.data.role,
        });
        broadcastUserList(io, classId);
      } catch (error) {
        console.error("Join class error:", error);
      }
    });

    /* TOGGLE DRAW PERMISSION */
    socket.on("toggle-draw-permission", ({ classId, targetSocketId, allowed }) => {
      const current = classSessions[classId]?.[socket.id];
      if (!current || current.role !== "teacher") {
        return;
      }

      const target = classSessions[classId]?.[targetSocketId];
      if (!target) return;

      target.canDraw = Boolean(allowed);
      io.to(target.socketId).emit("draw-permission-changed", { allowed: target.canDraw });
      broadcastUserList(io, classId);
    });

    /* APPROVE ATTENDANCE */
    socket.on("approve-attendance", async ({ classId, targetSocketId }) => {
      const current = classSessions[classId]?.[socket.id];
      if (!current || current.role !== "teacher") {
        return;
      }

      const target = classSessions[classId]?.[targetSocketId];
      if (!target) return;

      const today = new Date().toISOString().split("T")[0];
      const existing = await Attendance.findOne({
        user: target.userId,
        classId: classId,
        date: today,
      });

      if (!existing) {
        await Attendance.create({
          user: target.userId,
          classId: classId,
          date: today,
          joinTime: new Date(),
          approved: true,
        });
      } else if (!existing.approved) {
        existing.approved = true;
        await existing.save();
      }

      target.attendanceApproved = true;
      broadcastUserList(io, classId);
    });

    /* RAISE HAND */
    socket.on("raise-hand", ({ classId, raised }) => {
      const current = classSessions[classId]?.[socket.id];
      if (!current) return;
      current.handRaised = raised === undefined ? !current.handRaised : Boolean(raised);
      broadcastUserList(io, classId);
    });

    /* MEDIA STATE */
    socket.on("media-state", ({ classId, micOn, cameraOn }) => {
      const current = classSessions[classId]?.[socket.id];
      if (!current) return;
      current.micOn = Boolean(micOn);
      current.cameraOn = Boolean(cameraOn);
      broadcastUserList(io, classId);
    });

    /* SEND NOTES */
    socket.on("send-notes", ({ classId, notes }) => {
      const current = classSessions[classId]?.[socket.id];
      if (!current || current.role !== "teacher") return;

      io.to(classId).emit("receive-notes", {
        from: current.userName,
        notes,
        timestamp: new Date().toISOString(),
      });
    });

    /* SEND NOTES TO SELECTED STUDENTS */
    socket.on("send-notes-to-selected", async ({ classId, notes, recipientUserIds }) => {
      const current = classSessions[classId]?.[socket.id];
      if (!current || current.role !== "teacher") return;

      // Save note to database
      const note = await Note.create({
        classId,
        teacher: current.userId,
        content: notes,
        recipients: recipientUserIds,
        sent: true,
        sentAt: new Date(),
      });

      // Send to selected recipients currently online
      const recipients = recipientUserIds.map(userId => {
        const user = Object.values(classSessions[classId] || {}).find(u => u.userId === userId);
        return user ? user.socketId : null;
      }).filter(Boolean);

      recipients.forEach(socketId => {
        io.to(socketId).emit("receive-notes", {
          from: current.userName,
          notes,
          timestamp: new Date().toISOString(),
        });
      });
    });

    /* PENCIL/BRUSH DRAW EVENT */
    socket.on("draw", ({ classId, data }) => {
      const current = classSessions[classId]?.[socket.id];
      if (!current || (!current.canDraw && current.role !== "teacher")) {
        socket.emit("draw-not-allowed");
        return;
      }

      socket.to(classId).emit("receive-draw", data);
    });

    /* SHAPE DRAW EVENT */
    socket.on(
      "draw-shape",
      ({ classId, startX, startY, endX, endY, tool, color, brushSize }) => {
        const current = classSessions[classId]?.[socket.id];
        if (!current || (!current.canDraw && current.role !== "teacher")) {
          socket.emit("draw-not-allowed");
          return;
        }

        socket.to(classId).emit("receive-shape", {
          startX,
          startY,
          endX,
          endY,
          tool,
          color,
          brushSize,
        });
      }
    );

    /* TEXT DRAW EVENT */
    socket.on("draw-text", ({ classId, x, y, text, color, brushSize }) => {
      const current = classSessions[classId]?.[socket.id];
      if (!current || (!current.canDraw && current.role !== "teacher")) {
        socket.emit("draw-not-allowed");
        return;
      }

      socket.to(classId).emit("receive-text", {
        x,
        y,
        text,
        color,
        brushSize,
      });
    });

    /* CLEAR BOARD */
    socket.on("clear-board", (classId) => {
      const current = classSessions[classId]?.[socket.id];
      if (!current || (!current.canDraw && current.role !== "teacher")) {
        socket.emit("draw-not-allowed");
        return;
      }

      io.to(classId).emit("receive-clear");
    });

    /* WebRTC OFFER */
    socket.on("offer", ({ classId, from, fromName, to, offer }) => {
      // Find the target user's socket and send offer
      const targetSocket = Object.entries(classSessions[classId] || {}).find(
        ([, user]) => user.userId === to
      );
      if (targetSocket) {
        io.to(targetSocket[1].socketId).emit("offer", {
          from,
          fromName,
          offer,
        });
      }
    });

    /* WebRTC ANSWER */
    socket.on("answer", ({ classId, from, to, answer }) => {
      // Find the target user's socket and send answer
      const targetSocket = Object.entries(classSessions[classId] || {}).find(
        ([, user]) => user.userId === to
      );
      if (targetSocket) {
        io.to(targetSocket[1].socketId).emit("answer", {
          from,
          answer,
        });
      }
    });

    /* WebRTC ICE CANDIDATE */
    socket.on("ice-candidate", ({ classId, to, candidate }) => {
      // Find the target user's socket and send ICE candidate
      const targetSocket = Object.entries(classSessions[classId] || {}).find(
        ([, user]) => user.userId === to
      );
      if (targetSocket) {
        io.to(targetSocket[1].socketId).emit("ice-candidate", {
          from: socket.data.userId,
          candidate,
        });
      }
    });

    /* DISCONNECT */
    socket.on("disconnect", () => {
      const classId = socket.data.classId;
      if (classId && classSessions[classId]) {
        delete classSessions[classId][socket.id];
        broadcastUserList(io, classId);
      }
      console.log("User disconnected:", socket.id);
    });

  });

};

export default initializeSocket;