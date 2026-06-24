import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

/**
 * Upgraded PageHeader.
 *
 * @param {string}  title
 * @param {string}  subtitle
 * @param {Array}   breadcrumb — [{ label, href }] breadcrumb trail
 * @param {React.ReactNode} actions — right-side action buttons/elements
 */
export default function PageHeader({ title, subtitle, breadcrumb, actions }) {
  return (
    <div className="space-y-1">
      {/* Breadcrumb */}
      {breadcrumb && breadcrumb.length > 0 && (
        <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-2">
          {breadcrumb.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1.5">
              {crumb.href ? (
                <Link
                  to={crumb.href}
                  className="hover:text-slate-300 transition-colors"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-slate-400">{crumb.label}</span>
              )}
              {i < breadcrumb.length - 1 && (
                <ChevronRight size={12} className="text-slate-700" />
              )}
            </span>
          ))}
        </nav>
      )}

      {/* Title row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight leading-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-slate-500 text-sm mt-1 leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2.5 shrink-0">{actions}</div>
        )}
      </div>
    </div>
  );
}
