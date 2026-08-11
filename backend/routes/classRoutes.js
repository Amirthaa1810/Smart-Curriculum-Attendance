import { Router } from "express";
import {
  createClass,
  getClasses,
  getClassById,
  addStudent,
  removeStudent,
} from "../controllers/classController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = Router();

router.use(protect, authorize("teacher"));

router.post("/", createClass);
router.get("/", getClasses);
router.get("/:id", getClassById);
router.post("/:id/students", addStudent);
router.delete("/:id/students/:studentId", removeStudent);

export default router;
