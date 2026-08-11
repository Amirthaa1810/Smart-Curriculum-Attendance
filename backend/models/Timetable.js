import mongoose from "mongoose";

const timetableSchema = new mongoose.Schema(
  {
    classId: { type: mongoose.Schema.Types.ObjectId, ref: "Class", required: true },
    day: { type: String, required: true }, // Mon, Tue, ...
    period: { type: Number, required: true },
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: "Subject" },
    startTime: { type: String, required: true }, // HH:mm
    endTime: { type: String, required: true }, // HH:mm
    type: { type: String, enum: ["class", "free", "break"], default: "class" },
  },
  { timestamps: true }
);

timetableSchema.index({ classId: 1, day: 1, period: 1 }, { unique: true });

export const Timetable = mongoose.model("Timetable", timetableSchema);
