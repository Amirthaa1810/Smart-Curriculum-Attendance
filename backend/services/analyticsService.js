import { Attendance } from "../models/Attendance.js";
import { AttendanceSession } from "../models/AttendanceSession.js";
import { Subject } from "../models/Subject.js";
import { Class } from "../models/Class.js";
import { User } from "../models/User.js";
import { Timetable } from "../models/Timetable.js";
import { toDateStr, getDayName } from "./plannerService.js";

export async function studentAnalytics(student) {
  const overall = await Attendance.aggregate([
    { $match: { studentId: student._id, status: "present" } },
    { $group: { _id: null, present: { $sum: 1 } } },
  ]);

  const held = await Attendance.aggregate([
    { $group: { _id: { subjectId: "$subjectId", date: "$date" } } },
  ]);

  const subjectAgg = await Attendance.aggregate([
    { $match: { studentId: student._id, status: "present" } },
    {
      $group: {
        _id: "$subjectId",
        present: { $sum: 1 },
      },
    },
  ]);

  const heldMap = {};
  for (const h of held) {
    const k = String(h._id.subjectId);
    heldMap[k] = (heldMap[k] || 0) + 1;
  }

  const presentMap = {};
  for (const s of subjectAgg) presentMap[String(s._id)] = s.present;

  const subjects = await Subject.find({ classId: student.classId }).lean();
  const subjectWise = subjects.map((s) => {
    const total = heldMap[String(s._id)] || 0;
    const present = presentMap[String(s._id)] || 0;
    const pct = total === 0 ? 0 : Math.round((present / total) * 100);
    return { subject: s.name, code: s.code, present, total, pct };
  });

  // Weekly trend (last 7 days)
  const weeklyTrend = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = toDateStr(d);
    const dayRec = await Attendance.findOne({ studentId: student._id, date: dateStr, status: "present" });
    weeklyTrend.push({ day: getDayName(d).slice(0, 3), date: dateStr, count: dayRec ? 1 : 0, present: dayRec ? 1 : 0 });
  }

  const presentTotal = overall[0]?.present || 0;
  const totalHeld = subjectWise.reduce((acc, s) => acc + s.total, 0);
  const overallPct = totalHeld === 0 ? 0 : Math.round((presentTotal / totalHeld) * 100);

  const warnings = subjectWise
    .filter((s) => s.total > 0 && s.pct < 75)
    .map((s) => ({
      subject: s.subject,
      pct: s.pct,
      message: `Attendance below 75%`,
    }));

  return {
    overall: { present: presentTotal, total: totalHeld, pct: overallPct },
    subjectWise,
    weeklyTrend,
    warnings,
    historyCount: presentTotal,
  };
}

export async function teacherAnalytics(teacher) {
  const classes = await Class.find({ teacherId: teacher._id }).lean();
  const classIds = classes.map((c) => c._id);

  const allStudents = await User.find({ role: "student", classId: { $in: classIds } }).lean();
  const allSubjects = await Subject.find({ teacherId: teacher._id }).lean();

  // held classes per subject
  const held = await Attendance.aggregate([
    { $group: { _id: { subjectId: "$subjectId", date: "$date" } } },
  ]);
  const heldMap = {};
  for (const h of held) heldMap[String(h._id.subjectId)] = (heldMap[String(h._id.subjectId)] || 0) + 1;

  const presentAgg = await Attendance.aggregate([
    { $match: { status: "present" } },
    { $group: { _id: { subjectId: "$subjectId", studentId: "$studentId" }, present: { $sum: 1 } } },
  ]);
  const presentPerSubject = await Attendance.aggregate([
    { $match: { status: "present" } },
    { $group: { _id: "$subjectId", present: { $sum: 1 } } },
  ]);
  const presentMap = {};
  for (const p of presentPerSubject) presentMap[String(p._id)] = p.present;

  const subjectWise = allSubjects.map((s) => {
    const total = heldMap[String(s._id)] || 0;
    const present = presentMap[String(s._id)] || 0;
    const pct = total === 0 ? 0 : Math.round((present / total) * 100);
    return { subject: s.name, code: s.code, present, total, pct };
  });

  // Class-wise (avg student attendance per class)
  const classWise = [];
  for (const c of classes) {
    const subjIds = allSubjects.filter((s) => String(s.classId) === String(c._id)).map((s) => s._id);
    let totalPresent = 0;
    let totalHeld = 0;
    for (const sid of subjIds) {
      totalPresent += presentMap[String(sid)] || 0;
      totalHeld += heldMap[String(sid)] || 0;
    }
    const expectedStudents = c.students ? c.students.length : 0;
    const expectedAttendance = totalHeld * expectedStudents;
    const pct = expectedAttendance === 0 ? 0 : Math.round((totalPresent / expectedAttendance) * 100);
    classWise.push({ class: `${c.name} ${c.section}`, pct, present: totalPresent, total: expectedAttendance });
  }

  // Today's attendance per class
  const today = toDateStr();
  const todaysSessions = await AttendanceSession.find({ teacherId: teacher._id, date: today }).lean();
  const todayMarked = await Attendance.countDocuments({
    classId: { $in: classIds },
    date: today,
    status: "present",
  });

  // Daily trend (last 14 days)
  const dailyTrend = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = toDateStr(d);
    const count = await Attendance.countDocuments({ classId: { $in: classIds }, date: dateStr, status: "present" });
    dailyTrend.push({ day: `${getDayName(d).slice(0, 3)} ${dateStr.slice(5)}`, count });
  }

  // Low attendance students
  // pct = (student's present marks) / (classes held for their class) across subjects
  const presentStudentBySubj = {};
  for (const p of presentAgg) {
    const key = `${String(p._id.subjectId)}|${String(p._id.studentId)}`;
    presentStudentBySubj[key] = p.present;
  }
  const lowAttendance = [];
  for (const s of allStudents) {
    let present = 0;
    let total = 0;
    for (const subj of allSubjects.filter((x) => String(x.classId) === String(s.classId))) {
      total += heldMap[String(subj._id)] || 0;
      const aggKey = `${String(subj._id)}|${String(s._id)}`;
      present += presentStudentBySubj[aggKey] || 0;
    }
    if (total > 0) {
      const pct = Math.round((present / total) * 100);
      if (pct < 75) {
        lowAttendance.push({ name: s.name, studentId: s.studentId, pct, present, total });
      }
    }
  }
  lowAttendance.sort((a, b) => a.pct - b.pct);

  const totalSessions = await AttendanceSession.countDocuments({ teacherId: teacher._id });
  const totalPresentCount = await Attendance.countDocuments({ classId: { $in: classIds }, status: "present" });
  const totalHeldCount = subjectWise.reduce((acc, s) => acc + s.total, 0);
  const totalExpected = totalHeldCount * Math.max(allStudents.length, 1);
  const overallPct = totalExpected === 0 ? 0 : Math.round((totalPresentCount / totalExpected) * 100);

  return {
    overall: { pct: overallPct, present: totalPresentCount, total: totalExpected },
    today: { sessions: todaysSessions.length, marked: todayMarked, classes: classWise.length },
    classWise,
    subjectWise,
    dailyTrend,
    lowAttendance,
    studentsCount: allStudents.length,
    subjectsCount: allSubjects.length,
    classesCount: classes.length,
    sessionsCount: totalSessions,
  };
}
