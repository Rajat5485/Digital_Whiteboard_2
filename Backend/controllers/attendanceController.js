import Attendance from "../models/Attendance.js";

export const markAttendance = async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];

    const existing = await Attendance.findOne({
      user: req.user._id,
      date: today
    });

    if (existing) {
      return res.status(400).json({ message: "Attendance already marked today" });
    }

    const attendance = await Attendance.create({
      user: req.user._id,
      date: today
    });

    res.status(201).json({
      message: "Attendance marked successfully",
      attendance
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAttendance = async (req, res) => {
  try {
    const records = await Attendance.find().populate("user", "name email role");

    res.json(records);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};