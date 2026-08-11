import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { CalendarCheck, Users, BookOpen, Activity, AlertTriangle } from "lucide-react";
import api from "../../services/api";
import PageHeader from "../../components/PageHeader";
import StatCard from "../../components/StatCard";
import Spinner from "../../components/Spinner";

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6"];

export default function TeacherAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/analytics/teacher")
      .then((res) => setData(res.data.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  const classDonut = (data?.classWise || []).map((c) => ({
    name: c.class,
    value: c.pct,
  }));

  return (
    <div>
      <PageHeader title="Class Analytics" subtitle="Attendance intelligence across your classes." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={CalendarCheck} label="Overall Attendance" value={`${data?.overall?.pct ?? 0}%`} accent="green" />
        <StatCard icon={Users} label="Students" value={data?.studentsCount ?? 0} accent="primary" />
        <StatCard icon={BookOpen} label="Subjects" value={data?.subjectsCount ?? 0} accent="amber" />
        <StatCard icon={Activity} label="Today's Marks" value={data?.today?.marked ?? 0} accent="indigo" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Subject-wise bar */}
        <div className="card p-5">
          <h2 className="mb-4 font-semibold">Subject-wise Attendance %</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.subjectWise || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="subject" />
                <YAxis domain={[0, 100]} />
                <Tooltip formatter={(v) => `${v}%`} />
                <Bar dataKey="pct" fill="#6366f1" radius={[6, 6, 0, 0]} name="Attendance %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Class donut */}
        <div className="card p-5">
          <h2 className="mb-4 font-semibold">Class-wise Attendance</h2>
          {classDonut.length ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={classDonut} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={2}>
                    {classDonut.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => `${v}%`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="py-10 text-center text-sm text-slate-400">No class data yet.</p>
          )}
        </div>
      </div>

      {/* Daily trend */}
      <div className="card mt-6 p-5">
        <h2 className="mb-4 font-semibold">Daily Attendance Trend (14 days)</h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data?.dailyTrend || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="day" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="count" name="Marks" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Low attendance */}
      <div className="card mt-6 p-5">
        <h2 className="mb-4 font-semibold">Low Attendance Students (below 75%)</h2>
        {data?.lowAttendance?.length ? (
          <div className="space-y-3">
            {data.lowAttendance.map((s, i) => (
              <div key={i} className="flex items-center gap-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 dark:border-red-900 dark:bg-red-950">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-red-100 text-sm font-bold text-red-600 dark:bg-red-900 dark:text-red-300">
                  {s.name?.[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-red-700 dark:text-red-300">{s.name}</p>
                  <p className="text-xs text-red-600/80 dark:text-red-400/80">{s.studentId} · {s.present}/{s.total} classes</p>
                </div>
                <span className="inline-flex items-center gap-1 text-lg font-bold text-red-600 dark:text-red-400">
                  <AlertTriangle className="h-4 w-4" /> {s.pct}%
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-6 text-center text-sm text-slate-400">No students below 75% attendance.</p>
        )}
      </div>
    </div>
  );
}
