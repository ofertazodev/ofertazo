"use client";

import { FormEvent, useState } from "react";
import { ArrowRight, ImagePlus, ShieldCheck } from "lucide-react";
import type { Dictionary } from "@/i18n/dictionaries/es";
import { track } from "@/lib/analytics";
import { PROPERTY_TYPES } from "@/lib/listing";
import { whatsappUrl } from "@/lib/whatsapp";

type Props = { dict: Dictionary; cities: string[] };

// Field order in the WhatsApp message; labels come from the dictionary.
const MESSAGE_FIELDS = [
  "business_name", "property_type", "city", "address", "capacity",
  "contact_name", "phone", "email", "website",
  "services", "regular_price", "offered_price", "high_season", "low_season", "availability", "conditions", "message"
] as const;

/**
 * Providers don't upload anything to Tripya: the form only builds a WhatsApp
 * message for the admin, who reviews it and publishes the offer from /admin.
 */
export function ProviderApplicationForm({ dict, cities }: Props) {
  const t = dict.providers;
  const [status, setStatus] = useState<"idle" | "done">("idle");
  const [error, setError] = useState("");

  const labels: Record<(typeof MESSAGE_FIELDS)[number], string> = {
    business_name: t.businessName, property_type: t.propertyType, city: t.city, address: t.address, capacity: t.capacity,
    contact_name: t.contactName, phone: t.phone, email: t.email, website: t.website,
    services: t.services, regular_price: t.regularPrice, offered_price: t.offeredPrice, high_season: t.highSeason,
    low_season: t.lowSeason, availability: t.availability, conditions: t.conditions, message: t.message
  };

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const lines = MESSAGE_FIELDS.flatMap((key) => {
      const raw = String(form.get(key) ?? "").trim();
      if (!raw) return [];
      const value = key === "property_type" ? dict.propertyTypes[raw as keyof Dictionary["propertyTypes"]] ?? raw : raw;
      return [`*${labels[key]}:* ${value}`];
    });
    const url = whatsappUrl([t.messageIntro, "", ...lines].join("\n"));
    if (!url) { setError(t.error); return; }
    track("provider_application", { property_type: String(form.get("property_type") ?? "") || undefined, city: String(form.get("city") ?? "") || undefined });
    window.open(url, "_blank", "noopener,noreferrer");
    setError("");
    setStatus("done");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (status === "done") {
    return (
      <div className="status-card">
        <span className="success-icon"><ShieldCheck /></span>
        <h2>{t.successTitle}</h2>
        <p className="muted">{t.successText}</p>
      </div>
    );
  }

  return (
    <form className="provider-form" onSubmit={submit}>
      <fieldset>
        <legend>{t.sectionBusiness}</legend>
        <label>{t.businessName}<input name="business_name" required minLength={2} maxLength={160} /></label>
        <div className="form-grid">
          <label>{t.propertyType}<select name="property_type" required defaultValue=""><option value="" disabled>—</option>{PROPERTY_TYPES.map((type) => <option key={type} value={type}>{dict.propertyTypes[type]}</option>)}</select></label>
          <label>{t.city}<input name="city" required minLength={2} maxLength={80} list="provider-cities" /><datalist id="provider-cities">{cities.map((city) => <option key={city} value={city} />)}</datalist></label>
        </div>
        <label>{t.address}<input name="address" maxLength={300} /></label>
        <label>{t.capacity}<input name="capacity" maxLength={200} placeholder={t.capacityPlaceholder} /></label>
      </fieldset>

      <fieldset>
        <legend>{t.sectionContact}</legend>
        <div className="form-grid">
          <label>{t.contactName}<input name="contact_name" required minLength={2} maxLength={120} autoComplete="name" /></label>
          <label>{t.phone}<input name="phone" type="tel" required minLength={7} maxLength={30} autoComplete="tel" placeholder="+591" /></label>
        </div>
        <div className="form-grid">
          <label>{t.email}<input name="email" type="email" maxLength={254} autoComplete="email" /></label>
          <label>{t.website}<input name="website" maxLength={300} /></label>
        </div>
      </fieldset>

      <fieldset>
        <legend>{t.sectionOffer}</legend>
        <label>{t.services}<textarea name="services" maxLength={2000} placeholder={t.servicesPlaceholder} /></label>
        <div className="form-grid">
          <label>{t.regularPrice}<input name="regular_price" maxLength={300} placeholder={t.regularPricePlaceholder} /></label>
          <label>{t.offeredPrice}<input name="offered_price" maxLength={300} placeholder={t.offeredPricePlaceholder} /></label>
        </div>
        <div className="form-grid">
          <label>{t.highSeason}<input name="high_season" maxLength={500} placeholder={t.highSeasonPlaceholder} /></label>
          <label>{t.lowSeason}<input name="low_season" maxLength={500} placeholder={t.lowSeasonPlaceholder} /></label>
        </div>
        <label>{t.availability}<textarea name="availability" maxLength={1000} /></label>
        <label>{t.conditions}<textarea name="conditions" maxLength={2000} /></label>
        <label>{t.message}<textarea name="message" maxLength={2000} /></label>
        <p className="map-hint"><ImagePlus size={18} /> {t.photosHint}</p>
      </fieldset>

      <label className="check-row"><input type="checkbox" required /> <span>{t.consent}</span></label>
      {error && <p className="form-message" role="alert">{error}</p>}
      <button className="dark-button form-button">{t.submit} <ArrowRight size={17} /></button>
    </form>
  );
}
