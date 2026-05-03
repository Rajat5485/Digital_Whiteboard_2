import express from "express";
import Board from "../models/Board.js";

const router = express.Router();

/* SAVE BOARD */
router.post("/save/:classId", async (req, res) => {
  try {
    const { classId } = req.params;
    const { strokes } = req.body;
    let board = await Board.findOneAndUpdate(
      { classId },
      { $set: { strokes } },
      { upsert: true, new: true }
    );
    res.json({ message: "Board saved successfully", board });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* LOAD BOARD */
router.get("/load/:classId", async (req, res) => {
  try {
    const { classId } = req.params;
    const board = await Board.findOne({ classId });
    if (!board) return res.json({ strokes: [] });
    res.json(board);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* DELETE BOARD (End Class) */
router.delete("/end-class/:classId", async (req, res) => {
  try {
    const { classId } = req.params;
    await Board.findOneAndDelete({ classId });
    res.json({ message: "Class session ended, board data cleared." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;