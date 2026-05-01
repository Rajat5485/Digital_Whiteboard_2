import Board from "../models/Board.js";

// Save or update board
export const saveBoard = async (req, res) => {
  try {
    const { classId, strokes } = req.body;

    if (!classId || !strokes) {
      return res.status(400).json({ message: "classId and strokes are required" });
    }

    let board = await Board.findOne({ classId });

    if (board) {
      board.strokes = strokes;
      await board.save();
    } else {
      board = await Board.create({ classId, strokes });
    }

    res.json({ message: "Board saved successfully" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get board data
export const getBoard = async (req, res) => {
  try {
    const { classId } = req.params;

    if (!classId) {
      return res.status(400).json({ message: "classId is required" });
    }

    const board = await Board.findOne({ classId });

    if (!board) {
      return res.json({ strokes: [] });
    }

    res.json(board);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};