"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowRight } from "lucide-react";

export default function EmployeeSetupForm() {
  const params = useSearchParams();
  const token = params.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState("");
  const [complete, setComplete] = useState(false);
  const [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault();
    if (event.nativeEvent.isComposing || event.keyCode === 229) return;
    if (password !== confirmation) { setMessage("Passwords do not match."); return; }
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/auth/accept-invite", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, password }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not finish account setup.");
      setComplete(true);
    } catch (error) { setMessage(error.message); }
    finally { setBusy(false); }
  }
  return <main className="auth-screen"><section className="auth-card" aria-labelledby="setup-title"><div className="auth-mark">SS</div><p className="eyebrow">SS SUPPLEMENT · EMPLOYEE ACCESS</p><h1 id="setup-title">{complete ? "You’re all set." : "Set your password."}</h1><p className="auth-description">{complete ? "Your secure account is ready. Sign in to continue." : "Create a private password to finish setting up your employee account."}</p>{complete ? <a className="primary-button auth-submit" href="/inventory">Continue to sign in <ArrowRight size={16} /></a> : <form onSubmit={submit}><label>New password<input type="password" autoComplete="new-password" minLength={12} maxLength={256} required value={password} onChange={(event) => setPassword(event.target.value)} /></label><label>Confirm password<input type="password" autoComplete="new-password" minLength={12} maxLength={256} required value={confirmation} onChange={(event) => setConfirmation(event.target.value)} /></label>{message && <p className="form-error" role="alert">{message}</p>}{token.length < 40 && <p className="form-error" role="alert">This invite link is missing or invalid.</p>}<button className="primary-button auth-submit" disabled={busy || token.length < 40} type="submit">{busy ? "Saving…" : "Set password"}<ArrowRight size={16} /></button></form>}</section><aside className="auth-aside"><span>SS</span><div><p>Every store,<br />in good hands.</p><small>Secure team access for your store.</small></div></aside></main>;
}
