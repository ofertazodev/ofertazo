"use client";

import { useEffect } from "react";
import { MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const markerIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

type LocationPickerProps = {
  latitude: string;
  longitude: string;
  onChange: (latitude: string, longitude: string) => void;
};

function ClickHandler({ onChange }: { onChange: LocationPickerProps["onChange"] }) {
  useMapEvents({
    click(event) {
      onChange(event.latlng.lat.toFixed(6), event.latlng.lng.toFixed(6));
    }
  });
  return null;
}

export default function LocationPicker({ latitude, longitude, onChange }: LocationPickerProps) {
  const hasLocation = latitude !== "" && longitude !== "";
  const position: [number, number] = hasLocation ? [Number(latitude), Number(longitude)] : [-16.5, -64.5];

  useEffect(() => {
    L.Icon.Default.prototype.options = markerIcon.options;
  }, []);

  return (
    <div className="location-picker">
      <MapContainer center={position} zoom={hasLocation ? 14 : 5} scrollWheelZoom className="location-map">
        <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <ClickHandler onChange={onChange} />
        {hasLocation && <Marker position={position} icon={markerIcon} />}
      </MapContainer>
      <p className="map-picker-help">Haz clic en el mapa para colocar el pin. Puedes mover el mapa con el mouse o el dedo.</p>
    </div>
  );
}
