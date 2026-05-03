import Attendance from "../models/Attendance.js";
import Note from "../models/Note.js";

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
    socket.on("draw", ({ classId, data }) => {
      const user = classSessions[classId]?.[socket.id];

      if (!user || (!user.canDraw && user.role !== "teacher")) {
        return socket.emit("draw-not-allowed");
      }

      socket.to(classId).emit("receive-draw", data);
    });

    /* CLEAR */
    socket.on("clear-board", (classId) => {
      const user = classSessions[classId]?.[socket.id];

      if (!user || (!user.canDraw && user.role !== "teacher")) {
        return socket.emit("draw-not-allowed");
      }

      io.to(classId).emit("receive-clear");
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