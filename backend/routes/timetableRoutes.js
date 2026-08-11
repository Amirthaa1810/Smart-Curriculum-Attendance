import { Router } from "express";
import { getTimetable, upsertSlot, deleteSlot } from "../controllers/timetableController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = Router();

router.use(protect);

router.get("/", getTimetable);
router.post("/", authorize("teacher"), upsertSlot);
router.delete("/:classId/:day/:period", authorize("teacher"), deleteSlot);

export default router;
