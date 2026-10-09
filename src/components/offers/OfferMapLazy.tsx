"use client";

import dynamic from "next/dynamic";
import { LlamaLoader } from "@/components/site/TripyaLogo";

// Leaflet touches `window`, so the map only renders in the browser.
export const OfferMapLazy = dynamic(() => import("./OfferMap"), { ssr: false, loading: () => <div className="offer-map offer-map-loading"><LlamaLoader size="sm" /></div> });
