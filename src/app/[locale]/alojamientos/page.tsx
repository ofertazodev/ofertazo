import { redirect } from "next/navigation";
import { resolveLocale } from "@/i18n";
import { href } from "@/i18n/format";
import type { SearchParams } from "@/lib/search-params";

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<SearchParams> };

/** The accommodation search now lives on the home page; keep old shared links working. */
export default async function AccommodationsPage({ params, searchParams }: Props) {
  const [{ locale }, query] = await Promise.all([resolveLocale(params), searchParams]);
  const qs = new URLSearchParams(Object.entries(query).flatMap(([key, value]) => (typeof value === "string" ? [[key, value]] : []))).toString();
  redirect(`${href(locale, "/")}${qs ? `?${qs}` : ""}#alojamientos`);
}
