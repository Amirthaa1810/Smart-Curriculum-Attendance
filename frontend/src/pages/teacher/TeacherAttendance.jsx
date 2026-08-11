import { useEffect, useState } from "react";
import { CalendarCheck, Clock, Users, QrCode, Search } from "lucide-react";
import api from "../../services/api";
import PageHeader from "../../components/PageHeader";
import Spinner from "../../components/Spinner";
import { formatDate, formatDateTime } from "../../utils/format";

export default function TeacherAttendance() {
  const [classes, setClasses] = useState([]);
  const [classId, setClassId] = useState("");
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/classes").then((res) => {
      setClasses(res.data.data);
      if (res.data.data[0]) setClassId(res.data.data[0]._id);
    });
  }, []);

  useEffect(() => {
    if (!classId) return;
    setLoading(true);
    api
      .get("/attendance/history", { params: { classId } })
      .then((res) => setRecords(res.data.data))
      .finally(() => setLoading(false));
  }, [classId]);

  if (loading) return <Spinner />;

  const bySession = {};
  records.forEach((r) => {
    const key = `${r.sessionId}`;
    if (!bySession[key]) {
      bySession[key] = {
        sessionId: r.sessionId,
        subject: r.subjectId?.name || "—",
        code: r.subjectId?.code || "",
        date: r.date,
        period: r.period,
        marks: [],
      };
    }
    bySession[key].marks.push(r);
  });
  const sessions = Object.values(bySession).sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div>
      <PageHeader
        title="Attendance"
        subtitle="Session reports and attendance records."
        actions={
          <span className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
            <Search className="h-4 w-4" />
            <select value={classId} onChange={(e) => setClassId(e.target.value)} className="bg-transparent outline-none">
              {classes.map((c) => (
                <option key={c._id} value={c._id}>{c.name} · {c.section}</option>
              ))}
            </select>
          </span>
        }
      />

      {sessions.length === 0 ? (
        <div className="card p-12 text-center">
          <CalendarCheck className="mx-auto h-12 w-12 text-slate-300" />
          <h2 className="mt-3 font-semibold">No attendance records yet</h2>
          <p className="mt-1 text-sm text-slate-400">Generate a QR session and students will appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.map((s) => (
            <div key={s.sessionId} className="card overflow-hidden">
              <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 px-5 py-3.5 dark:border-slate-800">
                <div className="rounded-lg bg-primary-50 p-2 text-primary-600 dark:bg-primary-950 dark:text-primary-400">
                  <QrCode className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{s.subject} {s.code ? <span className="text-xs font-normal text-slate-400">({s.code})</span> : null}</p>
                  <p className="text-xs text-slate-400">{formatDate(s.date)} · Period {s.period}</p>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                  <Users className="h-3 w-3" /> {s.marks.length} present
                </span>
              </div>
              <div className="grid gap-1.5 p-4 sm:grid-cols-2 lg:grid-cols-3">
                {s.marks.map((m) => (
                  <div key={m._id} className="flex items-center gap-2.5 rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700">
                    <div className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
                      {m.studentId?.name?.[0]}
                    </div>
                    <span className="truncate font-medium">{m.studentId?.name}</span>
                    <span className="ml-auto inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                      <Clock className="h-3 w-3" /> {formatDateTime(m.timestamp).split(",")[1]}
                    </span>
                  </div>
                ))}
                {s.marks.length === 0 && <p className="col-span-full text-sm text-slate-400">No students marked for this session.</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
