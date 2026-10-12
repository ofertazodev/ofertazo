"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowDownRight, ArrowUpRight, Lightbulb, Minus, RefreshCw } from "lucide-react";
import { supabase } from "@/lib/supabase-browser";

// ---------------------------------------------------------------------------------------------
// Data shape returned by the analytics_summary() database function
// ---------------------------------------------------------------------------------------------
type Kpis = Record<"visitors" | "pageviews" | "offer_views" | "whatsapp" | "checkouts" | "leads" | "p_visitors" | "p_pageviews" | "p_offer_views" | "p_whatsapp" | "p_checkouts" | "p_leads", number>;
type LabelCount = { label: string; count: number };
type OfferStats = { slug: string; title: string; is_sample: boolean; views: number; visitors: number; card_clicks: number; checkouts: number; leads: number; whatsapp: number };
type Summary = {
  days: number;
  kpis: Kpis;
  daily: { day: string; visitors: number; pageviews: number }[];
  funnel: { visitors: number; offer_viewers: number; checkout_starters: number; lead_senders: number; whatsapp_clickers: number };
  sources: { label: string; visitors: number; leads: number }[];
  devices: { label: string; visitors: number }[];
  countries: { label: string; visitors: number }[];
  offers: OfferStats[];
  campaigns: { source: string; campaign: string | null; content: string | null; visitors: number; leads: number; whatsapp: number }[];
  searches: LabelCount[];
  destinations: LabelCount[];
  pages: LabelCount[];
  hours: { hour: number; visitors: number }[];
};

const RANGES = [7, 30, 90] as const;
const SOURCE_NAMES: Record<string, string> = { tiktok: "TikTok", instagram: "Instagram", facebook: "Facebook", whatsapp: "WhatsApp", google: "Google", youtube: "YouTube", x: "X / Twitter", buscadores: "Otros buscadores", directo: "Directo / sin origen", "otros sitios": "Otros sitios web" };
const DEVICE_NAMES: Record<string, string> = { mobile: "Móvil", tablet: "Tablet", desktop: "Computadora" };

const nf = new Intl.NumberFormat("es-BO");
const pct = (part: number, whole: number) => (whole > 0 ? (part / whole) * 100 : 0);
const fmtPct = (value: number) => `${value.toLocaleString("es-BO", { maximumFractionDigits: value < 10 ? 1 : 0 })}%`;
const regionNames = typeof Intl.DisplayNames === "function" ? new Intl.DisplayNames(["es"], { type: "region" }) : null;
const countryName = (code: string) => { try { return code === "??" ? "Desconocido" : regionNames?.of(code) ?? code; } catch { return code; } };

/** Admin → Estadísticas: anonymous first-party traffic and conversion per offer. */
export function StatsPanel() {
  const [days, setDays] = useState<(typeof RANGES)[number]>(30);
  const [data, setData] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    const { data: result, error: rpcError } = await supabase.rpc("analytics_summary", { p_days: days });
    setLoading(false);
    if (rpcError) { setError(rpcError.message); return; }
    setError("");
    setData(result as Summary);
  }, [days]);

  useEffect(() => { void load(); }, [load]);

  return (
    <section className="stats-panel">
      <div className="admin-toolbar">
        <h1>Estadísticas</h1>
        <div className="stats-range" role="group" aria-label="Periodo">
          {RANGES.map((range) => <button key={range} className={range === days ? "active" : ""} aria-pressed={range === days} onClick={() => setDays(range)}>Últimos {range} días</button>)}
        </div>
        <button className="admin-action-link" onClick={() => void load()}><RefreshCw size={15} /> Actualizar</button>
      </div>
      <p className="muted stats-note">Datos anónimos de la web: sin cookies y sin guardar IPs. Cada persona cuenta una vez por día. Las visitas de los administradores no se cuentan.</p>
      {error && <p className="admin-notice">{error}</p>}
      {!data ? (loading ? <p className="muted">Cargando estadísticas...</p> : null) : (
        <div className={`stats-body ${loading ? "refreshing" : ""}`}>
          <KpiRow data={data} />
          <Insights data={data} />
          <div className="stats-grid two">
            <Card title="Visitantes por día" subtitle={`Últimos ${data.days} días`}><DailyChart daily={data.daily} /></Card>
            <Card title="Embudo de conversión" subtitle="Personas que llegan a cada paso"><Funnel funnel={data.funnel} /></Card>
          </div>
          <Card title="Rendimiento por oferta" subtitle="Qué anuncios llaman la atención y cuáles convierten. Pulsa una columna para ordenar."><OffersTable offers={data.offers} /></Card>
          <div className="stats-grid three">
            <Card title="De dónde llegan" subtitle="Visitantes por fuente"><BarList rows={data.sources.map((row) => ({ label: SOURCE_NAMES[row.label] ?? row.label, value: row.visitors, note: row.leads ? `${nf.format(row.leads)} solicitudes` : undefined }))} /></Card>
            <Card title="Dispositivos" subtitle="Visitantes"><BarList rows={data.devices.map((row) => ({ label: DEVICE_NAMES[row.label] ?? row.label, value: row.visitors }))} showShare /></Card>
            <Card title="Países" subtitle="Visitantes"><BarList rows={data.countries.map((row) => ({ label: countryName(row.label), value: row.visitors }))} showShare /></Card>
          </div>
          <Card title="¿A qué hora entran?" subtitle="Visitantes por hora (hora de Bolivia). Útil para elegir cuándo publicar en redes."><HoursChart hours={data.hours} /></Card>
          <Card title="Campañas y videos" subtitle="Enlaces con seguimiento (generados en Ofertas → Generador de enlaces)"><CampaignsTable rows={data.campaigns} /></Card>
          <div className="stats-grid three">
            <Card title="Destinos más vistos" subtitle="Visitas a la página de cada destino"><BarList rows={data.destinations.map((row) => ({ label: row.label, value: row.count }))} /></Card>
            <Card title="Búsquedas más frecuentes" subtitle="Lo que escriben en el buscador"><BarList rows={data.searches.map((row) => ({ label: row.label, value: row.count }))} /></Card>
            <Card title="Páginas más visitadas" subtitle="Páginas vistas"><BarList rows={data.pages.map((row) => ({ label: row.label, value: row.count }))} /></Card>
          </div>
        </div>
      )}
    </section>
  );
}

function Card({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="admin-panel-card stats-card">
      <header><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</header>
      {children}
    </section>
  );
}

// ---------------------------------------------------------------------------------------------
// KPI row + automatic insights
// ---------------------------------------------------------------------------------------------
function KpiRow({ data }: { data: Summary }) {
  const k = data.kpis;
  const conversion = pct(k.leads, k.visitors);
  const prevConversion = pct(k.p_leads, k.p_visitors);
  const tiles = [
    { label: "Visitantes", value: nf.format(k.visitors), now: k.visitors, before: k.p_visitors },
    { label: "Páginas vistas", value: nf.format(k.pageviews), now: k.pageviews, before: k.p_pageviews },
    { label: "Vistas de ofertas", value: nf.format(k.offer_views), now: k.offer_views, before: k.p_offer_views },
    { label: "Clics en WhatsApp", value: nf.format(k.whatsapp), now: k.whatsapp, before: k.p_whatsapp },
    { label: "Solicitudes de reserva", value: nf.format(k.leads), now: k.leads, before: k.p_leads },
    { label: "Conversión", value: fmtPct(conversion), now: conversion, before: prevConversion, hint: "Solicitudes ÷ visitantes" }
  ];
  return (
    <div className="stats-kpis">
      {tiles.map((tile) => (
        <div className="stats-kpi" key={tile.label} title={tile.hint}>
          <span className="stats-kpi-label">{tile.label}</span>
          <strong>{tile.value}</strong>
          <Delta now={tile.now} before={tile.before} days={data.days} />
        </div>
      ))}
    </div>
  );
}

function Delta({ now, before, days }: { now: number; before: number; days: number }) {
  if (before === 0 && now === 0) return <span className="stats-delta flat"><Minus size={13} /> sin datos previos</span>;
  if (before === 0) return <span className="stats-delta up"><ArrowUpRight size={13} /> nuevo vs. {days} días anteriores</span>;
  const change = ((now - before) / before) * 100;
  const dir = Math.abs(change) < 0.5 ? "flat" : change > 0 ? "up" : "down";
  const Icon = dir === "up" ? ArrowUpRight : dir === "down" ? ArrowDownRight : Minus;
  return <span className={`stats-delta ${dir}`}><Icon size={13} /> {change > 0 ? "+" : ""}{fmtPct(change)} vs. {days} días anteriores</span>;
}

function Insights({ data }: { data: Summary }) {
  const items: string[] = [];
  const real = data.offers.filter((offer) => !offer.is_sample);
  const pool = real.length ? real : data.offers;
  const mostViewed = [...pool].sort((a, b) => b.views - a.views)[0];
  if (mostViewed?.views) items.push(`La oferta más vista es «${mostViewed.title}» con ${nf.format(mostViewed.views)} vistas.`);
  const converters = pool.filter((offer) => offer.visitors >= 10);
  const best = [...converters].sort((a, b) => pct(b.leads + b.whatsapp, b.visitors) - pct(a.leads + a.whatsapp, a.visitors))[0];
  if (best && best.leads + best.whatsapp > 0) items.push(`«${best.title}» es la que más convierte: ${fmtPct(pct(best.leads + best.whatsapp, best.visitors))} de quienes la ven reserva o escribe por WhatsApp.`);
  const lowConversion = [...converters].sort((a, b) => b.visitors - a.visitors).find((offer) => offer.leads + offer.whatsapp === 0);
  if (lowConversion) items.push(`«${lowConversion.title}» tiene ${nf.format(lowConversion.visitors)} visitantes pero nadie reservó ni escribió: revisa precio, fotos o descripción.`);
  const topSource = data.sources.find((source) => source.label !== "directo");
  if (topSource) items.push(`Tu mejor fuente de visitas es ${SOURCE_NAMES[topSource.label] ?? topSource.label} (${nf.format(topSource.visitors)} visitantes).`);
  const peak = [...data.hours].sort((a, b) => b.visitors - a.visitors)[0];
  if (peak?.visitors) items.push(`La hora con más visitas es a las ${String(peak.hour).padStart(2, "0")}:00. Publicar en redes un poco antes suele funcionar mejor.`);
  const mobile = data.devices.find((device) => device.label === "mobile")?.visitors ?? 0;
  const totalDevices = data.devices.reduce((sum, device) => sum + device.visitors, 0);
  if (totalDevices >= 10) items.push(`${fmtPct(pct(mobile, totalDevices))} de las visitas llegan desde el móvil.`);
  if (!items.length) return <p className="stats-empty">Todavía no hay suficientes datos para sacar conclusiones. Vuelve cuando la web reciba visitas.</p>;
  return (
    <section className="stats-insights">
      <h2><Lightbulb size={18} /> Lo más importante</h2>
      <ul>{items.map((item) => <li key={item}>{item}</li>)}</ul>
    </section>
  );
}

// ---------------------------------------------------------------------------------------------
// Charts (hand-drawn SVG, single series in the brand orange)
// ---------------------------------------------------------------------------------------------
const shortDate = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString("es-BO", { day: "numeric", month: "short" });

/** Smallest "clean" axis maximum (4 equal steps of 1, 2, 2.5 or 5 × 10^n) that fits the value. */
function niceMax(value: number) {
  if (value <= 4) return 4;
  const rough = value / 4;
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((candidate) => candidate >= rough) ?? magnitude * 10;
  return step * 4;
}

function DailyChart({ daily }: { daily: Summary["daily"] }) {
  const [hover, setHover] = useState<number | null>(null);
  const width = 640;
  const height = 220;
  const pad = { top: 12, right: 12, bottom: 26, left: 40 };
  const max = niceMax(Math.max(0, ...daily.map((day) => day.visitors)));
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const x = (index: number) => pad.left + (daily.length <= 1 ? innerW / 2 : (index / (daily.length - 1)) * innerW);
  const y = (value: number) => pad.top + innerH - (value / max) * innerH;
  const line = daily.map((day, index) => `${index ? "L" : "M"}${x(index).toFixed(1)},${y(day.visitors).toFixed(1)}`).join(" ");
  const area = `${line} L${x(daily.length - 1).toFixed(1)},${y(0)} L${x(0).toFixed(1)},${y(0)} Z`;
  const ticks = [0, max / 4, max / 2, (3 * max) / 4, max];
  const labelEvery = Math.max(1, Math.ceil(daily.length / 6));
  const active = hover === null ? null : daily[hover];

  function onMove(event: React.PointerEvent<SVGSVGElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const px = ((event.clientX - rect.left) / rect.width) * width;
    const index = Math.round(((px - pad.left) / innerW) * (daily.length - 1));
    setHover(Math.min(daily.length - 1, Math.max(0, index)));
  }

  return (
    <div className="stats-chart">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Visitantes por día" onPointerMove={onMove} onPointerLeave={() => setHover(null)}>
        {ticks.map((tick) => (
          <g key={tick}>
            <line x1={pad.left} x2={width - pad.right} y1={y(tick)} y2={y(tick)} className="stats-grid-line" />
            <text x={pad.left - 8} y={y(tick) + 4} textAnchor="end" className="stats-axis">{nf.format(Math.round(tick))}</text>
          </g>
        ))}
        {daily.map((day, index) => index % labelEvery === 0 && <text key={day.day} x={x(index)} y={height - 6} textAnchor={index === 0 ? "start" : index > daily.length - labelEvery ? "end" : "middle"} className="stats-axis">{shortDate(day.day)}</text>)}
        <path d={area} className="stats-area" />
        <path d={line} className="stats-line" />
        {active && hover !== null && (
          <g>
            <line x1={x(hover)} x2={x(hover)} y1={pad.top} y2={y(0)} className="stats-crosshair" />
            <circle cx={x(hover)} cy={y(active.visitors)} r={5} className="stats-dot" />
          </g>
        )}
      </svg>
      {active && hover !== null && (
        <div className="stats-tooltip" style={{ left: `${(x(hover) / width) * 100}%` }}>
          <strong>{nf.format(active.visitors)}</strong> visitantes · {nf.format(active.pageviews)} páginas
          <span>{shortDate(active.day)}</span>
        </div>
      )}
      <details className="stats-table-toggle">
        <summary>Ver tabla</summary>
        <table className="stats-table compact"><thead><tr><th>Día</th><th>Visitantes</th><th>Páginas vistas</th></tr></thead>
          <tbody>{[...daily].reverse().map((day) => <tr key={day.day}><td>{shortDate(day.day)}</td><td>{nf.format(day.visitors)}</td><td>{nf.format(day.pageviews)}</td></tr>)}</tbody>
        </table>
      </details>
    </div>
  );
}

function Funnel({ funnel }: { funnel: Summary["funnel"] }) {
  const steps = [
    { label: "Visitaron la web", value: funnel.visitors },
    { label: "Vieron una oferta", value: funnel.offer_viewers },
    { label: "Pulsaron «Reservar»", value: funnel.checkout_starters },
    { label: "Enviaron una solicitud", value: funnel.lead_senders }
  ];
  const top = Math.max(1, steps[0].value);
  return (
    <div className="stats-funnel">
      {steps.map((step, index) => (
        <div className="stats-funnel-step" key={step.label} title={`${step.label}: ${nf.format(step.value)}`}>
          <div className="stats-funnel-head">
            <span>{step.label}</span>
            <strong>{nf.format(step.value)}</strong>
          </div>
          <div className="stats-bar-track"><span className="stats-bar" style={{ width: `${Math.max(step.value ? 1.5 : 0, (step.value / top) * 100)}%` }} /></div>
          {index > 0 && <small>{fmtPct(pct(step.value, steps[index - 1].value))} del paso anterior · {fmtPct(pct(step.value, top))} del total</small>}
        </div>
      ))}
      <p className="stats-funnel-side"><strong>{nf.format(funnel.whatsapp_clickers)}</strong> personas escribieron por WhatsApp ({fmtPct(pct(funnel.whatsapp_clickers, top))} de los visitantes).</p>
    </div>
  );
}

function BarList({ rows, showShare = false }: { rows: { label: string; value: number; note?: string }[]; showShare?: boolean }) {
  if (!rows.length) return <p className="stats-empty">Sin datos en este periodo.</p>;
  const max = Math.max(1, ...rows.map((row) => row.value));
  const total = rows.reduce((sum, row) => sum + row.value, 0);
  return (
    <ul className="stats-barlist">
      {rows.map((row) => (
        <li key={row.label} title={`${row.label}: ${nf.format(row.value)}`}>
          <div className="stats-barlist-head">
            <span className="stats-barlist-label">{row.label}</span>
            <strong>{nf.format(row.value)}{showShare && total ? <small> · {fmtPct(pct(row.value, total))}</small> : null}</strong>
          </div>
          <div className="stats-bar-track"><span className="stats-bar" style={{ width: `${Math.max(1.5, (row.value / max) * 100)}%` }} /></div>
          {row.note && <small className="stats-barlist-note">{row.note}</small>}
        </li>
      ))}
    </ul>
  );
}

function HoursChart({ hours }: { hours: Summary["hours"] }) {
  const [hover, setHover] = useState<number | null>(null);
  const width = 960;
  const height = 170;
  const pad = { top: 10, bottom: 22, left: 8, right: 8 };
  const max = Math.max(1, ...hours.map((hour) => hour.visitors));
  const slot = (width - pad.left - pad.right) / 24;
  const barW = Math.min(18, slot - 4);
  const innerH = height - pad.top - pad.bottom;
  return (
    <div className="stats-chart">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Visitantes por hora">
        <line x1={pad.left} x2={width - pad.right} y1={pad.top + innerH} y2={pad.top + innerH} className="stats-grid-line" />
        {hours.map((hour) => {
          const h = (hour.visitors / max) * innerH;
          const x = pad.left + hour.hour * slot + (slot - barW) / 2;
          const yTop = pad.top + innerH - h;
          const r = Math.min(4, h / 2);
          return (
            <g key={hour.hour} onPointerEnter={() => setHover(hour.hour)} onPointerLeave={() => setHover(null)} tabIndex={0} onFocus={() => setHover(hour.hour)} onBlur={() => setHover(null)}>
              <rect x={pad.left + hour.hour * slot} y={pad.top} width={slot} height={innerH} fill="transparent" />
              {hour.visitors > 0 && <path className={`stats-column ${hover === hour.hour ? "hover" : ""}`} d={`M${x},${pad.top + innerH} V${yTop + r} Q${x},${yTop} ${x + r},${yTop} H${x + barW - r} Q${x + barW},${yTop} ${x + barW},${yTop + r} V${pad.top + innerH} Z`} />}
              {hour.hour % 3 === 0 && <text x={x + barW / 2} y={height - 6} textAnchor="middle" className="stats-axis">{String(hour.hour).padStart(2, "0")}h</text>}
            </g>
          );
        })}
      </svg>
      {hover !== null && (
        <div className="stats-tooltip" style={{ left: `${((pad.left + hover * slot + slot / 2) / width) * 100}%` }}>
          <strong>{nf.format(hours[hover]?.visitors ?? 0)}</strong> visitantes<span>{String(hover).padStart(2, "0")}:00 – {String(hover).padStart(2, "0")}:59</span>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
// Tables
// ---------------------------------------------------------------------------------------------
type SortKey = "title" | "views" | "visitors" | "card_clicks" | "checkouts" | "whatsapp" | "leads" | "interest" | "conversion";

function OffersTable({ offers }: { offers: OfferStats[] }) {
  const [sort, setSort] = useState<SortKey>("views");
  const rows = useMemo(() => offers.map((offer) => ({
    ...offer,
    interest: pct(offer.checkouts + offer.whatsapp, offer.visitors),
    conversion: pct(offer.leads, offer.visitors)
  })).sort((a, b) => (sort === "title" ? a.title.localeCompare(b.title) : (b[sort] as number) - (a[sort] as number))), [offers, sort]);
  if (!rows.length) return <p className="stats-empty">Todavía nadie vio una oferta en este periodo.</p>;
  const maxViews = Math.max(1, ...rows.map((row) => row.views));
  const columns: { key: SortKey; label: string; hint?: string }[] = [
    { key: "title", label: "Oferta" },
    { key: "views", label: "Vistas" },
    { key: "visitors", label: "Visitantes" },
    { key: "card_clicks", label: "Clics en tarjeta", hint: "Clics en la tarjeta de la oferta desde listados" },
    { key: "checkouts", label: "«Reservar»", hint: "Pulsaron el botón Reservar" },
    { key: "whatsapp", label: "WhatsApp", hint: "Clics en WhatsApp desde esta oferta" },
    { key: "leads", label: "Solicitudes" },
    { key: "interest", label: "Interés", hint: "(«Reservar» + WhatsApp) ÷ visitantes" },
    { key: "conversion", label: "Conversión", hint: "Solicitudes ÷ visitantes" }
  ];
  return (
    <div className="stats-table-wrap">
      <table className="stats-table">
        <thead>
          <tr>{columns.map((column) => (
            <th key={column.key} title={column.hint} aria-sort={sort === column.key ? "descending" : undefined}>
              <button onClick={() => setSort(column.key)} className={sort === column.key ? "active" : ""}>{column.label}{sort === column.key ? " ↓" : ""}</button>
            </th>
          ))}</tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.slug}>
              <td className="stats-offer-cell">
                <a href={`/es/ofertas/${row.slug}`} target="_blank" rel="noreferrer">{row.title}</a>
                {row.is_sample && <small className="stats-tag">Ejemplo</small>}
              </td>
              <td><div className="stats-inline-bar"><span style={{ width: `${(row.views / maxViews) * 100}%` }} /></div>{nf.format(row.views)}</td>
              <td>{nf.format(row.visitors)}</td>
              <td>{nf.format(row.card_clicks)}</td>
              <td>{nf.format(row.checkouts)}</td>
              <td>{nf.format(row.whatsapp)}</td>
              <td>{nf.format(row.leads)}</td>
              <td>{fmtPct(row.interest)}</td>
              <td><strong>{fmtPct(row.conversion)}</strong></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CampaignsTable({ rows }: { rows: Summary["campaigns"] }) {
  if (!rows.length) return <p className="stats-empty">Todavía no llegaron visitas desde enlaces con seguimiento. Créalos en Ofertas → «Generador de enlaces» y úsalos en cada video o publicación.</p>;
  return (
    <div className="stats-table-wrap">
      <table className="stats-table">
        <thead><tr><th>Red</th><th className="text">Campaña</th><th className="text">Video / publicación</th><th>Visitantes</th><th>WhatsApp</th><th>Solicitudes</th></tr></thead>
        <tbody>{rows.map((row) => (
          <tr key={`${row.source}-${row.campaign}-${row.content}`}>
            <td>{SOURCE_NAMES[row.source] ?? row.source}</td><td className="text">{row.campaign ?? "—"}</td><td className="text">{row.content ?? "—"}</td>
            <td>{nf.format(row.visitors)}</td><td>{nf.format(row.whatsapp)}</td><td>{nf.format(row.leads)}</td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
}
