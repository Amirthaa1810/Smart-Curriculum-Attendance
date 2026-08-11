import {
  generateDailyPlan,
  getSuggestionsForStudent,
  createTasksFromSuggestions,
} from "../services/plannerService.js";
import { AcademicTask } from "../models/AcademicTask.js";

export const getPlanner = async (req, res, next) => {
  try {
    const date = req.query.date ? new Date(req.query.date) : new Date();
    const plan = await generateDailyPlan(req.user, date);
    const tasks = await AcademicTask.find({
      studentId: req.user._id,
      date: plan.date,
    }).sort({ completed: 1, createdAt: 1 });
    return res.json({ success: true, data: { ...plan, tasks } });
  } catch (err) {
    next(err);
  }
};

export const getSuggestions = async (req, res, next) => {
  try {
    const date = req.query.date ? new Date(req.query.date) : new Date();
    const suggestions = await getSuggestionsForStudent(req.user, date);
    return res.json({ success: true, data: suggestions });
  } catch (err) {
    next(err);
  }
};

export const generateTasks = async (req, res, next) => {
  try {
    const date = req.query.date ? new Date(req.query.date) : new Date();
    const tasks = await createTasksFromSuggestions(req.user, date);
    return res.status(201).json({ success: true, data: tasks });
  } catch (err) {
    next(err);
  }
};

export const toggleTask = async (req, res, next) => {
  try {
    const task = await AcademicTask.findOne({ _id: req.params.id, studentId: req.user._id });
    if (!task) return res.status(404).json({ success: false, message: "Task not found" });
    task.completed = !task.completed;
    await task.save();
    return res.json({ success: true, data: task });
  } catch (err) {
    next(err);
  }
};

export const deleteTask = async (req, res, next) => {
  try {
    const task = await AcademicTask.findOneAndDelete({ _id: req.params.id, studentId: req.user._id });
    if (!task) return res.status(404).json({ success: false, message: "Task not found" });
    return res.json({ success: true, message: "Task deleted" });
  } catch (err) {
    next(err);
  }
};
