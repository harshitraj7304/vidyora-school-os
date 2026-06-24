import { AlertCircle } from "lucide-react";

export default function ErrorState({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 space-y-3 text-center px-6">
      <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
        <AlertCircle size={22} className="text-red-400" />
      </div>
      <p className="text-red-400 font-semibold text-sm">Failed to load data</p>
      {message && <p className="text-slate-500 text-xs max-w-sm">{message}</p>}
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-2 px-4 py-2 text-xs font-semibold text-cyan-400 hover:text-white bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 hover:border-cyan-500/30 rounded-xl transition-all duration-200"
        >
          Try Again
        </button>
      )}
    </div>
  );
}
