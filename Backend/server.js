import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import authRoutes from "./routes/authRoutes.js";
import protect from "./middleware/authMiddleware.js";
import initializeSocket from "./sockets/socket.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";
import boardRoutes from "./routes/boardRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import connectDB from "./config/db.js";
import classroomRoutes from "./routes/classroomRoutes.js";
dotenv.config();

connectDB();

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

initializeSocket(io);

app.get("/", (req, res) => {
  res.send("API Running...");
});
app.use("/api/auth", authRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/board", protect,boardRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/classroom", classroomRoutes);
app.get("/api/protected", protect, (req, res) => {
  res.json({
    message: "Protected route accessed",
    user: req.user
  });
});
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});