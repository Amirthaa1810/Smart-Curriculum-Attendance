import { useEffect, useState } from "react";
import { Coffee, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import PageHeader from "../../components/PageHeader";
import TimetableGrid from "../../components/TimetableGrid";
import Spinner from "../../components/Spinner";
import { todayName } from "../../utils/format";

export default function StudentTimetable() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const today = todayName();

  useEffect(() => {
    api
      .get("/timetable")
      .then((res) => setData(res.data.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  const todaySlots = data?.grouped?.[today] || [];
  const freeCount = todaySlots.filter((s) => s.type === "free").length;

  return (
    <div>
      <PageHeader
        title="Timetable"
        subtitle={`Your weekly schedule. ${today} highlighted.`}
        actions={
          <Link to="/student/planner" className="btn-primary">
            <Sparkles className="h-4 w-4" /> Open Daily Planner
          </Link>
        }
      />

      <div className="mb-4 flex flex-wrap gap-3">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">
          <span className="inline-flex items-center gap-1.5 font-semibold">
            <Coffee className="h-4 w-4" /> {freeCount} free period{freeCount === 1 ? "" : "s"} detected today
          </span>
        </div>
      </div>

      <TimetableGrid grouped={data?.grouped} highlightDay={today} />
    </div>
  );
}
