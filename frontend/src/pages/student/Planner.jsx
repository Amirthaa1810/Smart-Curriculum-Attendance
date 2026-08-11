import { useEffect, useState } from "react";
import {
  Sparkles,
  CheckCircle2,
  Circle,
  Trash2,
  Clock,
  BookOpen,
  Target,
  Eye,
  Pencil,
  FileText,
  Loader2,
  CalendarDays,
} from "lucide-react";
import api from "../../services/api";
import PageHeader from "../../components/PageHeader";
import Spinner from "../../components/Spinner";
import { toast } from "../../utils/toast";
import { formatDate } from "../../utils/format";

const CATEGORY_ICONS = {
  revision: BookOpen,
  practice: Target,
  preview: Eye,
  assignment: Pencil,
  reading: FileText,
};

const PRIORITY_STYLES = {
  high: "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300",
  medium: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300",
  low: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300",
};

export default function Planner() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const load = () => {
    setLoading(true);
    api
      .get("/planner")
      .then((res) => setData(res.data.data))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await api.post("/planner/tasks/generate");
      toast("Personalized tasks generated from today's free periods");
      load();
    } catch (err) {
      toast(err?.response?.data?.message || "Failed to generate tasks", "error");
    } finally {
      setGenerating(false);
    }
  };

  const toggleTask = async (id) => {
    await api.patch(`/planner/tasks/${id}`);
    load();
  };

  const deleteTask = async (id) => {
    await api.delete(`/planner/tasks/${id}`);
    toast("Task deleted", "info");
    load();
  };

  if (loading) return <Spinner />;

  const hasFree = (data?.freePeriods || []).length > 0;
  const tasks = data?.tasks || [];

  return (
    <div>
      <PageHeader
        title="Daily Planner"
        subtitle={`${formatDate(data?.date)} · ${data?.day} — built around your timetable`}
        actions={
          <button onClick={handleGenerate} disabled={generating} className="btn-primary">
            {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Auto-generate Tasks
          </button>
        }
      />

      {data?.isHoliday ? (
        <div className="card p-8 text-center">
          <CalendarDays className="mx-auto h-12 w-12 text-slate-300" />
          <h2 className="mt-3 font-semibold">No classes today</h2>
          <p className="mt-1 text-sm text-slate-400">It's a holiday. Plan your own study time.</p>
        </div>
      ) : null}

      {/* Today timeline */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="mb-4 font-semibold">Today's Schedule</h2>
          <div className="space-y-2.5">
            {(data?.periods || []).map((p, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 ${
                  p.type === "free"
                    ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950"
                    : "border-slate-200 dark:border-slate-700"
                }`}
              >
                <span className="w-16 text-xs font-bold text-slate-500">{p.startTime}</span>
                <span className="flex-1 text-sm font-medium">
                  {p.type === "free" ? (
                    <span className="inline-flex items-center gap-1.5 font-bold text-emerald-700 dark:text-emerald-400">
                      <Clock className="h-4 w-4" /> FREE PERIOD
                    </span>
                  ) : (
                    p.subject?.name || "—"
                  )}
                </span>
                <span className="text-xs text-slate-400">P{p.period}</span>
              </div>
            ))}
            {(data?.periods || []).length === 0 && (
              <p className="text-sm text-slate-400">No timetable for today.</p>
            )}
          </div>
        </div>

        {/* Free-period plan */}
        <div className="card p-5">
          <h2 className="mb-4 font-semibold">Personalized Plan for Free Periods</h2>
          {!hasFree ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950">
              No free periods today — no plan generated.
            </div>
          ) : (
            <div className="space-y-4">
              {(data?.plan || []).map((block, bi) => (
                <div key={bi} className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wide text-primary-600 dark:text-primary-400">
                      Free period · {block.startTime}–{block.endTime}
                    </span>
                    <span className="text-xs text-slate-400">{block.totalFreeMinutes} min free</span>
                  </div>
                  <div className="space-y-2">
                    {block.options.map((opt, oi) => {
                      const Icon = CATEGORY_ICONS[opt.category] || BookOpen;
                      return (
                        <div
                          key={oi}
                          className={`flex items-start gap-2.5 rounded-lg border px-3 py-2.5 ${PRIORITY_STYLES[opt.priority] || PRIORITY_STYLES.low}`}
                        >
                          <Icon className="mt-0.5 h-4 w-4 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm font-semibold">
                              {opt.title} <span className="text-xs font-normal opacity-80">· {opt.duration} min</span>
                            </p>
                            <p className="text-xs opacity-80">{opt.description}</p>
                            {opt.reason ? <p className="mt-0.5 text-xs italic opacity-70">{opt.reason}</p> : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tasks */}
      <div className="card mt-6 p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold">My Tasks ({tasks.filter((t) => t.completed).length}/{tasks.length})</h2>
          <span className="text-xs text-slate-400">Click a task to mark it complete</span>
        </div>
        {tasks.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center dark:border-slate-700">
            <Sparkles className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-2 text-sm font-medium">No tasks yet</p>
            <p className="text-sm text-slate-400">Generate tasks from today's free periods to get started.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {tasks.map((t) => {
              const Icon = CATEGORY_ICONS[t.category] || BookOpen;
              return (
                <div
                  key={t._id}
                  className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${
                    t.completed
                      ? "border-slate-200 bg-slate-50 opacity-70 dark:border-slate-800 dark:bg-slate-950"
                      : "border-slate-200 dark:border-slate-700"
                  }`}
                >
                  <button onClick={() => toggleTask(t._id)} className="shrink-0 text-slate-400 hover:text-emerald-500">
                    {t.completed ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : <Circle className="h-5 w-5" />}
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-medium ${t.completed ? "line-through" : ""}`}>{t.title}</p>
                    {t.description ? <p className="truncate text-xs text-slate-400">{t.description}</p> : null}
                  </div>
                  <span className="hidden items-center gap-1 text-xs text-slate-400 sm:inline-flex">
                    <Icon className="h-3.5 w-3.5" /> {t.category}
                  </span>
                  <span className="hidden items-center gap-1 text-xs text-slate-400 sm:inline-flex">
                    <Clock className="h-3.5 w-3.5" /> {t.duration} min
                  </span>
                  <button onClick={() => deleteTask(t._id)} className="shrink-0 text-slate-300 hover:text-red-500 dark:text-slate-600">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
