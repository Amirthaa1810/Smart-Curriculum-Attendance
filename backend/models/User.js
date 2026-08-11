import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["student", "teacher"], required: true },
    studentId: { type: String, default: null },
    teacherId: { type: String, default: null },
    classId: { type: mongoose.Schema.Types.ObjectId, ref: "Class", default: null },
  },
  { timestamps: true }
);

userSchema.methods.toSafeJSON = function () {
  return {
    _id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    studentId: this.studentId,
    teacherId: this.teacherId,
    classId: this.classId,
  };
};

export const User = mongoose.model("User", userSchema);
