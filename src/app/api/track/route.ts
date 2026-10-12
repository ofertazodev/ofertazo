import { NextResponse, type NextRequest } from "next/server";
import { getServerSupabase } from "@/lib/supabase-server";

// Receives anonymous site events from the browser (see lib/analytics.ts) and stores them through the
// track_event() database function. No cookies; the IP and user agent are only used to compute a
// daily-salted hash inside the database and are never stored.

const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|headless|lighthouse|pagespeed|vercel|monitor|curl|wget|python|axios|node-fetch/i;

const SOURCES: [RegExp, string][] = [
  [/tiktok/, "tiktok"],
  [/instagram/, "instagram"],
  [/facebook|fb\.|^fb$/, "facebook"],
  [/whatsapp|wa\.me/, "whatsapp"],
  [/google/, "google"],
  [/bing|yahoo|duckduckgo|ecosia/, "buscadores"],
  [/youtube|youtu\.be/, "youtube"],
  [/t\.co|twitter|x\.com/, "x"]
];

function normalizeSource(utmSource: string | undefined, referrer: string | undefined, ownHost: string): string {
  const raw = (utmSource ?? "").toLowerCase().trim();
  if (raw) return SOURCES.find(([pattern]) => pattern.test(raw))?.[1] ?? raw.slice(0, 40);
  if (!referrer) return "directo";
  try {
    const host = new URL(referrer).hostname.replace(/^www\./, "");
    if (host === ownHost.replace(/^www\./, "")) return "directo";
    return SOURCES.find(([pattern]) => pattern.test(host))?.[1] ?? "otros sitios";
  } catch {
    return "directo";
  }
}

function deviceOf(userAgent: string): "mobile" | "tablet" | "desktop" {
  if (/ipad|tablet|kindle|silk/i.test(userAgent) || (/android/i.test(userAgent) && !/mobile/i.test(userAgent))) return "tablet";
  if (/mobi|iphone|android/i.test(userAgent)) return "mobile";
  return "desktop";
}

const text = (value: unknown, max: number) => (typeof value === "string" && value.trim() ? value.trim().slice(0, max) : null);

export async function POST(request: NextRequest) {
  const userAgent = request.headers.get("user-agent") ?? "";
  if (!userAgent || BOT.test(userAgent)) return new NextResponse(null, { status: 204 });

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return new NextResponse(null, { status: 204 });
  }

  const supabase = getServerSupabase();
  if (!supabase) return new NextResponse(null, { status: 204 });

  const ip = (request.headers.get("x-forwarded-for") ?? "").split(",")[0]?.trim() || request.headers.get("x-real-ip") || "0.0.0.0";
  const { error } = await supabase.rpc("track_event", {
    p_event: text(body.event, 40),
    p_fingerprint: `${ip}|${userAgent}`.slice(0, 600),
    p_path: text(body.path, 300),
    p_offer_slug: text(body.offer, 120),
    p_destination_slug: text(body.destination, 120),
    p_placement: text(body.placement, 60),
    p_search_term: text(body.search, 80),
    p_source: normalizeSource(text(body.utm_source, 60) ?? undefined, text(body.referrer, 300) ?? undefined, request.nextUrl.hostname),
    p_campaign: text(body.utm_campaign, 100),
    p_content: text(body.utm_content, 100),
    p_device: deviceOf(userAgent),
    p_country: request.headers.get("x-vercel-ip-country"),
    p_locale: text(body.locale, 5)
  });
  if (error) console.error("track_event failed", error.message);
  return new NextResponse(null, { status: 204 });
}
