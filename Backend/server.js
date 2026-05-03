import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";

import connectDB from "./config/db.js";

import authRoutes from "./routes/authRoutes.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";
import boardRoutes from "./routes/boardRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import classroomRoutes from "./routes/classroomRoutes.js";
import protect from "./middleware/authMiddleware.js";
import initializeSocket from "./sockets/socket.js";

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// DB connect FIRST
await connectDB();

// Server create
const server = http.createServer(app);

// Socket setup
const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

initializeSocket(io);

// Routes
app.get("/", (req, res) => {
  res.send("API Running...");
});

app.use("/api/auth", authRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/board", protect, boardRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/classroom", classroomRoutes);

// Protected test route
app.get("/api/protected", protect, (req, res) => {
  res.json({
    message: "Protected route accessed",
    user: req.user
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err);
  if (!res.headersSent) {
    res.status(500).json({ message: err.message || "Server error" });
  }
});

// Start server
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});

