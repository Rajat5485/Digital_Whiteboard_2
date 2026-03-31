import Attendance from "../models/Attendance.js";

const initializeSocket = (io) => {

  io.on("connection", (socket) => {

    console.log("User connected:", socket.id);

    /* JOIN CLASSROOM */

    socket.on("join-class", async ({ classId, userId }) => {

      try {

        socket.join(classId);

        console.log(`User ${userId} joined class ${classId}`);

        const today = new Date().toISOString().split("T")[0];

        const existing = await Attendance.findOne({
          user: userId,
          classId: classId,
          date: today
        });

        if (!existing) {

          await Attendance.create({
            user: userId,
            classId: classId,
            date: today
          });

        }

        io.to(classId).emit("user-joined", { userId });

      } catch (error) {

        console.error("Join class error:", error);

      }

    });

    /* DRAW EVENT */

    socket.on("draw", ({ classId, data }) => {

      socket.to(classId).emit("receive-draw", data);

    });

    /* CLEAR BOARD */

    socket.on("clear-board", (classId) => {

      io.to(classId).emit("clear-board");

    });

    /* DISCONNECT */

    socket.on("disconnect", () => {

      console.log("User disconnected:", socket.id);

    });

  });

};

export default initializeSocket;