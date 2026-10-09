/** Business WhatsApp number in international format, digits only (e.g. 59170000000). */
export const whatsappNumber = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "").replace(/\D/g, "");
export const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "";
export const siteUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");

/** Returns a wa.me link with a prefilled message, or null when no number is configured. */
export function whatsappUrl(message: string): string | null {
  if (!whatsappNumber) return null;
  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
}
