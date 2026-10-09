"use client";

import { useEffect, useState } from "react";
import { Timer } from "lucide-react";
import type { Dictionary } from "@/i18n/dictionaries/es";

function parts(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  return { d: Math.floor(total / 86400), h: Math.floor((total % 86400) / 3600), m: Math.floor((total % 3600) / 60), s: total % 60 };
}

export function Countdown({ endsAt, common, compact = false }: { endsAt: string; common: Dictionary["common"]; compact?: boolean }) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  // Render nothing on the server to avoid hydration mismatches with the ticking clock.
  if (now === null) return <span className={`countdown ${compact ? "compact" : ""}`} aria-hidden="true" />;
  const remaining = Date.parse(endsAt) - now;
  if (remaining <= 0) return <span className={`countdown ended ${compact ? "compact" : ""}`}>{common.ended}</span>;
  const { d, h, m, s } = parts(remaining);

  return (
    <span className={`countdown ${compact ? "compact" : ""}`} role="timer">
      <Timer size={compact ? 13 : 16} />
      {!compact && <span className="countdown-label">{common.endsIn}</span>}
      {d > 0 && <b>{d}{common.days}</b>}
      <b>{String(h).padStart(2, "0")}{common.hours}</b>
      <b>{String(m).padStart(2, "0")}{common.minutes}</b>
      {!compact && <b>{String(s).padStart(2, "0")}{common.seconds}</b>}
    </span>
  );
}
