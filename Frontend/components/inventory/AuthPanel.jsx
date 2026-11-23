"use client";

import { useEffect, useState } from "react";
import { ArrowRight, LockKeyhole, ShieldCheck } from "lucide-react";

export default function AuthPanel({ onAuthenticated }) {
  const [step, setStep] = useState("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [resendSeconds, setResendSeconds] = useState(0);

  useEffect(() => {
    if (resendSeconds <= 0) return;
    const timeout = window.setTimeout(() => setResendSeconds((seconds) => Math.max(0, seconds - 1)), 1000);
    return () => window.clearTimeout(timeout);
  }, [resendSeconds]);

  async function submit(event) {
    event.preventDefault();
    if (event.nativeEvent.isComposing || event.keyCode === 229) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const endpoint = step === "credentials" ? "/api/auth/login" : "/api/auth/verify-otp";
      const payload = step === "credentials" ? { email, password } : { email, code };
      const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await response.json();
      if (!response.ok) {
        if (Number.isInteger(data.retryAfterSeconds)) setResendSeconds(data.retryAfterSeconds);
        throw new Error(data.error || "Unable to sign in.");
      }
      if (step === "credentials") {
        setStep("verification");
        setResendSeconds(15);
      } else await onAuthenticated(data);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  async function resendCode() {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
      const data = await response.json();
      if (!response.ok) {
        if (Number.isInteger(data.retryAfterSeconds)) setResendSeconds(data.retryAfterSeconds);
        throw new Error(data.error || "Unable to resend the verification code.");
      }
      setCode("");
      setResendSeconds(15);
      setNotice("A new verification code was sent.");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-screen">
      <section className="auth-card" aria-labelledby="auth-title">
        <div className="auth-mark">SS</div>
        <p className="eyebrow">SS SUPPLEMENT · OPERATIONS</p>
        <h1 id="auth-title">{step === "credentials" ? "Welcome back." : "Check your inbox."}</h1>
        <p className="auth-description">{step === "credentials" ? "Sign in to your store operations workspace." : `Enter the 6-digit verification code sent to ${email}.`}</p>
        <form onSubmit={submit}>
          {step === "credentials" ? <>
            <label>Email address<input autoComplete="username" type="email" required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} /></label>
            <label>Password<input autoComplete="current-password" type="password" required minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} /></label>
          </> : <label>Verification code<input autoFocus inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} /></label>}
          {error && <p className="form-error" role="alert">{error}</p>}
          {notice && <p className="auth-description" role="status">{notice}</p>}
          <button className="primary-button auth-submit" disabled={busy} type="submit">{busy ? "Please wait…" : step === "credentials" ? "Continue" : "Verify and sign in"}<ArrowRight size={16} /></button>
        </form>
        {step === "verification" && <>
          <button className="text-button" type="button" disabled={busy || resendSeconds > 0} onClick={resendCode}>
            {resendSeconds > 0 ? `Resend code in ${resendSeconds}s` : "Resend verification code"}
          </button>
          <button className="text-button" type="button" onClick={() => { setStep("credentials"); setCode(""); setPassword(""); setError(""); setNotice(""); setResendSeconds(0); }}>Use a different account</button>
        </>}
        <div className="auth-security"><ShieldCheck size={16} /><span>Protected with verified sign-in</span><LockKeyhole size={14} /></div>
      </section>
      <aside className="auth-aside"><span>SS</span><div><p>One business.<br />Every store in sync.</p><small>Inventory intelligence for your team.</small></div></aside>
    </main>
  );
}
