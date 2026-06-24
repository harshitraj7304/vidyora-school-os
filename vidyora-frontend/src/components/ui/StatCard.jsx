import { ArrowRight, TrendingUp, TrendingDown } from "lucide-react";
import { Link } from "react-router-dom";
import Skeleton from "./Skeleton";

/**
 * Upgraded StatCard.
 *
 * @param {string}  label     — stat label
 * @param {number}  value     — stat value
 * @param {React.ComponentType} icon — Lucide icon
 * @param {string}  color     — text color class e.g. "text-cyan-400"
 * @param {string}  iconBg    — icon container bg classes
 * @param {string}  accent    — border/glow accent color class (for hover)
 * @param {string}  trend     — optional e.g. "+3 this week"
 * @param {boolean} trendUp   — controls trend icon direction + color
 * @param {string}  to        — react-router Link destination (makes card clickable)
 * @param {boolean} loading
 */
export default function StatCard({
  label,
  value,
  icon: Icon,
  color = "text-cyan-400",
  iconBg = "bg-cyan-500/10 border-cyan-500/20",
  accent = "hover:border-cyan-500/30",
  trend,
  trendUp,
  to,
  loading = false,
}) {
  const TrendIcon = trendUp ? TrendingUp : TrendingDown;
  const trendColor = trendUp ? "text-emerald-400" : "text-red-400";

  const content = (
    <>
      <div className="flex items-center justify-between">
        {loading ? (
          <Skeleton height="36px" width="36px" style={{ borderRadius: "10px" }} />
        ) : (
          Icon && (
            <div
              className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${iconBg}`}
            >
              <Icon size={18} className={color} />
            </div>
          )
        )}

        {to && !loading && (
          <span className="text-xs text-slate-500 group-hover:text-slate-300 flex items-center gap-0.5 transition-colors">
            View <ArrowRight size={11} className="group-hover:translate-x-0.5 transition-transform" />
          </span>
        )}
      </div>

      <div className="mt-3">
        {loading ? (
          <div className="space-y-2">
            <Skeleton height="22px" width="60px" />
            <Skeleton height="10px" width="90px" />
          </div>
        ) : (
          <>
            <p className={`text-2xl font-extrabold tracking-tight ${color}`}>
              {value ?? 0}
            </p>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">{label}</p>
            {trend && (
              <p className={`text-[11px] mt-1.5 flex items-center gap-1 ${trendColor}`}>
                <TrendIcon size={11} />
                {trend}
              </p>
            )}
          </>
        )}
      </div>
    </>
  );

  const baseClass = `group flex flex-col p-5 rounded-xl bg-slate-900 border border-white/[0.06] transition-all duration-200 ${accent} hover:shadow-[0_0_24px_rgba(0,212,255,0.05)] hover:-translate-y-0.5 shadow-sm ${to ? "cursor-pointer" : ""}`;

  if (to) {
    return (
      <Link to={to} className={baseClass}>
        {content}
      </Link>
    );
  }

  return <div className={baseClass}>{content}</div>;
}
