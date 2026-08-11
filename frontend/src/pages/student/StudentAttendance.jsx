import { useEffect, useState } from "react";
import { CalendarCheck, Clock } from "lucide-react";
import api from "../../services/api";
import PageHeader from "../../components/PageHeader";
import ProgressBar from "../../components/ProgressBar";
import Spinner from "../../components/Spinner";
import { formatDate, formatDateTime, pctColor } from "../../utils/format";

export default function StudentAttendance() {
  const [summary, setSummary] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get("/attendance/summary"), api.get("/attendance/student")])
      .then(([s, h]) => {
        setSummary(s.data.data);
        setHistory(h.data.data);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  return (
    <div>
      <PageHeader title="My Attendance" subtitle="Subject-wise performance and history." />

      <div className="card p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Overall Attendance</p>
            <p className="text-3xl font-extrabold">{summary?.overall?.pct ?? 0}%</p>
          </div>
          <div className="text-sm text-slate-500 dark:text-slate-400">
            {summary?.overall?.present ?? 0} present out of {summary?.overall?.total ?? 0} classes
          </div>
        </div>
        <div className="mt-4">
          <ProgressBar pct={summary?.overall?.pct ?? 0} size="lg" />
        </div>
        {(summary?.overall?.pct ?? 0) < 75 ? (
          <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700 dark:bg-amber-950 dark:text-amber-300">
            ⚠ Warning: attendance is below 75% — prioritize revision for your weak subjects.
          </p>
        ) : null}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {(summary?.subjectWise || []).map((s) => (
          <div key={s.subjectId} className="card p-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">{s.subject}</h3>
                <p className="text-xs text-slate-400">{s.code}</p>
              </div>
              <span className={`text-xl font-bold ${pctColor(s.pct)}`}>{s.pct}%</span>
            </div>
            <div className="mt-3">
              <ProgressBar pct={s.pct} />
            </div>
            <p className="mt-2 text-xs text-slate-400">
              {s.present} present · {s.total} held
              {s.total > 0 && s.pct < 75 ? (
                <span className="ml-2 font-semibold text-amber-600 dark:text-amber-400">Below 75% — act now</span>
              ) : null}
            </p>
          </div>
        ))}
      </div>

      <div className="card mt-6 overflow-hidden">
        <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <h2 className="font-semibold">Attendance History</h2>
        </div>
        <div className="max-h-[480px] overflow-auto">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-slate-50 text-xs uppercase tracking-wide text-slate-400 dark:bg-slate-950">
              <tr>
                <th className="px-5 py-3 font-semibold">Date</th>
                <th className="px-5 py-3 font-semibold">Subject</th>
                <th className="px-5 py-3 font-semibold">Period</th>
                <th className="px-5 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {history.map((h) => (
                <tr key={h._id}>
                  <td className="px-5 py-3">{formatDate(h.date)}</td>
                  <td className="px-5 py-3">
                    <span className="font-medium">{h.subjectId?.name || "—"}</span>
                  </td>
                  <td className="px-5 py-3 text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" /> Period {h.period}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                      <CalendarCheck className="h-3 w-3" /> {h.status.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
              {history.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-slate-400">
                    No attendance records yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
