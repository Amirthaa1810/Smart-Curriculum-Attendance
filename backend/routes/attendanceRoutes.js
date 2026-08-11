import { Router } from "express";
import {
  createSession,
  getSession,
  markAttendance,
  studentHistory,
  studentAttendanceSummary,
  getSessions,
  teacherHistory,
} from "../controllers/attendanceController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = Router();

router.use(protect);

// Teacher routes
router.post("/session", authorize("teacher"), createSession);
router.get("/session/:id", getSession);
router.get("/sessions", authorize("teacher"), getSessions);
router.get("/history", authorize("teacher"), teacherHistory);

// Shared / student routes
router.post("/mark", authorize("student"), markAttendance);
router.get("/student", authorize("student"), studentHistory);
router.get("/summary", authorize("student"), studentAttendanceSummary);

export default router;
