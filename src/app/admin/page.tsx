"use client";

import { FormEvent, useEffect, useState } from "react";
import { ArrowLeft, BarChart3, BriefcaseBusiness, CalendarCheck, ExternalLink, ImagePlus, LogOut, MapPin, Package, ShieldAlert, Users, X } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import Link from "next/link";
import dynamic from "next/dynamic";
import { supabase } from "@/lib/supabase-browser";

const LocationPicker = dynamic(() => import("@/components/LocationPicker"), { ssr: false });

const metricDefaults = { offers: 0, bookings: 0, providers: 0, users: 0 };
const emptyOffer = { title: "", description: "", category: "tour" as "accommodation" | "tour" | "package", destination: "", address: "", latitude: "", longitude: "", originalPrice: "", promotionalPrice: "", duration: "", includes: "", startsAt: "", endsAt: "", maxUnits: "" };

export default function AdminPage() {
  const [user, setUser] = useState<User | null>(null);
  const [allowed, setAllowed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState(metricDefaults);
  const [message, setMessage] = useState("");
  const [offerFormOpen, setOfferFormOpen] = useState(false);
  const [offerForm, setOfferForm] = useState(emptyOffer);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [savingOffer, setSavingOffer] = useState(false);
  const [offerMessage, setOfferMessage] = useState("");
  const [adminNotice, setAdminNotice] = useState("");

  useEffect(() => {
    async function loadAdmin() {
      if (!supabase) { setMessage("Supabase no está configurado en este entorno."); setLoading(false); return; }
      const { data: authData } = await supabase.auth.getUser();
      setUser(authData.user);
      if (!authData.user) { setLoading(false); return; }
      const { data: roleData, error: roleError } = await supabase.from("user_roles").select("role").eq("user_id", authData.user.id);
      const hasAccess = !roleError && Boolean(roleData?.some(({ role }) => ["admin", "superadmin", "finance_admin"].includes(role)));
      setAllowed(hasAccess);
      if (!hasAccess) { setMessage("Tu cuenta todavía no tiene un rol administrativo."); setLoading(false); return; }
      const [offersResult, bookingsResult, providersResult, usersResult] = await Promise.all([
        supabase.from("offers").select("id", { count: "exact", head: true }),
        supabase.from("bookings").select("id", { count: "exact", head: true }),
        supabase.from("providers").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true })
      ]);
      setMetrics({ offers: offersResult.count ?? 0, bookings: bookingsResult.count ?? 0, providers: providersResult.count ?? 0, users: usersResult.count ?? 0 });
      setLoading(false);
    }
    void loadAdmin();
  }, []);

  async function signOut() {
    await supabase?.auth.signOut();
    window.location.href = "/";
  }

  function updateOfferField(field: keyof typeof emptyOffer, value: string) {
    setOfferForm((current) => ({ ...current, [field]: value }));
  }

  function selectMedia(files: FileList | null) {
    if (!files) return;
    setMediaFiles(Array.from(files).slice(0, 8));
  }

  async function saveOffer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || !user) return;
    setSavingOffer(true); setOfferMessage("");
    try {
      if (Number(offerForm.promotionalPrice) > Number(offerForm.originalPrice)) throw new Error("El precio de promoción no puede ser mayor que el precio normal.");
      if (offerForm.category === "accommodation" && (!offerForm.address || !offerForm.latitude || !offerForm.longitude)) throw new Error("Para un hospedaje debes completar la dirección y seleccionar una ubicación en el mapa.");
      if (offerForm.startsAt && offerForm.endsAt && new Date(offerForm.endsAt) <= new Date(offerForm.startsAt)) throw new Error("La fecha de finalización debe ser posterior a la fecha de inicio.");
      const slug = `${offerForm.title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${Date.now()}`;
      const country = await supabase.from("country_settings").upsert({ country_code: "BO", name: "Bolivia", default_currency_code: "BOB", timezone: "America/La_Paz" }, { onConflict: "country_code" }).select("country_code").single();
      if (country.error) throw country.error;
      const destination = await supabase.from("destinations").insert({ country_code: "BO", name: offerForm.destination, slug: `${slug}-destination`, kind: "city", description: offerForm.address, address: offerForm.address || null, latitude: offerForm.latitude ? Number(offerForm.latitude) : null, longitude: offerForm.longitude ? Number(offerForm.longitude) : null, is_published: true }).select("id").single();
      if (destination.error) throw destination.error;
      const provider = await supabase.from("providers").insert({ owner_id: user.id, legal_name: "Ofertazo Travel", trade_name: "Ofertazo Travel", email: user.email ?? "", country_code: "BO", status: "approved" }).select("id").single();
      if (provider.error) throw provider.error;
      const product = await supabase.from("products").insert({ provider_id: provider.data.id, destination_id: destination.data.id, type: offerForm.category, slug, title: offerForm.title, description: offerForm.description, currency_code: "BOB", base_price_minor: Math.round(Number(offerForm.promotionalPrice) * 100), duration_label: offerForm.duration, includes: offerForm.includes.split(",").map((item) => item.trim()).filter(Boolean), is_published: true }).select("id").single();
      if (product.error) throw product.error;
      const offer = await supabase.from("offers").insert({ product_id: product.data.id, kind: offerForm.endsAt ? "flash" : "normal", title: offerForm.title, original_price_minor: Math.round(Number(offerForm.originalPrice) * 100), promotional_price_minor: Math.round(Number(offerForm.promotionalPrice) * 100), currency_code: "BOB", starts_at: offerForm.startsAt || null, ends_at: offerForm.endsAt || null, max_units: offerForm.maxUnits ? Number(offerForm.maxUnits) : null, is_published: true }).select("id").single();
      if (offer.error) throw offer.error;
      for (const [index, file] of mediaFiles.entries()) {
        const path = `${user.id}/${product.data.id}/${index}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
        const upload = await supabase.storage.from("offer-media").upload(path, file, { upsert: true, contentType: file.type });
        if (upload.error) throw upload.error;
        const publicUrl = supabase.storage.from("offer-media").getPublicUrl(path).data.publicUrl;
        const media = await supabase.from("product_media").insert({ product_id: product.data.id, storage_path: path, public_url: publicUrl, alt_text: offerForm.title, sort_order: index });
        if (media.error) throw media.error;
      }
      setOfferForm(emptyOffer); setMediaFiles([]); setOfferFormOpen(false); setOfferMessage("Oferta publicada correctamente."); setMetrics((current) => ({ ...current, offers: current.offers + 1 }));
    } catch (error) {
      setOfferMessage(error instanceof Error ? error.message : "No se pudo publicar la oferta.");
    } finally { setSavingOffer(false); }
  }

  if (loading) return <main className="admin-page"><div className="admin-loading">Cargando panel...</div></main>;
  if (!user) return <main className="admin-page"><div className="admin-gate"><ShieldAlert size={38} /><p className="modal-kicker">PANEL ADMINISTRATIVO</p><h1>Inicia sesión para continuar.</h1><p>El panel está separado del catálogo público y requiere una cuenta autorizada.</p><Link className="dark-button" href="/">Volver al inicio</Link></div></main>;
  if (!allowed) return <main className="admin-page"><div className="admin-gate"><ShieldAlert size={38} /><p className="modal-kicker">ACCESO RESTRINGIDO</p><h1>Tu cuenta no es administradora.</h1><p>{message}</p><button className="dark-button" onClick={signOut}>Cerrar sesión <LogOut size={16} /></button></div></main>;

  const cards = [
    { label: "Ofertas publicadas", value: metrics.offers, icon: Package },
    { label: "Reservas", value: metrics.bookings, icon: CalendarCheck },
    { label: "Proveedores", value: metrics.providers, icon: BriefcaseBusiness },
    { label: "Usuarios", value: metrics.users, icon: Users }
  ];

  return <main className="admin-page"><nav className="admin-nav shell"><Link className="brand" href="/"><span className="brand-mark">O</span><span>ofertazo<span className="brand-dot">.</span></span></Link><div className="admin-nav-actions"><span>{user.email}</span><button onClick={signOut} aria-label="Cerrar sesión"><LogOut size={17} /></button></div></nav><section className="shell admin-content"><div className="admin-heading"><div><p className="eyebrow warm">CENTRO DE CONTROL</p><h1>Panel <em>admin.</em></h1><p>Una vista rápida de la operación de Ofertazo.</p></div></div><div className="admin-actions"><button className="dark-button" onClick={() => { setOfferMessage(""); setOfferFormOpen(true); }}><Package size={17} /> Nueva oferta</button><Link className="admin-action-link" href="/"><ExternalLink size={17} /> Página principal</Link><button className="admin-action-link" onClick={() => setAdminNotice("Las reservas aparecerán aquí cuando los viajeros comiencen a reservar.")}><CalendarCheck size={17} /> Reservas</button><button className="admin-action-link" onClick={() => setAdminNotice("Los proveedores pendientes aparecerán aquí cuando se registren nuevos negocios.")}><BriefcaseBusiness size={17} /> Proveedores</button></div>{offerMessage && <p className="admin-notice">{offerMessage}</p>}{adminNotice && <p className="admin-notice">{adminNotice}</p>}<div className="admin-metrics">{cards.map(({ label, value, icon: Icon }) => <article className="admin-metric" key={label}><Icon size={20} /><span>{label}</span><strong>{value}</strong></article>)}</div><div className="admin-grid"><section className="admin-panel-card admin-activity"><div className="admin-panel-title"><div><p className="eyebrow warm">ACTIVIDAD</p><h2>Resumen operativo</h2></div><BarChart3 size={22} /></div><div className="admin-bars"><span style={{ height: "42%" }} /><span style={{ height: "68%" }} /><span style={{ height: "51%" }} /><span style={{ height: "84%" }} /><span style={{ height: "72%" }} /><span style={{ height: "92%" }} /><span style={{ height: "78%" }} /></div><div className="admin-days"><span>L</span><span>M</span><span>X</span><span>J</span><span>V</span><span>S</span><span>D</span></div></section><section className="admin-panel-card admin-shortcuts"><p className="eyebrow warm">GESTIÓN</p><h2>Accesos rápidos</h2><button onClick={() => setOfferFormOpen(true)}><Package size={18} /> Nueva oferta <span>›</span></button><Link href="/" className="admin-shortcut-link"><ExternalLink size={18} /> Ver página pública <span>›</span></Link><button onClick={() => setAdminNotice("Las reservas aparecerán aquí cuando los viajeros comiencen a reservar.")}><CalendarCheck size={18} /> Ver reservas <span>›</span></button><button onClick={() => setAdminNotice("Los proveedores pendientes aparecerán aquí cuando se registren nuevos negocios.")}><BriefcaseBusiness size={18} /> Proveedores pendientes <span>›</span></button></section></div></section>
    {offerFormOpen && <div className="modal-backdrop" role="presentation" onMouseDown={() => setOfferFormOpen(false)}><section className="modal-card admin-offer-modal" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}><button className="modal-close" aria-label="Cerrar" onClick={() => setOfferFormOpen(false)}><X size={19} /></button><p className="modal-kicker">NUEVA PUBLICACIÓN</p><h2>Cargar oferta o promoción.</h2><p className="modal-copy">Publica hasta 8 imágenes, fechas, descuento y ubicación para que el viajero encuentre todos los detalles.</p>{offerMessage && <p className="form-message">{offerMessage}</p>}<form className="admin-offer-form" onSubmit={saveOffer}><div className="admin-form-grid"><label>Título<input required value={offerForm.title} onChange={(event) => updateOfferField("title", event.target.value)} placeholder="Ej. Fin de semana en Uyuni" /></label><label>Tipo<select value={offerForm.category} onChange={(event) => updateOfferField("category", event.target.value)}><option value="accommodation">Hospedaje</option><option value="tour">Tour</option><option value="package">Paquete</option></select></label></div><label>Descripción<textarea required value={offerForm.description} onChange={(event) => updateOfferField("description", event.target.value)} placeholder="Describe la experiencia, beneficios y condiciones" /></label><div className="admin-form-grid"><label>Destino / ciudad<input required value={offerForm.destination} onChange={(event) => updateOfferField("destination", event.target.value)} placeholder="Uyuni" /></label><label>Duración<input value={offerForm.duration} onChange={(event) => updateOfferField("duration", event.target.value)} placeholder="3 días / 2 noches" /></label></div><label>Dirección o referencia<textarea value={offerForm.address} onChange={(event) => updateOfferField("address", event.target.value)} placeholder="Dirección del hotel o punto de encuentro" /></label><div className="map-picker-field"><LocationPicker latitude={offerForm.latitude} longitude={offerForm.longitude} onChange={(latitude, longitude) => setOfferForm((current) => ({ ...current, latitude, longitude }))} /></div><div className="admin-form-grid"><label>Latitud<input type="number" step="any" value={offerForm.latitude} onChange={(event) => updateOfferField("latitude", event.target.value)} placeholder="-20.4600" /></label><label>Longitud<input type="number" step="any" value={offerForm.longitude} onChange={(event) => updateOfferField("longitude", event.target.value)} placeholder="-66.8260" /></label></div><div className="map-hint"><MapPin size={17} /> El pin del mapa actualiza automáticamente estas coordenadas.</div><div className="admin-form-grid"><label>Precio normal (Bs)<input required type="number" min="0" step="0.01" value={offerForm.originalPrice} onChange={(event) => updateOfferField("originalPrice", event.target.value)} /></label><label>Precio promoción (Bs)<input required type="number" min="0" step="0.01" value={offerForm.promotionalPrice} onChange={(event) => updateOfferField("promotionalPrice", event.target.value)} /></label></div><label>Incluye <input value={offerForm.includes} onChange={(event) => updateOfferField("includes", event.target.value)} placeholder="Desayuno, transporte, guía" /></label><div className="admin-form-grid"><label>Disponible desde<input type="datetime-local" value={offerForm.startsAt} onChange={(event) => updateOfferField("startsAt", event.target.value)} /></label><label>Disponible hasta<input type="datetime-local" value={offerForm.endsAt} onChange={(event) => updateOfferField("endsAt", event.target.value)} /></label></div><label>Cupos disponibles<input type="number" min="1" value={offerForm.maxUnits} onChange={(event) => updateOfferField("maxUnits", event.target.value)} placeholder="Opcional" /></label><label className="upload-box"><ImagePlus size={20} /> Imágenes (máximo 8)<input type="file" accept="image/*" multiple onChange={(event) => selectMedia(event.target.files)} />{mediaFiles.length > 0 && <span>{mediaFiles.length} imagen(es) seleccionada(s)</span>}</label><button className="dark-button form-button" disabled={savingOffer}>{savingOffer ? "Publicando..." : "Publicar oferta"} <ArrowLeft size={17} /></button></form></section></div>}
  </main>;
}
