"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import type { PartnerMessage } from "@/lib/partner";
import { supabase } from "@/lib/supabase-browser";

const POLL_MS = 15_000;
const time = (iso: string) => new Intl.DateTimeFormat("es-BO", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "America/La_Paz" }).format(new Date(iso));

/** Negotiation chat of one proposal, shared by the partner panel and admin → Propuestas. Live via Realtime, with polling as fallback. */
export function ProposalThread({ proposalId, role, partnerName, canWrite = true }: { proposalId: string; role: "partner" | "tripya"; partnerName: string; canWrite?: boolean }) {
  const [messages, setMessages] = useState<PartnerMessage[]>([]);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const end = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    if (!supabase) return;
    const { data } = await supabase.from("partner_messages").select("id,proposal_id,author_role,body,created_at").eq("proposal_id", proposalId).order("created_at");
    setMessages((data ?? []) as PartnerMessage[]);
  }, [proposalId]);

  useEffect(() => {
    if (!supabase) return;
    const client = supabase;
    void load();
    const channel = client.channel(`partner-messages-${proposalId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "partner_messages", filter: `proposal_id=eq.${proposalId}` }, () => { void load(); })
      .subscribe();
    const id = window.setInterval(() => { void load(); }, POLL_MS);
    return () => { window.clearInterval(id); void client.removeChannel(channel); };
  }, [load, proposalId]);

  useEffect(() => { end.current?.scrollIntoView({ block: "nearest" }); }, [messages.length]);

  async function send(event: FormEvent) {
    event.preventDefault();
    const body = text.trim();
    if (!supabase || !body) return;
    setSending(true); setError("");
    const { data: auth } = await supabase.auth.getUser();
    const { error: insertError } = await supabase.from("partner_messages").insert({ proposal_id: proposalId, author_role: role, body: body.slice(0, 2000), author_id: auth.user?.id });
    setSending(false);
    if (insertError) { setError("No pudimos enviar el mensaje."); return; }
    setText("");
    void load();
  }

  return (
    <div className="chat">
      <div className="chat-messages" aria-live="polite">
        {messages.length === 0 && <p className="chat-empty">Todavía no hay mensajes. {role === "partner" ? "Escríbenos si quieres explicar algo de tu oferta." : "Escribe al socio para negociar."}</p>}
        {messages.map((message) => (
          <div key={message.id} className={`chat-message ${message.author_role === role ? "mine" : ""} ${message.author_role}`}>
            <span className="chat-author">{message.author_role === "tripya" ? "Equipo Tripya" : partnerName}</span>
            <p>{message.body}</p>
            <time dateTime={message.created_at}>{time(message.created_at)}</time>
          </div>
        ))}
        <div ref={end} />
      </div>
      {canWrite && (
        <form className="chat-form" onSubmit={send}>
          <textarea rows={2} maxLength={2000} value={text} onChange={(event) => setText(event.target.value)} placeholder="Escribe tu mensaje..."
            onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void send(event); } }} />
          <button className="dark-button" disabled={sending || !text.trim()} aria-label="Enviar"><Send size={16} /></button>
        </form>
      )}
      {error && <p className="form-message">{error}</p>}
    </div>
  );
}
