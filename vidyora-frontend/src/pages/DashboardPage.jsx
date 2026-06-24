import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  LayoutDashboard,
  School,
  Users,
  Layers,
  Plus,
  ArrowRight,
  Clock,
  AlertCircle,
  CalendarCheck,
  Zap,
  Activity,
} from "lucide-react";
import useAuth from "../hooks/useAuth";
import useTenant from "../hooks/useTenant";
import { useAcademicYear } from "../context/AcademicYearContext";
import { supabase } from "../services/supabase";
import { getAllClasses } from "../modules/classes/services/classService";
import StatCard from "../components/ui/StatCard";

function formatRelativeTime(dateString) {
  if (!dateString) return "—";
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now - date;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

const ActivitySkeleton = () => (
  <div className="space-y-1">
    {[1, 2, 3, 4].map((n) => (
      <div key={n} className="flex items-center gap-3 p-3 rounded-xl">
        <div className="w-8 h-8 rounded-xl skeleton shrink-0" />
        <div className="flex-1 space-y-1.5">
          <div className="skeleton h-3 rounded w-28" />
          <div className="skeleton h-2.5 rounded w-44" />
        </div>
        <div className="skeleton h-2.5 rounded w-10 shrink-0" />
      </div>
    ))}
  </div>
);

function DashboardPage() {
  const { profile } = useAuth();
  const { school } = useTenant();
  const { activeYear, loading: academicYearLoading } = useAcademicYear();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ schools: 0, users: 0, classes: 0 });
  const [activities, setActivities] = useState([]);

  const fetchDashboardData = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    try {
      const isSuperAdmin = profile.role === "SUPER_ADMIN";
      const schoolId = profile.school_id;

      let schoolsCount = 0;
      let usersCount = 0;
      let recentClasses = [];

      if (isSuperAdmin) {
        const { count } = await supabase
          .from("schools")
          .select("id", { count: "exact", head: true })
          .neq("status", "archived");
        schoolsCount = count || 0;
      }

      const userQuery = supabase.from("users").select("id", { count: "exact", head: true });
      const { count: uc } = await (isSuperAdmin ? userQuery : userQuery.eq("school_id", schoolId));
      usersCount = uc || 0;

      const classesList = await getAllClasses(isSuperAdmin ? null : schoolId);
      const classesCount = classesList.filter((c) => c.status?.toLowerCase() === "active").length;
      recentClasses = classesList.slice(0, 5);

      setStats({ schools: schoolsCount, users: usersCount, classes: classesCount });

      // Activity
      let recentSchools = [];
      let recentUsers = [];

      if (isSuperAdmin) {
        const { data } = await supabase
          .from("schools")
          .select("id, school_name, school_code, created_at")
          .neq("status", "archived")
          .order("created_at", { ascending: false })
          .limit(5);
        recentSchools = data || [];
      }

      const uQuery = supabase.from("users").select("id, full_name, email, role, created_at");
      const { data: ud } = await (isSuperAdmin ? uQuery : uQuery.eq("school_id", schoolId))
        .order("created_at", { ascending: false })
        .limit(5);
      recentUsers = ud || [];

      const merged = [
        ...recentSchools.map((s) => ({
          id: `school-${s.id}`,
          title: "School Registered",
          description: `${s.school_name} (${s.school_code})`,
          time: s.created_at,
          icon: School,
          color: "text-violet-400",
          bg: "bg-violet-500/10 border-violet-500/20",
        })),
        ...recentUsers.map((u) => ({
          id: `user-${u.id}`,
          title: "User Onboarded",
          description: `${u.full_name} · ${u.role?.replace(/_/g, " ")}`,
          time: u.created_at,
          icon: Users,
          color: "text-cyan-400",
          bg: "bg-cyan-500/10 border-cyan-500/20",
        })),
        ...recentClasses.map((c) => ({
          id: `class-${c.id}`,
          title: "Class Created",
          description: `${c.class_name} (${c.class_code})`,
          time: c.created_at,
          icon: Layers,
          color: "text-emerald-400",
          bg: "bg-emerald-500/10 border-emerald-500/20",
        })),
      ]
        .sort((a, b) => new Date(b.time) - new Date(a.time))
        .slice(0, 8);

      setActivities(merged);
    } catch (err) {
      console.error("Dashboard load error:", err);
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    if (profile) fetchDashboardData();
  }, [profile, fetchDashboardData]);

  const isSuperAdmin = profile?.role === "SUPER_ADMIN";
  const usersPath = isSuperAdmin ? "/super-admin/users" : "/admin/users";

  return (
    <div className="space-y-7 max-w-7xl mx-auto">

      {/* ── Welcome Banner ────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] p-7"
           style={{ background: "linear-gradient(135deg, #0d1526 0%, #0a0f1a 60%, #050a14 100%)" }}>
        {/* Ambient glow */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-cyan-500/6 blur-[80px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-1/2 w-56 h-56 bg-indigo-500/5 blur-[80px] rounded-full pointer-events-none" />
        {/* Dot grid */}
        <div className="absolute inset-0 bg-dot-grid opacity-40 pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-[10px] text-cyan-400 font-semibold tracking-widest uppercase">
              <Activity size={10} />
              ERP Engine Active
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {profile
                ? `Welcome back, ${profile.full_name?.split(" ")[0]} 👋`
                : "Welcome to Vidyora OS"}
            </h1>
            <p className="text-slate-400 text-sm max-w-md leading-relaxed">
              {isSuperAdmin
                ? "Platform-wide view. Manage campuses, users, and academic configurations."
                : `Managing ${school?.school_name || "your campus"}. Track operations from one dashboard.`}
            </p>
          </div>

          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-950/50 border border-slate-800/60 shrink-0 backdrop-blur-sm">
            <LayoutDashboard size={18} className="text-cyan-400 shrink-0" />
            <div className="min-w-0">
              <p className="text-[9px] text-slate-500 font-semibold uppercase tracking-widest">
                Access Scope
              </p>
              <p className="text-sm font-bold text-white capitalize">
                {profile?.role?.replace(/_/g, " ").toLowerCase() || "Loading..."}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Stats Grid ───────────────────────────────────────────── */}
      <div>
        <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest mb-3">
          Live Statistics
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {isSuperAdmin ? (
            <>
              <StatCard
                label="Registered Schools"
                value={stats.schools}
                icon={School}
                color="text-violet-400"
                iconBg="bg-violet-500/10 border-violet-500/20"
                accent="hover:border-violet-500/30"
                to="/super-admin/schools"
                loading={loading}
              />
              <StatCard
                label="Platform Users"
                value={stats.users}
                icon={Users}
                color="text-cyan-400"
                iconBg="bg-cyan-500/10 border-cyan-500/20"
                accent="hover:border-cyan-500/30"
                to="/super-admin/users"
                loading={loading}
              />
              <StatCard
                label="Active Classes"
                value={stats.classes}
                icon={Layers}
                color="text-emerald-400"
                iconBg="bg-emerald-500/10 border-emerald-500/20"
                accent="hover:border-emerald-500/30"
                to="/super-admin/classes"
                loading={loading}
              />
            </>
          ) : (
            <>
              <StatCard
                label="Campus Users"
                value={stats.users}
                icon={Users}
                color="text-cyan-400"
                iconBg="bg-cyan-500/10 border-cyan-500/20"
                accent="hover:border-cyan-500/30"
                to="/admin/users"
                loading={loading}
              />
              <StatCard
                label="Class Sections"
                value={stats.classes}
                icon={Layers}
                color="text-emerald-400"
                iconBg="bg-emerald-500/10 border-emerald-500/20"
                accent="hover:border-emerald-500/30"
                to="/admin/classes"
                loading={loading}
              />
              <div className="flex flex-col p-5 rounded-xl bg-slate-900 border border-slate-800/80">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl border border-amber-500/20 bg-amber-500/10 flex items-center justify-center">
                    <CalendarCheck size={18} className="text-amber-400" />
                  </div>
                  {academicYearLoading ? (
                    <div className="skeleton h-4 w-16 rounded" />
                  ) : activeYear ? (
                    <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Active
                    </span>
                  ) : (
                    <span className="text-[10px] bg-amber-500/10 border border-amber-500/20 text-amber-400 font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Setup Needed
                    </span>
                  )}
                </div>
                <div className="mt-3">
                  <p className="text-lg font-extrabold text-white truncate">
                    {academicYearLoading ? "—" : activeYear?.name || "Not Set"}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5 font-medium">Academic Year</p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Main Two-Column Layout ──────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Quick Actions */}
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-slate-900 border border-white/[0.06] space-y-3.5 shadow-sm">
            <div className="flex items-center gap-2">
              <Zap size={14} className="text-cyan-400" />
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Quick Actions
              </h3>
            </div>

            <div className="space-y-2">
              {isSuperAdmin ? (
                <>
                  <Link
                    to="/super-admin/schools?add=true"
                    className="flex items-center justify-between p-3 rounded-xl border border-white/[0.06] bg-slate-950/20 hover:border-violet-500/30 hover:bg-violet-500/5 transition-all duration-200 group cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <School size={15} className="text-violet-400" />
                      <span className="text-sm font-medium text-slate-300">Add New School</span>
                    </div>
                    <Plus size={14} className="text-slate-650 group-hover:text-white transition-colors duration-200" />
                  </Link>
                  <Link
                    to="/super-admin/users?add=true"
                    className="flex items-center justify-between p-3 rounded-xl border border-white/[0.06] bg-slate-950/20 hover:border-cyan-500/30 hover:bg-cyan-500/5 transition-all duration-200 group cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <Users size={15} className="text-cyan-400" />
                      <span className="text-sm font-medium text-slate-300">Onboard User</span>
                    </div>
                    <Plus size={14} className="text-slate-655 group-hover:text-white transition-colors duration-200" />
                  </Link>
                  <Link
                    to="/super-admin/classes?add=true"
                    className="flex items-center justify-between p-3 rounded-xl border border-white/[0.06] bg-slate-950/20 hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all duration-200 group cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <Layers size={15} className="text-emerald-400" />
                      <span className="text-sm font-medium text-slate-300">Create Class</span>
                    </div>
                    <Plus size={14} className="text-slate-650 group-hover:text-white transition-colors duration-200" />
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/admin/users?add=true"
                    className="flex items-center justify-between p-3 rounded-xl border border-white/[0.06] bg-slate-950/20 hover:border-cyan-500/30 hover:bg-cyan-500/5 transition-all duration-200 group cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <Users size={15} className="text-cyan-400" />
                      <span className="text-sm font-medium text-slate-300">Add Campus User</span>
                    </div>
                    <Plus size={14} className="text-slate-650 group-hover:text-white transition-colors duration-200" />
                  </Link>
                  <Link
                    to="/admin/classes?add=true"
                    className="flex items-center justify-between p-3 rounded-xl border border-white/[0.06] bg-slate-950/20 hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all duration-200 group cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <Layers size={15} className="text-emerald-400" />
                      <span className="text-sm font-medium text-slate-300">Register Class</span>
                    </div>
                    <Plus size={14} className="text-slate-650 group-hover:text-white transition-colors duration-200" />
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* School context */}
          {!isSuperAdmin && school && (
            <div className="p-5 rounded-2xl bg-slate-900 border border-white/[0.06] space-y-3 shadow-sm">
              <div className="flex items-center gap-2">
                <School size={14} className="text-indigo-400" />
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Campus Info
                </h3>
              </div>
              <div className="space-y-3 text-sm">
                {[
                  { label: "Campus Name", value: school.school_name },
                  { label: "School Code", value: school.school_code },
                  {
                    label: "Since",
                    value: school.created_at
                      ? new Date(school.created_at).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                         })
                      : "—",
                  },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-[9px] text-slate-500 font-semibold uppercase tracking-widest mb-0.5">
                      {label}
                    </p>
                    <p className="text-sm font-semibold text-white">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Activity Feed */}
        <div className="lg:col-span-2">
          <div className="p-5 rounded-2xl bg-slate-900 border border-white/[0.06] h-full flex flex-col shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-cyan-400" />
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Recent Activity
                </h3>
              </div>
              {!loading && activities.length > 0 && (
                <Link
                  to={usersPath}
                  className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 group transition-colors"
                >
                  View all
                  <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                </Link>
              )}
            </div>

            <div className="flex-1">
              {loading ? (
                <ActivitySkeleton />
              ) : activities.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-12 h-12 rounded-xl bg-slate-800/60 border border-slate-700/40 flex items-center justify-center mb-3">
                    <AlertCircle size={20} className="text-slate-600" />
                  </div>
                  <p className="text-slate-300 font-semibold text-sm">No activity yet</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs">
                    Schools, users, and classes you create will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-0.5">
                  {activities.map((act) => {
                    const Icon = act.icon;
                    return (
                      <div
                        key={act.id}
                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-800/30 transition-colors group"
                      >
                        <div
                          className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 ${act.bg}`}
                        >
                          <Icon size={14} className={act.color} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-white truncate">
                            {act.title}
                          </p>
                          <p className="text-[11px] text-slate-500 truncate mt-0.5">
                            {act.description}
                          </p>
                        </div>
                        <span className="text-[10px] text-slate-600 font-medium shrink-0">
                          {formatRelativeTime(act.time)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;