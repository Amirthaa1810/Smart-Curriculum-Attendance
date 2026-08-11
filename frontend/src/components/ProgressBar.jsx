import { barColor } from "../utils/format";

export default function ProgressBar({ pct, size = "md" }) {
  const h = size === "sm" ? "h-2" : size === "lg" ? "h-4" : "h-3";
  const clamped = Math.max(0, Math.min(100, pct || 0));
  return (
    <div className={`w-full ${h} overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800`}>
      <div
        className={`${h} rounded-full ${barColor(clamped)} transition-all duration-500`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
