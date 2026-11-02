"use client";

import { useState } from "react";
import { Camera, Check, Copy, DoorOpen, Plus, Save, Trash2 } from "lucide-react";
import { Modal } from "@/components/site/Modal";
import { ROOM_FEATURES, ROOM_TYPES, type PartnerListing, type PartnerMedia, type PartnerUnit } from "@/lib/partner";
import { supabase } from "@/lib/supabase-browser";
import { PartnerLlama } from "./PartnerLlama";
import { PhotoUploader } from "./PhotoUploader";

type Props = { listing: PartnerListing; units: PartnerUnit[]; media: PartnerMedia[]; editable: boolean; onChange: () => void };

const roomLabel = (floor: number, index: number) => `${floor}${String(index).padStart(2, "0")}`;

/** Hotels: floors and rooms drawn as a building; tapping a room opens its data and photos. */
export function HotelBuilder({ listing, units, media, editable, onChange }: Props) {
  const [floors, setFloors] = useState(String(listing.floors || 1));
  const [perFloor, setPerFloor] = useState(String(Math.max(...[1, ...Array.from({ length: listing.floors }, (_, i) => units.filter((unit) => unit.floor === i + 1).length)])));
  const [openUnit, setOpenUnit] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const floorCount = Math.max(listing.floors, ...units.map((unit) => unit.floor), 1);
  const unit = units.find((item) => item.id === openUnit) ?? null;

  async function generate() {
    if (!supabase) return;
    const totalFloors = Math.min(Math.max(Number.parseInt(floors, 10) || 1, 1), 60);
    const rooms = Math.min(Math.max(Number.parseInt(perFloor, 10) || 1, 1), 40);
    setBusy(true); setMessage("");
    await supabase.from("partner_listings").update({ floors: totalFloors }).eq("id", listing.id);
    // Only missing rooms are added: nothing the partner already filled is lost.
    const toAdd: Partial<PartnerUnit>[] = [];
    for (let floor = 1; floor <= totalFloors; floor += 1) {
      const existing = units.filter((item) => item.floor === floor).length;
      for (let index = existing + 1; index <= rooms; index += 1) toAdd.push({ listing_id: listing.id, floor, label: roomLabel(floor, index), sort_order: index });
    }
    if (toAdd.length) {
      const { error } = await supabase.from("partner_units").insert(toAdd);
      if (error) setMessage("No pudimos crear las habitaciones. Inténtalo de nuevo.");
    }
    setBusy(false);
    onChange();
  }

  async function addRoom(floor: number) {
    if (!supabase) return;
    const count = units.filter((item) => item.floor === floor).length;
    await supabase.from("partner_units").insert({ listing_id: listing.id, floor, label: roomLabel(floor, count + 1), sort_order: count + 1 });
    onChange();
  }

  const configured = units.filter((item) => item.room_type).length;
  return (
    <div className="hotel-builder">
      <PartnerLlama message={units.length === 0
        ? <>¿Cuántos pisos tiene tu hotel y cuántas habitaciones hay por piso? Dibujo el edificio y luego tocas cada habitación para cargar sus datos y fotos.</>
        : <>Toca cada habitación para indicar su tipo, capacidad y fotos. Llevas <strong>{configured} de {units.length}</strong> habitaciones listas.</>} />

      {editable && (
        <div className="hotel-setup">
          <label>Pisos<input type="number" min={1} max={60} value={floors} onChange={(event) => setFloors(event.target.value)} /></label>
          <label>Habitaciones por piso<input type="number" min={1} max={40} value={perFloor} onChange={(event) => setPerFloor(event.target.value)} /></label>
          <button type="button" className="dark-button" disabled={busy} onClick={() => void generate()}>{units.length ? "Actualizar edificio" : "Dibujar mi hotel"}</button>
        </div>
      )}
      {message && <p className="form-message">{message}</p>}

      {units.length > 0 && (
        <div className="building" aria-label={`Edificio de ${listing.name}`}>
          <div className="building-roof"><span>{listing.name}</span></div>
          {Array.from({ length: floorCount }, (_, i) => floorCount - i).map((floor) => (
            <div className="building-floor" key={floor}>
              <span className="building-floor-label">Piso {floor}</span>
              <div className="building-rooms">
                {units.filter((item) => item.floor === floor).sort((a, b) => a.sort_order - b.sort_order || a.label.localeCompare(b.label)).map((item) => {
                  const photos = media.filter((photo) => photo.unit_id === item.id).length;
                  return (
                    <button type="button" key={item.id} className={`building-room ${item.room_type ? "ready" : ""}`} onClick={() => setOpenUnit(item.id)}>
                      <span className="building-window" aria-hidden="true" />
                      <strong>{item.label}</strong>
                      <small>{item.room_type || "Sin datos"}</small>
                      {photos > 0 && <span className="building-room-photos"><Camera size={11} /> {photos}</span>}
                      {item.room_type && <span className="building-room-check"><Check size={11} /></span>}
                    </button>
                  );
                })}
                {editable && <button type="button" className="building-room add" onClick={() => void addRoom(floor)} aria-label={`Añadir habitación en el piso ${floor}`}><Plus size={18} /></button>}
              </div>
            </div>
          ))}
          <div className="building-ground"><DoorOpen size={20} /> Recepción</div>
        </div>
      )}

      {unit && (
        <Modal title={`Habitación ${unit.label}`} onClose={() => setOpenUnit(null)} className="unit-modal" closeLabel="Cerrar">
          <p className="modal-kicker">PISO {unit.floor}</p>
          <h2>Habitación {unit.label}</h2>
          <UnitForm unit={unit} units={units} listing={listing} media={media} editable={editable} onChange={onChange} onDeleted={() => setOpenUnit(null)} showLabel />
        </Modal>
      )}
    </div>
  );
}

type UnitFormProps = { unit: PartnerUnit; units: PartnerUnit[]; listing: PartnerListing; media: PartnerMedia[]; editable: boolean; onChange: () => void; onDeleted?: () => void; showLabel?: boolean };

/** Data and photos of one room (hotels) or of the whole place (apartments). */
export function UnitForm({ unit, units, listing, media, editable, onChange, onDeleted, showLabel = false }: UnitFormProps) {
  const [draft, setDraft] = useState({
    label: unit.label, room_type: unit.room_type, max_guests: unit.max_guests?.toString() ?? "", beds: unit.beds ?? "",
    size_m2: unit.size_m2?.toString() ?? "", features: unit.features, description: unit.description
  });
  const [saved, setSaved] = useState("");
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof typeof draft>(key: K, value: (typeof draft)[K]) => { setDraft((current) => ({ ...current, [key]: value })); setSaved(""); };
  const sameType = units.filter((item) => item.id !== unit.id && item.room_type && item.room_type === draft.room_type);
  const values = () => ({
    room_type: draft.room_type.trim().slice(0, 60),
    max_guests: draft.max_guests ? Math.min(Math.max(Number.parseInt(draft.max_guests, 10) || 1, 1), 30) : null,
    beds: draft.beds.trim() || null,
    size_m2: draft.size_m2 ? Math.min(Math.max(Number.parseInt(draft.size_m2, 10) || 1, 1), 2000) : null,
    features: draft.features,
    description: draft.description.trim().slice(0, 1500)
  });

  async function save() {
    if (!supabase) return;
    setBusy(true);
    const { error } = await supabase.from("partner_units").update({ ...values(), label: draft.label.trim().slice(0, 20) || unit.label }).eq("id", unit.id);
    setBusy(false);
    setSaved(error ? "No pudimos guardar." : "Guardado.");
    onChange();
  }

  async function copyToSameType() {
    if (!supabase || sameType.length === 0) return;
    setBusy(true);
    const { error } = await supabase.from("partner_units").update(values()).in("id", sameType.map((item) => item.id));
    setBusy(false);
    setSaved(error ? "No pudimos copiar los datos." : `Datos copiados a ${sameType.length} habitaciones ${draft.room_type}.`);
    onChange();
  }

  async function remove() {
    if (!supabase || !window.confirm(`¿Eliminar la habitación ${unit.label} y sus fotos?`)) return;
    const photos = media.filter((item) => item.unit_id === unit.id).map((item) => item.storage_path);
    await supabase.from("partner_units").delete().eq("id", unit.id);
    if (photos.length) await supabase.storage.from("partner-media").remove(photos);
    onDeleted?.();
    onChange();
  }

  return (
    <div className="unit-form">
      <fieldset disabled={!editable}>
        <div className="partner-grid">
          {showLabel && <label className="partner-field">Número o nombre<input value={draft.label} maxLength={20} onChange={(event) => set("label", event.target.value)} /></label>}
          {showLabel && (
            <label className="partner-field">Tipo de habitación
              <input list="room-types" value={draft.room_type} maxLength={60} onChange={(event) => set("room_type", event.target.value)} placeholder="Doble, suite..." />
              <datalist id="room-types">{ROOM_TYPES.map((type) => <option key={type} value={type} />)}</datalist>
            </label>
          )}
          <label className="partner-field">Capacidad (personas)<input type="number" min={1} max={30} value={draft.max_guests} onChange={(event) => set("max_guests", event.target.value)} /></label>
          <label className="partner-field">Camas<input value={draft.beds} maxLength={120} onChange={(event) => set("beds", event.target.value)} placeholder="1 cama matrimonial" /></label>
          <label className="partner-field">Tamaño (m²)<input type="number" min={1} value={draft.size_m2} onChange={(event) => set("size_m2", event.target.value)} /></label>
        </div>
        <p className="field-label">¿Qué tiene?</p>
        <div className="partner-chips">
          {ROOM_FEATURES.map((feature) => {
            const active = draft.features.includes(feature);
            return <button type="button" key={feature} className={`chip ${active ? "active" : ""}`} onClick={() => set("features", active ? draft.features.filter((item) => item !== feature) : [...draft.features, feature])}>{feature}</button>;
          })}
        </div>
        <label className="partner-field">Descripción corta<textarea rows={3} maxLength={1500} value={draft.description} onChange={(event) => set("description", event.target.value)} placeholder="Lo que hace especial a esta habitación..." /></label>
      </fieldset>
      {editable && (
        <div className="partner-actions">
          {showLabel && <button type="button" className="ghost-button outlined danger" onClick={() => void remove()}><Trash2 size={15} /> Eliminar</button>}
          {showLabel && sameType.length > 0 && <button type="button" className="ghost-button outlined" disabled={busy} onClick={() => void copyToSameType()}><Copy size={15} /> Aplicar a las {sameType.length} otras «{draft.room_type}»</button>}
          <button type="button" className="dark-button" disabled={busy} onClick={() => void save()}><Save size={15} /> Guardar</button>
        </div>
      )}
      {saved && <p className="hint strong">{saved}</p>}
      <p className="field-label">Fotos {showLabel ? "de esta habitación" : "del alojamiento"}</p>
      <PhotoUploader providerId={listing.provider_id} listingId={listing.id} unitId={unit.id} media={media} editable={editable} onChange={onChange} />
    </div>
  );
}
