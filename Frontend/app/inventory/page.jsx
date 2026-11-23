"use client";

import { useState } from "react";
import useSWR from "swr";
import AuthPanel from "../../components/inventory/AuthPanel.jsx";
import InventoryWorkspace from "../../components/inventory/InventoryWorkspace.jsx";

const fetcher = async (url) => { const response = await fetch(url, { cache: "no-store" }); if (response.status === 401) return null; const data = await response.json(); if (!response.ok) throw new Error(data.error || "Unable to verify session."); return data.user; };

export default function InventoryPage() {
  const { data: user, error, isLoading, mutate } = useSWR("/api/auth/me", fetcher, { shouldRetryOnError: false, revalidateOnFocus: false });
  const [signedIn, setSignedIn] = useState(null);
  const activeUser = signedIn || user;
  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    setSignedIn(null);
    await mutate(null, false);
  }
  if (isLoading && signedIn === null && user === undefined) return <main className="auth-loading"><span className="spinner" />Checking secure session…</main>;
  if (error) return <main className="auth-loading"><p role="alert">{error.message}</p><button className="primary-button" onClick={() => mutate()} type="button">Try again</button></main>;
  if (!activeUser) return <AuthPanel onAuthenticated={async () => { setSignedIn(null); await mutate(); }} />;
  return <InventoryWorkspace user={activeUser} onSignOut={signOut} />;
}
