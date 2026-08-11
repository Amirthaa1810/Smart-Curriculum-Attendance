import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { config } from "../config/index.js";
import { User } from "../models/User.js";
import { Class } from "../models/Class.js";
import { Subject } from "../models/Subject.js";
import { Timetable } from "../models/Timetable.js";
import { AttendanceSession } from "../models/AttendanceSession.js";
import { Attendance } from "../models/Attendance.js";
import { AcademicTask } from "../models/AcademicTask.js";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const PERIODS = [
  { period: 1, start: "09:00", end: "10:00" },
  { period: 2, start: "10:00", end: "11:00" },
  { period: 3, start: "11:00", end: "12:00" }, // free
  { period: 4, start: "12:00", end: "13:00" },
  { period: 5, start: "14:00", end: "15:00" },
];

const toDateStr = (date) => {
  const d = new Date(date);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
};

const subjectRotation = (dayIdx) => [
  "Data Structures",
  "Mathematics",
  "free",
  "Digital Electronics",
  "Management",
];

export async function seedDatabase({ verbose = true } = {}) {
  console.log("Clearing existing data...");
  await Promise.all([
    User.deleteMany({}),
    Class.deleteMany({}),
    Subject.deleteMany({}),
    Timetable.deleteMany({}),
    AttendanceSession.deleteMany({}),
    Attendance.deleteMany({}),
    AcademicTask.deleteMany({}),
  ]);

  // Teacher
  const teacherPasswordHash = await bcrypt.hash("teacher123", 10);
  const teacher = await User.create({
    name: "Prof. Anita Sharma",
    email: "teacher@demo.com",
    passwordHash: teacherPasswordHash,
    role: "teacher",
    teacherId: "TCH-2026-001",
  });

  // Class
  const cls = await Class.create({
    name: "CSE 2nd Year",
    section: "B",
    teacherId: teacher._id,
    students: [],
  });

  // Subjects
  const subjectDefs = [
    { name: "Data Structures", code: "CS203" },
    { name: "Mathematics", code: "MA204" },
    { name: "Digital Electronics", code: "EC205" },
    { name: "Management", code: "MS206" },
  ];
  const subjects = [];
  for (const s of subjectDefs) {
    const subj = await Subject.create({
      name: s.name,
      code: s.code,
      teacherId: teacher._id,
      classId: cls._id,
    });
    subjects.push(subj);
  }

  // Students
  const studentDefs = [
    { name: "Rahul Verma", email: "student@demo.com", studentId: "STU2026001" },
    { name: "Priya Singh", email: "priya@demo.com", studentId: "STU2026002" },
    { name: "Arjun Mehta", email: "arjun@demo.com", studentId: "STU2026003" },
    { name: "Sneha Iyer", email: "sneha@demo.com", studentId: "STU2026004" },
    { name: "Karan Patel", email: "karan@demo.com", studentId: "STU2026005" },
  ];
  const studentPasswordHash = await bcrypt.hash("student123", 10);
  const students = [];
  for (const s of studentDefs) {
    const user = await User.create({
      name: s.name,
      email: s.email,
      passwordHash: studentPasswordHash,
      role: "student",
      studentId: s.studentId,
      classId: cls._id,
    });
    students.push(user);
    cls.students.push(user._id);
  }
  await cls.save();

  const subjectByName = (name) => subjects.find((s) => s.name === name);

  // Timetable - one week
  const today = new Date();
  for (let d = 0; d < DAYS.length; d++) {
    const dayIdx = d;
    const rotation = subjectRotation(dayIdx);
    for (const p of PERIODS) {
      const subjName = rotation[p.period - 1];
      await Timetable.create({
        classId: cls._id,
        day: DAYS[dayIdx],
        period: p.period,
        subjectId: subjName === "free" ? null : subjectByName(subjName)._id,
        startTime: p.start,
        endTime: p.end,
        type: subjName === "free" ? "free" : "class",
      });
    }
  }

  // Sample attendance history (past 3 weeks, Mon-Fri)
  let sessionCounter = 0;
  for (let back = 21; back >= 0; back--) {
    const d = new Date();
    d.setDate(d.getDate() - back);
    const dow = d.getDay();
    if (dow === 0 || dow === 6) continue;

    const dayIdx = DAYS.indexOf(["Mon", "Tue", "Wed", "Thu", "Fri"][dow - 1]);
    const rotation = subjectRotation(dayIdx);
    const dateStr = toDateStr(d);

    for (let p = 1; p <= 5; p++) {
      const subjName = rotation[p - 1];
      if (subjName === "free") continue;
      const subject = subjectByName(subjName);
      sessionCounter++;

      const start = new Date(d);
      start.setHours(9, 0, 0, 0);
      const session = await AttendanceSession.create({
        classId: cls._id,
        subjectId: subject._id,
        teacherId: teacher._id,
        date: dateStr,
        period: p,
        periodName: `Period ${p}`,
        qrToken: `seed-token-${sessionCounter}-${Math.random().toString(36).slice(2, 10)}`,
        startTime: new Date(start.getTime() - 60 * 60 * 1000),
        expiryTime: new Date(start.getTime() + 60 * 60 * 1000),
        active: false,
      });

      for (const student of students) {
        const hash = (student.studentId + dateStr + String(p) + subject.name)
          .split("")
          .reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
        const r = hash % 10;
        // Deterministic presence: demo student ~78% overall, weak on Management
        let present = true;
        if (student.studentId === "STU2026001") {
          if (subject.name === "Management") present = r >= 4; // ~60-65% (weak subject)
          else present = r !== 0 && r !== 5; // ~85%
        } else if (student.studentId === "STU2026002") present = r >= 2; // ~80%
        else if (student.studentId === "STU2026003") present = r >= 4; // ~60%
        else if (student.studentId === "STU2026004") present = r >= 3; // ~70%
        else present = r >= 5; // ~50%

        await Attendance.create({
          sessionId: session._id,
          studentId: student._id,
          classId: cls._id,
          subjectId: subject._id,
          date: dateStr,
          period: p,
          status: present ? "present" : "absent",
          timestamp: new Date(start.getTime() + (present ? 5 : 0) * 60 * 1000),
        });
      }
    }
  }

  // Sample academic tasks for demo student
  const demoStudent = students[0];
  const todayStr = toDateStr(new Date());
  const tasks = [
    { title: "Revise Binary Search notes", description: "Go over today's Data Structures notes on binary search.", category: "revision", duration: 20 },
    { title: "Solve 3 DSA problems", description: "Practice 3 problems from the DSA sheet (trees).", category: "practice", duration: 25 },
    { title: "Preview next Math class", description: "Skim the chapter on Linear Algebra.", category: "preview", duration: 15 },
    { title: "Submit Management assignment", description: "Finish the business model canvas draft.", category: "assignment", duration: 30 },
  ];
  await AcademicTask.insertMany(
    tasks.map((t, i) => ({
      studentId: demoStudent._id,
      title: t.title,
      description: t.description,
      category: t.category,
      duration: t.duration,
      completed: i === 0,
      date: todayStr,
    }))
  );

  console.log("🌱 Seeding complete!");
  console.log("-------------------------------------");
  console.log("Teacher : teacher@demo.com / teacher123");
  console.log("Student : student@demo.com / student123");
  console.log("-------------------------------------");
  console.log("Class   : CSE 2nd Year B");
  console.log("Subjects: Data Structures, Mathematics, Digital Electronics, Management");
  console.log(`Students: ${students.length} (demo: STU2026001)`);

  return { teacher, cls, subjects, students, demoStudent };
}

const isMain = process.argv[1] && import.meta.url === `file://${process.argv[1].replace(/\\/g, "/")}`;

const seed = async () => {
  await mongoose.connect(config.mongoUri);
  console.log(`Connected: ${mongoose.connection.host}`);
  const result = await seedDatabase();
  await mongoose.disconnect();
  console.log("Done.");
  return result;
};

if (isMain) {
  seed().catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
}
