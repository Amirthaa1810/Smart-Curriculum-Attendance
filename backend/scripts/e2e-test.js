import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { seedDatabase } from "./seedCore.js";
import app from "../app.js";

const API = "http://127.0.0.1:4399/api";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let passed = 0;
let failed = 0;

function check(name, cond, extra = "") {
  if (cond) {
    passed++;
    console.log(`  ✅ ${name}`);
  } else {
    failed++;
    console.log(`  ❌ ${name} ${extra}`);
  }
}

async function request(method, path, body, token) {
  const res = await fetch(API + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

async function main() {
  console.log("Starting in-memory MongoDB...");
  const mongod = await MongoMemoryServer.create({
    binary: { version: "6.0.20" },
  });
  const uri = mongod.getUri("smart_curriculum");
  await mongoose.connect(uri);
  console.log("Seeding demo data...");
  const { cls, subjects } = await seedDatabase({ verbose: false });

  const server = app.listen(4399);
  console.log("Test API listening on 4399\n");

  console.log("── AUTH ──────────────────────────────");
  const teacherLogin = await request("POST", "/auth/login", { email: "teacher@demo.com", password: "teacher123" });
  check("Teacher login works", teacherLogin.status === 200 && teacherLogin.json.user?.role === "teacher");
  const teacherToken = teacherLogin.json.token;

  const studentLogin = await request("POST", "/auth/login", { email: "student@demo.com", password: "student123" });
  check("Student login works", studentLogin.status === 200 && studentLogin.json.user?.role === "student");
  const studentToken = studentLogin.json.token;

  const badLogin = await request("POST", "/auth/login", { email: "student@demo.com", password: "wrong" });
  check("Invalid login rejected (401)", badLogin.status === 401);

  const me = await request("GET", "/auth/me", null, studentToken);
  check("GET /auth/me returns user", me.status === 200 && me.json.user?.email === "student@demo.com");

  console.log("── CLASSES ───────────────────────────");
  const classes = await request("GET", "/classes", null, teacherToken);
  check("Teacher gets classes", classes.status === 200 && classes.json.data.length === 1);
  const myClass = classes.json.data[0];
  check("Class has 5 students", myClass.students.length === 5, `(got ${myClass.students.length})`);
  check("Class has 4 subjects", myClass.subjects.length === 4, `(got ${myClass.subjects.length})`);

  console.log("── QR ATTENDANCE FLOW ────────────────");
  const subjId = myClass.subjects[0]._id; // Data Structures

  // Create session
  const sessionRes = await request("POST", "/attendance/session", {
    classId: myClass._id,
    subjectId: subjId,
    period: 1,
    minutes: 5,
  }, teacherToken);
  check("Teacher creates QR session", sessionRes.status === 201 && !!sessionRes.json.data.qrDataUrl, JSON.stringify(sessionRes.json).slice(0, 120));
  const session = sessionRes.json.data.session;
  check("Session has unique token", typeof session.qrToken === "string" && session.qrToken.length >= 20);
  check("Session has expiry", !!session.expiryTime);

  // Student marks attendance
  const markRes = await request("POST", "/attendance/mark", { sessionId: session._id, token: session.qrToken }, studentToken);
  check("Student marks attendance", markRes.status === 201 && markRes.json.message === "Attendance Marked Successfully", JSON.stringify(markRes.json).slice(0, 120));

  // Duplicate
  const dupRes = await request("POST", "/attendance/mark", { sessionId: session._id, token: session.qrToken }, studentToken);
  check("Duplicate attendance blocked (409)", dupRes.status === 409);

  // Wrong token
  const wrongTokenRes = await request("POST", "/attendance/mark", { sessionId: session._id, token: "wrong-token" }, studentToken);
  check("Invalid QR token rejected (400)", wrongTokenRes.status === 400);

  // Teacher sees live marks
  const live = await request("GET", `/attendance/session/${session._id}`, null, teacherToken);
  check("Teacher sees live marks", live.status === 200 && live.json.data.marks.length === 1, JSON.stringify(live.json).slice(0, 120));

  // Expired session (force expiry in DB)
  const expiredSession = await request("POST", "/attendance/session", {
    classId: myClass._id,
    subjectId: subjId,
    period: 2,
    minutes: 5,
  }, teacherToken);
  const expS = expiredSession.json.data.session;
  await mongoose.model("AttendanceSession").findByIdAndUpdate(expS._id, {
    expiryTime: new Date(Date.now() - 60000),
  });
  const expMark = await request("POST", "/attendance/mark", { sessionId: expS._id, token: expS.qrToken }, studentToken);
  check("Expired QR rejected (400)", expMark.status === 400 && expMark.json.message.includes("expired"), JSON.stringify(expMark.json).slice(0, 120));

  console.log("── ATTENDANCE SUMMARY ────────────────");
  const summary = await request("GET", "/attendance/summary", null, studentToken);
  check("Student summary fetched", summary.status === 200);
  check("Subject-wise data present", summary.json.data.subjectWise.length === 4, JSON.stringify(summary.json.data.subjectWise.map((s) => `${s.subject}:${s.pct}`)).slice(0, 200));
  check("Overall pct computed", typeof summary.json.data.overall.pct === "number" && summary.json.data.overall.total > 0);
  check("Realistic attendance (not 100%)", summary.json.data.overall.pct < 100 && summary.json.data.overall.pct > 50, `(pct=${summary.json.data.overall.pct})`);

  const history = await request("GET", "/attendance/student", null, studentToken);
  check("Student history fetched", history.status === 200 && history.json.data.length > 0);

  console.log("── TIMETABLE ─────────────────────────");
  const tt = await request("GET", "/timetable", null, studentToken);
  check("Student timetable fetched", tt.status === 200 && tt.json.data.grouped.Mon.length === 5, JSON.stringify(tt.json).slice(0, 120));
  const monSlots = tt.json.data.grouped.Mon;
  const freeSlot = monSlots.find((s) => s.type === "free");
  check("Free period detected (P3 Monday)", !!freeSlot && freeSlot.period === 3, JSON.stringify(monSlots).slice(0, 200));
  check("First period has subject", monSlots[0].subject?.name === "Data Structures");

  console.log("── PLANNER / FREE PERIODS / SUGGESTIONS ──");
  const planner = await request("GET", "/planner", null, studentToken);
  check("Planner fetched", planner.status === 200, JSON.stringify(planner.json).slice(0, 120));
  check("Planner has today periods", Array.isArray(planner.json.data.periods));

  const suggestions = await request("GET", "/planner/suggestions", null, studentToken);
  check("Suggestions fetched", suggestions.status === 200 && Array.isArray(suggestions.json.data));
  check("Suggestions exist for free day", suggestions.json.data.length > 0, `(got ${suggestions.json.data.length})`);
  const firstSuggestion = suggestions.json.data[0];
  check("Suggestion has title/duration", !!firstSuggestion?.title && typeof firstSuggestion?.duration === "number");

  const genTasks = await request("POST", "/planner/tasks/generate", null, studentToken);
  check("Auto-generate tasks works", genTasks.status === 201 && genTasks.json.data.length > 0);

  console.log("── ANALYTICS ─────────────────────────");
  const sa = await request("GET", "/analytics/student", null, studentToken);
  check("Student analytics fetched", sa.status === 200, JSON.stringify(sa.json).slice(0, 120));
  check("Student analytics has weekly trend", sa.json.data.weeklyTrend.length === 7);
  check("Weak-subject warning present", sa.json.data.warnings.length > 0, `(warnings=${JSON.stringify(sa.json.data.warnings)})`);

  const ta = await request("GET", "/analytics/teacher", null, teacherToken);
  check("Teacher analytics fetched", ta.status === 200, JSON.stringify(ta.json).slice(0, 120));
  check("Teacher analytics has subject-wise", ta.json.data.subjectWise.length === 4);
  check("Teacher analytics has daily trend", ta.json.data.dailyTrend.length === 14);
  check("Teacher overall is sane (<=100%)", ta.json.data.overall.pct > 0 && ta.json.data.overall.pct <= 100, `(pct=${ta.json.data.overall.pct})`);

  console.log("── TIMETABLE MANAGEMENT (teacher) ────");
  const saveSlot = await request("POST", "/timetable", {
    classId: myClass._id,
    day: "Sat",
    period: 1,
    type: "class",
    subjectId: subjId,
    startTime: "09:00",
    endTime: "10:00",
  }, teacherToken);
  check("Teacher saves timetable slot", saveSlot.status === 201 || saveSlot.status === 200);

  console.log("── ERROR HANDLING ────────────────────");
  const noAuth = await request("GET", "/attendance/summary");
  check("Protected route rejects no token (401)", noAuth.status === 401);

  const forbidden = await request("GET", "/classes", null, studentToken);
  check("Student blocked from teacher route (403)", forbidden.status === 403);

  console.log("\n========================================");
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log("========================================");

  server.close();
  await mongoose.disconnect();
  await mongod.stop();

  process.exit(failed === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error("E2E test crashed:", err);
  process.exit(1);
});
