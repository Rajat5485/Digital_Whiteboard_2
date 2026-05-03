import mongoose from "mongoose";

const boardSchema = new mongoose.Schema(
  {
    classId: {
      type: String,
      required: true,
      index: true
    },
    strokes: {
      type: Array,
      default: []
    }
  },
  { timestamps: true }
);

const Board = mongoose.model("Board", boardSchema);

export default Board;