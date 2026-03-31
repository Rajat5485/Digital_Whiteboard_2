import express from "express";
import protect from "../middleware/authMiddleware.js";
import { markAttendance, getAttendance } from "../controllers/attendanceController.js";

const router = express.Router();

router.post("/mark", protect, markAttendance);
router.get("/", protect, getAttendance);

export default router;