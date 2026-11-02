import type { Metadata } from "next";
import "../globals.css";
import "../platform.css";
import { fontVariables } from "../fonts";

export const metadata: Metadata = { title: "Panel de socios | Tripya", robots: { index: false, follow: false } };

export default function PartnerLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={fontVariables}>
      <body>{children}</body>
    </html>
  );
}
