import { useState, useCallback, useEffect } from "react";
import { Link, useNavigate, useLocation, Outlet } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import useTenant from "../hooks/useTenant";
import { useAcademicYear } from "../context/AcademicYearContext";
import { EntityAvatar } from "../components/ui";
import { fetchNotifications, markAsRead, markAllNotificationsAsRead } from "../services/notificationService";
import { supabase } from "../services/supabase";
import {
  LayoutDashboard,
  School,
  Users,
  GraduationCap,
  Briefcase,
  Layers,
  CalendarCheck,
  CreditCard,
  ClipboardList,
  FileSpreadsheet,
  BookOpen,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  User,
  Clock,
  Key,
} from "lucide-react";

function DashboardLayout() {
  const { profile, logout } = useAuth();
  const { school } = useTenant();
  const { activeYear } = useAcademicYear();
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  // Notifications state
  const [notifications, setNotifications] = useState([]);
  const [notificationDropdownOpen, setNotificationDropdownOpen] = useState(false);

  const loadNotifications = useCallback(async () => {
    if (!profile) return;
    try {
      const list = await fetchNotifications(profile);
      setNotifications(list);
    } catch (err) {
      console.error("Failed to load notifications:", err.message);
    }
  }, [profile]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Realtime subscription
  useEffect(() => {
    if (!profile) return;

    const channel = supabase
      .channel("public:notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        (payload) => {
          const newNotif = payload.new;
          const isSuperAdmin = profile.role === "SUPER_ADMIN";
          const matchesSchool = newNotif.school_id === profile.school_id;
          const matchesUser = newNotif.user_id === profile.auth_user_id;

          if (isSuperAdmin || matchesSchool || matchesUser) {
            setNotifications((prev) => [newNotif, ...prev]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile]);

  const handleMarkAsRead = useCallback(async (id) => {
    try {
      await markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (err) {
      console.error("Failed to mark notification as read:", err.message);
    }
  }, []);

  const handleMarkAllAsRead = useCallback(async () => {
    try {
      await markAllNotificationsAsRead(profile);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      console.error("Failed to mark all notifications as read:", err.message);
    }
  }, [profile]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleLogout = useCallback(async () => {
    try {
      await logout();
      navigate("/login");
    } catch (err) {
      console.error("Logout failed:", err.message);
    }
  }, [logout, navigate]);

  const getNavItems = useCallback((role) => {
    switch (role) {
      case "SUPER_ADMIN":
        return [
          { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
          { name: "Schools", path: "/super-admin/schools", icon: School },
          { name: "Users", path: "/super-admin/users", icon: Users },
          { name: "Classes", path: "/super-admin/classes", icon: Layers },
        ];
      case "SCHOOL_ADMIN":
        return [
          { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
          { name: "Users", path: "/admin/users", icon: Users },
          { name: "Staff", path: "/admin/staff", icon: Briefcase },
          { name: "Students", path: "/admin/students", icon: GraduationCap },
          { name: "Classes", path: "/admin/classes", icon: Layers },
          { name: "Attendance", path: "/admin/attendance", icon: CalendarCheck },
          { name: "Fees", path: "/admin/fees", icon: CreditCard },
          { name: "Exams", path: "/admin/exams", icon: ClipboardList },
          { name: "Announcements", path: "/admin/announcements", icon: Bell },
          { name: "Settings", path: "/admin/settings", icon: Settings },
        ];
      case "TEACHER":
        return [
          { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
          { name: "My Classes", path: "/teacher/classes", icon: Layers },
          { name: "Attendance", path: "/teacher/attendance", icon: CalendarCheck },
          { name: "Exams & Marks", path: "/teacher/exams", icon: ClipboardList },
          { name: "Homework", path: "/teacher/homework", icon: FileSpreadsheet },
          { name: "LMS Syllabus", path: "/teacher/lms", icon: BookOpen },
          { name: "Announcements", path: "/teacher/announcements", icon: Bell },
        ];
      case "STUDENT":
        return [
          { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
          { name: "My Timetable", path: "/student/timetable", icon: Clock },
          { name: "Attendance", path: "/student/attendance", icon: CalendarCheck },
          { name: "My Homework", path: "/student/homework", icon: FileSpreadsheet },
          { name: "Exams & Schedule", path: "/student/exams", icon: ClipboardList },
          { name: "LMS Portal", path: "/student/lms", icon: BookOpen },
          { name: "Announcements", path: "/student/announcements", icon: Bell },
        ];
      case "PARENT":
        return [
          { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
          { name: "Children Progress", path: "/parent/children", icon: GraduationCap },
          { name: "Attendance Log", path: "/parent/attendance", icon: CalendarCheck },
          { name: "Fees Invoices", path: "/parent/fees", icon: CreditCard },
          { name: "Academic Reports", path: "/parent/results", icon: ClipboardList },
          { name: "Announcements", path: "/parent/announcements", icon: Bell },
        ];
      default:
        return [{ name: "Dashboard", path: "/dashboard", icon: LayoutDashboard }];
    }
  }, []);

  const navItems = getNavItems(profile?.role);

  // Determine current page label
  const currentPageName = location.pathname === "/dashboard"
    ? `Welcome, ${profile?.full_name?.split(" ")[0] || "User"}`
    : navItems.find(
        (item) => item.path !== "/dashboard" && location.pathname.startsWith(item.path)
      )?.name || "Vidyora OS";

  return (
    <div className="min-h-screen bg-[var(--color-surface-0)] font-sans text-slate-100 flex overflow-hidden">

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 flex flex-col justify-between transform transition-transform duration-300 ease-out lg:static lg:translate-x-0 bg-slate-900 border-r border-white/[0.06] ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div>
          {/* Sidebar Header */}
          <div className="h-14 px-5 border-b border-white/[0.06] flex items-center justify-between">
            <Link
              to="/dashboard"
              className="flex items-center gap-2.5"
              onClick={() => setSidebarOpen(false)}
            >
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-400 to-indigo-500 flex items-center justify-center shadow-lg shadow-cyan-500/25 shrink-0">
                <span className="font-extrabold text-sm text-black select-none font-sans">V</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="font-bold text-sm text-white tracking-wide">Vidyora</span>
                <span className="text-cyan-400 text-xs font-semibold">OS</span>
              </div>
            </Link>
            <button
              className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800/60 transition-colors duration-200 cursor-pointer"
              onClick={() => setSidebarOpen(false)}
            >
              <X size={16} />
            </button>
          </div>

          {/* School context pill */}
          {school && (
            <div className="mx-3 mt-3 mb-1 px-3.5 py-2.5 rounded-xl bg-slate-850/40 border border-white/[0.06] shadow-sm">
              <p className="text-[9px] text-slate-500 font-semibold tracking-widest uppercase mb-0.5">
                Active Campus
              </p>
              <p className="text-xs font-bold text-cyan-400 truncate">{school.school_name}</p>
              {activeYear && (
                <p className="text-[10px] text-slate-400 mt-1 truncate font-medium">
                  {activeYear.name}
                </p>
              )}
            </div>
          )}

          {/* Navigation */}
          <nav className="px-3 py-3 space-y-0.5">
            {navItems.map((item) => {
              const isActive =
                location.pathname === item.path ||
                (item.path !== "/dashboard" && location.pathname.startsWith(item.path));
              const Icon = item.icon;

              return (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm transition-all duration-200 group border border-transparent ${
                    isActive
                      ? "text-white bg-cyan-500/8 border-cyan-500/15 font-semibold shadow-[0_0_12px_rgba(0,212,255,0.04)]"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/35 hover:border-white/[0.02] font-medium"
                  }`}
                >
                  {/* Active left accent bar */}
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(0,212,255,0.8)]" />
                  )}
                  <Icon
                    size={16}
                    className={`shrink-0 transition-colors duration-200 ${
                      isActive ? "text-cyan-400" : "text-slate-500 group-hover:text-slate-300"
                    }`}
                  />
                  <span className="truncate">{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-white/[0.04]">
          <div className="flex items-center justify-between gap-2 px-1">
            <Link
              to="/profile"
              className="flex items-center gap-2.5 min-w-0 flex-1 p-1.5 rounded-xl hover:bg-slate-800/50 transition-colors group"
              onClick={() => setSidebarOpen(false)}
            >
              <EntityAvatar
                name={profile?.full_name}
                imageUrl={profile?.profile_photo_url}
                size="sm"
              />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white truncate">
                  {profile?.full_name || "User"}
                </p>
                <p className="text-[10px] text-slate-500 truncate">
                  {profile?.role?.replace(/_/g, " ")}
                </p>
              </div>
            </Link>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer shrink-0"
              title="Sign out"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main Content ─────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top Header */}
        <header
          className="h-14 px-5 flex items-center justify-between z-30 shrink-0 bg-slate-900/80 border-b border-white/[0.06] backdrop-blur-md"
        >
          {/* Left: hamburger + page title */}
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors cursor-pointer"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={18} />
            </button>
            <div className="hidden sm:flex items-center gap-2">
              <h2 className="text-sm font-semibold text-white">{currentPageName}</h2>
              {location.pathname !== "/dashboard" && (
                <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-md bg-slate-800/60 text-[10px] text-slate-400 font-semibold border border-slate-700/40">
                  {profile?.role?.replace(/_/g, " ")}
                </span>
              )}
            </div>
          </div>

          {/* Right: notifications + profile */}
          <div className="flex items-center gap-2">

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setNotificationDropdownOpen(!notificationDropdownOpen)}
                className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors cursor-pointer"
              >
                <Bell size={17} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-cyan-500 text-[9px] font-bold text-black flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {notificationDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setNotificationDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-white/[0.08] rounded-xl shadow-[0_12px_40px_rgba(0,0,0,0.5)] z-50 flex flex-col max-h-96 animate-slide-down overflow-hidden">
                    <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between shrink-0">
                      <span className="text-sm font-semibold text-white">Notifications</span>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllAsRead}
                          className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer transition-colors"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>

                    <div className="flex-1 overflow-y-auto divide-y divide-white/[0.04]">
                      {notifications.length === 0 ? (
                        <div className="px-4 py-10 text-center space-y-2">
                          <Bell size={22} className="mx-auto text-slate-750" />
                          <p className="text-xs text-slate-500">No notifications yet</p>
                        </div>
                      ) : (
                        notifications.map((notif) => {
                          let Icon = Bell;
                          if (notif.type?.includes("SCHOOL")) Icon = School;
                          else if (notif.type?.includes("USER")) Icon = Users;
                          else if (notif.type?.includes("CLASS")) Icon = Layers;
                          else if (notif.type?.includes("PASSWORD")) Icon = Key;

                          return (
                            <div
                              key={notif.id}
                              onClick={() => { if (!notif.is_read) handleMarkAsRead(notif.id); }}
                              className={`p-3.5 flex gap-3 items-start transition-colors cursor-pointer ${
                                notif.is_read
                                  ? "hover:bg-slate-800/30"
                                  : "bg-cyan-500/5 hover:bg-cyan-500/8"
                              }`}
                            >
                              <div
                                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                                  notif.is_read
                                    ? "bg-slate-800 text-slate-500"
                                    : "bg-cyan-500/15 text-cyan-400"
                                }`}
                              >
                                <Icon size={13} />
                              </div>
                              <div className="min-w-0 flex-1 space-y-0.5">
                                <div className="flex items-center justify-between gap-2">
                                  <p className={`text-xs font-semibold truncate ${
                                    notif.is_read ? "text-slate-400" : "text-white"
                                  }`}>
                                    {notif.title}
                                  </p>
                                  {!notif.is_read && (
                                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
                                  )}
                                </div>
                                <p className="text-[11px] text-slate-500 leading-snug line-clamp-2">
                                  {notif.message}
                                </p>
                                <p className="text-[10px] text-slate-600">
                                  {new Date(notif.created_at).toLocaleTimeString("en-IN", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </p>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-slate-800/60 transition-colors text-slate-300 cursor-pointer"
              >
                <EntityAvatar
                  name={profile?.full_name}
                  imageUrl={profile?.profile_photo_url}
                  size="sm"
                />
                <span className="hidden md:inline text-xs font-semibold text-white">
                  {profile?.full_name?.split(" ")[0] || "User"}
                </span>
                <ChevronDown size={13} className="text-slate-500 hidden md:block" />
              </button>

              {profileDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setProfileDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-52 bg-slate-900 border border-white/[0.08] rounded-xl shadow-[0_12px_40px_rgba(0,0,0,0.5)] py-2 z-50 animate-slide-down">
                    <div className="px-4 py-2.5 border-b border-white/[0.06] mb-1">
                      <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                        Logged in as
                      </p>
                      <p className="text-xs font-semibold text-white truncate mt-0.5">
                        {profile?.email}
                      </p>
                    </div>
                    <Link
                      to="/profile"
                      className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800/60 hover:text-white transition-colors"
                      onClick={() => setProfileDropdownOpen(false)}
                    >
                      <User size={14} className="text-slate-500" />
                      <span className="text-xs font-medium">My Profile</span>
                    </Link>
                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        handleLogout();
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-red-400 hover:bg-red-500/10 transition-colors text-left cursor-pointer font-medium"
                    >
                      <LogOut size={14} />
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-5 md:p-7 bg-[var(--color-surface-0)]">
          <div className="animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;