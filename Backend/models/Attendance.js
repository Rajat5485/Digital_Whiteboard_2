import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Classroom",
      required: true
    },
    date: {
      type: String,
      required: true
    },
    joinTime: {
      type: Date,
      required: true
    },
    activeTime: {
      type: Number, // in seconds
      default: 0
    },
    tabActiveDuration: {
      type: Number, // in seconds (time spent with tab focused)
      default: 0
    },
    marked: {
      type: Boolean,
      default: false
    },
    approved: {
      type: Boolean,
      default: false
    },
    minimumTimeMet: {
      type: Boolean,
      default: false
    },
    minimumTimeRequired: {
      type: Number, // in seconds (default 10 minutes)
      default: 600
    }
  },
  { timestamps: true }
);

export default mongoose.model("Attendance", attendanceSchema);