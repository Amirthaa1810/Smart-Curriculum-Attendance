import { useEffect, useState } from "react";
import { Coffee, Clock, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import PageHeader from "../../components/PageHeader";
import Spinner from "../../components/Spinner";

export default function FreePeriods() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/planner")
      .then((res) => setData(res.data.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  const free = data?.freePeriods || [];

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Free Periods" subtitle="Automatically detected from your timetable." />

      {free.length === 0 ? (
        <div className="card p-10 text-center">
          <Coffee className="mx-auto h-14 w-14 text-slate-300" />
          <h2 className="mt-4 text-lg font-semibold">No free periods today</h2>
          <p className="mt-1 text-sm text-slate-400">
            Enjoy the full schedule — or use the evening to review notes.
          </p>
        </div>
      ) : (
        <>
          <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">
            Great news — you have <span className="font-bold">{free.length}</span> free period{free.length === 1 ? "" : "s"} today totaling{" "}
            {free.reduce((acc, f) => {
              const [sh, sm] = f.startTime.split(":").map(Number);
              const [eh, em] = f.endTime.split(":").map(Number);
              return acc + (eh * 60 + em - (sh * 60 + sm));
            }, 0)}{" "}
            minutes.
          </div>

          <div className="space-y-3">
            {free.map((f, i) => (
              <div key={i} className="card flex items-center gap-4 p-5">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                  <Coffee className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold">Free Period {f.period}</p>
                  <p className="inline-flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400">
                    <Clock className="h-3.5 w-3.5" /> {f.startTime} – {f.endTime}
                  </p>
                </div>
                <Link to="/student/suggestions" className="btn-secondary !py-2 text-xs">
                  <Sparkles className="h-3.5 w-3.5" /> Suggest activities
                </Link>
              </div>
            ))}
          </div>

          <div className="card mt-6 p-5">
            <h3 className="font-semibold">Why it matters</h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Free periods are prime learning time. Our planner converts them into revision, practice
              and preview activities tailored to your attendance and today's subjects.
            </p>
            <Link to="/student/planner" className="btn-primary mt-4">
              <Sparkles className="h-4 w-4" /> Open my planner
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
