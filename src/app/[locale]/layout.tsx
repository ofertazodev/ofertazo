import type { Metadata, Viewport } from "next";
import "../globals.css";
import "../platform.css";
import { Analytics } from "@/components/site/Analytics";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { WhatsAppButton } from "@/components/site/WhatsAppButton";
import { locales, resolveLocale } from "@/i18n";
import { siteUrl } from "@/lib/whatsapp";

type Props = { children: React.ReactNode; params: Promise<{ locale: string }> };

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#ffffff" };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, dict } = await resolveLocale(params);
  return {
    metadataBase: new URL(siteUrl),
    title: { default: dict.meta.title, template: "%s | Tripya" },
    description: dict.meta.description,
    alternates: { languages: Object.fromEntries(locales.map((item) => [item, `/${item}`])) },
    openGraph: { siteName: "Tripya", locale, type: "website" }
  };
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale, dict } = await resolveLocale(params);
  return (
    <html lang={locale}>
      <body>
        <Header locale={locale} nav={dict.nav} auth={dict.auth} />
        <main>{children}</main>
        <Footer locale={locale} dict={dict} />
        <WhatsAppButton variant="floating" placement="floating" message={dict.whatsapp.generalMessage} label={dict.whatsapp.floating} />
        <Analytics locale={locale} cookies={dict.cookies} policyLabel={dict.legal.cookies} />
      </body>
    </html>
  );
}
