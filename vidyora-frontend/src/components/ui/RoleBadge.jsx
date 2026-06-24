const ROLE_CONFIG = {
  super_admin:  { label: "Super Admin",  classes: "bg-violet-500/10 border-violet-500/20 text-violet-400" },
  school_admin: { label: "School Admin", classes: "bg-cyan-500/10 border-cyan-500/20 text-cyan-400" },
  teacher:      { label: "Teacher",      classes: "bg-blue-500/10 border-blue-500/20 text-blue-400" },
  student:      { label: "Student",      classes: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" },
  parent:       { label: "Parent",       classes: "bg-amber-500/10 border-amber-500/20 text-amber-400" },
};

export default function RoleBadge({ role }) {
  const roleKey = role?.toLowerCase() || "";
  const cfg = ROLE_CONFIG[roleKey] || {
    label: role ? role.replace(/_/g, " ") : "Unknown",
    classes: "bg-slate-700/30 border-slate-600/30 text-slate-400"
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.classes}`}>
      {cfg.label}
    </span>
  );
}
