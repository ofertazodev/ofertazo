import type { Metadata } from "next";
import "../globals.css";
import "../platform.css";

export const metadata: Metadata = { title: "Panel admin | Tripya", robots: { index: false, follow: false } };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
