import { createContext, useContext, useState, useCallback, useRef } from "react";
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from "lucide-react";

/* ── Toast Context ─────────────────────────────────────────── */
const ToastContext = createContext(null);

const ICONS = {
  success: CheckCircle2,
  error:   XCircle,
  warning: AlertTriangle,
  info:    Info,
};

const STYLES = {
  success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  error:   "border-red-500/30    bg-red-500/10    text-red-300",
  warning: "border-amber-500/30  bg-amber-500/10  text-amber-300",
  info:    "border-blue-500/30   bg-blue-500/10   text-blue-300",
};

const ICON_COLORS = {
  success: "text-emerald-400",
  error:   "text-red-400",
  warning: "text-amber-400",
  info:    "text-blue-400",
};

/* ── ToastItem ─────────────────────────────────────────────── */
function ToastItem({ id, message, type = "success", onRemove, removing }) {
  const Icon = ICONS[type] || ICONS.info;

  return (
    <div
      className={[
        "flex items-start gap-3 pl-4 pr-3 py-3.5 rounded-xl border shadow-xl min-w-[280px] max-w-sm",
        "text-sm font-medium",
        STYLES[type] || STYLES.info,
        removing ? "animate-toast-out" : "animate-toast-in",
      ].join(" ")}
    >
      <Icon size={16} className={`shrink-0 mt-0.5 ${ICON_COLORS[type]}`} />
      <p className="flex-1 text-slate-100 text-sm leading-snug">{message}</p>
      <button
        onClick={() => onRemove(id)}
        className="shrink-0 p-0.5 rounded text-slate-400 hover:text-white transition-colors mt-0.5 cursor-pointer"
        aria-label="Dismiss"
      >
        <X size={13} />
      </button>
    </div>
  );
}

/* ── ToastProvider ─────────────────────────────────────────── */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    clearTimeout(timers.current[id]);
    delete timers.current[id];
  }, []);

  const showToast = useCallback((message, type = "success", duration = 4000) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    timers.current[id] = setTimeout(() => remove(id), duration);
  }, [remove]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Toast Renderer */}
      <div
        className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2.5 pointer-events-none"
        aria-live="polite"
        aria-atomic="false"
      >
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem {...t} onRemove={remove} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/* ── useToast Hook ─────────────────────────────────────────── */
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Graceful fallback if used outside provider
    return {
      showToast: (msg, type) => {
        console.warn(`[Toast] ${type?.toUpperCase()}: ${msg}`);
      },
    };
  }
  return ctx;
}

export default ToastProvider;
