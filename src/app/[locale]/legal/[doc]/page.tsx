import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { legalDocs } from "@/content/legal";
import { fmt, resolveLocale } from "@/i18n";
import { formatDate } from "@/lib/dates";

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
      <p className="draft-notice"><AlertTriangle size={16} /> {dict.legal.draftNotice}</p>
      {locale !== "es" && <p className="translation-note">{dict.common.translationPending}</p>}
      <p className="muted">{fmt(dict.legal.updated, { date: formatDate(doc.updated, locale, { day: "numeric", month: "long", year: "numeric" }) })}</p>
      {doc.sections.map((section) => (
        <section key={section.heading}>
          <h2>{section.heading}</h2>
          {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        </section>
      ))}
    </article>
  );
}
