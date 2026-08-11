import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  QrCode,
  CalendarCheck,
  Clock,
  Lightbulb,
  CalendarDays,
  TrendingUp,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import api from "../../services/api";
import PageHeader from "../../components/PageHeader";
import StatCard from "../../components/StatCard";
import ProgressBar from "../../components/ProgressBar";
import Spinner from "../../components/Spinner";
import { pctColor, todayName } from "../../utils/format";

export default function StudentDashboard() {
  const [summary, setSummary] = useState(null);
  const [timetable, setTimetable] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/attendance/summary"),
      api.get("/timetable"),
      api.get("/analytics/student"),
    ])
      .then(([s, t, a]) => {
        setSummary(s.data.data);
        setTimetable(t.data.data);
        setAnalytics(a.data.data);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  const today = timetable?.grouped?.[todayName()] || [];
  const nextClass = today.find((slot) => slot.type === "class");
  const freeCount = today.filter((slot) => slot.type === "free").length;
  const warnings = analytics?.warnings || [];
  const suggestionCount = warnings.length;

  return (
    <div>
      <PageHeader
        title="Student Dashboard"
        subtitle="Your attendance, timetable and plan at a glance."
        actions={
          <Link to="/student/scan" className="btn-primary">
            <QrCode className="h-4 w-4" /> Scan Attendance
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={CalendarCheck}
          label="Overall Attendance"
          value={`${summary?.overall?.pct ?? 0}%`}
          sub={`${summary?.overall?.present ?? 0}/${summary?.overall?.total ?? 0} classes present`}
          accent={summary?.overall?.pct >= 75 ? "green" : summary?.overall?.pct >= 60 ? "amber" : "red"}
        />
        <StatCard
          icon={CalendarDays}
          label={todayName()}
          value={`${today.length} periods`}
          sub={nextClass ? `Next: ${nextClass.subject?.name || "—"}` : "No classes today"}
          accent="primary"
        />
        <StatCard
          icon={Clock}
          label="Free Periods Today"
          value={freeCount}
          sub={freeCount ? "Time to plan & learn!" : "No free periods"}
          accent="green"
        />
        <StatCard
          icon={AlertTriangle}
          label="Attendance Warnings"
          value={warnings.length}
          sub={warnings.length ? "Subjects below 75%" : "All good"}
          accent={warnings.length ? "red" : "green"}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Subject-wise attendance */}
        <div className="card p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Subject-wise Attendance</h2>
            <Link to="/student/attendance" className="text-xs font-semibold text-primary-600 hover:underline dark:text-primary-400">
              View all →
            </Link>
          </div>
          <div className="space-y-4">
            {(summary?.subjectWise || []).slice(0, 5).map((s) => (
              <div key={s.subjectId}>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="font-medium">
                    {s.subject} <span className="text-xs text-slate-400">({s.code})</span>
                  </span>
                  <span className={`font-semibold ${pctColor(s.pct)}`}>{s.pct}%</span>
                </div>
                <ProgressBar pct={s.pct} />
              </div>
            ))}
            {(summary?.subjectWise || []).length === 0 && (
              <p className="text-sm text-slate-400">No attendance data yet.</p>
            )}
          </div>
        </div>

        {/* Today's schedule */}
        <div className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Today's Schedule</h2>
            <Link to="/student/timetable" className="text-xs font-semibold text-primary-600 hover:underline dark:text-primary-400">
              Timetable →
            </Link>
          </div>
          <div className="space-y-2">
            {today.map((slot, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm ${
                  slot.type === "free"
                    ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950"
                    : "border-slate-200 dark:border-slate-700"
                }`}
              >
                <span className="w-14 shrink-0 text-xs font-semibold text-slate-500">{slot.startTime}</span>
                {slot.type === "free" ? (
                  <span className="flex items-center gap-1.5 font-semibold text-emerald-700 dark:text-emerald-400">
                    <Clock className="h-3.5 w-3.5" /> FREE PERIOD
                  </span>
                ) : (
                  <span className="font-medium">{slot.subject?.name || "—"}</span>
                )}
              </div>
            ))}
            {today.length === 0 && <p className="text-sm text-slate-400">No classes scheduled today.</p>}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { to: "/student/planner", icon: Sparkles, title: "Daily Planner", desc: "Personalized study plan", color: "bg-primary-50 text-primary-600 dark:bg-primary-950 dark:text-primary-400" },
          { to: "/student/suggestions", icon: Lightbulb, title: "Suggestions", desc: `${Math.max(suggestionCount, today.length)} activities to try`, color: "bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400" },
          { to: "/student/free-periods", icon: Clock, title: "Free Periods", desc: `${freeCount} free today`, color: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400" },
          { to: "/student/analytics", icon: TrendingUp, title: "Analytics", desc: "Trends & insights", color: "bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400" },
        ].map((q, i) => (
          <Link key={i} to={q.to} className="card group p-5 transition hover:-translate-y-0.5 hover:shadow-md">
            <div className={`mb-3 inline-flex rounded-xl p-2.5 ${q.color}`}>
              <q.icon className="h-5 w-5" />
            </div>
            <h3 className="font-semibold group-hover:text-primary-600">{q.title}</h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{q.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
