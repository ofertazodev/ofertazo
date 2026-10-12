"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import type { Dictionary } from "@/i18n/dictionaries/es";
import { supabase } from "@/lib/supabase-browser";
import { LlamaLoader } from "./TripyaLogo";

/**
 * Landing page of the "forgot password" email. Supabase signs the visitor in from the link,
 * then they choose a new password. Also lets Google-only accounts add a password.
 */
export function NewPasswordForm({ auth, homeHref }: { auth: Dictionary["auth"]; homeHref: string }) {
  const [state, setState] = useState<"checking" | "ready" | "invalid" | "saved">("checking");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!supabase) { setState("invalid"); return; }
    const client = supabase;
    const { data: listener } = client.auth.onAuthStateChange((event, session) => {
      if (session && (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN" || event === "INITIAL_SESSION")) setState("ready");
    });
    // The session from the link is read asynchronously; give it a moment before calling the link invalid.
    const timer = window.setTimeout(() => {
      void client.auth.getSession().then(({ data }) => setState((current) => (current === "checking" ? (data.session ? "ready" : "invalid") : current)));
    }, 1500);
    return () => { listener.subscription.unsubscribe(); window.clearTimeout(timer); };
  }, []);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;
    const password = String(new FormData(event.currentTarget).get("password") ?? "");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) { setMessage(error.message); return; }
    setState("saved");
  }

  if (state === "checking") return <LlamaLoader />;

  if (state === "invalid") return (
    <div className="status-card">
      <p>{auth.resetInvalid}</p>
      <Link className="dark-button" href={homeHref}>Tripya <ArrowRight size={16} /></Link>
    </div>
  );

  if (state === "saved") return (
    <div className="status-card">
      <span className="success-icon"><ShieldCheck /></span>
      <p>{auth.passwordSaved}</p>
      <Link className="dark-button" href={homeHref}>Tripya <ArrowRight size={16} /></Link>
    </div>
  );

  return (
    <form className="lookup-form" onSubmit={save}>
      <label>{auth.newPassword}<input name="password" type="password" minLength={8} required autoComplete="new-password" placeholder={auth.passwordPlaceholder} /></label>
      {message && <p className="form-message" role="alert">{message}</p>}
      <button className="dark-button form-button" disabled={busy}>{auth.savePassword} <ArrowRight size={17} /></button>
    </form>
  );
}
