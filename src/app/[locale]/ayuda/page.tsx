import type { Metadata } from "next";
import { ArrowRight, Clock, LifeBuoy, Mail } from "lucide-react";
import { WhatsAppButton } from "@/components/site/WhatsAppButton";
import { href, resolveLocale } from "@/i18n";
import { supportEmail } from "@/lib/whatsapp";

export const revalidate = 3600;

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { dict } = await resolveLocale(params);
  return { title: dict.help.title, description: dict.help.lead };
}

export default async function HelpPage({ params }: Props) {
  const { locale, dict } = await resolveLocale(params);
  const t = dict.help;
  return (
    <section className="shell page-section narrow">
      <p className="eyebrow warm"><LifeBuoy size={15} /> {t.eyebrow}</p>
      <h1 className="page-title">{t.title}</h1>
      <p className="section-lead">{t.lead}</p>
      <div className="help-actions">
        <WhatsAppButton placement="help" message={dict.whatsapp.generalMessage} label={t.whatsappCta} variant="block" />
        {supportEmail && <a className="ghost-button outlined" href={`mailto:${supportEmail}`}><Mail size={17} /> {t.emailCta}</a>}
      </div>
      <p className="muted"><Clock size={15} /> {t.hours}</p>

      <form className="info-card lookup-inline" id="consultar" action={href(locale, "/reserva")} method="get">
        <h2>{t.lookupTitle}</h2>
        <label>{dict.confirmation.lookupCode}<input name="code" required placeholder="OFZ-XXXXXX" maxLength={11} autoCapitalize="characters" /></label>
        <button className="dark-button">{dict.confirmation.lookupButton} <ArrowRight size={16} /></button>
      </form>

      <h2 className="group-title">{t.topicsTitle}</h2>
      <ul className="topic-list">{t.topics.map((topic) => <li key={topic}>{topic}</li>)}</ul>

      <h2 className="group-title">{t.faqTitle}</h2>
      <div className="faq">{t.faq.map((item) => <details key={item.q}><summary>{item.q}</summary><p>{item.a}</p></details>)}</div>
    </section>
  );
}
