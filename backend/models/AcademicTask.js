import mongoose from "mongoose";

const academicTaskSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    category: { type: String, enum: ["revision", "practice", "preview", "assignment", "reading"], default: "revision" },
    duration: { type: Number, default: 15 }, // minutes
    completed: { type: Boolean, default: false },
    date: { type: String, default: null }, // YYYY-MM-DD target date
  },
  { timestamps: true }
);

export const AcademicTask = mongoose.model("AcademicTask", academicTaskSchema);
