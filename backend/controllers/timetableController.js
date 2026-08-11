import { Timetable } from "../models/Timetable.js";
import { Subject } from "../models/Subject.js";
import { Class } from "../models/Class.js";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export const getTimetable = async (req, res, next) => {
  try {
    const day = req.query.day || null;
    let classId = req.user.classId;

    if (req.user.role === "teacher") {
      const { classId: cid } = req.query;
      if (!cid) {
        return res.status(400).json({ success: false, message: "classId query param is required for teachers" });
      }
      const cls = await Class.findOne({ _id: cid, teacherId: req.user._id });
      if (!cls) return res.status(404).json({ success: false, message: "Class not found" });
      classId = cid;
    }

    if (!classId) {
      return res.status(404).json({ success: false, message: "No class assigned to your account" });
    }

    const filter = { classId };
    if (day) filter.day = day;

    const entries = await Timetable.find(filter).populate("subjectId", "name code").sort({ period: 1 });

    const grouped = {};
    for (const d of DAYS) {
      const dayEntries = entries
        .filter((e) => e.day === d)
        .map((e) => ({
          _id: e._id,
          period: e.period,
          day: e.day,
          startTime: e.startTime,
          endTime: e.endTime,
          type: e.type,
          subject: e.subjectId
            ? { _id: e.subjectId._id, name: e.subjectId.name, code: e.subjectId.code }
            : null,
        }));
      grouped[d] = dayEntries;
    }

    return res.json({ success: true, data: { day, days: DAYS, grouped } });
  } catch (err) {
    next(err);
  }
};

export const upsertSlot = async (req, res, next) => {
  try {
    const { classId, day, period, subjectId, startTime, endTime, type } = req.body;

    if (!classId || !day || !period || !startTime || !endTime) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const cls = await Class.findOne({ _id: classId, teacherId: req.user._id });
    if (!cls) return res.status(404).json({ success: false, message: "Class not found" });

    if (subjectId && type !== "free") {
      const subj = await Subject.findOne({ _id: subjectId, classId, teacherId: req.user._id });
      if (!subj) return res.status(404).json({ success: false, message: "Subject not found for this class" });
    }

    const slotType = type === "free" ? "free" : "class";

    const existing = await Timetable.findOne({ classId, day, period });
    if (existing) {
      existing.subjectId = slotType === "free" ? null : subjectId;
      existing.startTime = startTime;
      existing.endTime = endTime;
      existing.type = slotType;
      await existing.save();
      return res.json({ success: true, data: existing, message: "Timetable slot updated" });
    }

    const slot = await Timetable.create({
      classId,
      day,
      period,
      subjectId: slotType === "free" ? null : subjectId,
      startTime,
      endTime,
      type: slotType,
    });
    return res.status(201).json({ success: true, data: slot });
  } catch (err) {
    next(err);
  }
};

export const deleteSlot = async (req, res, next) => {
  try {
    const { classId, day, period } = req.params;
    const cls = await Class.findOne({ _id: classId, teacherId: req.user._id });
    if (!cls) return res.status(404).json({ success: false, message: "Class not found" });

    const deleted = await Timetable.findOneAndDelete({ classId, day, period });
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Slot not found" });
    }
    return res.json({ success: true, message: "Slot deleted" });
  } catch (err) {
    next(err);
  }
};
