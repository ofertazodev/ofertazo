"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, Mail, MessageCircle, RefreshCw, Search, Trash2 } from "lucide-react";
import { WAITLIST_DESTINATIONS, WAITLIST_INTERESTS } from "@/components/waitlist/WaitlistForm";
import { es } from "@/i18n/dictionaries/es";
import { supabase } from "@/lib/supabase-browser";

type Signup = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  whatsapp: string | null;
  destination: string;
  interest: string;
  wants_updates: boolean;
  locale: string;
  attribution: { utm_source?: string; utm_campaign?: string; referrer?: string } | null;
  created_at: string;
};

const destinationLabel = (value: string) => es.waitlist.destinations[value as keyof typeof es.waitlist.destinations] ?? value;
const interestLabel = (value: string) => es.waitlist.interests[value as keyof typeof es.waitlist.interests] ?? value;
const dateTime = (iso: string) => new Intl.DateTimeFormat("es-BO", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "America/La_Paz" }).format(new Date(iso));

function toCsv(rows: Signup[]) {
  const cell = (value: string) => `"${value.replace(/"/g, '""')}"`;
  const header = ["Fecha", "Nombre", "Apellido", "Email", "WhatsApp", "Destino", "Interés", "Quiere novedades", "Idioma", "Origen"];
  const lines = rows.map((row) => [dateTime(row.created_at), row.first_name, row.last_name, row.email, row.whatsapp ?? "", destinationLabel(row.destination), interestLabel(row.interest), row.wants_updates ? "Sí" : "No", row.locale, row.attribution?.utm_source ?? row.attribution?.referrer ?? ""].map(cell).join(","));
  // BOM so Excel opens the accents correctly.
  return "﻿" + [header.map(cell).join(","), ...lines].join("\r\n");
}

/** Admin → Viajeros: everyone who joined the launch list ("Únete a la familia Tripya"). */
export function WaitlistPanel() {
  const [rows, setRows] = useState<Signup[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");
  const [destination, setDestination] = useState("all");
  const [interest, setInterest] = useState("all");
  const [updatesOnly, setUpdatesOnly] = useState(false);

  const load = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    const { data, error } = await supabase.from("waitlist_signups").select("id,first_name,last_name,email,whatsapp,destination,interest,wants_updates,locale,attribution,created_at").order("created_at", { ascending: false }).limit(5000);
    setLoading(false);
    if (error) { setMessage(error.message.includes("waitlist_signups") ? "Falta aplicar la migración de la lista de viajeros en Supabase." : error.message); return; }
    setMessage("");
    setRows((data ?? []) as Signup[]);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const filtered = useMemo(() => {
    const text = query.trim().toLowerCase();
    return rows.filter((row) =>
      (destination === "all" || row.destination === destination)
      && (interest === "all" || row.interest === interest)
      && (!updatesOnly || row.wants_updates)
      && (!text || `${row.first_name} ${row.last_name} ${row.email} ${row.whatsapp ?? ""}`.toLowerCase().includes(text)));
  }, [rows, query, destination, interest, updatesOnly]);

  const count = (predicate: (row: Signup) => boolean) => rows.filter(predicate).length;
  const lastWeek = Date.now() - 7 * 86_400_000;

  async function remove(row: Signup) {
    if (!supabase || !window.confirm(`¿Eliminar a ${row.first_name} ${row.last_name} (${row.email}) de la lista?`)) return;
    const { error } = await supabase.from("waitlist_signups").delete().eq("id", row.id);
    if (error) { setMessage(error.message); return; }
    setRows((current) => current.filter((item) => item.id !== row.id));
  }

  function download() {
    const url = URL.createObjectURL(new Blob([toCsv(filtered)], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `tripya-viajeros-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="admin-toolbar">
        <h1>Lista de viajeros</h1>
        <button type="button" className="admin-action-link" onClick={() => void load()}><RefreshCw size={15} /> Actualizar</button>
        <button type="button" className="admin-action-link" onClick={download} disabled={filtered.length === 0}><Download size={15} /> Descargar CSV ({filtered.length})</button>
      </div>
      <p className="muted">Personas que se unieron a la familia Tripya desde el formulario de lanzamiento.</p>
      {message && <p className="form-message">{message}</p>}

      <div className="admin-metrics">
        <div className="admin-metric"><span>Inscritos</span><strong>{rows.length}</strong></div>
        <div className="admin-metric"><span>Últimos 7 días</span><strong>{count((row) => Date.parse(row.created_at) > lastWeek)}</strong></div>
        <div className="admin-metric"><span>Quieren novedades</span><strong>{count((row) => row.wants_updates)}</strong></div>
        <div className="admin-metric"><span>«¡Sí, me interesa!»</span><strong>{count((row) => row.interest === "yes")}</strong></div>
      </div>

      <div className="waitlist-breakdown">
        <div className="admin-panel-card">
          <h2>Destinos de interés</h2>
          {WAITLIST_DESTINATIONS.map((value) => <Bar key={value} label={destinationLabel(value)} value={count((row) => row.destination === value)} total={rows.length} />)}
        </div>
        <div className="admin-panel-card">
          <h2>¿Usarían Tripya?</h2>
          {WAITLIST_INTERESTS.map((value) => <Bar key={value} label={interestLabel(value)} value={count((row) => row.interest === value)} total={rows.length} />)}
        </div>
      </div>

      <div className="admin-toolbar waitlist-filters">
        <label className="admin-search"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar nombre, email o WhatsApp" /></label>
        <select value={destination} onChange={(event) => setDestination(event.target.value)} aria-label="Destino">
          <option value="all">Todos los destinos</option>
          {WAITLIST_DESTINATIONS.map((value) => <option key={value} value={value}>{destinationLabel(value)}</option>)}
        </select>
        <select value={interest} onChange={(event) => setInterest(event.target.value)} aria-label="Interés">
          <option value="all">Todas las respuestas</option>
          {WAITLIST_INTERESTS.map((value) => <option key={value} value={value}>{interestLabel(value)}</option>)}
        </select>
        <label className="check-row"><input type="checkbox" checked={updatesOnly} onChange={(event) => setUpdatesOnly(event.target.checked)} /> Solo quienes quieren novedades</label>
      </div>

      {loading ? <p className="muted">Cargando...</p> : filtered.length === 0 ? <p className="muted">{rows.length === 0 ? "Todavía no hay inscritos." : "Nadie coincide con los filtros."}</p> : (
        <div className="waitlist-table-wrap">
          <table className="waitlist-table">
            <thead><tr><th>Fecha</th><th>Nombre</th><th>Contacto</th><th>Destino</th><th>Interés</th><th>Novedades</th><th>Idioma</th><th aria-label="Acciones" /></tr></thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.id}>
                  <td>{dateTime(row.created_at)}</td>
                  <td><strong>{row.first_name} {row.last_name}</strong></td>
                  <td>
                    <a href={`mailto:${row.email}`}><Mail size={13} /> {row.email}</a>
                    {row.whatsapp && <a href={`https://wa.me/${row.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer"><MessageCircle size={13} /> {row.whatsapp}</a>}
                  </td>
                  <td>{destinationLabel(row.destination)}</td>
                  <td>{interestLabel(row.interest)}</td>
                  <td>{row.wants_updates ? "Sí" : "No"}</td>
                  <td>{row.locale.toUpperCase()}</td>
                  <td><button type="button" className="icon-danger" aria-label="Eliminar" onClick={() => void remove(row)}><Trash2 size={15} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Bar({ label, value, total }: { label: string; value: number; total: number }) {
  const pct = total ? Math.round((value / total) * 100) : 0;
  return (
    <div className="waitlist-bar">
      <span>{label}</span>
      <b>{value} <small>({pct}%)</small></b>
      <i><span style={{ width: `${pct}%` }} /></i>
    </div>
  );
}
