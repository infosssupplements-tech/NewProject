import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowLeft, ArrowRight, KeyRound, Loader2 } from "lucide-react";
import AuthShell from "../components/auth/AuthShell.jsx";
import Field from "../components/auth/Field.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPassword() {
  const {
    requestPasswordReset,
    verifyPasswordResetOtp,
    confirmPasswordReset,
    resendPasswordResetOtp,
  } = useAuth();
  const location = useLocation();

  const [email, setEmail] = useState(() => location.state?.email || "");
  const [otp, setOtp] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [passwords, setPasswords] = useState({ password: "", confirm: "" });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState({
    loading: false,
    message: "",
    tone: "error",
    stage: "request", // "request" | "verify" | "reset" | "done"
  });

  const onRequestOtp = async (e) => {
    e.preventDefault();
    const trimmedEmail = email.trim();
    if (!EMAIL_RE.test(trimmedEmail)) {
      setErrors({ email: "Enter a valid email address." });
      return;
    }

    setErrors({});
    setStatus({ loading: true, message: "", tone: "error", stage: "request" });
    try {
      await requestPasswordReset(trimmedEmail);
      setStatus({
        loading: false,
        message: "",
        tone: "info",
        stage: "verify",
      });
    } catch (err) {
      setStatus({
        loading: false,
        message: err.message || "Could not send recovery code. Please try again.",
        tone: "error",
        stage: "request",
      });
    }
  };

  const onVerifyOtp = async (e) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(otp)) {
      setErrors({ otp: "Enter the 6-digit code sent to your email." });
      return;
    }

    setErrors({});
    setStatus({ loading: true, message: "", tone: "error", stage: "verify" });
    try {
      const res = await verifyPasswordResetOtp(email.trim(), otp);
      const token =
        res?.reset_token ||
        res?.resetToken ||
        res?.data?.reset_token ||
        res?.data?.resetToken ||
        res?.token ||
        res?.data?.token ||
        otp;
      setResetToken(token);
      setStatus({
        loading: false,
        message: "",
        tone: "info",
        stage: "reset",
      });
    } catch (err) {
      setStatus({
        loading: false,
        message: err.message || "Invalid or expired recovery code.",
        tone: "error",
        stage: "verify",
      });
    }
  };

  const onResendOtp = async () => {
    setErrors({});
    setStatus({ loading: true, message: "", tone: "info", stage: "verify" });
    try {
      await resendPasswordResetOtp(email.trim());
      setStatus({
        loading: false,
        message: "A new 6-digit recovery code has been sent to your email.",
        tone: "info",
        stage: "verify",
      });
    } catch (err) {
      setStatus({
        loading: false,
        message: err.message || "Unable to resend code right now.",
        tone: "error",
        stage: "verify",
      });
    }
  };

  const onResetPassword = async (e) => {
    e.preventDefault();
    const next = {};
    if (passwords.password.length < 8 || passwords.password.length > 128) {
      next.password = "Use a password between 8 and 128 characters.";
    }
    if (!passwords.confirm || passwords.confirm !== passwords.password) {
      next.confirm = "Passwords don't match.";
    }
    setErrors(next);
    if (Object.keys(next).length) return;

    setStatus({ loading: true, message: "", tone: "error", stage: "reset" });
    try {
      await confirmPasswordReset(resetToken, passwords.password);
      setStatus({
        loading: false,
        message: "",
        tone: "info",
        stage: "done",
      });
    } catch (err) {
      setStatus({
        loading: false,
        message: err.message || "Could not reset password. Please try again.",
        tone: "error",
        stage: "reset",
      });
    }
  };

  if (status.stage === "done") {
    return (
      <AuthShell mode="forgot">
        <div className="flex flex-col items-start py-4">
          <span className="grid size-14 place-items-center rounded-2xl bg-mint text-ink">
            <KeyRound className="size-6" aria-hidden="true" />
          </span>
          <h1 className="mt-6 text-3xl font-bold tracking-[-0.03em] text-ink">
            Password updated.
          </h1>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-ink/60">
            Your password for <strong className="text-ink">{email.trim()}</strong> has been reset.
            You can now sign in with your new password.
          </p>
          <Link
            to="/login"
            state={{ email: email.trim() }}
            className="mt-8 inline-flex h-12 items-center gap-2 rounded-xl bg-ink px-6 font-semibold text-cream transition-colors hover:bg-emerald"
          >
            Go to sign in <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </AuthShell>
    );
  }

  if (status.stage === "reset") {
    return (
      <AuthShell mode="forgot">
        <p className="font-mono text-[11px] tracking-[0.22em] text-ink/45 uppercase">
          New password
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-[-0.03em] text-ink md:text-3xl">
          Create a new password.
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-ink/60">
          Choose a strong password for <strong className="text-ink">{email.trim()}</strong>.
        </p>

        <form onSubmit={onResetPassword} noValidate className="mt-6 space-y-4">
          <Field
            label="New password"
            type="password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            value={passwords.password}
            onChange={(e) => setPasswords((p) => ({ ...p, password: e.target.value }))}
            error={errors.password}
            hint="8 to 128 characters."
          />
          <Field
            label="Confirm new password"
            type="password"
            autoComplete="new-password"
            placeholder="Repeat new password"
            value={passwords.confirm}
            onChange={(e) => setPasswords((p) => ({ ...p, confirm: e.target.value }))}
            error={errors.confirm}
          />

          {status.message && (
            <p
              role="alert"
              className="rounded-xl border border-amber/50 bg-amber/10 px-4 py-3 text-sm text-ink/80"
            >
              {status.message}
            </p>
          )}

          <button
            type="submit"
            disabled={status.loading}
            className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-ink font-semibold text-cream transition-colors hover:bg-emerald disabled:opacity-60"
          >
            {status.loading ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <>
                Reset password
                <ArrowRight
                  className="size-4 transition-transform group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </>
            )}
          </button>
        </form>
      </AuthShell>
    );
  }

  if (status.stage === "verify") {
    return (
      <AuthShell mode="forgot">
        <p className="font-mono text-[11px] tracking-[0.22em] text-ink/45 uppercase">
          Verify recovery code
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-[-0.03em] text-ink md:text-4xl">
          Check your inbox.
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-ink/60">
          Enter the 6-digit recovery code sent to{" "}
          <strong className="text-ink">{email.trim()}</strong>.
        </p>

        <form onSubmit={onVerifyOtp} noValidate className="mt-7 space-y-5">
          <Field
            label="Recovery code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="123456"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
            error={errors.otp}
          />

          {status.message && (
            <p
              role="status"
              className={`rounded-xl border px-4 py-3 text-sm ${
                status.tone === "info"
                  ? "border-emerald/35 bg-emerald/10 text-ink"
                  : "border-amber/50 bg-amber/10 text-ink/80"
              }`}
            >
              {status.message}
            </p>
          )}

          <button
            type="submit"
            disabled={status.loading}
            className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-ink font-semibold text-cream transition-colors hover:bg-emerald disabled:opacity-60"
          >
            {status.loading ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <>
                Verify code
                <ArrowRight
                  className="size-4 transition-transform group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </>
            )}
          </button>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-sm">
            <button
              type="button"
              onClick={() => {
                setErrors({});
                setStatus({ loading: false, message: "", tone: "error", stage: "request" });
              }}
              disabled={status.loading}
              className="inline-flex items-center gap-1.5 font-semibold text-ink/60 hover:text-ink disabled:opacity-60"
            >
              <ArrowLeft className="size-3.5" aria-hidden="true" />
              Change email
            </button>
            <button
              type="button"
              onClick={onResendOtp}
              disabled={status.loading}
              className="font-semibold text-ink/70 hover:text-emerald disabled:opacity-60"
            >
              Resend recovery code
            </button>
          </div>
        </form>
      </AuthShell>
    );
  }

  return (
    <AuthShell mode="forgot">
      <p className="font-mono text-[11px] tracking-[0.22em] text-ink/45 uppercase">
        Password recovery
      </p>
      <h1 className="mt-2 text-3xl font-bold tracking-[-0.03em] text-ink md:text-4xl">
        Forgot your password?
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-ink/55">
        Enter the email linked to your account and we&apos;ll send a 6-digit recovery code to reset
        your password.
      </p>

      <form onSubmit={onRequestOtp} noValidate className="mt-7 space-y-5">
        <Field
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
        />

        {status.message && (
          <p
            role="alert"
            className="rounded-xl border border-amber/50 bg-amber/10 px-4 py-3 text-sm text-ink/80"
          >
            {status.message}
          </p>
        )}

        <button
          type="submit"
          disabled={status.loading}
          className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-ink font-semibold text-cream transition-colors hover:bg-emerald disabled:opacity-60"
        >
          {status.loading ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <>
              Send recovery code
              <ArrowRight
                className="size-4 transition-transform group-hover:translate-x-1"
                aria-hidden="true"
              />
            </>
          )}
        </button>

        <p className="text-center text-sm text-ink/55">
          Remembered your password?{" "}
          <Link to="/login" className=" inline-flex items-center gap-1 font-semibold text-ink hover:text-emerald">
            Back to sign in
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
