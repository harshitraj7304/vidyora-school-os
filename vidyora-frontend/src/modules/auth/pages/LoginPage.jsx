import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../../../hooks/useAuth";
import LoginForm from "../components/LoginForm";

function LoginPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // If the user is already authenticated, redirect away from login
  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, loading, navigate]);

  // While resolving the initial session, show a fullscreen spinner
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-cyan-400 font-medium animate-pulse text-sm">
          Checking session...
        </p>
      </div>
    );
  }

  // Don't flash the form while we are mid-redirect
  if (user) return null;

  return (
    <LoginForm onSuccess={() => navigate("/dashboard", { replace: true })} />
  );
}

export default LoginPage;
