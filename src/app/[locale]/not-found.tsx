import Link from "next/link";
import { Compass } from "lucide-react";
import { es } from "@/i18n/dictionaries/es";

// not-found pages don't receive route params, so this one is in Spanish (default locale).
export default function NotFound() {
  return (
    <section className="shell page-section narrow">
      <div className="empty-state">
        <Compass size={26} />
        <h1>{es.notFound.title}</h1>
        <p>{es.notFound.text}</p>
        <Link className="dark-button" href="/es/ofertas">{es.notFound.cta}</Link>
      </div>
    </section>
  );
}
