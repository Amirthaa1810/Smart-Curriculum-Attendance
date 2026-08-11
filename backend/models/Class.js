import mongoose from "mongoose";

const classSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    section: { type: String, required: true, trim: true },
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    students: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

classSchema.virtual("subjectCount", {
  ref: "Subject",
  localField: "_id",
  foreignField: "classId",
  count: true,
});

classSchema.set("toJSON", { virtuals: true });

export const Class = mongoose.model("Class", classSchema);
