"use client";

import { MapContainer, Marker, Polyline, TileLayer, Tooltip } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { ItineraryDay } from "@/lib/listing";

/** Numbered stop marker; the day's color helps follow the route. */
function stopIcon(label: string, day: number) {
  return L.divIcon({ className: "route-marker-wrap", html: `<span class="route-marker route-day-${((day - 1) % 3) + 1}">${label}</span>`, iconSize: [28, 28], iconAnchor: [14, 14] });
}

/** Circuit route: one line through every stop in order, numbered markers, fitted to the whole route. */
export default function RouteMap({ days }: { days: ItineraryDay[] }) {
  // A stop visited twice (the circuit ends where it starts) gets a single marker.
  const stops = days.flatMap((day) => day.stops.map((stop) => ({ ...stop, day: day.day })));
  const line = stops.map((stop) => [stop.lat, stop.lng] as [number, number]);
  const markers = stops.filter((stop, index) => stops.findIndex((other) => other.lat === stop.lat && other.lng === stop.lng) === index);
  if (line.length === 0) return null;

  return (
    <MapContainer bounds={L.latLngBounds(line).pad(0.08)} scrollWheelZoom={false} className="offer-map route-map">
      <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <Polyline positions={line} pathOptions={{ color: "#ff4a0b", weight: 4, opacity: 0.85, dashArray: "8 8" }} />
      {markers.map((stop, index) => (
        <Marker key={`${stop.name}-${index}`} position={[stop.lat, stop.lng]} icon={stopIcon(String(index + 1), stop.day)}>
          <Tooltip direction="top" offset={[0, -12]}>{stop.name}</Tooltip>
        </Marker>
      ))}
    </MapContainer>
  );
}
