import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  QrCode,
  Users,
  BookOpen,
  BarChart3,
  CalendarCheck,
  Activity,
  AlertTriangle,
  BookMarked,
} from "lucide-react";
import api from "../../services/api";
import PageHeader from "../../components/PageHeader";
import StatCard from "../../components/StatCard";
import Spinner from "../../components/Spinner";
import { formatDate } from "../../utils/format";

export default function TeacherDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get("/analytics/teacher"), api.get("/attendance/sessions")])
      .then(([a, s]) => {
        setAnalytics(a.data.data);
        setSessions(s.data.data);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  return (
    <div>
      <PageHeader
        title="Teacher Dashboard"
        subtitle="Manage classes, run live QR sessions and track attendance."
        actions={
          <Link to="/teacher/qr" className="btn-primary">
            <QrCode className="h-4 w-4" /> Generate QR
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={CalendarCheck} label="Overall Attendance" value={`${analytics?.overall?.pct ?? 0}%`} accent="green" />
        <StatCard icon={Users} label="Students" value={analytics?.studentsCount ?? 0} accent="primary" />
        <StatCard icon={BookOpen} label="Subjects" value={analytics?.subjectsCount ?? 0} accent="amber" />
        <StatCard icon={Activity} label="Today's Marks" value={analytics?.today?.marked ?? 0} sub={`${analytics?.today?.sessions ?? 0} live session${analytics?.today?.sessions === 1 ? "" : "s"}`} accent="indigo" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Recent sessions */}
        <div className="card p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Recent QR Sessions</h2>
            <Link to="/teacher/attendance" className="text-xs font-semibold text-primary-600 hover:underline dark:text-primary-400">
              All attendance →
            </Link>
          </div>
          <div className="space-y-3">
            {sessions.slice(0, 6).map((s) => {
              const now = new Date();
              const expired = new Date(s.expiryTime) < now;
              return (
                <div key={s._id} className="flex items-center gap-4 rounded-xl border border-slate-200 px-4 py-3 dark:border-slate-700">
                  <div className={`grid h-10 w-10 place-items-center rounded-lg ${expired ? "bg-slate-100 text-slate-400 dark:bg-slate-800" : "bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400"}`}>
                    <QrCode className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      {s.subjectId?.name} <span className="text-xs font-normal text-slate-400">· {s.subjectId?.code}</span>
                    </p>
                    <p className="text-xs text-slate-400">
                      {s.classId?.name} {s.classId?.section} · {formatDate(s.date)} · {s.periodName}
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-slate-500">
                    {s.markedCount || 0} marked
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${
                      expired
                        ? "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                        : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300"
                    }`}
                  >
                    {expired ? "Expired" : "Live"}
                  </span>
                </div>
              );
            })}
            {sessions.length === 0 && <p className="py-8 text-center text-sm text-slate-400">No QR sessions yet. Generate your first one!</p>}
          </div>
        </div>

        {/* Low attendance */}
        <div className="card p-5">
          <h2 className="mb-4 font-semibold">Low Attendance Students</h2>
          {analytics?.lowAttendance?.length ? (
            <div className="space-y-3">
              {analytics.lowAttendance.slice(0, 6).map((s, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-red-100 text-xs font-bold text-red-600 dark:bg-red-950 dark:text-red-400">
                    {s.name?.[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{s.name}</p>
                    <p className="text-xs text-slate-400">{s.present}/{s.total} classes</p>
                  </div>
                  <span className="inline-flex items-center gap-1 font-bold text-red-600 dark:text-red-400">
                    <AlertTriangle className="h-3.5 w-3.5" /> {s.pct}%
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center text-sm font-medium text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">
              All students are above 75% attendance.
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {[
          { to: "/teacher/qr", icon: QrCode, title: "Generate QR", desc: "Start a time-limited session" },
          { to: "/teacher/classes", icon: BookMarked, title: "Manage Classes", desc: "Students & subjects" },
          { to: "/teacher/analytics", icon: BarChart3, title: "View Analytics", desc: "Trends & insights" },
        ].map((q, i) => (
          <Link key={i} to={q.to} className="card group flex items-center gap-4 p-5 transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="rounded-xl bg-primary-50 p-2.5 text-primary-600 dark:bg-primary-950 dark:text-primary-400">
              <q.icon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold group-hover:text-primary-600">{q.title}</h3>
              <p className="text-xs text-slate-400">{q.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
