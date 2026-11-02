"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { ArrowLeft, Check, ExternalLink, MessageCircle, RefreshCw, X } from "lucide-react";
import { es } from "@/i18n/dictionaries/es";
import { AMENITIES, type Amenity } from "@/lib/listing";
import {
  KIND_LABELS, LISTING_SELECT, PARTNER_BUCKET, PROPOSAL_SELECT, PROPOSAL_STATUS, formatBs, inputToMinor, minorToInput, signedUrls,
  type PartnerListing, type PartnerMedia, type PartnerProposal, type PartnerUnit, type ProposalStatus
} from "@/lib/partner";
import { supabase } from "@/lib/supabase-browser";
import { ProposalThread } from "@/components/partner/ProposalThread";

type Row = PartnerProposal & { partner_listings: { name: string; kind: PartnerListing["kind"]; city_text: string | null } | null; providers: { trade_name: string } | null };
type Filter = "open" | ProposalStatus | "all";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "open", label: "Por revisar" }, { id: "accepted", label: "Publicadas" }, { id: "rejected", label: "Rechazadas" }, { id: "withdrawn", label: "Retiradas" }, { id: "all", label: "Todas" }
];
const date = (iso: string) => new Intl.DateTimeFormat("es-BO", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "America/La_Paz" }).format(new Date(iso));
const slugify = (text: string) => text.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 70);

/** Admin → Propuestas: offers sent by partners from /socios. Only from here (publish_partner_proposal) a proposal reaches the site. */
export function ProposalsPanel() {
  const [rows, setRows] = useState<Row[]>([]);
  const [filter, setFilter] = useState<Filter>("open");
  const [open, setOpen] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    if (!supabase) return;
    const { data, error } = await supabase.from("partner_proposals").select(`${PROPOSAL_SELECT},partner_listings(name,kind,city_text),providers(trade_name)`).order("created_at", { ascending: false }).limit(300);
    if (error) { setMessage(error.message.includes("partner_proposals") ? "Falta aplicar la migración del panel de socios en Supabase." : error.message); return; }
    setRows((data ?? []) as unknown as Row[]);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const visible = rows.filter((row) => (filter === "all" ? true : filter === "open" ? row.status === "sent" || row.status === "negotiating" : row.status === filter));
  const current = rows.find((row) => row.id === open);
  if (current) return <ProposalDetail row={current} onBack={() => { setOpen(null); void load(); }} onChange={() => void load()} />;

  return (
    <div>
      <div className="admin-toolbar">
        <h1>Propuestas de socios</h1>
        <button type="button" className="admin-action-link" onClick={() => void load()}><RefreshCw size={15} /> Actualizar</button>
      </div>
      <p className="muted">Ofertas que los socios envían desde su panel. Nada se publica hasta que lo aceptes aquí.</p>
      {message && <p className="form-message">{message}</p>}
      <div className="admin-filter-chips">
        {FILTERS.map((item) => <button key={item.id} className={`chip ${filter === item.id ? "active" : ""}`} onClick={() => setFilter(item.id)}>{item.label} ({rows.filter((row) => (item.id === "all" ? true : item.id === "open" ? row.status === "sent" || row.status === "negotiating" : row.status === item.id)).length})</button>)}
      </div>
      {visible.length === 0 ? <p className="muted">No hay propuestas en esta lista.</p> : (
        <div className="admin-table">
          {visible.map((row) => {
            const cheapest = Math.min(...row.partner_proposal_items.map((item) => item.offered_price_minor));
            return (
              <button key={row.id} className="admin-row proposal-row" onClick={() => setOpen(row.id)}>
                <span><strong>{row.partner_listings?.name ?? "—"}</strong><small>{row.providers?.trade_name} · {row.partner_listings ? KIND_LABELS[row.partner_listings.kind] : ""}{row.partner_listings?.city_text ? ` · ${row.partner_listings.city_text}` : ""}</small></span>
                <span>{Number.isFinite(cheapest) ? `Desde ${formatBs(cheapest)}` : "—"}</span>
                <span className={`partner-chip ${row.status === "accepted" ? "ok" : row.status === "rejected" ? "no" : row.status === "negotiating" ? "talk" : row.status === "withdrawn" ? "draft" : "wait"}`}>{PROPOSAL_STATUS[row.status]}</span>
                <small>{date(row.created_at)}</small>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ProposalDetail({ row, onBack, onChange }: { row: Row; onBack: () => void; onChange: () => void }) {
  const [listing, setListing] = useState<PartnerListing | null>(null);
  const [units, setUnits] = useState<PartnerUnit[]>([]);
  const [media, setMedia] = useState<PartnerMedia[]>([]);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [destinations, setDestinations] = useState<{ id: string; name: string }[]>([]);
  const [reply, setReply] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [result, setResult] = useState("");
  const [busy, setBusy] = useState(false);
  const items = row.partner_proposal_items;
  const cheapestOffered = Math.min(...items.map((item) => item.offered_price_minor));
  const cheapestRegular = Math.min(...items.filter((item) => item.offered_price_minor === cheapestOffered).map((item) => item.regular_price_minor));
  const [pub, setPub] = useState({ title: row.partner_listings?.name ?? "", destinationId: "", original: minorToInput(cheapestRegular), promo: minorToInput(cheapestOffered) });

  useEffect(() => {
    if (!supabase) return;
    const client = supabase;
    void (async () => {
      const [l, u, m, d] = await Promise.all([
        client.from("partner_listings").select(LISTING_SELECT).eq("id", row.listing_id).single(),
        client.from("partner_units").select("*").eq("listing_id", row.listing_id).order("floor").order("sort_order"),
        client.from("partner_media").select("*").eq("listing_id", row.listing_id).order("sort_order"),
        client.from("destinations").select("id,name").eq("kind", "city").not("slug", "like", "%-destination").order("name")
      ]);
      const listingData = l.data as PartnerListing | null;
      setListing(listingData);
      setUnits((u.data ?? []) as PartnerUnit[]);
      const mediaRows = (m.data ?? []) as PartnerMedia[];
      setMedia(mediaRows);
      setDestinations((d.data ?? []) as { id: string; name: string }[]);
      if (listingData?.destination_id) setPub((current) => ({ ...current, destinationId: listingData.destination_id ?? "" }));
      setUrls(await signedUrls(client, mediaRows.map((item) => item.storage_path)));
    })();
  }, [row.listing_id]);

  // General photos first, then each room's photos, in the order the partner uploaded them.
  const orderedMedia = useMemo(() => [...media].sort((a, b) => Number(Boolean(a.unit_id)) - Number(Boolean(b.unit_id)) || a.sort_order - b.sort_order), [media]);
  const open = row.status === "sent" || row.status === "negotiating";

  async function decide(decision: "negotiating" | "rejected") {
    if (!supabase) return;
    if (decision === "rejected" && !window.confirm("¿Rechazar esta propuesta? El socio verá tu mensaje y podrá enviar otra.")) return;
    setBusy(true);
    const { error } = await supabase.rpc("decide_partner_proposal", { p_proposal_id: row.id, p_decision: decision, p_reply: reply.trim() });
    setBusy(false);
    if (error) { setResult(error.message); return; }
    setReply("");
    onChange();
    onBack();
  }

  async function publish() {
    if (!supabase || !listing) return;
    const original = inputToMinor(pub.original);
    const promo = inputToMinor(pub.promo);
    if (!pub.destinationId) { setResult("Elige el destino (ciudad) de la oferta."); return; }
    if (!original || !promo || promo > original) { setResult("Revisa los precios: el precio Tripya no puede ser mayor que el habitual."); return; }
    setBusy(true); setResult("Copiando fotos y publicando...");
    // Photos are private until now: copy them to the public bucket for the offer.
    const copied: { unit_id: string | null; path: string; url: string }[] = [];
    for (const item of orderedMedia) {
      const target = `partners/${listing.id}/${item.storage_path.split("/").slice(2).join("/")}`;
      const { error } = await supabase.storage.from(PARTNER_BUCKET).copy(item.storage_path, target, { destinationBucket: "offer-media" });
      if (error && !error.message.toLowerCase().includes("exists")) continue;
      copied.push({ unit_id: item.unit_id, path: target, url: supabase.storage.from("offer-media").getPublicUrl(target).data.publicUrl });
    }
    const { data, error } = await supabase.rpc("publish_partner_proposal", {
      p_proposal_id: row.id, p_destination_id: pub.destinationId, p_slug: slugify(pub.title), p_title: pub.title.trim(), p_original_minor: original, p_promo_minor: promo, p_media: copied
    });
    setBusy(false);
    if (error) { setResult(`No se pudo publicar: ${error.message}`); return; }
    setResult(`Publicada: /es/ofertas/${String(data)}. Puedes pulirla en la pestaña «Ofertas».`);
    onChange();
  }

  if (!listing) return <p className="muted">Cargando propuesta...</p>;
  const floors = [...new Set(units.map((unit) => unit.floor))].sort((a, b) => b - a);

  return (
    <div className="proposal-detail">
      <button className="admin-action-link" onClick={onBack}><ArrowLeft size={15} /> Propuestas</button>
      <div className="admin-toolbar">
        <h1>{listing.name}</h1>
        <span className={`partner-chip ${row.status === "accepted" ? "ok" : row.status === "rejected" ? "no" : row.status === "negotiating" ? "talk" : "wait"}`}>{PROPOSAL_STATUS[row.status]}</span>
      </div>
      <p className="muted">{row.providers?.trade_name} · {KIND_LABELS[listing.kind]} · {listing.city_text ?? "Sin ciudad"}{listing.address ? ` · ${listing.address}` : ""} · enviada el {date(row.created_at)}</p>

      <div className="proposal-layout">
        <div>
          <section className="admin-panel-card">
            <h2>Precios propuestos</h2>
            <ul className="proposal-items">
              {items.map((item) => (
                <li key={item.id}><span>{item.room_type ? `Habitación ${item.room_type}` : listing.name} <small>({item.pricing_unit === "per_night" ? "noche" : item.pricing_unit === "per_person" ? "persona" : "estadía"})</small></span><s>{formatBs(item.regular_price_minor)}</s><b>{formatBs(item.offered_price_minor)}</b><small>-{Math.round((1 - item.offered_price_minor / item.regular_price_minor) * 100)}%</small></li>
              ))}
            </ul>
            {(row.valid_from || row.valid_to) && <p><b>Fechas:</b> {row.valid_from ?? "—"} → {row.valid_to ?? "—"}</p>}
            {row.benefits && <p><b>Beneficios para clientes:</b> {row.benefits.split("\n").join(" · ")}</p>}
            {row.notes && <p><b>Notas del socio:</b> {row.notes}</p>}
          </section>

          <section className="admin-panel-card">
            <h2>El alojamiento</h2>
            {listing.description && <p className="prose">{listing.description}</p>}
            {listing.amenities.length > 0 && <p><b>Servicios:</b> {listing.amenities.filter((item): item is Amenity => AMENITIES.includes(item as Amenity)).map((item) => es.amenities[item]).join(" · ")}</p>}
            {(listing.check_in_time || listing.check_out_time) && <p><b>Check-in / out:</b> {listing.check_in_time ?? "—"} / {listing.check_out_time ?? "—"}</p>}
            {listing.rules && <p><b>Reglas:</b> {listing.rules}</p>}
            {listing.includes.length > 0 && <p><b>Incluye:</b> {listing.includes.join(" · ")}</p>}
            {listing.itinerary.length > 0 && <ol>{listing.itinerary.map((day, index) => <li key={index}><b>{day.title}</b> {day.description}</li>)}</ol>}
            {listing.latitude !== null && listing.longitude !== null && <a className="map-link" href={`https://www.google.com/maps/search/?api=1&query=${listing.latitude},${listing.longitude}`} target="_blank" rel="noreferrer">Ver ubicación <ExternalLink size={13} /></a>}
          </section>

          {units.length > 0 && listing.kind === "hotel" && (
            <section className="admin-panel-card">
              <h2>Habitaciones ({units.length})</h2>
              {floors.map((floor) => (
                <div key={floor} className="proposal-floor">
                  <strong>Piso {floor}</strong>
                  <ul>{units.filter((unit) => unit.floor === floor).map((unit) => <li key={unit.id}><b>{unit.label}</b> {unit.room_type || "sin tipo"}{unit.max_guests ? ` · ${unit.max_guests} pers.` : ""}{unit.beds ? ` · ${unit.beds}` : ""}{unit.features.length ? ` · ${unit.features.join(", ")}` : ""} · {media.filter((item) => item.unit_id === unit.id).length} fotos</li>)}</ul>
                </div>
              ))}
            </section>
          )}

          <section className="admin-panel-card">
            <h2>Fotos ({media.length}) <small className="muted">privadas hasta publicar</small></h2>
            <div className="partner-photo-grid">
              {orderedMedia.map((item) => <figure key={item.id}>{urls[item.storage_path] && <Image src={urls[item.storage_path]} alt="" fill sizes="160px" unoptimized />}{item.unit_id && <figcaption>{units.find((unit) => unit.id === item.unit_id)?.label}</figcaption>}</figure>)}
            </div>
          </section>
        </div>

        <aside>
          {open && (
            <section className="admin-panel-card proposal-actions">
              <h2>Responder</h2>
              <label className="partner-field">Mensaje para el socio (opcional)<textarea rows={3} value={reply} onChange={(event) => setReply(event.target.value)} placeholder="Ej. ¿Podrías llegar a Bs 300 la doble?" /></label>
              <div className="partner-actions">
                <button className="ghost-button outlined" disabled={busy} onClick={() => void decide("negotiating")}><MessageCircle size={15} /> Negociar</button>
                <button className="ghost-button outlined danger" disabled={busy} onClick={() => void decide("rejected")}><X size={15} /> Rechazar</button>
              </div>
              <button className="dark-button form-button" disabled={busy} onClick={() => setPublishing(!publishing)}><Check size={16} /> Aceptar y publicar</button>
              {publishing && (
                <div className="publish-form">
                  <label className="partner-field">Título en Tripya<input value={pub.title} onChange={(event) => setPub({ ...pub, title: event.target.value })} /></label>
                  <label className="partner-field">Destino<select value={pub.destinationId} onChange={(event) => setPub({ ...pub, destinationId: event.target.value })}><option value="">Elegir...</option>{destinations.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>{!listing.destination_id && listing.city_text && <small>El socio indicó: {listing.city_text}. Créala en «Destinos» si no existe.</small>}</label>
                  <div className="partner-grid">
                    <label className="partner-field">Precio habitual (Bs)<input inputMode="decimal" value={pub.original} onChange={(event) => setPub({ ...pub, original: event.target.value })} /></label>
                    <label className="partner-field">Precio Tripya (Bs)<input inputMode="decimal" value={pub.promo} onChange={(event) => setPub({ ...pub, promo: event.target.value })} /></label>
                  </div>
                  <small className="muted">{items.length > 1 ? "Es el precio del tipo de habitación más barato; las demás se suman como suplemento según lo ofertado." : "Prellenado con la oferta del socio."}</small>
                  <button className="dark-button form-button" disabled={busy} onClick={() => void publish()}>Confirmar y publicar en Tripya</button>
                </div>
              )}
            </section>
          )}
          {result && <p className="admin-notice">{result}</p>}
          <section className="admin-panel-card">
            <h2>Chat con el socio</h2>
            <ProposalThread proposalId={row.id} role="tripya" partnerName={row.providers?.trade_name ?? "Socio"} />
          </section>
        </aside>
      </div>
    </div>
  );
}
