import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts";
import { AlertTriangle, TrendingUp, CalendarCheck } from "lucide-react";
import api from "../../services/api";
import PageHeader from "../../components/PageHeader";
import StatCard from "../../components/StatCard";
import Spinner from "../../components/Spinner";

const COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#3b82f6"];

export default function StudentAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/analytics/student")
      .then((res) => setData(res.data.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  const donutData = (data?.subjectWise || []).map((s) => ({
    name: s.subject,
    value: s.pct,
  }));

  const barData = (data?.weeklyTrend || []).map((d) => ({
    day: d.day,
    classes: d.count,
  }));

  return (
    <div>
      <PageHeader title="Attendance Analytics" subtitle="Your performance, visualized." />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={CalendarCheck} label="Overall Attendance" value={`${data?.overall?.pct ?? 0}%`} accent={data?.overall?.pct >= 75 ? "green" : data?.overall?.pct >= 60 ? "amber" : "red"} />
        <StatCard icon={TrendingUp} label="Classes Present" value={data?.overall?.present ?? 0} sub={`out of ${data?.overall?.total ?? 0}`} accent="primary" />
        <StatCard icon={AlertTriangle} label="Warnings" value={data?.warnings?.length ?? 0} sub="Subjects below 75%" accent={data?.warnings?.length ? "red" : "green"} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Subject donut */}
        <div className="card p-5">
          <h2 className="mb-4 font-semibold">Subject-wise Attendance</h2>
          {donutData.length ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={donutData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={2}>
                    {donutData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => `${v}%`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="py-10 text-center text-sm text-slate-400">No data yet.</p>
          )}
        </div>

        {/* Weekly trend bar */}
        <div className="card p-5">
          <h2 className="mb-4 font-semibold">Classes Attended — Last 7 Days</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="day" />
                <YAxis allowDecimals={false} domain={[0, Math.max(5, ...barData.map((d) => d.classes))]} />
                <Tooltip />
                <Bar dataKey="classes" fill="#6366f1" radius={[6, 6, 0, 0]} name="Classes attended" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Warnings */}
      <div className="card mt-6 p-5">
        <h2 className="mb-4 font-semibold">Attendance Warnings</h2>
        {data?.warnings?.length ? (
          <div className="space-y-3">
            {data.warnings.map((w, i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm dark:border-red-900 dark:bg-red-950">
                <AlertTriangle className="h-5 w-5 shrink-0 text-red-500" />
                <div className="flex-1">
                  <p className="font-semibold text-red-700 dark:text-red-300">{w.subject}</p>
                  <p className="text-xs text-red-600/80 dark:text-red-400/80">{w.message}</p>
                </div>
                <span className="text-lg font-bold text-red-600 dark:text-red-400">{w.pct}%</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-6 text-center text-sm text-slate-400">No warnings — great job!</p>
        )}
      </div>
    </div>
  );
}
