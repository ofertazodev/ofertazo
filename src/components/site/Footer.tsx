import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/es";
import { fmt, href } from "@/i18n/format";
import { supportEmail, whatsappUrl } from "@/lib/whatsapp";
import { Brand } from "./Brand";

export function Footer({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const wa = whatsappUrl(dict.whatsapp.generalMessage);
  return (
    <footer className="footer">
      <div className="shell footer-grid">
        <div className="footer-brand">
          <Brand locale={locale} inverse />
          <p>{dict.footer.tagline}</p>
          <span className="footer-small">{fmt(dict.footer.rights, { year: new Date().getFullYear() })}</span>
        </div>
        <div>
          <h3>{dict.footer.explore}</h3>
          <Link href={href(locale, "/ofertas")}>{dict.nav.offers}</Link>
          <Link href={href(locale, "/destinos")}>{dict.nav.destinations}</Link>
          <Link href={href(locale, "/ofertas?flash=1")}>{dict.nav.flash}</Link>
        </div>
        <div>
          <h3>{dict.footer.company}</h3>
          <Link href={href(locale, "/verificacion")}>{dict.footer.verification}</Link>
          <Link href={href(locale, "/ayuda")}>{dict.nav.help}</Link>
          <Link href={href(locale, "/proveedores")}>{dict.nav.publish}</Link>
          {wa && <a href={wa} target="_blank" rel="noreferrer">WhatsApp</a>}
          {supportEmail && <a href={`mailto:${supportEmail}`}>{supportEmail}</a>}
        </div>
        <div>
          <h3>{dict.footer.legal}</h3>
          <Link href={href(locale, "/legal/terminos")}>{dict.legal.terms}</Link>
          <Link href={href(locale, "/legal/condiciones-reserva")}>{dict.legal.bookingConditions}</Link>
          <Link href={href(locale, "/legal/cancelacion")}>{dict.legal.cancellation}</Link>
          <Link href={href(locale, "/legal/reembolsos")}>{dict.legal.refunds}</Link>
          <Link href={href(locale, "/legal/privacidad")}>{dict.legal.privacy}</Link>
          <Link href={href(locale, "/legal/cookies")}>{dict.legal.cookies}</Link>
        </div>
      </div>
    </footer>
  );
}
