"use client";

// Partner portal (/socios) data shapes and helpers. Partners only write drafts and proposals:
// RLS and the SQL functions in 20261101000100_partner_portal.sql enforce that they never publish.
import type { SupabaseClient } from "@supabase/supabase-js";

export type ListingKind = "hotel" | "apartment" | "package";
export type ListingStatus = "draft" | "submitted" | "negotiating" | "accepted" | "published" | "rejected";
export type ProposalStatus = "sent" | "negotiating" | "accepted" | "rejected" | "withdrawn";
export type PricingUnit = "per_night" | "per_person" | "per_stay";

export type PartnerProfile = { id: string; trade_name: string; partner_type: string; city: string | null; contact_name: string | null; email: string; phone: string | null };

export type ItineraryDayDraft = { title: string; description: string };

export type PartnerListing = {
  id: string;
  provider_id: string;
  kind: ListingKind;
  name: string;
  destination_id: string | null;
  city_text: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  description: string;
  property_type: string | null;
  amenities: string[];
  check_in_time: string | null;
  check_out_time: string | null;
  rules: string;
  duration_label: string | null;
  includes: string[];
  excludes: string[];
  itinerary: ItineraryDayDraft[];
  floors: number;
  status: ListingStatus;
  product_id: string | null;
  updated_at: string;
};

export type PartnerUnit = {
  id: string;
  listing_id: string;
  floor: number;
  label: string;
  room_type: string;
  max_guests: number | null;
  beds: string | null;
  size_m2: number | null;
  features: string[];
  description: string;
  sort_order: number;
};

export type PartnerMedia = { id: string; listing_id: string; unit_id: string | null; storage_path: string; sort_order: number };

export type ProposalItem = { id?: string; room_type: string | null; regular_price_minor: number; offered_price_minor: number; pricing_unit: PricingUnit };

export type PartnerProposal = {
  id: string;
  listing_id: string;
  provider_id: string;
  status: ProposalStatus;
  currency_code: string;
  valid_from: string | null;
  valid_to: string | null;
  benefits: string;
  notes: string;
  admin_reply: string | null;
  created_at: string;
  partner_proposal_items: ProposalItem[];
};

export type PartnerMessage = { id: string; proposal_id: string; author_role: "partner" | "tripya"; body: string; created_at: string };

export const PARTNER_BUCKET = "partner-media";

export const LISTING_SELECT = "id,provider_id,kind,name,destination_id,city_text,address,latitude,longitude,description,property_type,amenities,check_in_time,check_out_time,rules,duration_label,includes,excludes,itinerary,floors,status,product_id,updated_at";
export const PROPOSAL_SELECT = "id,listing_id,provider_id,status,currency_code,valid_from,valid_to,benefits,notes,admin_reply,created_at,partner_proposal_items(id,room_type,regular_price_minor,offered_price_minor,pricing_unit)";

export const KIND_LABELS: Record<ListingKind, string> = { hotel: "Hotel / hostal", apartment: "Departamento o casa", package: "Paquete o tour" };

export const LISTING_STATUS: Record<ListingStatus, { label: string; tone: "draft" | "wait" | "talk" | "ok" | "no" }> = {
  draft: { label: "Borrador", tone: "draft" },
  submitted: { label: "Oferta enviada", tone: "wait" },
  negotiating: { label: "En negociación", tone: "talk" },
  accepted: { label: "Aceptada", tone: "ok" },
  published: { label: "Publicada por Tripya", tone: "ok" },
  rejected: { label: "No aceptada", tone: "no" }
};

export const PROPOSAL_STATUS: Record<ProposalStatus, string> = {
  sent: "Enviada · esperando respuesta",
  negotiating: "En negociación",
  accepted: "Aceptada y publicada",
  rejected: "No aceptada",
  withdrawn: "Retirada"
};

/** Drafts are editable only while Tripya is not reviewing them (same rule as RLS partner_listing_editable). */
export const isEditable = (status: ListingStatus) => status === "draft" || status === "rejected";

export const ROOM_TYPES = ["Individual", "Doble", "Matrimonial", "Twin", "Triple", "Cuádruple", "Familiar", "Suite"];
export const ROOM_FEATURES = ["Baño privado", "Aire acondicionado", "Ventilador", "Calefacción", "TV", "Wi-Fi", "Escritorio", "Frigobar", "Balcón", "Vista", "Agua caliente", "Caja fuerte"];

// --- money: Bs typed by the partner <-> minor units (never floats) ---
export function minorToInput(minor: number | null | undefined): string {
  if (!minor) return "";
  const cents = minor % 100;
  return `${Math.floor(minor / 100)}${cents ? `.${String(cents).padStart(2, "0")}` : ""}`;
}
export function inputToMinor(value: string): number | null {
  const match = /^(\d{1,9})(?:[.,](\d{1,2}))?$/.exec(value.trim());
  if (!match) return null;
  return Number(match[1]) * 100 + Number((match[2] ?? "").padEnd(2, "0"));
}
export function formatBs(minor: number): string {
  return `Bs ${new Intl.NumberFormat("es-BO", { minimumFractionDigits: minor % 100 ? 2 : 0, maximumFractionDigits: 2 }).format(minor / 100)}`;
}

/** Private photos are shown through short-lived signed URLs (the bucket is not public). */
export async function signedUrls(client: SupabaseClient, paths: string[]): Promise<Record<string, string>> {
  if (paths.length === 0) return {};
  const { data } = await client.storage.from(PARTNER_BUCKET).createSignedUrls(paths, 60 * 60);
  const entries: [string, string][] = [];
  for (const item of data ?? []) if (item.path && item.signedUrl) entries.push([item.path, item.signedUrl]);
  return Object.fromEntries(entries);
}

/** Readable message for the errors raised by the partner SQL functions. */
export function partnerError(message: string): string {
  const known: Record<string, string> = {
    photos_required: "Sube al menos una foto antes de enviar tu oferta.",
    rooms_required: "Indica el tipo de al menos una habitación antes de enviar tu oferta.",
    invalid_prices: "Revisa los precios: deben ser números y el precio para Tripya no puede ser mayor que tu precio normal.",
    invalid_dates: "Revisa las fechas de la oferta.",
    invalid_status: "Esta oferta ya está en revisión. Espera la respuesta de Tripya.",
    not_allowed: "No tienes permiso para hacer esto.",
    status_changes_only_through_functions: "Esta acción no está permitida.",
    text_too_long: "El texto es demasiado largo."
  };
  const key = Object.keys(known).find((candidate) => message.includes(candidate));
  return key ? known[key] : "No pudimos guardar. Inténtalo de nuevo.";
}
