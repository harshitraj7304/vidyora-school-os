export default function SectionCard({ children, className = "" }) {
  return (
    <div className={`rounded-2xl bg-slate-900 border border-slate-800/60 overflow-hidden ${className}`}>
      {children}
    </div>
  );
}
