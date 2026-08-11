import { useEffect, useState } from "react";
import {
  Lightbulb,
  BookOpen,
  Target,
  Eye,
  Pencil,
  FileText,
  Clock,
  CheckCircle2,
  Sparkles,
  Loader2,
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

const CATEGORY_COLORS = {
  revision: "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400",
  practice: "bg-primary-50 text-primary-600 dark:bg-primary-950 dark:text-primary-400",
  preview: "bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400",
  assignment: "bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400",
  reading: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400",
};

export default function Suggestions() {
  const [suggestions, setSuggestions] = useState([]);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(null);
  const [added, setAdded] = useState({});

  useEffect(() => {
    setLoading(true);
    api
      .get("/planner/suggestions", { params: { date } })
      .then((res) => setSuggestions(res.data.data))
      .finally(() => setLoading(false));
  }, [date]);

  const addAsTask = async (s) => {
    setAdding(s.id);
    try {
      await api.post("/planner/tasks/generate", null, { params: { date } });
      toast("Added to your planner tasks");
      setAdded((p) => ({ ...p, [s.id]: true }));
    } catch (err) {
      toast(err?.response?.data?.message || "Failed to add task", "error");
    } finally {
      setAdding(null);
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Academic Suggestions" subtitle="Smart activities based on your timetable and attendance." />

      <div className="card mb-5 p-4">
        <label className="label">Select date</label>
        <input type="date" className="input max-w-xs" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>

      {suggestions.length === 0 ? (
        <div className="card p-10 text-center">
          <Lightbulb className="mx-auto h-14 w-14 text-slate-300" />
          <h2 className="mt-4 text-lg font-semibold">No suggestions for this day</h2>
          <p className="mt-1 text-sm text-slate-400">
            {formatDate(date)} has no free periods, so nothing was generated.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {suggestions.map((s) => {
            const Icon = CATEGORY_ICONS[s.category] || Lightbulb;
            const priorityColor =
              s.priority === "high"
                ? "border-red-200 dark:border-red-900"
                : s.priority === "medium"
                ? "border-amber-200 dark:border-amber-900"
                : "border-slate-200 dark:border-slate-700";
            return (
              <div key={s.id} className={`card border-l-4 p-5 ${priorityColor}`}>
                <div className="flex items-start gap-3">
                  <div className={`rounded-xl p-2.5 ${CATEGORY_COLORS[s.category] || CATEGORY_COLORS.reading}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">{s.title}</h3>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                        {s.category}
                      </span>
                      {s.priority === "high" ? (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-red-600 dark:bg-red-950 dark:text-red-400">
                          High priority
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{s.description}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" /> {s.duration} min
                      </span>
                      {s.startTime ? <span>Free period {s.period} · {s.startTime}</span> : null}
                      {s.reason ? <span className="italic">“{s.reason}”</span> : null}
                    </div>
                  </div>
                  {added[s.id] ? (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                      <CheckCircle2 className="h-4 w-4" /> Added
                    </span>
                  ) : (
                    <button
                      onClick={() => addAsTask(s)}
                      disabled={adding === s.id}
                      className="btn-secondary shrink-0 !px-3 !py-2 text-xs"
                    >
                      {adding === s.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                      Add to planner
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
