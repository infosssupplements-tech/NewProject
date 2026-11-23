import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, Loader2 } from "lucide-react";
import AuthShell from "../components/auth/AuthShell.jsx";
import Field from "../components/auth/Field.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  // Keep users signed in across browser restarts unless they explicitly opt out.
  // A non-persistent session still remains available by unchecking “Remember me”.
  const [form, setForm] = useState(() => ({
    email: location.state?.email || "",
    password: "",
    remember: true,
  }));
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState({ loading: false, message: "" });

  const set = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    const next = {};
    if (!EMAIL_RE.test(form.email.trim())) next.email = "Enter a valid email address.";
    if (!form.password) next.password = "Enter your password.";
    setErrors(next);
    if (Object.keys(next).length) return;

    setStatus({ loading: true, message: "" });
    try {
      await signIn({ email: form.email.trim(), password: form.password, remember: form.remember });
      navigate(location.state?.from || "/dashboard", { replace: true });
    } catch (err) {
      setStatus({ loading: false, message: err.message });
    }
  };

  return (
    <AuthShell mode="login">
      <p className="font-mono text-[11px] tracking-[0.22em] text-ink/45 uppercase">Welcome back</p>
      <h1 className="mt-2 text-3xl font-bold tracking-[-0.03em] text-ink md:text-4xl">Good to have you here.</h1>
      <p className="mt-2 text-sm text-ink/55">Pick up your thinking right where you left it.</p>

      <form onSubmit={onSubmit} noValidate className="mt-8 space-y-5">
        <Field
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={form.email}
          onChange={set("email")}
          error={errors.email}
        />
        <Field
          label="Password"
          type="password"
          autoComplete="current-password"
          placeholder="Your password"
          value={form.password}
          onChange={set("password")}
          error={errors.password}
        />

        <div className="flex items-center justify-between">
          <label className="flex cursor-pointer items-center gap-2.5 text-sm text-ink/65">
            <input
              type="checkbox"
              checked={form.remember}
              onChange={set("remember")}
              className="size-4 rounded border-ink/20 accent-emerald"
            />
            Remember me
          </label>
          <Link
            to="/forgot-password"
            state={{ email: form.email }}
            className="text-sm font-semibold text-ink/70 hover:text-emerald"
          >
            Forgot password?
          </Link>
        </div>

        {status.message && (
          <p role="alert" className="rounded-xl border border-amber/50 bg-amber/10 px-4 py-3 text-sm text-ink/80">
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
              Sign in
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </>
          )}
        </button>

        <p className="text-center text-sm text-ink/55">
          New to <span className="font-bangla font-semibold">উপলব্ধি</span>?{" "}
          <Link to="/register" className="font-semibold text-ink hover:text-emerald">
            Create an account
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
