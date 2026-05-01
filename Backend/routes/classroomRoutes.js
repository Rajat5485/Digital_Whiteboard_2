import express from "express";
import Classroom from "../models/Classroom.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

/* CREATE CLASS */

router.post("/create", protect, async (req, res) => {

  const { name } = req.body;

  const code = Math.random().toString(36).substring(2,8);

  const classroom = new Classroom({
    name,
    code,
    teacher: req.user._id
  });

  await classroom.save();

  res.json(classroom);

});

/* GENERATE JOIN LINK */

router.post("/generate-link", protect, async (req, res) => {
  const { classId } = req.body;

  const classroom = await Classroom.findOne({ _id: classId, teacher: req.user._id });

  if (!classroom) {
    return res.status(404).json({ message: "Class not found or not authorized" });
  }

  const joinLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/join/${classroom._id}`;

  res.json({ joinLink });
});

/* GET TEACHER'S CLASSES */

router.get("/teacher", protect, async (req, res) => {
  const classrooms = await Classroom.find({ teacher: req.user._id });
  res.json(classrooms);
});

/* GET STUDENT'S CLASSES */

router.get("/student", protect, async (req, res) => {
  // For now, return empty array as students join via code/link
  // TODO: Implement student-class relationship
  res.json([]);
});

export default router;