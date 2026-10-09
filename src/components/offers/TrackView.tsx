"use client";

import { useEffect } from "react";
import { track, type AnalyticsEvent } from "@/lib/analytics";

/** Fires one analytics event when the page is shown. */
export function TrackView({ event, params }: { event: AnalyticsEvent; params: Record<string, string | number | undefined> }) {
  const key = JSON.stringify(params);
  useEffect(() => {
    track(event, JSON.parse(key) as Record<string, string | number | undefined>);
  }, [event, key]);
  return null;
}
