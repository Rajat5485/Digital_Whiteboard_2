import Attendance from "../models/Attendance.js";
import Note from "../models/Note.js";
import Board from "../models/Board.js";

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
    socket.on("approve-attendance", ({ classId, targetSocketId }) => {
      const user = classSessions[classId]?.[socket.id];
      if (!user || user.role !== "teacher") return;

      if (classSessions[classId][targetSocketId]) {
        classSessions[classId][targetSocketId].attendanceApproved = true;
        io.to(targetSocketId).emit("attendance-approved", {
          message: "Your attendance has been approved by the teacher.",
        });
        broadcastUserList(io, classId);
      }
    });

    /* SEND NOTES */
    socket.on("send-notes-to-selected", ({ classId, notes, recipientUserIds }) => {
      const user = classSessions[classId]?.[socket.id];
      if (!user || user.role !== "teacher") return;

      // Find socket IDs for the recipient user IDs
      const recipients = Object.values(classSessions[classId]).filter(u => recipientUserIds.includes(u.userId));
      recipients.forEach(r => {
        io.to(r.socketId).emit("receive-notes", { from: user.userName, notes });
      });
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