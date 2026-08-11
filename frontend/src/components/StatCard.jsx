export default function StatCard({ icon: Icon, label, value, sub, accent = "primary" }) {
  const accents = {
    primary: "bg-primary-50 text-primary-600 dark:bg-primary-950 dark:text-primary-400",
    green: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400",
    amber: "bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400",
    red: "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400",
  };
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
          <p className="mt-1 text-2xl font-bold tracking-tight">{value}</p>
          {sub ? <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{sub}</p> : null}
        </div>
        {Icon ? (
          <div className={`rounded-xl p-2.5 ${accents[accent]}`}>
            <Icon className="h-5 w-5" />
          </div>
        ) : null}
      </div>
    </div>
  );
}
