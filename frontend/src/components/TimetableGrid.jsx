import { Clock, Coffee } from "lucide-react";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function TimetableGrid({ grouped, highlightDay }) {
  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950">
              <th className="px-3 py-3 text-left font-semibold text-slate-400">Period</th>
              {DAYS.map((d) => (
                <th
                  key={d}
                  className={`px-3 py-3 text-center font-semibold ${
                    highlightDay === d
                      ? "text-primary-600 dark:text-primary-400"
                      : "text-slate-400"
                  }`}
                >
                  {d}
                  {highlightDay === d ? <span className="ml-1 text-[10px] font-bold uppercase">· today</span> : null}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {[1, 2, 3, 4, 5].map((period) => (
              <tr key={period}>
                <td className="px-3 py-2.5 whitespace-nowrap">
                  <span className="font-semibold">P{period}</span>
                  <span className="ml-1.5 block text-xs text-slate-400">
                    {grouped?.Mon?.[period - 1]?.startTime}
                  </span>
                </td>
                {DAYS.map((d) => {
                  const slot = grouped?.[d]?.find((s) => s.period === period);
                  const isToday = highlightDay === d;
                  if (!slot) {
                    return <td key={d} className="px-3 py-2.5 text-center text-xs text-slate-300 dark:text-slate-600">—</td>;
                  }
                  if (slot.type === "free") {
                    return (
                      <td key={d} className={`px-3 py-2.5 text-center ${isToday ? "bg-emerald-50 dark:bg-emerald-950/50" : ""}`}>
                        <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
                          <Coffee className="h-3 w-3" /> FREE
                        </span>
                      </td>
                    );
                  }
                  return (
                    <td key={d} className={`px-3 py-2.5 text-center ${isToday ? "bg-primary-50 dark:bg-primary-950/40" : ""}`}>
                      <span className="block font-semibold">{slot.subject?.name || "—"}</span>
                      <span className="block text-xs text-slate-400">{slot.startTime}–{slot.endTime}</span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center gap-4 border-t border-slate-200 px-4 py-3 text-xs text-slate-400 dark:border-slate-800">
        <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> Periods shown are 60 minutes</span>
        <span className="inline-flex items-center gap-1"><Coffee className="h-3.5 w-3.5" /> Green = free period</span>
      </div>
    </div>
  );
}
