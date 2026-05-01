import Attendance from "../models/Attendance.js";

export const markAttendance = async (req, res) => {
  try {
    const { classId, tabActiveDuration, activeTime } = req.body;
    const today = new Date().toISOString().split("T")[0];
    const minimumTimeRequired = 600; // 10 minutes in seconds

    // Check if attendance already marked today
    let attendance = await Attendance.findOne({
      user: req.user._id,
      classId,
      date: today,
      marked: true
    });

    if (attendance) {
      return res.status(400).json({ message: "Attendance already marked today" });
    }

    // Check if tab active time meets minimum requirement
    const minimumTimeMet = tabActiveDuration >= minimumTimeRequired;

    // Create or update attendance record
    if (!attendance) {
      attendance = await Attendance.create({
        user: req.user._id,
        classId,
        date: today,
        joinTime: new Date(),
        activeTime: activeTime || 0,
        tabActiveDuration: tabActiveDuration || 0,
        minimumTimeMet: minimumTimeMet,
        marked: minimumTimeMet
      });
    } else {
      attendance.activeTime = activeTime || 0;
      attendance.tabActiveDuration = tabActiveDuration || 0;
      attendance.minimumTimeMet = minimumTimeMet;
      attendance.marked = minimumTimeMet;
      await attendance.save();
    }

    res.status(201).json({
      message: minimumTimeMet 
        ? "Attendance marked successfully" 
        : `Attendance not marked. Need ${Math.ceil((minimumTimeRequired - tabActiveDuration) / 60)} more minutes`,
      attendance,
      minimumTimeMet
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateAttendanceTime = async (req, res) => {
  try {
    const { classId, tabActiveDuration, activeTime } = req.body;
    const today = new Date().toISOString().split("T")[0];
    const minimumTimeRequired = 600;

    let attendance = await Attendance.findOne({
      user: req.user._id,
      classId,
      date: today
    });

    if (!attendance) {
      attendance = await Attendance.create({
        user: req.user._id,
        classId,
        date: today,
        joinTime: new Date(),
        activeTime: activeTime || 0,
        tabActiveDuration: tabActiveDuration || 0,
        minimumTimeMet: false
      });
    } else {
      attendance.activeTime = activeTime || 0;
      attendance.tabActiveDuration = tabActiveDuration || 0;
      attendance.minimumTimeMet = tabActiveDuration >= minimumTimeRequired;
      await attendance.save();
    }

    res.json({
      attendance,
      timeRemaining: Math.max(0, minimumTimeRequired - tabActiveDuration),
      minimumTimeMet: attendance.minimumTimeMet
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAttendance = async (req, res) => {
  try {
    const { classId } = req.query;
    
    let query = {};
    if (classId) {
      query.classId = classId;
    }

    const records = await Attendance.find(query)
      .populate("user", "name email role")
      .populate("classId", "name code")
      .sort({ date: -1 });

    res.json(records);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getUserAttendance = async (req, res) => {
  try {
    const records = await Attendance.find({ user: req.user._id })
      .populate("classId", "name code")
      .sort({ date: -1 });

    const summary = {
      totalPresent: records.filter(r => r.marked).length,
      totalAbsent: records.filter(r => !r.marked).length,
      totalSessions: records.length
    };

    res.json({
      records,
      summary
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};