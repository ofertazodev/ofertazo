"use client";

// Thin wrapper around Google Analytics 4. GA only loads after cookie consent (see components/site/Analytics.tsx),
// so track() is a no-op until then. Event names follow GA4 recommended events where one exists.

type EventParams = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

export type AnalyticsEvent =
  | "view_item"            // offer page viewed
  | "select_item"          // offer card clicked
  | "search"               // hero search / filters
  | "click_whatsapp"       // any WhatsApp button
  | "begin_checkout"       // "Reservar ahora"
  | "checkout_step"        // booking step reached
  | "generate_lead"        // booking request sent
  | "view_destination"
  | "provider_application" // "Publica tu alojamiento" sent
  | "language_change";

export function track(event: AnalyticsEvent, params: EventParams = {}) {
  try {
    window.gtag?.("event", event, params);
  } catch {
    // Analytics must never break the page.
  }
  sendFirstParty(event, params);
}

// --- First-party anonymous statistics (admin → Estadísticas) ---
// Sent to /api/track without cookies or identifiers; works whether or not the visitor accepts cookies.

const INTERNAL_KEY = "tripya_internal";

/** Admins browsing the site are not counted (set when the admin panel opens). */
export function markInternalVisitor() {
  try { window.localStorage.setItem(INTERNAL_KEY, "1"); } catch { /* best effort */ }
}

function isInternalVisitor() {
  try { return window.localStorage.getItem(INTERNAL_KEY) === "1"; } catch { return false; }
}

export function trackPageView() {
  sendFirstParty("page_view", {});
}

function sendFirstParty(event: AnalyticsEvent | "page_view", params: EventParams) {
  try {
    if (isInternalVisitor()) return;
    const attribution = getAttribution();
    const pick = (value: unknown) => (typeof value === "string" || typeof value === "number" ? String(value) : undefined);
    const payload = JSON.stringify({
      event,
      path: window.location.pathname,
      locale: window.location.pathname.split("/")[1],
      offer: pick(params.item_id ?? params.offer),
      destination: event === "view_destination" ? pick(params.destination) : undefined,
      placement: pick(params.placement ?? params.item_list_name),
      search: pick(params.search_term),
      utm_source: attribution.utm_source,
      utm_campaign: attribution.utm_campaign,
      utm_content: attribution.utm_content,
      referrer: attribution.referrer
    });
    const blob = new Blob([payload], { type: "application/json" });
    if (!navigator.sendBeacon?.("/api/track", blob)) {
      void fetch("/api/track", { method: "POST", body: payload, headers: { "Content-Type": "application/json" }, keepalive: true });
    }
  } catch {
    // Statistics must never break the page.
  }
}

// --- First-touch attribution (which TikTok / Instagram link brought the visitor) ---

const ATTRIBUTION_KEY = "ofz_attribution";
const ATTRIBUTION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const;

export type Attribution = Partial<Record<(typeof UTM_KEYS)[number] | "referrer" | "landing_page", string>>;

/** Stores UTM parameters from the landing URL. A new campaign link overrides the previous one. */
export function captureAttribution() {
  try {
    const params = new URLSearchParams(window.location.search);
    const hasUtm = UTM_KEYS.some((key) => params.get(key));
    const existing = readStoredAttribution();
    if (!hasUtm && existing) return;

    const data: Attribution = {};
    for (const key of UTM_KEYS) {
      const value = params.get(key);
      if (value) data[key] = value.slice(0, 100);
    }
    if (document.referrer && !document.referrer.startsWith(window.location.origin)) data.referrer = document.referrer.slice(0, 300);
    data.landing_page = window.location.pathname.slice(0, 300);
    window.localStorage.setItem(ATTRIBUTION_KEY, JSON.stringify({ data, savedAt: Date.now() }));
  } catch {
    // Storage can be unavailable (private mode); attribution is best effort.
  }
}

function readStoredAttribution(): Attribution | null {
  try {
    const raw = window.localStorage.getItem(ATTRIBUTION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { data: Attribution; savedAt: number };
    if (Date.now() - parsed.savedAt > ATTRIBUTION_TTL_MS) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

export function getAttribution(): Attribution {
  return readStoredAttribution() ?? {};
}

// --- Cookie consent ---

const CONSENT_KEY = "ofz_cookie_consent";
export type Consent = "granted" | "denied";
export const CONSENT_EVENT = "ofz-consent-change";

export function readConsent(): Consent | null {
  try {
    const value = window.localStorage.getItem(CONSENT_KEY);
    return value === "granted" || value === "denied" ? value : null;
  } catch {
    return null;
  }
}

export function saveConsent(consent: Consent) {
  try {
    window.localStorage.setItem(CONSENT_KEY, consent);
  } catch {
    // Without storage the banner simply shows again next visit.
  }
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: consent }));
}
