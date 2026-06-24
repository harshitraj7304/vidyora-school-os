import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Layouts
import AuthLayout from "../layouts/AuthLayout";
import DashboardLayout from "../layouts/DashboardLayout";

// Guards
import ProtectedRoute from "./ProtectedRoute";
import RoleRoute from "./RoleRoute";

// Auth module
import LoginPage from "../modules/auth/pages/LoginPage";
import ForgotPasswordPage from "../pages/ForgotPasswordPage";
import ResetPasswordPage from "../pages/ResetPasswordPage";

// Pages
import DashboardPage from "../pages/DashboardPage";
import ProfilePage from "../pages/ProfilePage";

// Module pages
import UsersPage from "../modules/users/pages/UsersPage";
import ClassesPage from "../modules/classes/pages/ClassesPage";
import SchoolsPage from "../modules/schools/pages/SchoolsPage";

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ── Public: Auth Layout ─────────────────────────── */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
        </Route>

        {/* ── Private: Dashboard Layout ───────────────────── */}
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/profile/:userId?" element={<ProfilePage />} />

            {/* ── Super Admin Restricted Routes ───────────────── */}
            <Route element={<RoleRoute allowedRoles={["SUPER_ADMIN"]} />}>
              <Route path="/super-admin/schools" element={<SchoolsPage />} />
              <Route path="/super-admin/users" element={<UsersPage />} />
              <Route path="/super-admin/classes" element={<ClassesPage />} />
            </Route>

            {/* ── Tenant Isolated Admin Routes ────────────────── */}
            <Route element={<RoleRoute allowedRoles={["SUPER_ADMIN", "SCHOOL_ADMIN"]} />}>
              <Route path="/admin/users" element={<UsersPage />} />
              <Route path="/admin/classes" element={<ClassesPage />} />
            </Route>

            {/* Additional module routes will be added per module */}
          </Route>
        </Route>

        {/* ── Catch-all: redirect root to login ──────────── */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />

      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;