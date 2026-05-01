import mongoose from "mongoose";

const boardSchema = new mongoose.Schema(
  {
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Classroom",
      required: true
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