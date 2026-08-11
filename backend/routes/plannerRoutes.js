import { Router } from "express";
import {
  getPlanner,
  getSuggestions,
  generateTasks,
  toggleTask,
  deleteTask,
} from "../controllers/plannerController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = Router();

router.use(protect, authorize("student"));

router.get("/", getPlanner);
router.get("/suggestions", getSuggestions);
router.post("/tasks/generate", generateTasks);
router.patch("/tasks/:id", toggleTask);
router.delete("/tasks/:id", deleteTask);

export default router;
