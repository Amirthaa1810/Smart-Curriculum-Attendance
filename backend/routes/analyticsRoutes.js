import { Router } from "express";
import { getStudentAnalytics, getTeacherAnalytics } from "../controllers/analyticsController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = Router();

router.use(protect);

router.get("/student", authorize("student"), getStudentAnalytics);
router.get("/teacher", authorize("teacher"), getTeacherAnalytics);

export default router;
