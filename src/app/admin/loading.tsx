import { LlamaLoader } from "@/components/site/TripyaLogo";

// Shown while the admin panel loads.
export default function Loading() {
  return <div className="page-loading"><LlamaLoader size="lg" /></div>;
}
