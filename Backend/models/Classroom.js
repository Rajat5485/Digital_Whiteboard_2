import mongoose from "mongoose";

const classroomSchema = new mongoose.Schema({

  name: String,

  code: String,

  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }

});

export default mongoose.model("Classroom", classroomSchema);