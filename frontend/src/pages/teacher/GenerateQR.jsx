import { useEffect, useRef, useState } from "react";
import { QrCode, Loader2, Timer, CheckCircle2, Users, RefreshCw, PartyPopper } from "lucide-react";
import api from "../../services/api";
import PageHeader from "../../components/PageHeader";
import Spinner from "../../components/Spinner";
import { toast } from "../../utils/toast";

export default function GenerateQR() {
  const [classes, setClasses] = useState([]);
  const [classId, setClassId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [period, setPeriod] = useState(1);
  const [minutes, setMinutes] = useState(5);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [generating, setGenerating] = useState(false);

  const [session, setSession] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [marked, setMarked] = useState([]);
  const [countdown, setCountdown] = useState({ mins: 0, secs: 0 });
  const [polling, setPolling] = useState(false);
  const pollRef = useRef(null);

  useEffect(() => {
    api
      .get("/classes")
      .then((res) => {
        const data = res.data.data;
        setClasses(data);
        if (data[0]) {
          setClassId(data[0]._id);
          if (data[0].subjects?.[0]) setSubjectId(data[0].subjects[0]._id);
        }
      })
      .finally(() => setLoadingClasses(false));
  }, []);

  const selectedClass = classes.find((c) => c._id === classId);

  const generate = async () => {
    if (!classId || !subjectId) {
      toast("Select class and subject first", "error");
      return;
    }
    setGenerating(true);
    try {
      const res = await api.post("/attendance/session", { classId, subjectId, period, minutes });
      const data = res.data.data;
      setSession(data.session);
      setQrDataUrl(data.qrDataUrl);
      setMarked([]);
      toast("QR session created! Share it with your students.");
      startPolling(data.session._id);
    } catch (err) {
      toast(err?.response?.data?.message || "Failed to generate QR", "error");
    } finally {
      setGenerating(false);
    }
  };

  const startPolling = (sessionId) => {
    if (pollRef.current) clearInterval(pollRef.current);
    setPolling(true);
    const tick = async () => {
      try {
        const res = await api.get(`/attendance/session/${sessionId}`);
        const data = res.data.data;
        setMarked(data.marks || []);
        if (data.session.expired) {
          clearInterval(pollRef.current);
          setPolling(false);
        }
      } catch {
        clearInterval(pollRef.current);
        setPolling(false);
      }
    };
    tick();
    pollRef.current = setInterval(tick, 5000);
  };

  useEffect(() => {
    if (!session) return;
    const timer = setInterval(() => {
      const diff = new Date(session.expiryTime).getTime() - Date.now();
      if (diff <= 0) {
        setCountdown({ mins: 0, secs: 0 });
        clearInterval(timer);
      } else {
        setCountdown({ mins: Math.floor(diff / 60000), secs: Math.floor((diff % 60000) / 1000) });
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [session]);

  useEffect(() => () => clearInterval(pollRef.current), []);

  const stopSession = async () => {
    clearInterval(pollRef.current);
    setPolling(false);
  };

  if (loadingClasses) return <Spinner />;

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="Generate QR Attendance" subtitle="Create a unique, time-limited QR session for your class." />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Form */}
        <div className="card p-5">
          <h2 className="mb-4 font-semibold">Session Details</h2>
          <div className="space-y-4">
            <div>
              <label className="label">Class</label>
              <select className="input" value={classId} onChange={(e) => {
                setClassId(e.target.value);
                const c = classes.find((x) => x._id === e.target.value);
                setSubjectId(c?.subjects?.[0]?._id || "");
              }}>
                <option value="">Select class</option>
                {classes.map((c) => (
                  <option key={c._id} value={c._id}>{c.name} · {c.section}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Subject</label>
              <select className="input" value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
                <option value="">Select subject</option>
                {(selectedClass?.subjects || []).map((s) => (
                  <option key={s._id} value={s._id}>{s.name} ({s.code})</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Period</label>
                <select className="input" value={period} onChange={(e) => setPeriod(Number(e.target.value))}>
                  {[1, 2, 3, 4, 5].map((p) => (
                    <option key={p} value={p}>Period {p}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Valid for (min)</label>
                <select className="input" value={minutes} onChange={(e) => setMinutes(Number(e.target.value))}>
                  {[2, 3, 5, 10, 15, 30].map((m) => (
                    <option key={m} value={m}>{m} minutes</option>
                  ))}
                </select>
              </div>
            </div>

            <button onClick={generate} disabled={generating || !classId || !subjectId} className="btn-primary w-full !py-3">
              {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <QrCode className="h-4 w-4" />}
              Generate QR
            </button>
          </div>
        </div>

        {/* QR display */}
        <div className="card p-5">
          {!session ? (
            <div className="flex h-full min-h-[360px] flex-col items-center justify-center gap-3 text-center">
              <QrCode className="h-16 w-16 text-slate-200 dark:text-slate-700" />
              <p className="text-sm text-slate-400">
                Your generated QR will appear here.
                <br /> Select class, subject and period, then click Generate.
              </p>
            </div>
          ) : (
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">Live QR Session</h2>
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${
                  session.expired ? "bg-slate-100 text-slate-500 dark:bg-slate-800" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300"
                }`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${session.expired ? "bg-slate-400" : "animate-pulse bg-emerald-500"}`} />
                  {session.expired ? "Expired" : "Active"}
                </span>
              </div>

              <div className="mt-4 grid place-items-center rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-white">
                <img src={qrDataUrl} alt="Attendance QR" className="h-56 w-56" />
              </div>

              <div className="mt-4 rounded-xl bg-slate-50 p-3 text-center dark:bg-slate-950">
                <p className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-700 dark:text-slate-200">
                  <Timer className="h-4 w-4 text-primary-500" />
                  {session.expired ? "Session expired" : `Expires in ${countdown.mins}m ${String(countdown.secs).padStart(2, "0")}s`}
                </p>
              </div>

              <div className="mt-4 space-y-1 text-sm">
                <p><span className="text-slate-400">Subject:</span> <span className="font-medium">{session.subject?.name} ({session.subject?.code})</span></p>
                <p><span className="text-slate-400">Class:</span> <span className="font-medium">{session.class?.name} · {session.class?.section}</span></p>
                <p><span className="text-slate-400">Date / Period:</span> <span className="font-medium">{session.date} · {session.periodName}</span></p>
              </div>

              {!session.expired ? (
                <button onClick={stopSession} className="btn-secondary mt-4 w-full">
                  <RefreshCw className="h-4 w-4" /> Stop monitoring
                </button>
              ) : null}
            </div>
          )}
        </div>
      </div>

      {/* Live attendance */}
      {session ? (
        <div className="card mt-6 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="inline-flex items-center gap-2 font-semibold">
              <Users className="h-4 w-4 text-slate-400" /> Live Attendance
              <span className="rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-bold text-primary-600 dark:bg-primary-950 dark:text-primary-400">
                {marked.length}
              </span>
            </h2>
            {polling ? (
              <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
                <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Updating live…
              </span>
            ) : null}
          </div>

          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {marked.map((m) => (
              <div key={m._id} className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 dark:border-emerald-900 dark:bg-emerald-950">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-emerald-800 dark:text-emerald-300">{m.studentId?.name}</p>
                  <p className="text-xs text-emerald-600/80 dark:text-emerald-400/80">{m.studentId?.studentId}</p>
                </div>
              </div>
            ))}
            {marked.length === 0 && (
              <p className="col-span-full py-6 text-center text-sm text-slate-400">
                Waiting for students to scan… Tell them to open <span className="font-semibold">Scan Attendance</span>.
              </p>
            )}
          </div>

          {marked.length > 0 ? (
            <p className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400">
              <PartyPopper className="h-4 w-4" /> {marked.length} student{marked.length === 1 ? "" : "s"} marked attendance.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
