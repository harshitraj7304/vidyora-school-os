import { Loader2 } from "lucide-react";

export default function LoadingState({ message = "Loading..." }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 space-y-4">
      <Loader2 size={32} className="text-cyan-500 animate-spin" />
      <p className="text-slate-500 text-sm animate-pulse">{message}</p>
    </div>
  );
}
