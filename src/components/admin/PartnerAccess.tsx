"use client";

import { FormEvent, useState } from "react";
import { KeyRound, X } from "lucide-react";
import { supabase } from "@/lib/supabase-browser";

export type PartnerAccessEntry = { provider_id: string; email: string; claimed: boolean };

/** Admin → Socios: emails that can enter /socios for this partner. Nobody gets in without being added here. */
export function PartnerAccess({ providerId, entries, onChange }: { providerId: string; entries: PartnerAccessEntry[]; onChange: () => void }) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function grant(event: FormEvent) {
    event.preventDefault();
    if (!supabase || !email.trim()) return;
    setBusy(true); setMessage("");
    const { data, error } = await supabase.rpc("grant_partner_access", { p_provider_id: providerId, p_email: email.trim() });
    setBusy(false);
    if (error) { setMessage(error.message.includes("invalid_email") ? "Revisa el email." : error.message); return; }
    setMessage(data === "linked"
      ? "Listo: esa cuenta ya existía y ahora tiene acceso a /socios."
      : "Listo: cuando el socio cree su cuenta en /socios con ese email, entrará directo a su panel.");
    setEmail("");
    onChange();
  }

  async function revoke(target: string) {
    if (!supabase || !window.confirm(`¿Quitar el acceso al panel a ${target}?`)) return;
    await supabase.rpc("revoke_partner_access", { p_provider_id: providerId, p_email: target });
    onChange();
  }

  return (
    <div className="partner-access">
      <p className="field-label"><KeyRound size={14} /> Acceso al panel de socios (/socios)</p>
      {entries.length > 0 && (
        <ul>
          {entries.map((entry) => (
            <li key={entry.email}>
              <span>{entry.email}</span>
              <small>{entry.claimed ? "Cuenta activa" : "Invitado · aún no creó su cuenta"}</small>
              <button type="button" onClick={() => void revoke(entry.email)} aria-label={`Quitar acceso a ${entry.email}`}><X size={14} /></button>
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={grant}>
        <input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="email del socio" aria-label="Email del socio" />
        <button className="dark-button" disabled={busy}>Dar acceso</button>
      </form>
      {message && <p className="hint strong">{message}</p>}
    </div>
  );
}
