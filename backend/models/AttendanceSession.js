import mongoose from "mongoose";

const attendanceSessionSchema = new mongoose.Schema(
  {
    classId: { type: mongoose.Schema.Types.ObjectId, ref: "Class", required: true },
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", required: true },
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: String, required: true }, // YYYY-MM-DD
    period: { type: Number, required: true },
    periodName: { type: String, default: "" },
    qrToken: { type: String, required: true, unique: true },
    startTime: { type: Date, required: true },
    expiryTime: { type: Date, required: true },
    active: { type: Boolean, default: true },
    markedCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

attendanceSessionSchema.index({ classId: 1, date: 1, period: 1 });

export const AttendanceSession = mongoose.model("AttendanceSession", attendanceSessionSchema);
