import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, AlertCircle, CheckCircle2, ArrowLeft } from "lucide-react";
import { sendForgotPasswordEmail } from "../modules/auth/services/authService";
import { Input, Button } from "../components/ui";

function ForgotPasswordPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setError(null);

      // Validation
      const emailTrim = email.trim();
      if (!emailTrim) {
        setError("Please enter your email address.");
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailTrim)) {
        setError("Please enter a valid email address.");
        return;
      }

      setLoading(true);
      try {
        await sendForgotPasswordEmail(emailTrim);
        setSuccess(true);
      } catch (err) {
        console.error("Forgot password error:", err);
        const msg = err.message || "";
        if (msg.includes("Too many requests") || err.status === 429) {
          setError("Too many recovery requests. Please wait a minute and try again.");
        } else {
          setError(msg || "Failed to initiate password reset. Please try again.");
        }
      } finally {
        setLoading(false);
      }
    },
    [email]
  );

  if (success) {
    return (
      <div className="w-full space-y-8 animate-slide-in">
        {/* Success Header */}
        <div className="space-y-4 text-center sm:text-left">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto sm:mx-0">
            <CheckCircle2 size={24} className="text-emerald-400" />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-extrabold text-white tracking-tight">
              Check your email
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              We have sent a secure password reset link to <strong className="text-slate-200">{email.trim()}</strong>. Please check your inbox.
            </p>
          </div>
        </div>

        {/* Back to Login Button */}
        <Button
          onClick={() => navigate("/login")}
          variant="secondary"
          size="lg"
          fullWidth
          icon={ArrowLeft}
        >
          Back to sign in
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full space-y-8 animate-slide-in">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-3xl font-extrabold text-white tracking-tight">
          Forgot password?
        </h2>
        <p className="text-slate-400 text-sm">
          No worries! Enter your registered email address and we'll send you a password reset link.
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
        {/* Email Field */}
        <Input
          id="reset-email"
          label="Email address"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setError(null);
          }}
          disabled={loading}
          placeholder="admin@school.edu"
          iconLeft={Mail}
          required
        />

        {/* Submit Button */}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          loading={loading}
        >
          Send reset link
        </Button>

        {/* Back link */}
        <button
          type="button"
          onClick={() => navigate("/login")}
          disabled={loading}
          className="w-full flex items-center justify-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>Back to sign in</span>
        </button>
      </form>
    </div>
  );
}

export default ForgotPasswordPage;
