import mongoose from "mongoose";

const classroomSchema = new mongoose.Schema({

  name: String,

  code: String,

  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  minimumTimeRequired: {
    type: Number,
    default: 600 // 10 minutes in seconds
  }

});

export default mongoose.model("Classroom", classroomSchema);