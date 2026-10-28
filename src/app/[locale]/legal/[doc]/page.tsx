import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Mail } from "lucide-react";
import { legalDocs } from "@/content/legal";
import { fmt, resolveLocale } from "@/i18n";
import { formatDate } from "@/lib/dates";
import { supportEmail } from "@/lib/whatsapp";

/** Renders a paragraph, turning "{email}" into a mailto link to the support address. */
function withEmail(text: string) {
  return text.split("{email}").flatMap((part, index) => index === 0 ? [part] : [<a key={index} href={`mailto:${supportEmail}`}>{supportEmail}</a>, part]);
}

type Props = { params: Promise<{ locale: string; doc: string }> };

export function generateStaticParams() {
  return Object.keys(legalDocs).map((doc) => ({ doc }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { dict } = await resolveLocale(params);
  const doc = legalDocs[(await params).doc];
  return doc ? { title: dict.legal[doc.titleKey], robots: { index: false } } : {};
}

export default async function LegalPage({ params }: Props) {
  const { locale, dict } = await resolveLocale(params);
  const doc = legalDocs[(await params).doc];
  if (!doc) notFound();
  return (
    <article className="shell page-section narrow legal-page">
      <h1 className="page-title">{dict.legal[doc.titleKey]}</h1>
      <p className="muted">{fmt(dict.legal.updated, { date: formatDate(doc.updated, locale, { day: "numeric", month: "long", year: "numeric" }) })}</p>
      {(doc.content[locale] ?? doc.content.en).map((section) => (
        <section key={section.heading}>
          <h2>{section.heading}</h2>
          {section.paragraphs.map((paragraph) => <p key={paragraph}>{withEmail(paragraph)}</p>)}
        </section>
      ))}
      <p className="legal-contact"><Mail size={18} /> <span>{withEmail(dict.legal.contact)}</span></p>
    </article>
  );
}
