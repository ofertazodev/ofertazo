"use client";

import { FormEvent, useMemo, useState } from "react";
import { ArrowRight, Handshake, Info } from "lucide-react";
import { Modal } from "@/components/site/Modal";
import { formatBs, inputToMinor, partnerError, type PartnerListing, type PartnerUnit, type PricingUnit } from "@/lib/partner";
import { supabase } from "@/lib/supabase-browser";
import { PartnerLlama } from "./PartnerLlama";

type Row = { roomType: string | null; label: string; rooms: number; regular: string; offered: string; unit: PricingUnit };

const UNIT_LABEL: Record<PricingUnit, string> = { per_night: "por noche", per_person: "por persona", per_stay: "por estadía / paquete" };

/** "¡Negociemos!": the partner proposes its best price, dates and perks. Tripya answers: accept and publish, negotiate or decline. */
export function NegotiationModal({ listing, units, onClose, onSent }: { listing: PartnerListing; units: PartnerUnit[]; onClose: () => void; onSent: () => void }) {
  const initialRows = useMemo<Row[]>(() => {
    if (listing.kind === "hotel") {
      const types = new Map<string, number>();
      for (const unit of units) if (unit.room_type) types.set(unit.room_type, (types.get(unit.room_type) ?? 0) + 1);
      return [...types.entries()].map(([type, rooms]) => ({ roomType: type, label: `Habitación ${type}`, rooms, regular: "", offered: "", unit: "per_night" }));
    }
    if (listing.kind === "apartment") return [{ roomType: null, label: "Alojamiento completo", rooms: 1, regular: "", offered: "", unit: "per_night" }];
    return [{ roomType: null, label: listing.name, rooms: 1, regular: "", offered: "", unit: "per_person" }];
  }, [listing, units]);
  const [rows, setRows] = useState<Row[]>(initialRows);
  const [validFrom, setValidFrom] = useState("");
  const [validTo, setValidTo] = useState("");
  const [benefits, setBenefits] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const untyped = listing.kind === "hotel" ? units.filter((unit) => !unit.room_type).length : 0;

  const update = (index: number, patch: Partial<Row>) => setRows(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!supabase) return;
    const items = rows.map((row) => ({ room_type: row.roomType, regular_price_minor: inputToMinor(row.regular), offered_price_minor: inputToMinor(row.offered), pricing_unit: row.unit }));
    if (items.length === 0) { setError("Primero indica el tipo de tus habitaciones."); return; }
    if (items.some((item) => !item.regular_price_minor || !item.offered_price_minor)) { setError("Completa tu precio normal y el precio para Tripya (solo números, ej. 350 o 350.50)."); return; }
    if (items.some((item) => (item.offered_price_minor ?? 0) > (item.regular_price_minor ?? 0))) { setError("El precio para Tripya no puede ser mayor que tu precio normal."); return; }
    if (validFrom && validTo && validTo < validFrom) { setError("La fecha de fin debe ser posterior a la de inicio."); return; }
    setBusy(true); setError("");
    const { error: rpcError } = await supabase.rpc("submit_partner_proposal", {
      p_listing_id: listing.id, p_items: items, p_valid_from: validFrom || null, p_valid_to: validTo || null, p_benefits: benefits.trim(), p_notes: notes.trim()
    });
    setBusy(false);
    if (rpcError) { setError(partnerError(rpcError.message)); return; }
    setDone(true);
  }

  if (done) return (
    <Modal title="Oferta enviada" onClose={() => { onSent(); onClose(); }} className="negotiation-modal" closeLabel="Cerrar">
      <div className="negotiation-done">
        <PartnerLlama variant="business" size="lg" message={<><strong>¡Trato en marcha!</strong> Recibimos tu oferta. La revisamos y te respondemos aquí mismo.</>} />
        <p className="muted">Si la oferta nos convence la publicamos; si no, te escribimos en el chat de tu panel para negociar.</p>
        <button className="dark-button cta" onClick={() => { onSent(); onClose(); }}>Volver a mi panel <ArrowRight size={17} /></button>
      </div>
    </Modal>
  );

  return (
    <Modal title="Negociemos" onClose={onClose} className="negotiation-modal" closeLabel="Cerrar">
      <PartnerLlama variant="business" size="lg" message={<><strong>¡Negociemos!</strong> ¿Cuál es el mejor precio que nos puedes dar?</>} />
      <div className="negotiation-note"><Info size={18} /><p>Esto es una <strong>propuesta de negociación</strong>, no se publica automáticamente. El equipo de Tripya la revisa: si nos parece buena la publicamos al momento; si no, abrimos una negociación contigo por el chat de tu panel.</p></div>
      {untyped > 0 && <p className="form-message">Tienes {untyped} habitaciones sin tipo: no entran en esta oferta. Puedes completarlas antes de enviar.</p>}

      <form className="negotiation-form" onSubmit={submit}>
        <p className="field-label"><Handshake size={16} /> Tus precios</p>
        {rows.map((row, index) => {
          const regular = inputToMinor(row.regular);
          const offered = inputToMinor(row.offered);
          const pct = regular && offered && offered <= regular ? Math.round((1 - offered / regular) * 100) : null;
          return (
            <div className="price-row" key={row.label}>
              <div className="price-row-head">
                <strong>{row.label}</strong>
                {listing.kind === "hotel" && <small>{row.rooms} {row.rooms === 1 ? "habitación" : "habitaciones"}</small>}
                {listing.kind === "package"
                  ? <select value={row.unit} onChange={(event) => update(index, { unit: event.target.value as PricingUnit })} aria-label="El precio es"><option value="per_person">por persona</option><option value="per_stay">por paquete completo</option></select>
                  : <small>{UNIT_LABEL[row.unit]}</small>}
              </div>
              <div className="price-row-fields">
                <label>Tu precio normal (Bs)<input inputMode="decimal" required value={row.regular} onChange={(event) => update(index, { regular: event.target.value })} placeholder="400" /></label>
                <label>Tu mejor precio para Tripya (Bs)<input inputMode="decimal" required value={row.offered} onChange={(event) => update(index, { offered: event.target.value })} placeholder="320" /></label>
                <span className={`price-row-pct ${pct ? "on" : ""}`}>{pct !== null ? `-${pct}%` : "—"}{offered ? <small>{formatBs(offered)}</small> : null}</span>
              </div>
            </div>
          );
        })}

        <div className="partner-grid">
          <label className="partner-field">Oferta válida desde<input type="date" value={validFrom} onChange={(event) => setValidFrom(event.target.value)} /></label>
          <label className="partner-field">Oferta válida hasta<input type="date" value={validTo} min={validFrom || undefined} onChange={(event) => setValidTo(event.target.value)} /></label>
        </div>
        <label className="partner-field">¿Ofrecerás algo especial a los clientes de Tripya? (uno por línea)
          <textarea rows={3} maxLength={2000} value={benefits} onChange={(event) => setBenefits(event.target.value)} placeholder={"Bebida de bienvenida\nLate check-out\nDesayuno incluido"} />
        </label>
        <label className="partner-field">Algo más que quieras decirnos (opcional)
          <textarea rows={2} maxLength={2000} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Temporadas, fechas sin disponibilidad, condiciones..." />
        </label>
        {error && <p className="form-message" role="alert">{error}</p>}
        <div className="partner-actions">
          <button type="button" className="ghost-button outlined" onClick={onClose}>Cancelar</button>
          <button className="dark-button cta" disabled={busy}>{busy ? "Enviando..." : "Enviar mi oferta a Tripya"} <ArrowRight size={17} /></button>
        </div>
      </form>
    </Modal>
  );
}
