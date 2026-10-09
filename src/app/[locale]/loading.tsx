import { LlamaLoader } from "@/components/site/TripyaLogo";

// Shown while any public page loads (navigation, search, offer pages).
export default function Loading() {
  return <div className="page-loading"><LlamaLoader size="lg" /></div>;
}
