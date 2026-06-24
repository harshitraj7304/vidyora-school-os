/**
 * Upgraded EmptyState component.
 *
 * @param {React.ComponentType} icon
 * @param {string}  title
 * @param {string}  subtitle
 * @param {string}  iconColor     — Tailwind text-color class for the icon
 * @param {string}  iconBg        — Tailwind bg classes for icon container
 * @param {React.ReactNode} children — action button / CTA
 */
export default function EmptyState({
  icon: Icon,
  title,
  subtitle,
  iconColor = "text-slate-500",
  iconBg = "bg-slate-800/60",
  children,
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center space-y-4 animate-fade-in">
      {Icon && (
        <div
          className={`w-14 h-14 rounded-2xl border border-slate-700/40 flex items-center justify-center ${iconBg}`}
        >
          <Icon size={24} className={iconColor} />
        </div>
      )}
      <div className="space-y-1 max-w-xs">
        <p className="text-slate-200 font-semibold text-sm">{title}</p>
        {subtitle && (
          <p className="text-slate-500 text-xs leading-relaxed">{subtitle}</p>
        )}
      </div>
      {children && <div className="pt-1">{children}</div>}
    </div>
  );
}
