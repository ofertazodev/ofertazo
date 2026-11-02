"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { ArrowLeft, ArrowRight, Check, Lock, Plus, Save, Trash2, Undo2 } from "lucide-react";
import { es } from "@/i18n/dictionaries/es";
import { AMENITIES, type Amenity } from "@/lib/listing";
import {
  KIND_LABELS, LISTING_SELECT, LISTING_STATUS, PROPOSAL_SELECT, PROPOSAL_STATUS, formatBs, isEditable, partnerError,
  type PartnerListing, type PartnerMedia, type PartnerProfile, type PartnerProposal, type PartnerUnit
} from "@/lib/partner";
import { supabase } from "@/lib/supabase-browser";
import { LlamaLoader } from "@/components/site/TripyaLogo";
import { HotelBuilder, UnitForm } from "./HotelBuilder";
import { NegotiationModal } from "./NegotiationModal";
import { PartnerLlama } from "./PartnerLlama";
import { PhotoUploader } from "./PhotoUploader";
import { ProposalThread } from "./ProposalThread";

const LocationPicker = dynamic(() => import("@/components/LocationPicker"), { ssr: false });

type Destination = { id: string; name: string };
const PROPERTY_OPTIONS = ["hotel", "boutique_hotel", "hostel", "ecolodge", "apartment", "house_villa", "cabin", "glamping"] as const;
const lines = (value: string) => value.split("\n").map((line) => line.trim()).filter(Boolean);

/** One listing: guided steps (data → rooms/unit/itinerary → photos → offer and negotiation). */
export function ListingEditor({ listingId, partner, onBack }: { listingId: string; partner: PartnerProfile; onBack: () => void }) {
  const [listing, setListing] = useState<PartnerListing | null>(null);
  const [units, setUnits] = useState<PartnerUnit[]>([]);
  const [media, setMedia] = useState<PartnerMedia[]>([]);
  const [proposals, setProposals] = useState<PartnerProposal[]>([]);
  const [step, setStep] = useState(0);

  const load = useCallback(async () => {
    if (!supabase) return;
    const [l, u, m, p] = await Promise.all([
      supabase.from("partner_listings").select(LISTING_SELECT).eq("id", listingId).single(),
      supabase.from("partner_units").select("*").eq("listing_id", listingId).order("floor").order("sort_order"),
      supabase.from("partner_media").select("*").eq("listing_id", listingId).order("sort_order"),
      supabase.from("partner_proposals").select(PROPOSAL_SELECT).eq("listing_id", listingId).order("created_at", { ascending: false })
    ]);
    if (l.data) setListing(l.data as PartnerListing);
    setUnits((u.data ?? []) as PartnerUnit[]);
    setMedia((m.data ?? []) as PartnerMedia[]);
    setProposals((p.data ?? []) as PartnerProposal[]);
  }, [listingId]);

  useEffect(() => { void load(); }, [load]);

  if (!listing) return <LlamaLoader label="Abriendo..." />;
  const editable = isEditable(listing.status);
  const steps = ["Datos", listing.kind === "hotel" ? "Habitaciones" : listing.kind === "apartment" ? "El alojamiento" : "Itinerario", "Fotos", "Oferta"];
  const status = LISTING_STATUS[listing.status];

  return (
    <div className="listing-editor">
      <button className="back-link" onClick={onBack}><ArrowLeft size={16} /> Mis alojamientos</button>
      <div className="listing-editor-head">
        <div><p className="eyebrow warm">{KIND_LABELS[listing.kind]}</p><h1>{listing.name}</h1></div>
        <span className={`partner-chip ${status.tone}`}>{status.label}</span>
      </div>
      {!editable && (
        <div className="partner-locked"><Lock size={18} /><p>{listing.status === "published" ? "Tripya ya publicó esta oferta. Para cambiar algo, escríbenos en el chat de la oferta." : "Tu oferta está en manos del equipo de Tripya. Mientras la revisamos no puedes editar los datos; puedes escribirnos en el chat o retirar la oferta para hacer cambios."}</p></div>
      )}
      <ol className="stepper-bar partner-stepper">
        {steps.map((label, index) => (
          <li key={label} className={index === step ? "current" : index < step ? "done" : ""}>
            <button type="button" onClick={() => setStep(index)}><span>{index < step ? <Check size={13} /> : index + 1}</span>{label}</button>
          </li>
        ))}
      </ol>

      {step === 0 && <DetailsStep listing={listing} editable={editable} onSaved={() => { void load(); setStep(1); }} />}
      {step === 1 && listing.kind === "hotel" && <HotelBuilder listing={listing} units={units} media={media} editable={editable} onChange={() => void load()} />}
      {step === 1 && listing.kind === "apartment" && (
        <>
          <PartnerLlama message={<>Cuéntame cómo es tu alojamiento: cuántas personas entran, las camas y lo que tiene. Luego subimos las fotos de cada ambiente.</>} />
          {units[0] ? <UnitForm unit={units[0]} units={units} listing={listing} media={media} editable={editable} onChange={() => void load()} /> : <LlamaLoader />}
        </>
      )}
      {step === 1 && listing.kind === "package" && <ItineraryStep listing={listing} editable={editable} onSaved={() => { void load(); setStep(2); }} />}
      {step === 2 && (
        <div>
          <PartnerLlama message={listing.kind === "hotel"
            ? <>Sube aquí las fotos generales: fachada, recepción, áreas comunes, piscina... Las de cada habitación se suben tocando la habitación en el paso anterior.</>
            : <>Sube tus mejores fotos: con buena luz y de todos los ambientes. Las fotos son lo primero que miran los viajeros.</>} />
          <PhotoUploader providerId={listing.provider_id} listingId={listing.id} unitId={null} media={media} editable={editable} onChange={() => void load()} />
          <div className="partner-actions"><button className="dark-button" onClick={() => setStep(3)}>Siguiente: mi oferta <ArrowRight size={16} /></button></div>
        </div>
      )}
      {step === 3 && <OfferStep listing={listing} units={units} media={media} proposals={proposals} partner={partner} onChange={() => void load()} />}
    </div>
  );
}

function DetailsStep({ listing, editable, onSaved }: { listing: PartnerListing; editable: boolean; onSaved: () => void }) {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [form, setForm] = useState({
    name: listing.name, destination_id: listing.destination_id ?? "", city_text: listing.city_text ?? "", address: listing.address ?? "",
    latitude: listing.latitude?.toString() ?? "", longitude: listing.longitude?.toString() ?? "", description: listing.description,
    property_type: listing.property_type ?? "", amenities: listing.amenities, check_in_time: listing.check_in_time ?? "", check_out_time: listing.check_out_time ?? "",
    rules: listing.rules, duration_label: listing.duration_label ?? "", includes: listing.includes.join("\n"), excludes: listing.excludes.join("\n")
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => setForm((current) => ({ ...current, [key]: value }));
  const isPackage = listing.kind === "package";

  useEffect(() => {
    void supabase?.from("destinations").select("id,name").eq("kind", "city").eq("is_published", true).not("slug", "like", "%-destination").order("name")
      .then(({ data }) => setDestinations((data ?? []) as Destination[]));
  }, []);

  async function save() {
    if (!supabase) return;
    if (form.name.trim().length < 2) { setError("Escribe el nombre."); return; }
    if (!form.destination_id && !form.city_text.trim()) { setError("Indica la ciudad."); return; }
    setBusy(true); setError("");
    const { error: updateError } = await supabase.from("partner_listings").update({
      name: form.name.trim(), destination_id: form.destination_id || null,
      city_text: (form.destination_id ? destinations.find((item) => item.id === form.destination_id)?.name : form.city_text.trim()) || null,
      address: form.address.trim() || null, latitude: form.latitude ? Number(form.latitude) : null, longitude: form.longitude ? Number(form.longitude) : null,
      description: form.description.trim(), property_type: isPackage ? null : form.property_type || null, amenities: form.amenities,
      check_in_time: form.check_in_time.trim() || null, check_out_time: form.check_out_time.trim() || null, rules: form.rules.trim(),
      duration_label: form.duration_label.trim() || null, includes: lines(form.includes), excludes: lines(form.excludes)
    }).eq("id", listing.id);
    setBusy(false);
    if (updateError) { setError(partnerError(updateError.message)); return; }
    onSaved();
  }

  return (
    <div className="partner-step">
      <PartnerLlama message={isPackage
        ? <>Empecemos por lo básico: dónde es, cuánto dura y qué incluye tu paquete.</>
        : <>Empecemos por lo básico: dónde está tu alojamiento y qué lo hace especial. Marca su ubicación en el mapa.</>} />
      <fieldset disabled={!editable}>
        <div className="partner-grid">
          <label className="partner-field">Nombre<input value={form.name} maxLength={120} onChange={(event) => set("name", event.target.value)} /></label>
          <label className="partner-field">Ciudad
            <select value={form.destination_id} onChange={(event) => set("destination_id", event.target.value)}>
              <option value="">Otra ciudad...</option>
              {destinations.map((destination) => <option key={destination.id} value={destination.id}>{destination.name}</option>)}
            </select>
          </label>
          {!form.destination_id && <label className="partner-field">¿Qué ciudad?<input value={form.city_text} maxLength={80} onChange={(event) => set("city_text", event.target.value)} /></label>}
          {!isPackage && (
            <label className="partner-field">Tipo de alojamiento
              <select value={form.property_type} onChange={(event) => set("property_type", event.target.value)}>
                <option value="">—</option>
                {PROPERTY_OPTIONS.map((type) => <option key={type} value={type}>{es.propertyTypes[type]}</option>)}
              </select>
            </label>
          )}
          {isPackage && <label className="partner-field">Duración<input value={form.duration_label} maxLength={120} onChange={(event) => set("duration_label", event.target.value)} placeholder="3 días / 2 noches" /></label>}
        </div>
        <label className="partner-field">Descripción<textarea rows={5} maxLength={6000} value={form.description} onChange={(event) => set("description", event.target.value)} placeholder="Cuéntale al viajero por qué le va a encantar..." /></label>

        {!isPackage && (
          <>
            <p className="field-label">Servicios</p>
            <div className="partner-chips">
              {AMENITIES.map((amenity: Amenity) => {
                const active = form.amenities.includes(amenity);
                return <button type="button" key={amenity} className={`chip ${active ? "active" : ""}`} onClick={() => set("amenities", active ? form.amenities.filter((item) => item !== amenity) : [...form.amenities, amenity])}>{es.amenities[amenity]}</button>;
              })}
            </div>
            <div className="partner-grid">
              <label className="partner-field">Check-in<input value={form.check_in_time} maxLength={20} onChange={(event) => set("check_in_time", event.target.value)} placeholder="14:00" /></label>
              <label className="partner-field">Check-out<input value={form.check_out_time} maxLength={20} onChange={(event) => set("check_out_time", event.target.value)} placeholder="11:00" /></label>
            </div>
          </>
        )}
        {isPackage && (
          <div className="partner-grid">
            <label className="partner-field">Qué incluye (uno por línea)<textarea rows={4} value={form.includes} onChange={(event) => set("includes", event.target.value)} placeholder={"Transporte\nGuía\nAlmuerzo"} /></label>
            <label className="partner-field">Qué no incluye (uno por línea)<textarea rows={4} value={form.excludes} onChange={(event) => set("excludes", event.target.value)} placeholder={"Entradas\nPropinas"} /></label>
          </div>
        )}
        <label className="partner-field">Reglas y condiciones<textarea rows={3} maxLength={3000} value={form.rules} onChange={(event) => set("rules", event.target.value)} placeholder="Mascotas, horarios, niños, cancelación..." /></label>
        <label className="partner-field">Dirección o punto de encuentro<input value={form.address} maxLength={300} onChange={(event) => set("address", event.target.value)} /></label>
        <div className="map-picker-field"><LocationPicker latitude={form.latitude} longitude={form.longitude} onChange={(latitude, longitude) => setForm((current) => ({ ...current, latitude, longitude }))} /></div>
      </fieldset>
      {error && <p className="form-message">{error}</p>}
      {editable && <div className="partner-actions"><button className="dark-button" disabled={busy} onClick={() => void save()}><Save size={16} /> Guardar y seguir</button></div>}
    </div>
  );
}

function ItineraryStep({ listing, editable, onSaved }: { listing: PartnerListing; editable: boolean; onSaved: () => void }) {
  const [days, setDays] = useState(listing.itinerary.length ? listing.itinerary : [{ title: "", description: "" }]);
  const [error, setError] = useState("");

  async function save() {
    if (!supabase) return;
    const clean = days.filter((day) => day.title.trim()).map((day) => ({ title: day.title.trim().slice(0, 160), description: day.description.trim().slice(0, 2000) }));
    const { error: updateError } = await supabase.from("partner_listings").update({ itinerary: clean }).eq("id", listing.id);
    if (updateError) { setError(partnerError(updateError.message)); return; }
    onSaved();
  }

  return (
    <div className="partner-step">
      <PartnerLlama message={<>Cuéntanos el recorrido día por día: qué se visita y qué se hace. Así el viajero se imagina el viaje.</>} />
      <fieldset disabled={!editable}>
        {days.map((day, index) => (
          <div className="admin-subcard" key={index}>
            <label className="partner-field">Día {index + 1}<input value={day.title} maxLength={160} onChange={(event) => setDays(days.map((item, i) => (i === index ? { ...item, title: event.target.value } : item)))} placeholder="Salar de Uyuni e Isla Incahuasi" /></label>
            <label className="partner-field">Qué se hace<textarea rows={3} value={day.description} onChange={(event) => setDays(days.map((item, i) => (i === index ? { ...item, description: event.target.value } : item)))} /></label>
            {days.length > 1 && <button type="button" className="ghost-button outlined" onClick={() => setDays(days.filter((_, i) => i !== index))}><Trash2 size={15} /> Quitar día</button>}
          </div>
        ))}
        <button type="button" className="ghost-button outlined" onClick={() => setDays([...days, { title: "", description: "" }])}><Plus size={15} /> Añadir día</button>
      </fieldset>
      {error && <p className="form-message">{error}</p>}
      {editable && <div className="partner-actions"><button className="dark-button" onClick={() => void save()}><Save size={16} /> Guardar y seguir</button></div>}
    </div>
  );
}

function OfferStep({ listing, units, media, proposals, partner, onChange }: { listing: PartnerListing; units: PartnerUnit[]; media: PartnerMedia[]; proposals: PartnerProposal[]; partner: PartnerProfile; onChange: () => void }) {
  const [negotiating, setNegotiating] = useState(false);
  const [error, setError] = useState("");
  const current = proposals.find((proposal) => proposal.status === "sent" || proposal.status === "negotiating") ?? proposals[0] ?? null;
  const canSend = ["draft", "rejected", "negotiating"].includes(listing.status);
  const missing = [
    media.length === 0 && "al menos una foto",
    listing.kind === "hotel" && !units.some((unit) => unit.room_type) && "el tipo de tus habitaciones",
    !listing.description.trim() && "la descripción"
  ].filter(Boolean) as string[];

  async function withdraw() {
    if (!supabase || !current || !window.confirm("¿Retirar tu oferta? Podrás editar los datos y enviarla de nuevo.")) return;
    const { error: rpcError } = await supabase.rpc("withdraw_partner_proposal", { p_proposal_id: current.id });
    if (rpcError) { setError(partnerError(rpcError.message)); return; }
    onChange();
  }

  return (
    <div className="partner-step">
      {listing.status === "draft" || listing.status === "rejected" ? (
        <PartnerLlama variant="business" message={missing.length
          ? <>Antes de negociar me falta {missing.join(", ")}. Complétalo y vuelve aquí.</>
          : <>¡Todo listo! Cuando quieras, envíanos tu mejor oferta y negociamos.</>} />
      ) : listing.status === "negotiating" ? (
        <PartnerLlama variant="business" message={<>Estamos negociando tu oferta. Respóndenos en el chat o envía una nueva propuesta.</>} />
      ) : listing.status === "published" ? (
        <PartnerLlama message={<><strong>¡Felicidades!</strong> Tripya publicó tu oferta.</>} />
      ) : (
        <PartnerLlama variant="business" message={<>Recibimos tu oferta y la estamos revisando. Te respondemos aquí mismo.</>} />
      )}

      {canSend && (
        <button className="dark-button cta negotiate-button" disabled={missing.length > 0} onClick={() => setNegotiating(true)}>
          {listing.status === "negotiating" ? "Enviar una nueva propuesta" : "Enviar mi oferta a Tripya"} <ArrowRight size={17} />
        </button>
      )}

      {current && (
        <div className="proposal-card">
          <div className="proposal-card-head">
            <strong>Tu última oferta</strong>
            <span className={`partner-chip ${current.status === "accepted" ? "ok" : current.status === "rejected" ? "no" : current.status === "negotiating" ? "talk" : "wait"}`}>{PROPOSAL_STATUS[current.status]}</span>
          </div>
          <ul className="proposal-items">
            {current.partner_proposal_items.map((item) => (
              <li key={item.id ?? item.room_type ?? "item"}><span>{item.room_type ? `Habitación ${item.room_type}` : listing.name}</span><s>{formatBs(item.regular_price_minor)}</s><b>{formatBs(item.offered_price_minor)}</b></li>
            ))}
          </ul>
          {(current.valid_from || current.valid_to) && <p className="muted">Fechas: {current.valid_from ?? "—"} → {current.valid_to ?? "—"}</p>}
          {current.benefits && <p className="muted">Beneficios: {current.benefits.split("\n").join(" · ")}</p>}
          {current.admin_reply && <p className="proposal-reply">Tripya: {current.admin_reply}</p>}
          {(current.status === "sent" || current.status === "negotiating") && <button className="ghost-button outlined" onClick={() => void withdraw()}><Undo2 size={15} /> Retirar oferta</button>}
          {error && <p className="form-message">{error}</p>}
          <p className="field-label">Chat con Tripya</p>
          <ProposalThread proposalId={current.id} role="partner" partnerName={partner.trade_name} canWrite={current.status !== "withdrawn"} />
        </div>
      )}
      {negotiating && <NegotiationModal listing={listing} units={units} onClose={() => setNegotiating(false)} onSent={onChange} />}
    </div>
  );
}
