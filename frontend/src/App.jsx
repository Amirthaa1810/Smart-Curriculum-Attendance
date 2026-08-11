import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import AppLayout, { studentNav, teacherNav } from "./layouts/AppLayout";
import Spinner from "./components/Spinner";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

import StudentDashboard from "./pages/student/StudentDashboard";
import ScanAttendance from "./pages/student/ScanAttendance";
import StudentAttendance from "./pages/student/StudentAttendance";
import StudentTimetable from "./pages/student/StudentTimetable";
import Planner from "./pages/student/Planner";
import FreePeriods from "./pages/student/FreePeriods";
import Suggestions from "./pages/student/Suggestions";
import StudentAnalytics from "./pages/student/StudentAnalytics";
import Profile from "./pages/Profile";

import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import Classes from "./pages/teacher/Classes";
import GenerateQR from "./pages/teacher/GenerateQR";
import TeacherAttendance from "./pages/teacher/TeacherAttendance";
import TeacherTimetable from "./pages/teacher/TeacherTimetable";
import TeacherAnalytics from "./pages/teacher/TeacherAnalytics";

function Protected({ role }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner className="h-12 w-12" />;
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to={`/${user.role}`} replace />;
  return <Outlet />;
}

export default function App() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to={`/${user.role}`} replace /> : <Landing />} />
      <Route path="/login" element={user ? <Navigate to={`/${user.role}`} replace /> : <Login />} />

      <Route element={<Protected role="student" />}>
        <Route path="/student" element={<AppLayout nav={studentNav} />}>
          <Route index element={<StudentDashboard />} />
          <Route path="scan" element={<ScanAttendance />} />
          <Route path="attendance" element={<StudentAttendance />} />
          <Route path="timetable" element={<StudentTimetable />} />
          <Route path="planner" element={<Planner />} />
          <Route path="free-periods" element={<FreePeriods />} />
          <Route path="suggestions" element={<Suggestions />} />
          <Route path="analytics" element={<StudentAnalytics />} />
          <Route path="profile" element={<Profile />} />
        </Route>
      </Route>

      <Route element={<Protected role="teacher" />}>
        <Route path="/teacher" element={<AppLayout nav={teacherNav} />}>
          <Route index element={<TeacherDashboard />} />
          <Route path="classes" element={<Classes />} />
          <Route path="qr" element={<GenerateQR />} />
          <Route path="attendance" element={<TeacherAttendance />} />
          <Route path="timetable" element={<TeacherTimetable />} />
          <Route path="analytics" element={<TeacherAnalytics />} />
          <Route path="profile" element={<Profile />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
