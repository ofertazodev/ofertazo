"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, Globe, LayoutDashboard, LogOut, Menu, X } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { LOCALE_COOKIE, localeNames, locales, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/es";
import { href } from "@/i18n/format";
import { track } from "@/lib/analytics";
import { supabase } from "@/lib/supabase-browser";
import { Brand } from "./Brand";
import { Modal } from "./Modal";

type Props = { locale: Locale; nav: Dictionary["nav"]; auth: Dictionary["auth"] };

export function Header({ locale, nav, auth }: Props) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    const client = supabase;
    async function refresh(nextUser: User | null) {
      setUser(nextUser);
      if (!nextUser) { setIsAdmin(false); return; }
      const { data } = await client.from("user_roles").select("role").eq("user_id", nextUser.id);
      setIsAdmin(Boolean(data?.some(({ role }) => ["admin", "superadmin", "finance_admin"].includes(role))));
    }
    void client.auth.getUser().then(({ data }) => refresh(data.user));
    const { data: listener } = client.auth.onAuthStateChange((_event, session) => { void refresh(session?.user ?? null); });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => { setMenuOpen(false); setLangOpen(false); }, [pathname]);

  function switchLocale(next: Locale) {
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    track("language_change", { language: next });
    const segments = pathname.split("/");
    segments[1] = next;
    window.location.assign(segments.join("/") + window.location.search);
  }

  const links = [
    { path: "/ofertas", label: nav.offers },
    { path: "/destinos", label: nav.destinations },
    { path: "/ofertas?flash=1", label: nav.flash },
    { path: "/ayuda", label: nav.help }
  ];

  return (
    <header className="site-header">
      <nav className="navbar shell">
        <Brand locale={locale} />
        <div className={`nav-links ${menuOpen ? "open" : ""}`}>
          {links.map((link) => <Link key={link.path} href={href(locale, link.path)}>{link.label}</Link>)}
          <Link className="nav-links-cta" href={href(locale, "/proveedores")}>{nav.publish}</Link>
        </div>
        <div className="nav-actions">
          <div className="lang-switch">
            <button className="ghost-button" aria-label={nav.language} aria-expanded={langOpen} onClick={() => setLangOpen(!langOpen)}><Globe size={16} /> {locale.toUpperCase()}</button>
            {langOpen && <div className="lang-menu">{locales.map((item) => <button key={item} className={item === locale ? "active" : ""} onClick={() => switchLocale(item)}>{localeNames[item]}</button>)}</div>}
          </div>
          {isAdmin && <Link className="ghost-button desktop-only" href="/admin"><LayoutDashboard size={16} /> {nav.admin}</Link>}
          {user
            ? <button className="ghost-button desktop-only" onClick={() => void supabase?.auth.signOut()} title={user.email ?? ""}><LogOut size={16} /> {nav.logout}</button>
            : <button className="ghost-button desktop-only" onClick={() => setAuthOpen(true)}>{nav.login}</button>}
          <Link className="nav-cta" href={href(locale, "/proveedores")}>{nav.publish} <ArrowRight size={16} /></Link>
          <button className="menu-button" aria-label={nav.menu} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X /> : <Menu />}</button>
        </div>
      </nav>
      {authOpen && <AuthModal auth={auth} onClose={() => setAuthOpen(false)} />}
    </header>
  );
}

function AuthModal({ auth, onClose }: { auth: Dictionary["auth"]; onClose: () => void }) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) { setMessage(auth.notConfigured); return; }
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");
    setBusy(true);
    const result = mode === "signup" ? await supabase.auth.signUp({ email, password }) : await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (result.error) { setMessage(result.error.message); return; }
    if (mode === "signup" && !result.data.session) { setMessage(auth.confirmEmail); return; }
    onClose();
  }

  async function google() {
    if (!supabase) { setMessage(auth.notConfigured); return; }
    const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.href } });
    if (error) setMessage(error.message);
  }

  return (
    <Modal title={mode === "signup" ? auth.signupTitle : auth.loginTitle} onClose={onClose}>
      <p className="modal-kicker">{auth.kicker}</p>
      <h2>{mode === "signup" ? auth.signupTitle : auth.loginTitle}</h2>
      <p className="modal-copy">{auth.text}</p>
      <button className="google-button" onClick={google}><span className="google-mark">G</span> {auth.google}</button>
      <div className="auth-divider"><span>{auth.divider}</span></div>
      <form className="modal-form" onSubmit={submit}>
        <label>{auth.email}<input name="email" type="email" autoComplete="email" required /></label>
        <label>{auth.password}<input name="password" type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} minLength={8} required placeholder={auth.passwordPlaceholder} /></label>
        {message && <p className="form-message">{message}</p>}
        <button className="dark-button form-button" disabled={busy}>{mode === "signup" ? auth.signup : auth.login} <ArrowRight size={17} /></button>
      </form>
      <button className="modal-secondary" onClick={() => { setMode(mode === "signup" ? "login" : "signup"); setMessage(""); }}>{mode === "signup" ? auth.switchToLogin : auth.switchToSignup}</button>
    </Modal>
  );
}
