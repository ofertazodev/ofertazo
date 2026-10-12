import type { Metadata } from "next";
import { NewPasswordForm } from "@/components/site/NewPasswordForm";
import { href, resolveLocale } from "@/i18n";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { dict } = await resolveLocale(params);
  return { title: dict.auth.newPasswordTitle, robots: { index: false, follow: false } };
}

export default async function NewPasswordPage({ params }: Props) {
  const { locale, dict } = await resolveLocale(params);
  return (
    <section className="shell page-section narrow-page">
      <header className="page-header">
        <p className="eyebrow warm">{dict.auth.kicker}</p>
        <h1 className="page-title">{dict.auth.newPasswordTitle}</h1>
        <p className="section-lead">{dict.auth.newPasswordText}</p>
      </header>
      <NewPasswordForm auth={dict.auth} homeHref={href(locale)} />
    </section>
  );
}
