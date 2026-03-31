import express from "express";
import Board from "../models/Board.js";

const router = express.Router();

/* SAVE BOARD */

router.post("/save", async (req, res) => {

  try {

    const { data } = req.body;

    let board = await Board.findOne();

    if (!board) {
      board = new Board({ data });
    } else {
      board.data = data;
    }

    await board.save();

    res.json({ message: "Board saved successfully" });

  } catch (error) {

    res.status(500).json({ error: error.message });

  }

});

/* LOAD BOARD */

router.get("/load", async (req, res) => {

  try {

    const board = await Board.findOne();

    if (!board) {
      return res.json(null);
    }

    res.json(board);

  } catch (error) {

    res.status(500).json({ error: error.message });

  }

});

export default router;