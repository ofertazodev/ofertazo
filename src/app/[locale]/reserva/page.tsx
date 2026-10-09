import { redirect } from "next/navigation";
import { href, resolveLocale } from "@/i18n";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<{ code?: string }> };

/** Lookup form target (/reserva?code=OFZ-XXXXXX) -> /reserva/OFZ-XXXXXX, or back to Help. */
export default async function BookingLookupPage({ params, searchParams }: Props) {
  const { locale } = await resolveLocale(params);
  const code = ((await searchParams).code ?? "").trim().toUpperCase().replace(/\s+/g, "");
  const normalized = /^OFZ-?[A-Z0-9]{6}$/.test(code) ? code.replace(/^OFZ-?/, "OFZ-") : null;
  redirect(normalized ? href(locale, `/reserva/${normalized}`) : `${href(locale, "/ayuda")}#consultar`);
}
