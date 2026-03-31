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

/* JOIN CLASS */

router.post("/join", protect, async (req, res) => {

  const { code } = req.body;

  const classroom = await Classroom.findOne({ code });

  if (!classroom) {
    return res.status(404).json({ message: "Class not found" });
  }

  res.json(classroom);

});

export default router;