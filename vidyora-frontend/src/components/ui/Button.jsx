import { Loader2 } from "lucide-react";

const VARIANTS = {
  primary:
    "bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-black font-bold shadow-md hover:shadow-[0_0_20px_rgba(6,182,212,0.3)] active:scale-[0.98]",
  secondary:
    "bg-slate-800 hover:bg-slate-700 border border-slate-700/80 hover:border-slate-600 text-slate-200 font-semibold",
  ghost:
    "bg-transparent hover:bg-slate-800/60 text-slate-300 hover:text-white font-semibold",
  danger:
    "bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 text-red-400 hover:text-red-300 font-semibold",
  outline:
    "bg-transparent border border-slate-700 hover:border-brand-500 text-slate-300 hover:text-white font-semibold hover:border-cyan-500/60",
  success:
    "bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 hover:border-emerald-500/40 text-emerald-400 hover:text-emerald-300 font-semibold",
};

const SIZES = {
  xs: "px-2.5 py-1.5 text-xs rounded-lg gap-1",
  sm: "px-3.5 py-2 text-xs rounded-xl gap-1.5",
  md: "px-4 py-2.5 text-sm rounded-xl gap-2",
  lg: "px-5 py-3 text-sm rounded-xl gap-2",
  xl: "px-6 py-3.5 text-base rounded-2xl gap-2.5",
};

const ICON_SIZES = { xs: 12, sm: 13, md: 15, lg: 16, xl: 18 };

/**
 * Unified Button component.
 *
 * @param {'primary'|'secondary'|'ghost'|'danger'|'outline'|'success'} variant
 * @param {'xs'|'sm'|'md'|'lg'|'xl'} size
 * @param {React.ComponentType} icon     — Lucide icon rendered before children
 * @param {React.ComponentType} iconRight — Lucide icon rendered after children
 * @param {boolean} loading  — show spinner, disable interaction
 * @param {boolean} fullWidth — w-full
 */
export default function Button({
  variant = "primary",
  size = "md",
  icon: Icon,
  iconRight: IconRight,
  loading = false,
  fullWidth = false,
  disabled = false,
  className = "",
  children,
  type = "button",
  ...rest
}) {
  const iconSize = ICON_SIZES[size] || 15;
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      disabled={isDisabled}
      className={[
        "inline-flex items-center justify-center transition-all duration-200 cursor-pointer select-none outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50 focus-visible:ring-offset-1 focus-visible:ring-offset-slate-950",
        VARIANTS[variant] || VARIANTS.primary,
        SIZES[size] || SIZES.md,
        fullWidth ? "w-full" : "",
        isDisabled ? "opacity-50 cursor-not-allowed pointer-events-none" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      {loading ? (
        <Loader2 size={iconSize} className="animate-spin shrink-0" />
      ) : Icon ? (
        <Icon size={iconSize} className="shrink-0" />
      ) : null}
      {children && <span>{children}</span>}
      {!loading && IconRight && <IconRight size={iconSize} className="shrink-0" />}
    </button>
  );
}
