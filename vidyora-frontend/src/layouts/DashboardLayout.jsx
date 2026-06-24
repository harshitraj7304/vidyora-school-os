import { useState, useCallback } from "react";
import { Link, useNavigate, useLocation, Outlet } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import useTenant from "../hooks/useTenant";
import { useAcademicYear } from "../context/AcademicYearContext";
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
  Clock
} from "lucide-react";

function DashboardLayout() {
  const { profile, logout } = useAuth();
  const { school } = useTenant();
  const { activeYear } = useAcademicYear();
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const handleLogout = useCallback(async () => {
    try {
      await logout();
      navigate("/login");
    } catch (err) {
      console.error("Logout failed:", err.message);
    }
  }, [logout, navigate]);

  // Define navigation configuration based on role
  const getNavItems = useCallback((role) => {
    switch (role) {
      case "SUPER_ADMIN":
        return [
          { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
          { name: "Schools", path: "/super-admin/schools", icon: School },
          { name: "Users", path: "/super-admin/users", icon: Users },
        ];
      case "SCHOOL_ADMIN":
        return [
          { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
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
        return [
          { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard }
        ];
    }
  }, []);

  const navItems = getNavItems(profile?.role);

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-100 flex overflow-hidden">
      
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800/80 flex flex-col justify-between transform transition-transform duration-300 lg:static lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div>
          {/* Sidebar Header */}
          <div className="h-16 px-6 border-b border-slate-800/80 flex items-center justify-between">
            <Link to="/dashboard" className="flex items-center gap-3" onClick={() => setSidebarOpen(false)}>
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-500 flex items-center justify-center">
                <span className="font-extrabold text-md text-black">V</span>
              </div>
              <div className="flex items-baseline">
                <span className="font-bold text-md text-white tracking-wide">Vidyora</span>
                <span className="text-cyan-400 text-xs font-semibold ml-1">OS</span>
              </div>
            </Link>
            <button
              className="lg:hidden p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              onClick={() => setSidebarOpen(false)}
            >
              <X size={18} />
            </button>
          </div>

          {/* School Name & Context Details */}
          {school && (
            <div className="p-4 mx-3 my-4 rounded-xl bg-slate-950/40 border border-slate-800/50">
              <p className="text-xs text-slate-500 font-semibold tracking-wider uppercase mb-1">Current School</p>
              <p className="text-sm font-bold text-cyan-400 truncate">{school.school_name}</p>
              {activeYear && (
                <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
                  <CalendarCheck size={12} className="text-slate-500" />
                  <span>Academic Year: {activeYear.name}</span>
                </div>
              )}
            </div>
          )}

          {/* Navigation Links */}
          <nav className="px-4 py-2 space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path || (item.path !== "/dashboard" && location.pathname.startsWith(item.path));
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group text-sm ${
                    isActive
                      ? "bg-gradient-to-r from-cyan-500/10 to-transparent border-l-2 border-cyan-500 text-cyan-400 font-semibold"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon
                    size={18}
                    className={`transition-colors ${
                      isActive ? "text-cyan-400" : "text-slate-500 group-hover:text-slate-300"
                    }`}
                  />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer / User Profile Summary */}
        <div className="p-4 border-t border-slate-800/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 truncate">
              <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700/60 text-slate-300 font-semibold">
                {profile?.first_name ? profile.first_name[0].toUpperCase() : <User size={16} />}
              </div>
              <div className="truncate">
                <p className="text-sm font-semibold text-white truncate">
                  {profile ? `${profile.first_name} ${profile.last_name || ""}` : "Guest Account"}
                </p>
                <p className="text-xs text-slate-500 truncate">{profile?.role.replace("_", " ")}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              title="Sign Out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Top Header */}
        <header className="h-16 bg-slate-900 border-b border-slate-800/80 px-6 flex items-center justify-between z-30">
          <div className="flex items-center gap-4">
            <button
              className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={20} />
            </button>
            <div className="hidden sm:block">
              <h2 className="text-lg font-bold text-white tracking-tight">
                {location.pathname === "/dashboard"
                  ? `Welcome, ${profile?.first_name || "User"}`
                  : navItems.find((item) => item.path !== "/dashboard" && location.pathname.startsWith(item.path))?.name || "System Portal"}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Announcement / Bell Quick Access */}
            <button className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors">
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-cyan-500 rounded-full"></span>
            </button>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-800/60 transition-colors text-slate-300"
              >
                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700/60 font-semibold text-slate-300">
                  {profile?.first_name ? profile.first_name[0].toUpperCase() : "U"}
                </div>
                <span className="hidden md:inline text-sm font-medium">
                  {profile?.first_name || "User"}
                </span>
                <ChevronDown size={14} className="text-slate-500" />
              </button>

              {profileDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setProfileDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-800 rounded-xl shadow-xl py-2 z-50">
                    <div className="px-4 py-2 border-b border-slate-800">
                      <p className="text-xs text-slate-500">Logged in as</p>
                      <p className="text-sm font-semibold text-white truncate">{profile?.email}</p>
                    </div>
                    <Link
                      to="/dashboard"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                      onClick={() => setProfileDropdownOpen(false)}
                    >
                      <User size={14} />
                      <span>My Profile</span>
                    </Link>
                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        handleLogout();
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors text-left"
                    >
                      <LogOut size={14} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* View Content Port */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-950">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;