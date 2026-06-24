const DEFAULT_STATUS_CONFIG = {
  active:   { label: "Active",   dot: "bg-emerald-400", classes: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" },
  inactive: { label: "Inactive", dot: "bg-slate-500",   classes: "bg-slate-700/30 border-slate-600/30 text-slate-500" },
};

export default function StatusBadge({ status, config }) {
  const statusKey = status?.toLowerCase() || "";
  const mergedConfig = { ...DEFAULT_STATUS_CONFIG, ...config };
  const cfg = mergedConfig[statusKey] || {
    label: status || "Unknown",
    dot: "bg-slate-500",
    classes: "bg-slate-700/30 border-slate-600/30 text-slate-400",
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.classes}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}
