import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, AlertCircle, CheckCircle2, Loader2, ArrowLeft } from "lucide-react";
import { supabase } from "../services/supabase";
import { resetUserPasswordCredentials } from "../modules/auth/services/authService";
import { Input, Button } from "../components/ui";

function ResetPasswordPage() {
  const navigate = useNavigate();

  // Session checks
  const [checking, setChecking] = useState(true);
  const [isValidSession, setIsValidSession] = useState(false);

  // Form states
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Verify recovery session on mount
  useEffect(() => {
    let timer;
    async function checkSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setIsValidSession(true);
          setChecking(false);
        } else {
          // If no session found immediately, wait a moment for hash parsing
          timer = setTimeout(async () => {
            const { data: { session: retrySession } } = await supabase.auth.getSession();
            if (retrySession) {
              setIsValidSession(true);
            } else {
              setIsValidSession(false);
            }
            setChecking(false);
          }, 1000);
        }
      } catch (err) {
        console.error("Session verification error:", err);
        setIsValidSession(false);
        setChecking(false);
      }
    }
    checkSession();
    return () => clearTimeout(timer);
  }, []);

  // Password Requirement Checks
  const meetMinLength = password.length >= 8;
  const meetUppercase = /[A-Z]/.test(password);
  const meetLowercase = /[a-z]/.test(password);
  const meetNumber = /[0-9]/.test(password);
  const meetMatching = password && password === confirmPassword;

  const allMet = meetMinLength && meetUppercase && meetLowercase && meetNumber && meetMatching;

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setError(null);

      // Perform strict validations
      if (!password) {
        setError("Please enter a new password.");
        return;
      }
      if (!meetMinLength) {
        setError("Password must be at least 8 characters long.");
        return;
      }
      if (!meetUppercase) {
        setError("Password must include at least one uppercase letter.");
        return;
      }
      if (!meetLowercase) {
        setError("Password must include at least one lowercase letter.");
        return;
      }
      if (!meetNumber) {
        setError("Password must include at least one number.");
        return;
      }
      if (!meetMatching) {
        setError("Passwords do not match.");
        return;
      }

      setLoading(true);
      try {
        // 1. Reset user password via Supabase Auth
        await resetUserPasswordCredentials(password);
        
        // 2. Sign out session recovery token to prevent auto-login
        await supabase.auth.signOut();
        
        setSuccess(true);
      } catch (err) {
        console.error("Reset password error:", err);
        setError(err.message || "Failed to reset password. Please check requirements and try again.");
      } finally {
        setLoading(false);
      }
    },
    [password, meetMinLength, meetUppercase, meetLowercase, meetNumber, meetMatching]
  );

  if (checking) {
    return (
      <div className="min-h-[250px] flex flex-col items-center justify-center space-y-4">
        <Loader2 size={24} className="text-cyan-400 animate-spin" />
        <p className="text-cyan-400 text-sm font-medium animate-pulse">Verifying reset token...</p>
      </div>
    );
  }

  if (!isValidSession) {
    return (
      <div className="w-full space-y-6 animate-slide-in">
        <div className="space-y-4 text-center sm:text-left">
          <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto sm:mx-0">
            <AlertCircle size={24} className="text-red-400" />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-extrabold text-white tracking-tight">
              Link Invalid or Expired
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Your password reset link is invalid, has expired, or has already been used. Please request a new recovery link.
            </p>
          </div>
        </div>

        <Button
          onClick={() => navigate("/forgot-password")}
          variant="secondary"
          size="lg"
          fullWidth
          icon={ArrowLeft}
        >
          Request new reset link
        </Button>
      </div>
    );
  }

  if (success) {
    return (
      <div className="w-full space-y-8 animate-slide-in">
        <div className="space-y-4 text-center sm:text-left">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto sm:mx-0">
            <CheckCircle2 size={24} className="text-emerald-400" />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-extrabold text-white tracking-tight">
              Password updated
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Your password has been successfully reset. You can now log in to your account with your new credentials.
            </p>
          </div>
        </div>

        <Button
          onClick={() => navigate("/login")}
          variant="primary"
          size="lg"
          fullWidth
        >
          Sign In to Vidyora OS
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full space-y-8 animate-slide-in">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-3xl font-extrabold text-white tracking-tight">
          Reset password
        </h2>
        <p className="text-slate-400 text-sm">
          Please enter and confirm your new secure account password.
        </p>
      </div>

      {/* Error Banner */}
      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-red-500/25 bg-red-500/10 p-4 text-sm text-red-400"
        >
          <AlertCircle size={17} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {/* Password field */}
        <Input
          id="new-password"
          label="New password"
          type={showPassword ? "text" : "password"}
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setError(null);
          }}
          disabled={loading}
          placeholder="••••••••"
          iconLeft={Lock}
          suffix={
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              disabled={loading}
              className="text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
            >
              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          }
          required
        />

        {/* Confirm password field */}
        <Input
          id="confirm-password"
          label="Confirm new password"
          type={showPassword ? "text" : "password"}
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            setError(null);
          }}
          disabled={loading}
          placeholder="••••••••"
          iconLeft={Lock}
          required
        />

        {/* Live Strength Checklist Widget */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2.5 text-xs text-slate-400">
          <p className="font-semibold text-slate-300 uppercase tracking-wider mb-1">Password Requirements</p>
          
          <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${meetMinLength ? "bg-emerald-400" : "bg-slate-700"}`} />
            <span className={meetMinLength ? "text-emerald-400 font-medium" : "text-slate-400"}>Minimum 8 characters</span>
          </div>

          <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${meetUppercase ? "bg-emerald-400" : "bg-slate-700"}`} />
            <span className={meetUppercase ? "text-emerald-400 font-medium" : "text-slate-400"}>At least one uppercase letter (A-Z)</span>
          </div>

          <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${meetLowercase ? "bg-emerald-400" : "bg-slate-700"}`} />
            <span className={meetLowercase ? "text-emerald-400 font-medium" : "text-slate-400"}>At least one lowercase letter (a-z)</span>
          </div>

          <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${meetNumber ? "bg-emerald-400" : "bg-slate-700"}`} />
            <span className={meetNumber ? "text-emerald-400 font-medium" : "text-slate-400"}>At least one number (0-9)</span>
          </div>

          <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${meetMatching ? "bg-emerald-400" : "bg-slate-700"}`} />
            <span className={meetMatching ? "text-emerald-400 font-medium" : "text-slate-400"}>Passwords match</span>
          </div>
        </div>

        {/* Submit button */}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          disabled={!allMet}
          loading={loading}
        >
          Update Password
        </Button>
      </form>
    </div>
  );
}

export default ResetPasswordPage;
