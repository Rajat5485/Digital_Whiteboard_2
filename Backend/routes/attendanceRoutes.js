import express from "express";
import protect from "../middleware/authMiddleware.js";
import {
  markAttendance,
  getAttendance,
  updateAttendanceTime,
  getUserAttendance
} from "../controllers/attendanceController.js";

const router = express.Router();

router.post("/mark", protect, markAttendance);
router.post("/update-time", protect, updateAttendanceTime);
router.get("/", protect, getAttendance);
router.get("/my-attendance", protect, getUserAttendance);

export default router;