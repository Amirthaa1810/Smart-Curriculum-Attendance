import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
  {
    sessionId: { type: mongoose.Schema.Types.ObjectId, ref: "AttendanceSession", required: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    classId: { type: mongoose.Schema.Types.ObjectId, ref: "Class", required: true },
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", required: true },
    date: { type: String, required: true }, // YYYY-MM-DD
    period: { type: Number, required: true },
    status: { type: String, enum: ["present", "absent"], default: "present" },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

attendanceSchema.index({ studentId: 1, subjectId: 1 });
attendanceSchema.index({ sessionId: 1, studentId: 1 }, { unique: true });

export const Attendance = mongoose.model("Attendance", attendanceSchema);
