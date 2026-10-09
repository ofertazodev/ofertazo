import type { Metadata } from "next";
import { BadgeCheck, Camera, FileCheck2, IdCard, ListChecks, MapPin, MessageCircle, Star } from "lucide-react";
import { WhatsAppButton } from "@/components/site/WhatsAppButton";
import { resolveLocale } from "@/i18n";

export const revalidate = 3600;

type Props = { params: Promise<{ locale: string }> };

const icons = [IdCard, MapPin, Camera, ListChecks, FileCheck2];

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { dict } = await resolveLocale(params);
  return { title: dict.verification.title, description: dict.verification.lead };
}

export default async function VerificationPage({ params }: Props) {
  const { dict } = await resolveLocale(params);
  const t = dict.verification;
  return (
    <section className="shell page-section narrow">
      <p className="eyebrow warm"><BadgeCheck size={15} /> {t.eyebrow}</p>
      <h1 className="page-title">{t.title}</h1>
      <p className="section-lead">{t.lead}</p>
      <ul className="feature-list">
        {t.checks.map((check, index) => {
          const Icon = icons[index] ?? BadgeCheck;
          return <li key={check.title}><Icon size={22} /><div><h3>{check.title}</h3><p>{check.text}</p></div></li>;
        })}
      </ul>
      <div className="info-card"><Star size={20} /><div><h3>{t.reviewsTitle}</h3><p>{t.reviewsText}</p></div></div>
      <div className="info-card"><MessageCircle size={20} /><div><h3>{t.problemTitle}</h3><p>{t.problemText}</p><WhatsAppButton placement="verification" message={dict.whatsapp.generalMessage} label={dict.help.whatsappCta} /></div></div>
    </section>
  );
}
