"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Script from "next/script";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/es";
import { href } from "@/i18n/format";
import { CONSENT_EVENT, captureAttribution, readConsent, saveConsent, type Consent } from "@/lib/analytics";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

/** Cookie banner + Google Analytics 4 (loaded only after the visitor accepts) + UTM capture. */
export function Analytics({ locale, cookies, policyLabel }: { locale: Locale; cookies: Dictionary["cookies"]; policyLabel: string }) {
  const [consent, setConsent] = useState<Consent | null | "unknown">("unknown");

  useEffect(() => {
    captureAttribution();
    setConsent(readConsent());
    const onChange = (event: Event) => setConsent((event as CustomEvent<Consent>).detail);
    window.addEventListener(CONSENT_EVENT, onChange);
    return () => window.removeEventListener(CONSENT_EVENT, onChange);
  }, []);

  return (
    <>
      {GA_ID && consent === "granted" && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
          <Script id="ga4" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;gtag('js',new Date());gtag('config','${GA_ID}',{anonymize_ip:true});`}
          </Script>
        </>
      )}
      {GA_ID && consent === null && (
        <div className="cookie-banner" role="dialog" aria-label={policyLabel}>
          <p>{cookies.text} <Link href={href(locale, "/legal/cookies")}>{cookies.more}</Link></p>
          <div>
            <button className="ghost-button" onClick={() => saveConsent("denied")}>{cookies.reject}</button>
            <button className="dark-button" onClick={() => saveConsent("granted")}>{cookies.accept}</button>
          </div>
        </div>
      )}
    </>
  );
}
