import mongoose from "mongoose";

const noteSchema = new mongoose.Schema(
  {
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Classroom",
      required: true
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    content: {
      type: String,
      required: true
    },
    recipients: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }],
    sent: {
      type: Boolean,
      default: false
    },
    sentAt: {
      type: Date
    }
  },
  { timestamps: true }
);

export default mongoose.model("Note", noteSchema);