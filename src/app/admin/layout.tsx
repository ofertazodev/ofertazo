import type { Metadata } from "next";
import "../globals.css";
import "../platform.css";
import { fontVariables } from "../fonts";

export const metadata: Metadata = { title: "Panel admin | Tripya", robots: { index: false, follow: false } };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={fontVariables}>
      <body>{children}</body>
    </html>
  );
}
