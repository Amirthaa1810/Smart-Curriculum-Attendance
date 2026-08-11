import { Timetable } from "../models/Timetable.js";
import { Subject } from "../models/Subject.js";
import { Attendance } from "../models/Attendance.js";
import { AcademicTask } from "../models/AcademicTask.js";
import { Class } from "../models/Class.js";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const getDayName = (date = new Date()) => DAY_NAMES[date.getDay()];

export const toDateStr = (date = new Date()) => {
  const d = new Date(date);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
};

const SUGGESTION_TEMPLATES = {
  revision: {
    title: (s) => `Revise ${s} notes`,
    desc: (s) => `Re-read and summarize today's ${s} notes.`,
    duration: 20,
  },
  practice: {
    title: () => "Solve practice problems",
    desc: (s) => `Attempt 3-5 problems from ${s} practice set.`,
    duration: 25,
  },
  preview: {
    title: (s) => `Preview next ${s} class`,
    desc: (s) => `Skim the chapter outline for the next ${s} class.`,
    duration: 15,
  },
  assignment: {
    title: () => "Catch up on pending assignments",
    desc: () => "Review your assignment tracker and complete pending items.",
    duration: 30,
  },
  reading: {
    title: () => "Read a topic from the syllabus",
    desc: () => "Pick a weak topic from the syllabus and read for understanding.",
    duration: 20,
  },
};

/**
 * Build a rule-based daily plan from the timetable + attendance.
 */
export async function generateDailyPlan(student, date = new Date()) {
  const dayName = getDayName(date);
  const dateStr = toDateStr(date);

  if (!student.classId) {
    return { day: dayName, date: dateStr, periods: [], freePeriods: [], plan: [] };
  }

  const slots = await Timetable.find({ classId: student.classId, day: dayName })
    .populate("subjectId")
    .sort({ period: 1 });

  const periods = slots.map((slot) => ({
    period: slot.period,
    startTime: slot.startTime,
    endTime: slot.endTime,
    type: slot.type,
    subject: slot.subjectId
      ? { _id: slot.subjectId._id, name: slot.subjectId.name, code: slot.subjectId.code }
      : null,
  }));

  const freePeriods = slots
    .filter((s) => s.type === "free")
    .map((s) => ({
      period: s.period,
      startTime: s.startTime,
      endTime: s.endTime,
    }));

  // Attendance stats per subject for personalization
  const classInfo = await Class.findById(student.classId);
  const totalExpected = classInfo ? classInfo.students.length : 0;
  const startOfSem = new Date();
  startOfSem.setMonth(startOfSem.getMonth() - 3);

  const attended = await Attendance.aggregate([
    { $match: { studentId: student._id, status: "present" } },
    {
      $group: {
        _id: { subjectId: "$subjectId" },
        present: { $sum: 1 },
      },
    },
  ]);

  const subjectStats = {};
  for (const a of attended) {
    subjectStats[String(a._id.subjectId)] = { present: a.present };
  }

  const classesHeld = await Attendance.aggregate([
    {
      $group: {
        _id: { subjectId: "$subjectId", date: "$date" },
      },
    },
  ]);
  const heldCount = {};
  for (const c of classesHeld) {
    const key = String(c._id.subjectId);
    heldCount[key] = (heldCount[key] || 0) + 1;
  }

  const allSubjects = await Subject.find({ classId: student.classId });

  const subjectStatsFinal = allSubjects.map((subj) => {
    const held = heldCount[String(subj._id)] || 0;
    const present = subjectStats[String(subj._id)]?.present || 0;
    const pct = held === 0 ? 100 : Math.round((present / held) * 100);
    return { subjectId: subj._id, name: subj.name, held, present, pct };
  });

  // Which subjects are "weak"? attendance < 75%
  const weakSubjects = subjectStatsFinal.filter((s) => s.held > 0 && s.pct < 75);
  const weakIds = new Set(weakSubjects.map((s) => String(s.subjectId)));

  // Today's subjects in order
  const todaySubjectIds = periods.filter((p) => p.subject).map((p) => String(p.subject._id));

  // Build plan
  const plan = [];
  freePeriods.forEach((fp, idx) => {
    const subjectName =
      todaySubjectIds.length > 0
        ? periods.find((p) => p.subject)?.subject?.name
        : null;

    const options = [];
    const weakTarget = allSubjects.find((s) => weakIds.has(String(s._id)));

    if (weakTarget && idx === 0) {
      // Prioritize revision for weak subject
      const tpl = SUGGESTION_TEMPLATES.revision;
      options.push({
        title: tpl.title(weakTarget.name),
        description: tpl.desc(weakTarget.name),
        category: "revision",
        duration: tpl.duration,
        priority: "high",
        reason: `Your attendance in ${weakTarget.name} is below 75%`,
      });
    }

    if (subjectName && todaySubjectIds.includes(String(periods.find((p) => p.subject)?.subject?._id))) {
      const preview = SUGGESTION_TEMPLATES.preview;
      options.push({
        title: preview.title(subjectName),
        description: preview.desc(subjectName),
        category: "preview",
        duration: preview.duration,
        priority: "medium",
        reason: "Based on today's classes",
      });
    }

    const practice = SUGGESTION_TEMPLATES.practice;
    const practiceTarget = weakTarget || allSubjects[0];
    if (practiceTarget) {
      options.push({
        title: practice.title(),
        description: practice.desc(practiceTarget.name),
        category: "practice",
        duration: practice.duration,
        priority: "medium",
        reason: `Practice keeps ${practiceTarget.name} concepts sharp`,
      });
    }

    const reading = SUGGESTION_TEMPLATES.reading;
    options.push({
      title: reading.title(),
      description: reading.desc(),
      category: "reading",
      duration: reading.duration,
      priority: "low",
      reason: "General syllabus coverage",
    });

    const task = SUGGESTION_TEMPLATES.assignment;
    options.push({
      title: task.title(),
      description: task.desc(),
      category: "assignment",
      duration: task.duration,
      priority: "medium",
      reason: "Staying on top of submissions",
    });

    plan.push({
      period: fp.period,
      startTime: fp.startTime,
      endTime: fp.endTime,
      options: options.slice(0, 3),
      totalFreeMinutes: minutesBetween(fp.startTime, fp.endTime),
    });
  });

  const isHoliday = periods.length === 0;
  return {
    day: dayName,
    date: dateStr,
    isHoliday,
    periods,
    freePeriods,
    plan,
    subjectStats: subjectStatsFinal,
    weakSubjects: weakSubjects.map((s) => s.name),
    totalExpected,
  };
}

export async function getSuggestionsForStudent(student, date = new Date()) {
  const plan = await generateDailyPlan(student, date);
  const suggestions = plan.plan.flatMap((block, bi) =>
    block.options.map((opt, oi) => ({
      id: `${bi}-${oi}`,
      period: block.period,
      startTime: block.startTime,
      endTime: block.endTime,
      title: opt.title,
      description: opt.description,
      category: opt.category,
      duration: opt.duration,
      priority: opt.priority,
      reason: opt.reason,
    }))
  );

  if (suggestions.length === 0) {
    suggestions.push({
      id: "none",
      period: null,
      title: "No free periods today",
      description: "You have no free periods today. Review notes in the evening.",
      category: "reading",
      duration: 20,
      priority: "low",
      reason: "No free periods detected",
    });
  }

  return suggestions;
}

export async function createTasksFromSuggestions(student, date = new Date()) {
  const plan = await generateDailyPlan(student, date);
  const tasks = [];
  for (const block of plan.plan) {
    for (const opt of block.options.slice(0, 2)) {
      tasks.push({
        studentId: student._id,
        title: opt.title,
        description: opt.description,
        category: opt.category,
        duration: opt.duration,
        completed: false,
        date: toDateStr(date),
      });
    }
  }
  if (tasks.length) {
    await AcademicTask.insertMany(tasks);
  }
  return tasks;
}

function minutesBetween(start, end) {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  return Math.max(0, (eh * 60 + em) - (sh * 60 + sm));
}
