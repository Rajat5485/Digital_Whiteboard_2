import mongoose from "mongoose";

const boardSchema = new mongoose.Schema({
  data: String
});

const Board = mongoose.model("Board", boardSchema);

export default Board;