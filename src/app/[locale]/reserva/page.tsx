import { redirect } from "next/navigation";
import { href, resolveLocale } from "@/i18n";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<{ code?: string }> };

/** Lookup form target (/reserva?code=TYA-XXXXXX) -> /reserva/TYA-XXXXXX, or back to Help. Older OFZ- codes still work. */
export default async function BookingLookupPage({ params, searchParams }: Props) {
  const { locale } = await resolveLocale(params);
  const code = ((await searchParams).code ?? "").trim().toUpperCase().replace(/\s+/g, "");
  const normalized = /^(TYA|OFZ)-?[A-Z0-9]{6}$/.test(code) ? code.replace(/^(TYA|OFZ)-?/, "$1-") : null;
  redirect(normalized ? href(locale, `/reserva/${normalized}`) : `${href(locale, "/ayuda")}#consultar`);
}
