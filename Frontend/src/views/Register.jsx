import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Loader2, MailCheck } from "lucide-react";
import AuthShell from "../components/auth/AuthShell.jsx";
import Field from "../components/auth/Field.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Register() {
  const { signUp, confirmSignUp, resendSignUpCode } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [otp, setOtp] = useState("");
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState({ loading: false, message: "", stage: "register" });

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const onRegister = async (e) => {
    e.preventDefault();
    const next = {};
    if (form.name.trim().length < 2) next.name = "Tell us your name.";
    if (!EMAIL_RE.test(form.email.trim())) next.email = "Enter a valid email address.";
    if (form.password.length < 8 || form.password.length > 128) {
      next.password = "Use a password between 8 and 128 characters.";
    }
    if (form.confirm !== form.password || !form.confirm) next.confirm = "Passwords don't match.";
    setErrors(next);
    if (Object.keys(next).length) return;

    setStatus({ loading: true, message: "", stage: "register" });
    try {
      await signUp({ name: form.name.trim(), email: form.email.trim(), password: form.password });
      setStatus({ loading: false, message: "", stage: "verify" });
    } catch (err) {
      setStatus({ loading: false, message: err.message, stage: "register" });
    }
  };

  const onVerify = async (e) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(otp)) {
      setErrors({ otp: "Enter the 6-digit code sent to your email." });
      return;
    }

    setErrors({});
    setStatus({ loading: true, message: "", stage: "verify" });
    try {
      await confirmSignUp(form.email, otp);
      setStatus({ loading: false, message: "", stage: "done" });
    } catch (err) {
      setStatus({ loading: false, message: err.message, stage: "verify" });
    }
  };

  const onResend = async () => {
    setStatus({ loading: true, message: "", stage: "verify" });
    try {
      await resendSignUpCode(form.email);
      setStatus({ loading: false, message: "A new verification code has been sent.", stage: "verify" });
    } catch (err) {
      setStatus({ loading: false, message: err.message, stage: "verify" });
    }
  };

  if (status.stage === "done") {
    return (
      <AuthShell mode="register">
        <div className="flex flex-col items-start py-6">
          <span className="grid size-14 place-items-center rounded-2xl bg-mint text-ink">
            <MailCheck className="size-6" aria-hidden="true" />
          </span>
          <h1 className="mt-6 text-3xl font-bold tracking-[-0.03em] text-ink">Your email is verified.</h1>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-ink/60">
            Your account for <strong className="text-ink">{form.email}</strong> is ready. Sign in to continue.
          </p>
          <Link
            to="/login"
            className="mt-8 inline-flex h-12 items-center gap-2 rounded-xl bg-ink px-6 font-semibold text-cream hover:bg-emerald"
          >
            Go to sign in <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </AuthShell>
    );
  }

  if (status.stage === "verify") {
    return (
      <AuthShell mode="register">
        <p className="font-mono text-[11px] tracking-[0.22em] text-ink/45 uppercase">Email verification</p>
        <h1 className="mt-2 text-3xl font-bold tracking-[-0.03em] text-ink md:text-4xl">Check your inbox.</h1>
        <p className="mt-3 text-sm leading-relaxed text-ink/60">
          Enter the 6-digit code sent to <strong className="text-ink">{form.email}</strong>.
        </p>

        <form onSubmit={onVerify} noValidate className="mt-7 space-y-5">
          <Field
            label="Verification code"
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
            <p role="status" className="rounded-xl border border-amber/50 bg-amber/10 px-4 py-3 text-sm text-ink/80">
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
                Verify email
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </>
            )}
          </button>
          <button
            type="button"
            onClick={onResend}
            disabled={status.loading}
            className="w-full text-center text-sm font-semibold text-ink/60 hover:text-emerald disabled:opacity-60"
          >
            Resend verification code
          </button>
        </form>
      </AuthShell>
    );
  }

  return (
    <AuthShell mode="register">
      <p className="font-mono text-[10px] tracking-[0.2em] text-ink/45 uppercase">Create Account</p>
      <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink md:text-3xl">Make your space.</h1>
      <p className="mt-1 text-xs text-ink/55">A private workspace for everything you want to understand.</p>

      <form onSubmit={onRegister} noValidate className="mt-5 space-y-3.5">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field
            label="Your name"
            autoComplete="name"
            placeholder="Aarav Sen"
            value={form.name}
            onChange={set("name")}
            error={errors.name}
          />
          <Field
            label="Email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={set("email")}
            error={errors.email}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field
            label="Password"
            type="password"
            autoComplete="new-password"
            placeholder="At least 8 chars"
            value={form.password}
            onChange={set("password")}
            error={errors.password}
            hint="8 to 128 characters."
          />
          <Field
            label="Confirm password"
            type="password"
            autoComplete="new-password"
            placeholder="Repeat password"
            value={form.confirm}
            onChange={set("confirm")}
            error={errors.confirm}
          />
        </div>

        {status.message && (
          <p role="alert" className="rounded-xl border border-amber/50 bg-amber/10 px-3.5 py-2.5 text-xs text-ink/80">
            {status.message}
          </p>
        )}

        <button
          type="submit"
          disabled={status.loading}
          className="group flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-ink font-semibold text-cream transition-colors hover:bg-emerald disabled:opacity-60 text-sm"
        >
          {status.loading ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <>
              Create account
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </>
          )}
        </button>

        <p className="text-center text-xs text-ink/55 pt-1">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-ink hover:text-emerald">
            Log in
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
