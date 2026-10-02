import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ofertazo | Viajes que si dan ganas",
  description: "Escapadas, hoteles y experiencias en Bolivia a precios que dan ganas de viajar."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
