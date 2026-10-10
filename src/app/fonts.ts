import { Poppins } from "next/font/google";
import localFont from "next/font/local";

// TripYa brand guideline: Poppins for headings, Open Sauce for body text.
// Both are self-hosted by Next and exposed as CSS variables used in globals.css.
export const poppins = Poppins({ subsets: ["latin"], weight: ["400", "500", "600", "700"], display: "swap", variable: "--font-poppins" });

export const openSauce = localFont({
  src: [
    { path: "../../node_modules/@fontsource/open-sauce-sans/files/open-sauce-sans-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../../node_modules/@fontsource/open-sauce-sans/files/open-sauce-sans-latin-500-normal.woff2", weight: "500", style: "normal" },
    { path: "../../node_modules/@fontsource/open-sauce-sans/files/open-sauce-sans-latin-600-normal.woff2", weight: "600", style: "normal" },
    { path: "../../node_modules/@fontsource/open-sauce-sans/files/open-sauce-sans-latin-700-normal.woff2", weight: "700", style: "normal" }
  ],
  display: "swap",
  variable: "--font-open-sauce"
});

export const fontVariables = `${poppins.variable} ${openSauce.variable}`;
