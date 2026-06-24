import { Navigate, Outlet } from "react-router-dom";
import useAuth from "../hooks/useAuth";

function RoleRoute({ allowedRoles }) {
  const { profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-cyan-400 font-medium animate-pulse">Checking permissions...</p>
      </div>
    );
  }

  if (!profile || !allowedRoles.includes(profile.role)) {
    console.warn(`Access denied. Role: ${profile?.role || "NONE"}. Required: ${allowedRoles.join(", ")}`);
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}

export default RoleRoute;
