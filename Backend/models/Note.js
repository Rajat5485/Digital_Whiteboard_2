import mongoose from "mongoose";

const noteSchema = new mongoose.Schema(
  {
    classId: {
      type: String,
      required: true
    },
    teacher: {
      type: String,
      ref: "User",
      required: true
    },
    content: {
      type: String,
      required: true
    },
    recipients: [{
      type: String,
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