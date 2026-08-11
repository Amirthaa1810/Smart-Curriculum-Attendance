import crypto from "crypto";
import QRCode from "qrcode";
import { AttendanceSession } from "../models/AttendanceSession.js";
import { Attendance } from "../models/Attendance.js";
import { Class } from "../models/Class.js";
import { Subject } from "../models/Subject.js";
import { User } from "../models/User.js";
import { config } from "../config/index.js";
import { toDateStr } from "../services/plannerService.js";

const SESSION_URL_PREFIX =
  process.env.SESSION_URL_PREFIX || "smart-curriculum://scan";

export const createSession = async (req, res, next) => {
  try {
    const { classId, subjectId, date, period, minutes } = req.body;

    if (!classId || !subjectId || !period) {
      return res.status(400).json({ success: false, message: "classId, subjectId and period are required" });
    }

    const cls = await Class.findOne({ _id: classId, teacherId: req.user._id });
    if (!cls) {
      return res.status(404).json({ success: false, message: "Class not found" });
    }

    const subject = await Subject.findOne({ _id: subjectId, classId, teacherId: req.user._id });
    if (!subject) {
      return res.status(404).json({ success: false, message: "Subject not found for this class" });
    }

    const sessionDate = date || toDateStr();
    const durationMinutes = Number(minutes || config.qrSessionMinutes);
    const startTime = new Date();
    const expiryTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);
    const qrToken = crypto.randomBytes(24).toString("hex");

    const session = await AttendanceSession.create({
      classId,
      subjectId,
      teacherId: req.user._id,
      date: sessionDate,
      period: Number(period),
      periodName: `Period ${period}`,
      qrToken,
      startTime,
      expiryTime,
      active: true,
    });

    const payload = JSON.stringify({
      t: "attendance",
      s: session._id.toString(),
      q: qrToken,
      c: sessionDate,
    });
    const qrDataUrl = await QRCode.toDataURL(payload, { width: 400, margin: 1, errorCorrectionLevel: "M" });

    return res.status(201).json({
      success: true,
      data: {
        session,
        qrDataUrl,
        qrPayload: payload,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getSession = async (req, res, next) => {
  try {
    const session = await AttendanceSession.findById(req.params.id)
      .populate("classId", "name section")
      .populate("subjectId", "name code")
      .populate("teacherId", "name email");

    if (!session) {
      return res.status(404).json({ success: false, message: "QR session not found" });
    }

    if (session.expiryTime < new Date() && session.active) {
      session.active = false;
      await session.save();
    }

    const marks = await Attendance.find({ sessionId: session._id })
      .populate("studentId", "name studentId")
      .sort({ timestamp: 1 });

    const now = new Date();
    const expired = session.expiryTime < now;

    return res.json({
      success: true,
      data: {
        session: {
          _id: session._id,
          class: session.classId,
          subject: session.subjectId,
          teacher: session.teacherId,
          date: session.date,
          period: session.period,
          periodName: session.periodName,
          startTime: session.startTime,
          expiryTime: session.expiryTime,
          active: session.active && !expired,
          expired,
          qrPayload: `${SESSION_URL_PREFIX}?session=${session._id}`,
        },
        markedCount: marks.length,
        marks,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const markAttendance = async (req, res, next) => {
  try {
    const { sessionId, token } = req.body;

    if (!sessionId || !token) {
      return res.status(400).json({ success: false, message: "sessionId and token are required" });
    }

    if (req.user.role !== "student") {
      return res.status(403).json({ success: false, message: "Only students can mark attendance" });
    }

    const session = await AttendanceSession.findById(sessionId);
    if (!session) {
      return res.status(400).json({ success: false, message: "Invalid QR code" });
    }

    if (session.qrToken !== token) {
      return res.status(400).json({ success: false, message: "Invalid QR code" });
    }

    const now = new Date();
    if (now > session.expiryTime) {
      if (session.active) {
        session.active = false;
        await session.save();
      }
      return res.status(400).json({ success: false, message: "QR session has expired" });
    }

    if (!session.active) {
      return res.status(400).json({ success: false, message: "QR session is no longer active" });
    }

    if (!req.user.classId || String(req.user.classId) !== String(session.classId)) {
      return res.status(403).json({ success: false, message: "You are not a student of this class" });
    }

    const existing = await Attendance.findOne({ sessionId: session._id, studentId: req.user._id });
    if (existing) {
      return res.status(409).json({ success: false, message: "Attendance already marked for this session" });
    }

    const attendance = await Attendance.create({
      sessionId: session._id,
      studentId: req.user._id,
      classId: session.classId,
      subjectId: session.subjectId,
      date: session.date,
      period: session.period,
      status: "present",
      timestamp: new Date(),
    });

    session.markedCount += 1;
    await session.save();

    return res.status(201).json({
      success: true,
      message: "Attendance Marked Successfully",
      data: attendance,
    });
  } catch (err) {
    next(err);
  }
};

export const studentHistory = async (req, res, next) => {
  try {
    const records = await Attendance.find({ studentId: req.user._id })
      .populate("subjectId", "name code")
      .populate("classId", "name section")
      .sort({ timestamp: -1 })
      .limit(100);

    return res.json({ success: true, data: records });
  } catch (err) {
    next(err);
  }
};

export const studentAttendanceSummary = async (req, res, next) => {
  try {
    const records = await Attendance.find({ studentId: req.user._id }).lean();
    const held = await Attendance.aggregate([{ $group: { _id: { subjectId: "$subjectId", date: "$date" } } }]);

    const heldMap = {};
    for (const h of held) {
      const k = String(h._id.subjectId);
      heldMap[k] = (heldMap[k] || 0) + 1;
    }

    const presentMap = {};
    for (const r of records) {
      if (r.status !== "present") continue;
      const k = String(r.subjectId);
      presentMap[k] = (presentMap[k] || 0) + 1;
    }

    const subjects = await Subject.find({ classId: req.user.classId }).lean();
    const subjectWise = subjects.map((s) => {
      const total = heldMap[String(s._id)] || 0;
      const present = presentMap[String(s._id)] || 0;
      const pct = total === 0 ? 0 : Math.round((present / total) * 100);
      return { subjectId: s._id, subject: s.name, code: s.code, present, total, pct };
    });

    const overallTotal = subjectWise.reduce((a, s) => a + s.total, 0);
    const overallPresent = subjectWise.reduce((a, s) => a + s.present, 0);
    const overallPct = overallTotal === 0 ? 0 : Math.round((overallPresent / overallTotal) * 100);

    return res.json({
      success: true,
      data: {
        overall: { present: overallPresent, total: overallTotal, pct: overallPct },
        subjectWise,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getSessions = async (req, res, next) => {
  try {
    const sessions = await AttendanceSession.find({ teacherId: req.user._id })
      .populate("classId", "name section")
      .populate("subjectId", "name code")
      .sort({ createdAt: -1 })
      .limit(50);

    return res.json({ success: true, data: sessions });
  } catch (err) {
    next(err);
  }
};

export const teacherHistory = async (req, res, next) => {
  try {
    const { classId, subjectId } = req.query;
    const filter = { teacherId: req.user._id };
    if (classId) filter.classId = classId;
    if (subjectId) filter.subjectId = subjectId;

    const records = await Attendance.find(filter)
      .populate("studentId", "name studentId")
      .populate("subjectId", "name code")
      .populate("classId", "name section")
      .sort({ timestamp: -1 })
      .limit(200);

    return res.json({ success: true, data: records });
  } catch (err) {
    next(err);
  }
};
