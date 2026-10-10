"use client";

import { FormEvent, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { ArrowLeft, ImagePlus, MapPin, Plus, Save, Trash2 } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { es } from "@/i18n/dictionaries/es";
import { compressImage } from "@/lib/image";
import { AMENITIES, PROPERTY_TYPES, type Amenity, type PricingUnit, type ProductType } from "@/lib/listing";
import { supabase } from "@/lib/supabase-browser";
import { LlamaLoader } from "@/components/site/TripyaLogo";

const LocationPicker = dynamic(() => import("@/components/LocationPicker"), { ssr: false });

const MAX_IMAGES = 20;

type Media = { id: string; storage_path: string; public_url: string | null; sort_order: number };
type DestinationOption = { id: string; name: string };
type ExtraDraft = { id: string; name: string; price: string };

const emptyForm = {
  title: "", slug: "", type: "accommodation" as ProductType, propertyType: "", destinationId: "", newCity: "",
  description: "", durationLabel: "", includes: "",
  originalPrice: "", promotionalPrice: "", pricingUnit: "per_night" as PricingUnit,
  flash: false, startsAt: "", endsAt: "", maxUnits: "", featured: false, published: true,
  capacityMax: "", minNights: "1", maxNights: "", checkInTime: "", checkOutTime: "", stayFrom: "", stayTo: "",
  bookingConditions: "", cancellationPolicy: "",
  address: "", latitude: "", longitude: "",
  sample: false, verified: false, verificationSummary: "", googleRating: "", googleReviewCount: "", googleMapsUrl: "",
  providerName: "", providerEmail: "", providerPhone: "",
  enTitle: "", enDescription: "", frTitle: "", frDescription: ""
};
type FormState = typeof emptyForm;

// --- conversions (prices are integers in minor units; never parse money as float) ---
function minorToInput(minor: number) {
  const cents = minor % 100;
  return `${Math.floor(minor / 100)}${cents ? `.${String(cents).padStart(2, "0")}` : ""}`;
}
function inputToMinor(value: string): number | null {
  const normalized = value.trim().replace(",", ".");
  const match = /^(\d{1,9})(?:\.(\d{1,2}))?$/.exec(normalized);
  if (!match) return null;
  return Number(match[1]) * 100 + Number((match[2] ?? "").padEnd(2, "0"));
}
function isoToLocalInput(iso: string | null) {
  if (!iso) return "";
  const date = new Date(iso);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}
function slugify(text: string) {
  return text.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 70);
}
const intOrNull = (value: string) => (value.trim() === "" ? null : Number.parseInt(value, 10));
const textOrNull = (value: string) => value.trim() || null;

type Props = { user: User; offerId: string | null; onClose: (savedMessage?: string) => void };

export function OfferForm({ user, offerId, onClose }: Props) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [extras, setExtras] = useState<ExtraDraft[]>([]);
  const [destinations, setDestinations] = useState<DestinationOption[]>([]);
  const [media, setMedia] = useState<Media[]>([]);
  const [removedMedia, setRemovedMedia] = useState<Media[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [ids, setIds] = useState<{ productId: string | null; providerId: string | null; verifiedAt: string | null; wasSample: boolean }>({ productId: null, providerId: null, verifiedAt: null, wasSample: false });
  const [loading, setLoading] = useState(Boolean(offerId));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((current) => ({ ...current, [key]: value }));

  useEffect(() => {
    if (!supabase) return;
    const client = supabase;
    void client.from("destinations").select("id,name").eq("kind", "city").eq("is_published", true).not("slug", "like", "%-destination").order("sort_order").then(({ data }) => setDestinations((data ?? []) as DestinationOption[]));
    if (!offerId) return;
    void (async () => {
      const { data, error: loadError } = await client
        .from("offers")
        .select("id,kind,title,original_price_minor,promotional_price_minor,starts_at,ends_at,max_units,featured,is_published,product:products(*,provider:providers(id,trade_name,email,phone),product_media(id,storage_path,public_url,sort_order))")
        .eq("id", offerId)
        .single();
      setLoading(false);
      if (loadError || !data) { setError(loadError?.message ?? "No se encontró la oferta."); return; }
      // Shape defined by the select above.
      const offer = data as unknown as {
        kind: "normal" | "flash"; title: string; original_price_minor: number; promotional_price_minor: number; starts_at: string | null; ends_at: string | null; max_units: number | null; featured: boolean; is_published: boolean;
        product: Record<string, unknown> & { id: string; provider: { id: string; trade_name: string; email: string; phone: string | null } | null; product_media: Media[] };
      };
      const p = offer.product;
      const tr = (p.translations ?? {}) as Record<string, { title?: string; description?: string }>;
      setIds({ productId: p.id, providerId: p.provider?.id ?? null, verifiedAt: (p.verified_at as string | null) ?? null, wasSample: Boolean(p.is_sample) });
      setForm({
        title: String(p.title ?? offer.title), slug: String(p.slug ?? ""), type: p.type as ProductType, propertyType: String(p.property_type ?? ""), destinationId: String(p.destination_id ?? ""), newCity: "",
        description: String(p.description ?? ""), durationLabel: String(p.duration_label ?? ""), includes: ((p.includes as string[] | null) ?? []).join(", "),
        originalPrice: minorToInput(offer.original_price_minor), promotionalPrice: minorToInput(offer.promotional_price_minor), pricingUnit: (p.pricing_unit as PricingUnit) ?? "per_stay",
        flash: offer.kind === "flash", startsAt: isoToLocalInput(offer.starts_at), endsAt: isoToLocalInput(offer.ends_at), maxUnits: offer.max_units?.toString() ?? "", featured: offer.featured, published: offer.is_published,
        capacityMax: p.capacity_max?.toString() ?? "", minNights: String(p.min_nights ?? 1), maxNights: p.max_nights?.toString() ?? "", checkInTime: String(p.check_in_time ?? ""), checkOutTime: String(p.check_out_time ?? ""),
        stayFrom: String(p.stay_available_from ?? ""), stayTo: String(p.stay_available_to ?? ""),
        bookingConditions: String(p.booking_conditions ?? ""), cancellationPolicy: String(p.cancellation_policy ?? ""),
        address: String(p.address ?? ""), latitude: p.latitude?.toString() ?? "", longitude: p.longitude?.toString() ?? "",
        sample: Boolean(p.is_sample), verified: Boolean(p.verified_at), verificationSummary: String(p.verification_summary ?? ""), googleRating: p.google_rating?.toString() ?? "", googleReviewCount: p.google_review_count?.toString() ?? "", googleMapsUrl: String(p.google_maps_url ?? ""),
        providerName: p.provider?.trade_name ?? "", providerEmail: p.provider?.email ?? "", providerPhone: p.provider?.phone ?? "",
        enTitle: tr.en?.title ?? "", enDescription: tr.en?.description ?? "", frTitle: tr.fr?.title ?? "", frDescription: tr.fr?.description ?? ""
      });
      setAmenities(((p.amenities as string[] | null) ?? []).filter((item): item is Amenity => AMENITIES.includes(item as Amenity)));
      setExtras(((p.extras as { id: string; name: string; price_minor: number }[] | null) ?? []).map((extra) => ({ id: extra.id, name: extra.name, price: minorToInput(extra.price_minor) })));
      setMedia([...(p.product_media ?? [])].sort((a, b) => a.sort_order - b.sort_order));
    })();
  }, [offerId]);

  async function addFiles(files: FileList | null) {
    const available = MAX_IMAGES - media.length - newFiles.length;
    const selected = Array.from(files ?? []).slice(0, Math.max(available, 0));
    const compressed = await Promise.all(selected.map((file) => compressImage(file)));
    setNewFiles((current) => [...current, ...compressed]);
  }

  function validate(): string | null {
    const original = inputToMinor(form.originalPrice);
    const promo = inputToMinor(form.promotionalPrice);
    if (form.title.trim().length < 3) return "Escribe un título.";
    if (original === null || promo === null) return "Los precios deben ser números (ej. 450 o 450.50).";
    if (promo > original) return "El precio Tripya no puede ser mayor que el precio habitual.";
    if (!form.destinationId && !form.newCity.trim()) return "Elige el destino (ciudad).";
    if (form.flash && !form.endsAt) return "Una Oferta Flash necesita fecha de fin para mostrar el contador.";
    if (form.startsAt && form.endsAt && new Date(form.endsAt) <= new Date(form.startsAt)) return "La fecha de fin de la oferta debe ser posterior al inicio.";
    if (form.stayFrom && form.stayTo && form.stayTo <= form.stayFrom) return "Las fechas disponibles no son válidas.";
    if (form.maxNights && Number(form.maxNights) < Number(form.minNights || 1)) return "Las noches máximas deben ser ≥ que las mínimas.";
    if (form.type === "accommodation" && !form.propertyType) return "Elige el tipo de alojamiento (se usa en los filtros de búsqueda).";
    if (form.type === "accommodation" && (!form.latitude || !form.longitude)) return "Para un alojamiento marca la ubicación en el mapa.";
    if (form.googleRating && (Number(form.googleRating) < 0 || Number(form.googleRating) > 5)) return "La valoración de Google debe estar entre 0 y 5.";
    if (extras.some((extra) => !extra.name.trim() || inputToMinor(extra.price) === null)) return "Revisa los servicios adicionales (nombre y precio).";
    if (media.length + newFiles.length === 0) return "Sube al menos una foto.";
    return null;
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!supabase) return;
    const problem = validate();
    if (problem) { setError(problem); window.scrollTo({ top: 0, behavior: "smooth" }); return; }
    setSaving(true); setError("");
    try {
      // 1. Destination (existing city or a new one)
      let destinationId = form.destinationId;
      if (!destinationId) {
        const created = await supabase.from("destinations").insert({ country_code: "BO", name: form.newCity.trim(), slug: slugify(form.newCity), kind: "city", is_published: true }).select("id").single();
        if (created.error) throw created.error;
        destinationId = created.data.id;
      }

      // 2. Provider (the property / business behind the offer)
      const providerName = form.providerName.trim() || form.title.trim();
      const providerPayload = { trade_name: providerName, legal_name: providerName, email: form.providerEmail.trim() || user.email || "", phone: textOrNull(form.providerPhone) };
      let providerId = ids.providerId;
      if (providerId) {
        const updated = await supabase.from("providers").update(providerPayload).eq("id", providerId);
        if (updated.error) throw updated.error;
      } else {
        const created = await supabase.from("providers").insert({ ...providerPayload, owner_id: user.id, country_code: "BO", status: "approved" }).select("id").single();
        if (created.error) throw created.error;
        providerId = created.data.id;
      }

      // 3. Product
      let slug = slugify(form.slug || form.title);
      if (!ids.productId) {
        const taken = await supabase.from("products").select("id").eq("slug", slug).maybeSingle();
        if (taken.data) slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
      }
      const translations = Object.fromEntries(
        [["en", form.enTitle, form.enDescription], ["fr", form.frTitle, form.frDescription]]
          .filter(([, title, description]) => title.trim() || description.trim())
          .map(([locale, title, description]) => [locale, { ...(title.trim() ? { title: title.trim() } : {}), ...(description.trim() ? { description: description.trim() } : {}) }])
      );
      const productPayload = {
        provider_id: providerId,
        destination_id: destinationId,
        type: form.type,
        slug,
        title: form.title.trim(),
        description: form.description.trim(),
        currency_code: "BOB",
        base_price_minor: inputToMinor(form.promotionalPrice),
        duration_label: textOrNull(form.durationLabel),
        includes: form.includes.split(",").map((item) => item.trim()).filter(Boolean),
        property_type: form.type === "accommodation" ? textOrNull(form.propertyType) : null,
        pricing_unit: form.pricingUnit,
        capacity_max: intOrNull(form.capacityMax),
        min_nights: intOrNull(form.minNights) ?? 1,
        max_nights: intOrNull(form.maxNights),
        amenities,
        extras: extras.map((extra) => ({ id: slugify(extra.name) || extra.id, name: extra.name.trim(), price_minor: inputToMinor(extra.price) })),
        booking_conditions: form.bookingConditions.trim(),
        cancellation_policy: form.cancellationPolicy.trim(),
        check_in_time: textOrNull(form.checkInTime),
        check_out_time: textOrNull(form.checkOutTime),
        stay_available_from: textOrNull(form.stayFrom),
        stay_available_to: textOrNull(form.stayTo),
        address: textOrNull(form.address),
        latitude: form.latitude ? Number(form.latitude) : null,
        longitude: form.longitude ? Number(form.longitude) : null,
        verified_at: form.verified ? ids.verifiedAt ?? new Date().toISOString() : null,
        verification_summary: textOrNull(form.verificationSummary),
        google_rating: form.googleRating ? Number(form.googleRating) : null,
        google_review_count: intOrNull(form.googleReviewCount),
        google_maps_url: textOrNull(form.googleMapsUrl),
        translations,
        is_published: form.published,
        // Only sent when editing a sample, so saving never depends on the is_sample migration.
        ...(ids.wasSample ? { is_sample: form.sample } : {}),
        updated_at: new Date().toISOString()
      };
      let productId = ids.productId;
      if (productId) {
        const updated = await supabase.from("products").update(productPayload).eq("id", productId);
        if (updated.error) throw updated.error;
      } else {
        const created = await supabase.from("products").insert(productPayload).select("id").single();
        if (created.error) throw created.error;
        productId = created.data.id;
      }

      // 4. Offer
      const offerPayload = {
        product_id: productId,
        kind: form.flash ? "flash" : "normal",
        title: form.title.trim(),
        original_price_minor: inputToMinor(form.originalPrice),
        promotional_price_minor: inputToMinor(form.promotionalPrice),
        currency_code: "BOB",
        starts_at: form.startsAt ? new Date(form.startsAt).toISOString() : null,
        ends_at: form.endsAt ? new Date(form.endsAt).toISOString() : null,
        max_units: intOrNull(form.maxUnits),
        featured: form.featured,
        is_published: form.published
      };
      const offerResult = offerId ? await supabase.from("offers").update(offerPayload).eq("id", offerId) : await supabase.from("offers").insert(offerPayload);
      if (offerResult.error) throw offerResult.error;

      // 5. Photos: remove deleted, re-number kept, upload new
      for (const item of removedMedia) {
        await supabase.from("product_media").delete().eq("id", item.id);
        // Sample offers use external photos (storage_path "external/..."): nothing to delete from storage.
        if (!item.storage_path.startsWith("external/")) await supabase.storage.from("offer-media").remove([item.storage_path]);
      }
      for (const [index, item] of media.entries()) {
        if (item.sort_order !== index) await supabase.from("product_media").update({ sort_order: index }).eq("id", item.id);
      }
      for (const [index, file] of newFiles.entries()) {
        const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
        const path = `${user.id}/${productId}/${Date.now()}-${index}.${extension}`;
        const upload = await supabase.storage.from("offer-media").upload(path, file, { contentType: file.type });
        if (upload.error) throw upload.error;
        const publicUrl = supabase.storage.from("offer-media").getPublicUrl(path).data.publicUrl;
        const inserted = await supabase.from("product_media").insert({ product_id: productId, storage_path: path, public_url: publicUrl, alt_text: form.title.trim(), sort_order: media.length + index });
        if (inserted.error) throw inserted.error;
      }

      onClose(`«${form.title.trim()}» guardada. Enlace: /es/ofertas/${slug}`);
    } catch (caught) {
      const text = caught instanceof Error ? caught.message : typeof caught === "object" && caught && "message" in caught ? String((caught as { message: unknown }).message) : "No se pudo guardar.";
      setError(text.includes("products_slug_key") ? "Ese enlace (slug) ya lo usa otra oferta." : text);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setSaving(false);
    }
  }

  function moveMedia(index: number, delta: number) {
    setMedia((current) => {
      const next = [...current];
      const target = index + delta;
      if (target < 0 || target >= next.length) return current;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  if (loading) return <LlamaLoader label="Cargando oferta..." />;

  return (
    <form className="admin-offer-form full" onSubmit={save}>
      <div className="admin-toolbar">
        <button type="button" className="admin-action-link" onClick={() => onClose()}><ArrowLeft size={15} /> Volver</button>
        <h1>{offerId ? "Editar oferta" : "Nueva oferta"}</h1>
        <button className="dark-button" disabled={saving}><Save size={16} /> {saving ? "Guardando..." : "Guardar"}</button>
      </div>
      {error && <p className="form-message">{error}</p>}

      <fieldset>
        <legend>Básico</legend>
        <div className="admin-form-grid">
          <label>Título<input required value={form.title} onChange={(event) => set("title", event.target.value)} placeholder="Ej. Escapada en Tolomosa" /></label>
          <label>Enlace (slug)<input value={form.slug} onChange={(event) => set("slug", slugify(event.target.value))} placeholder={slugify(form.title) || "se-genera-del-titulo"} /><small>tripya.com/es/ofertas/<b>{form.slug || slugify(form.title)}</b></small></label>
        </div>
        <div className="admin-form-grid three">
          <label>Tipo de producto<select value={form.type} onChange={(event) => set("type", event.target.value as ProductType)}><option value="accommodation">Alojamiento</option><option value="package">Escapada / paquete</option><option value="tour">Experiencia / tour</option></select></label>
          {form.type === "accommodation" && <label>Tipo de alojamiento<select value={form.propertyType} onChange={(event) => set("propertyType", event.target.value)}><option value="">—</option>{PROPERTY_TYPES.map((type) => <option key={type} value={type}>{es.propertyTypes[type]}</option>)}</select></label>}
          <label>Destino<select value={form.destinationId} onChange={(event) => set("destinationId", event.target.value)}><option value="">Otra ciudad...</option>{destinations.map((destination) => <option key={destination.id} value={destination.id}>{destination.name}</option>)}</select></label>
          {!form.destinationId && <label>Nueva ciudad<input value={form.newCity} onChange={(event) => set("newCity", event.target.value)} placeholder="Ej. Samaipata" /></label>}
        </div>
        <label>Descripción completa<textarea rows={6} value={form.description} onChange={(event) => set("description", event.target.value)} placeholder="Cómo es el alojamiento, qué lo hace especial, qué se puede hacer cerca..." /></label>
        <div className="admin-form-grid">
          <label>Resumen corto<input value={form.durationLabel} onChange={(event) => set("durationLabel", event.target.value)} placeholder="Ej. 2 noches + desayuno" /></label>
          <label>Incluye (separado por comas)<input value={form.includes} onChange={(event) => set("includes", event.target.value)} placeholder="Desayuno, visita a bodega, transporte" /></label>
        </div>
      </fieldset>

      <fieldset>
        <legend>Precio y oferta</legend>
        <div className="admin-form-grid three">
          <label>Precio habitual (Bs)<input required inputMode="decimal" value={form.originalPrice} onChange={(event) => set("originalPrice", event.target.value)} /></label>
          <label>Precio Tripya (Bs)<input required inputMode="decimal" value={form.promotionalPrice} onChange={(event) => set("promotionalPrice", event.target.value)} /></label>
          <label>El precio es<select value={form.pricingUnit} onChange={(event) => set("pricingUnit", event.target.value as PricingUnit)}><option value="per_night">por noche</option><option value="per_stay">por estadía / paquete completo</option><option value="per_person">por persona</option></select></label>
        </div>
        <div className="admin-form-grid three">
          <label>Oferta válida desde<input type="datetime-local" value={form.startsAt} onChange={(event) => set("startsAt", event.target.value)} /></label>
          <label>Oferta válida hasta<input type="datetime-local" value={form.endsAt} onChange={(event) => set("endsAt", event.target.value)} /><small>Recomendado: 1 a 1,5 semanas.</small></label>
          <label>Cupos (reservas máximas)<input type="number" min={1} value={form.maxUnits} onChange={(event) => set("maxUnits", event.target.value)} placeholder="Sin límite" /></label>
        </div>
        <div className="admin-checks">
          <label className="check-row"><input type="checkbox" checked={form.flash} onChange={(event) => set("flash", event.target.checked)} /> Oferta Flash (contador visible)</label>
          <label className="check-row"><input type="checkbox" checked={form.featured} onChange={(event) => set("featured", event.target.checked)} /> Destacada en la portada</label>
          <label className="check-row"><input type="checkbox" checked={form.published} onChange={(event) => set("published", event.target.checked)} /> Publicada</label>
        </div>
      </fieldset>

      <fieldset>
        <legend>Estadía y disponibilidad</legend>
        <div className="admin-form-grid four">
          <label>Capacidad máx. (personas)<input type="number" min={1} value={form.capacityMax} onChange={(event) => set("capacityMax", event.target.value)} /></label>
          <label>Noches mínimas<input type="number" min={1} value={form.minNights} onChange={(event) => set("minNights", event.target.value)} /></label>
          <label>Noches máximas<input type="number" min={1} value={form.maxNights} onChange={(event) => set("maxNights", event.target.value)} placeholder="Sin límite" /><small>Igual a las mínimas = paquete con noches fijas.</small></label>
          <label>Check-in / check-out<span className="inline-pair"><input value={form.checkInTime} onChange={(event) => set("checkInTime", event.target.value)} placeholder="14:00" /><input value={form.checkOutTime} onChange={(event) => set("checkOutTime", event.target.value)} placeholder="11:00" /></span></label>
        </div>
        <div className="admin-form-grid">
          <label>Fechas disponibles desde (llegada)<input type="date" value={form.stayFrom} onChange={(event) => set("stayFrom", event.target.value)} /></label>
          <label>Fechas disponibles hasta (salida)<input type="date" value={form.stayTo} onChange={(event) => set("stayTo", event.target.value)} /></label>
        </div>
      </fieldset>

      <fieldset>
        <legend>Servicios</legend>
        <div className="chip-grid">{AMENITIES.map((amenity) => <button type="button" key={amenity} className={`chip ${amenities.includes(amenity) ? "active" : ""}`} onClick={() => setAmenities(amenities.includes(amenity) ? amenities.filter((item) => item !== amenity) : [...amenities, amenity])}>{es.amenities[amenity]}</button>)}</div>
        <p className="field-label">Servicios adicionales con costo (el cliente los elige al reservar; precio por estadía)</p>
        {extras.map((extra, index) => (
          <div className="extra-row" key={extra.id}>
            <input value={extra.name} placeholder="Ej. Cena romántica" onChange={(event) => setExtras(extras.map((item, i) => (i === index ? { ...item, name: event.target.value } : item)))} />
            <input value={extra.price} inputMode="decimal" placeholder="Bs" onChange={(event) => setExtras(extras.map((item, i) => (i === index ? { ...item, price: event.target.value } : item)))} />
            <button type="button" aria-label="Quitar" onClick={() => setExtras(extras.filter((_, i) => i !== index))}><Trash2 size={15} /></button>
          </div>
        ))}
        <button type="button" className="admin-action-link" onClick={() => setExtras([...extras, { id: `extra-${Date.now()}`, name: "", price: "" }])}><Plus size={15} /> Añadir servicio adicional</button>
      </fieldset>

      <fieldset>
        <legend>Condiciones</legend>
        <label>Condiciones de reserva<textarea value={form.bookingConditions} onChange={(event) => set("bookingConditions", event.target.value)} placeholder="Documento al check-in, mascotas, niños, horarios..." /></label>
        <label>Política de cancelación<textarea value={form.cancellationPolicy} onChange={(event) => set("cancellationPolicy", event.target.value)} placeholder="Ej. Cancelación gratis hasta 7 días antes. Después, no reembolsable." /></label>
      </fieldset>

      <fieldset>
        <legend>Ubicación</legend>
        <label>Dirección o referencia<input value={form.address} onChange={(event) => set("address", event.target.value)} /></label>
        <div className="map-picker-field"><LocationPicker latitude={form.latitude} longitude={form.longitude} onChange={(latitude, longitude) => setForm((current) => ({ ...current, latitude, longitude }))} /></div>
        <div className="admin-form-grid">
          <label>Latitud<input type="number" step="any" value={form.latitude} onChange={(event) => set("latitude", event.target.value)} /></label>
          <label>Longitud<input type="number" step="any" value={form.longitude} onChange={(event) => set("longitude", event.target.value)} /></label>
        </div>
        <div className="map-hint"><MapPin size={17} /> El pin del mapa actualiza estas coordenadas.</div>
      </fieldset>

      <fieldset>
        <legend>Confianza</legend>
        {ids.wasSample && <label className="check-row"><input type="checkbox" checked={form.sample} onChange={(event) => set("sample", event.target.checked)} /> Oferta de ejemplo (se muestra con la etiqueta «Ejemplo» y no se puede reservar). Desmárcala si la conviertes en una oferta real.</label>}
        <label className="check-row"><input type="checkbox" checked={form.verified} onChange={(event) => set("verified", event.target.checked)} /> Verificado por Tripya (identidad, ubicación, fotos, servicios y condiciones comprobados)</label>
        <label>Qué verificamos (visible para el cliente)<input value={form.verificationSummary} onChange={(event) => set("verificationSummary", event.target.value)} placeholder="Ej. Visitado en persona el 12/10/2026. Fotos tomadas por Tripya." /></label>
        <div className="admin-form-grid three">
          <label>Valoración en Google (0-5)<input inputMode="decimal" value={form.googleRating} onChange={(event) => set("googleRating", event.target.value)} placeholder="4.5" /></label>
          <label>Nº de opiniones en Google<input type="number" min={0} value={form.googleReviewCount} onChange={(event) => set("googleReviewCount", event.target.value)} /></label>
          <label>Enlace a Google Maps<input type="url" value={form.googleMapsUrl} onChange={(event) => set("googleMapsUrl", event.target.value)} placeholder="https://maps.app.goo.gl/..." /></label>
        </div>
        <p className="muted">Copia la nota real de la ficha de Google Maps. No inventes valoraciones.</p>
      </fieldset>

      <fieldset>
        <legend>Proveedor (contacto interno, no se publica)</legend>
        <div className="admin-form-grid three">
          <label>Nombre del negocio<input value={form.providerName} onChange={(event) => set("providerName", event.target.value)} placeholder={form.title} /></label>
          <label>Email<input type="email" value={form.providerEmail} onChange={(event) => set("providerEmail", event.target.value)} /></label>
          <label>Teléfono / WhatsApp<input value={form.providerPhone} onChange={(event) => set("providerPhone", event.target.value)} /></label>
        </div>
      </fieldset>

      <fieldset>
        <legend>Fotos ({media.length + newFiles.length}/{MAX_IMAGES}) · la primera es la portada</legend>
        <div className="admin-photos editable">
          {media.map((item, index) => item.public_url && (
            <figure key={item.id}>
              <Image src={item.public_url} alt="" width={160} height={120} unoptimized />
              <figcaption>
                <button type="button" onClick={() => moveMedia(index, -1)} aria-label="Mover antes">←</button>
                <button type="button" onClick={() => moveMedia(index, 1)} aria-label="Mover después">→</button>
                <button type="button" aria-label="Eliminar" onClick={() => { setRemovedMedia([...removedMedia, item]); setMedia(media.filter((other) => other.id !== item.id)); }}><Trash2 size={14} /></button>
              </figcaption>
            </figure>
          ))}
          {newFiles.map((file, index) => (
            <figure key={`${file.name}-${index}`} className="pending">
              <span>{file.name}</span>
              <figcaption><button type="button" aria-label="Quitar" onClick={() => setNewFiles(newFiles.filter((_, i) => i !== index))}><Trash2 size={14} /></button></figcaption>
            </figure>
          ))}
        </div>
        {media.length + newFiles.length < MAX_IMAGES && <label className="upload-box"><ImagePlus size={20} /> Añadir fotos (se optimizan automáticamente)<input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(event) => { void addFiles(event.target.files); event.target.value = ""; }} /></label>}
      </fieldset>

      <fieldset>
        <legend>Traducciones (opcional)</legend>
        <p className="muted">Si las dejas vacías, la oferta se muestra en español en /en y /fr.</p>
        <div className="admin-form-grid">
          <label>Título en inglés<input value={form.enTitle} onChange={(event) => set("enTitle", event.target.value)} /></label>
          <label>Título en francés<input value={form.frTitle} onChange={(event) => set("frTitle", event.target.value)} /></label>
        </div>
        <div className="admin-form-grid">
          <label>Descripción en inglés<textarea value={form.enDescription} onChange={(event) => set("enDescription", event.target.value)} /></label>
          <label>Descripción en francés<textarea value={form.frDescription} onChange={(event) => set("frDescription", event.target.value)} /></label>
        </div>
      </fieldset>

      <button className="dark-button form-button" disabled={saving}><Save size={16} /> {saving ? "Guardando..." : "Guardar oferta"}</button>
    </form>
  );
}
