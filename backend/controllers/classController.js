import { Class } from "../models/Class.js";
import { Subject } from "../models/Subject.js";
import { User } from "../models/User.js";

export const createClass = async (req, res, next) => {
  try {
    const { name, section, subjects = [] } = req.body;
    if (!name || !section) {
      return res.status(400).json({ success: false, message: "Class name and section are required" });
    }

    const cls = await Class.create({
      name,
      section,
      teacherId: req.user._id,
      students: [],
    });

    for (const subj of subjects) {
      if (subj.name && subj.code) {
        await Subject.create({
          name: subj.name,
          code: subj.code,
          teacherId: req.user._id,
          classId: cls._id,
        });
      }
    }

    const populated = await Class.findById(cls._id).populate("students", "name email studentId");
    return res.status(201).json({ success: true, data: populated });
  } catch (err) {
    next(err);
  }
};

export const getClasses = async (req, res, next) => {
  try {
    const filter = { teacherId: req.user._id };
    const classes = await Class.find(filter)
      .populate("students", "name email studentId")
      .sort({ createdAt: -1 });

    const subjects = await Subject.find({ teacherId: req.user._id }).lean();

    const result = classes.map((c) => ({
      ...c.toObject(),
      subjects: subjects.filter((s) => String(s.classId) === String(c._id)),
    }));

    return res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

export const getClassById = async (req, res, next) => {
  try {
    const cls = await Class.findOne({ _id: req.params.id, teacherId: req.user._id })
      .populate("students", "name email studentId")
      .populate("teacherId", "name email");
    if (!cls) {
      return res.status(404).json({ success: false, message: "Class not found" });
    }
    const subjects = await Subject.find({ classId: cls._id }).lean();
    return res.json({ success: true, data: { ...cls.toObject(), subjects } });
  } catch (err) {
    next(err);
  }
};

export const addStudent = async (req, res, next) => {
  try {
    const cls = await Class.findOne({ _id: req.params.id, teacherId: req.user._id });
    if (!cls) {
      return res.status(404).json({ success: false, message: "Class not found" });
    }
    const { name, email, password, studentId } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "name, email and password are required" });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      if (String(existing.classId) === String(cls._id)) {
        return res.status(409).json({ success: false, message: "A user with this email already exists" });
      }
      existing.classId = cls._id;
      existing.role = "student";
      existing.studentId = studentId || existing.studentId;
      await existing.save();
      if (!cls.students.includes(existing._id)) cls.students.push(existing._id);
      await cls.save();
      return res.status(201).json({ success: true, data: existing.toSafeJSON() });
    }

    const bcrypt = (await import("bcryptjs")).default;
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      passwordHash,
      role: "student",
      studentId: studentId || `STU${Date.now() % 100000}`,
      classId: cls._id,
    });

    cls.students.push(user._id);
    await cls.save();

    return res.status(201).json({ success: true, data: user.toSafeJSON() });
  } catch (err) {
    next(err);
  }
};

export const removeStudent = async (req, res, next) => {
  try {
    const cls = await Class.findOne({ _id: req.params.id, teacherId: req.user._id });
    if (!cls) {
      return res.status(404).json({ success: false, message: "Class not found" });
    }
    cls.students = cls.students.filter((s) => String(s) !== String(req.params.studentId));
    await cls.save();
    return res.json({ success: true, message: "Student removed from class" });
  } catch (err) {
    next(err);
  }
};
