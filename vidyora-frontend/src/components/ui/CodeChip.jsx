export default function CodeChip({ value }) {
  if (!value) return <span className="text-slate-600">—</span>;
  return (
    <span className="font-mono text-xs text-slate-400 bg-slate-800/60 px-2 py-1 rounded-lg border border-slate-700/40">
      {value}
    </span>
  );
}
