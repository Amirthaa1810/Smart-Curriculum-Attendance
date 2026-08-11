import { studentAnalytics, teacherAnalytics } from "../services/analyticsService.js";

export const getStudentAnalytics = async (req, res, next) => {
  try {
    const data = await studentAnalytics(req.user);
    return res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

export const getTeacherAnalytics = async (req, res, next) => {
  try {
    const data = await teacherAnalytics(req.user);
    return res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};
