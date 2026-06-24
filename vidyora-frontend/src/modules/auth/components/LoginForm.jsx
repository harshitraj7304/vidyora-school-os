import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, AlertCircle, ArrowRight } from "lucide-react";
import useAuth from "../../../hooks/useAuth";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";

function LoginForm({ onSuccess }) {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const clearError = useCallback(() => setError(null), []);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setError(null);

      if (!email.trim()) { setError("Please enter your email address."); return; }
      if (!password)     { setError("Please enter your password.");       return; }

      setLoading(true);
      try {
        await login(email.trim(), password);
        if (onSuccess) onSuccess();
      } catch (err) {
        const msg = err.message || "";
        if (msg.includes("Invalid login credentials") || msg.includes("invalid_credentials")) {
          setError("Incorrect email or password. Please try again.");
        } else if (msg.includes("Email not confirmed")) {
          setError("Please verify your email address before logging in.");
        } else if (msg.includes("Too many requests")) {
          setError("Too many login attempts. Please wait a moment.");
        } else {
          setError(msg || "An unexpected error occurred. Please try again.");
        }
      } finally {
        setLoading(false);
      }
    },
    [email, password, login, onSuccess]
  );

  return (
    <div className="w-full space-y-7">
      {/* Header */}
      <div className="space-y-1.5">
        <h2 className="text-3xl font-extrabold text-white tracking-tight">
          Welcome back
        </h2>
        <p className="text-slate-500 text-sm">
          Sign in to your Vidyora OS account to continue.
        </p>
      </div>

      {/* Error Banner */}
      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-red-500/25 bg-red-500/8 p-3.5 text-sm text-red-400 animate-slide-down"
        >
          <AlertCircle size={15} className="mt-0.5 shrink-0" />
          <span className="leading-snug">{error}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <Input
          id="login-email"
          label="Email address"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); clearError(); }}
          disabled={loading}
          placeholder="admin@school.edu"
          iconLeft={Mail}
        />

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="login-password" className="block text-sm font-medium text-slate-300">
              Password
            </label>
            <button
              type="button"
              onClick={() => navigate("/forgot-password")}
              className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
            >
              Forgot password?
            </button>
          </div>
          <Input
            id="login-password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); clearError(); }}
            disabled={loading}
            placeholder="••••••••"
            iconLeft={Lock}
            suffix={
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                disabled={loading}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            }
          />
        </div>

        <Button
          id="login-submit"
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          loading={loading}
          iconRight={!loading ? ArrowRight : undefined}
        >
          {loading ? "Signing in…" : "Sign in to your account"}
        </Button>
      </form>

      {/* Footer */}
      <p className="text-center text-xs text-slate-600">
        Secured by Supabase Auth · Vidyora School OS
      </p>
    </div>
  );
}

export default LoginForm;
