import { useEffect, useCallback } from "react";
import { X } from "lucide-react";

const SIZE_CLASSES = {
  sm:  "max-w-sm",
  md:  "max-w-md",
  lg:  "max-w-lg",
  xl:  "max-w-xl",
  "2xl": "max-w-2xl",
};

/**
 * Reusable Modal overlay.
 *
 * @param {boolean}          isOpen    — controls visibility
 * @param {function}         onClose   — called on backdrop click or Escape
 * @param {string}           title     — modal heading
 * @param {string}           subtitle  — optional subheading below title
 * @param {'sm'|'md'|'lg'|'xl'|'2xl'} size
 * @param {React.ReactNode}  footer    — content for footer row
 * @param {boolean}          noClose   — hides the X button
 * @param {React.ReactNode}  children
 */
export default function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  size = "md",
  footer,
  noClose = false,
  children,
}) {
  // Close on Escape key
  const handleKey = useCallback(
    (e) => {
      if (e.key === "Escape" && !noClose) onClose?.();
    },
    [onClose, noClose]
  );

  useEffect(() => {
    if (!isOpen) return;
    document.addEventListener("keydown", handleKey);
    // Prevent body scroll
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleKey]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      aria-modal="true"
      role="dialog"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm"
        onClick={!noClose ? onClose : undefined}
      />

      {/* Panel */}
      <div
        className={[
          "relative w-full bg-slate-900 border border-slate-800/80 rounded-2xl shadow-xl flex flex-col max-h-[90vh] animate-slide-up",
          SIZE_CLASSES[size] || SIZE_CLASSES.md,
        ].join(" ")}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {(title || !noClose) && (
          <div className="flex items-start justify-between p-6 border-b border-slate-800/60 shrink-0">
            <div>
              {title && (
                <h2 className="text-base font-bold text-white">{title}</h2>
              )}
              {subtitle && (
                <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
              )}
            </div>
            {!noClose && (
              <button
                onClick={onClose}
                className="ml-4 p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800/60 transition-colors cursor-pointer shrink-0"
                aria-label="Close modal"
              >
                <X size={16} />
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="p-6 pt-0 flex items-center justify-end gap-3 shrink-0 border-t border-slate-800/60">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
