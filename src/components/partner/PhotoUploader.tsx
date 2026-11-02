"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ImagePlus, Trash2 } from "lucide-react";
import { compressImage } from "@/lib/image";
import { PARTNER_BUCKET, signedUrls, type PartnerMedia } from "@/lib/partner";
import { supabase } from "@/lib/supabase-browser";

const MAX_PHOTOS = 15;

type Props = {
  providerId: string;
  listingId: string;
  /** Photos of one hotel room / unit, or null for the general photos. */
  unitId: string | null;
  media: PartnerMedia[];
  editable: boolean;
  onChange: () => void;
};

/** Private photo uploads (bucket partner-media, folder {provider}/{listing}/...): only the partner and Tripya can see them. */
export function PhotoUploader({ providerId, listingId, unitId, media, editable, onChange }: Props) {
  const photos = media.filter((item) => item.unit_id === unitId).sort((a, b) => a.sort_order - b.sort_order);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const paths = photos.map((item) => item.storage_path).join("|");

  useEffect(() => {
    if (!supabase || !paths) return;
    let cancelled = false;
    void signedUrls(supabase, paths.split("|")).then((map) => { if (!cancelled) setUrls(map); });
    return () => { cancelled = true; };
  }, [paths]);

  async function add(files: FileList | null) {
    if (!supabase || !files) return;
    const selected = Array.from(files).slice(0, Math.max(MAX_PHOTOS - photos.length, 0));
    setBusy(true); setError("");
    for (const [index, original] of selected.entries()) {
      const file = await compressImage(original);
      const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
      const path = `${providerId}/${listingId}/${unitId ?? "general"}/${Date.now()}-${index}.${extension}`;
      const upload = await supabase.storage.from(PARTNER_BUCKET).upload(path, file, { contentType: file.type });
      if (upload.error) { setError("No pudimos subir una foto (máximo 8 MB, JPG, PNG o WebP)."); continue; }
      const inserted = await supabase.from("partner_media").insert({ listing_id: listingId, unit_id: unitId, storage_path: path, sort_order: photos.length + index });
      if (inserted.error) { await supabase.storage.from(PARTNER_BUCKET).remove([path]); setError("No pudimos guardar una foto."); }
    }
    setBusy(false);
    onChange();
  }

  async function remove(item: PartnerMedia) {
    if (!supabase) return;
    await supabase.from("partner_media").delete().eq("id", item.id);
    await supabase.storage.from(PARTNER_BUCKET).remove([item.storage_path]);
    onChange();
  }

  return (
    <div className="partner-photos">
      <div className="partner-photo-grid">
        {photos.map((item) => (
          <figure key={item.id}>
            {/* Signed URLs expire, so they are shown as-is instead of through the image optimizer. */}
            {urls[item.storage_path] ? <Image src={urls[item.storage_path]} alt="" fill sizes="160px" unoptimized /> : <span className="partner-photo-loading" />}
            {editable && <button type="button" aria-label="Quitar foto" onClick={() => void remove(item)}><Trash2 size={14} /></button>}
          </figure>
        ))}
        {editable && photos.length < MAX_PHOTOS && (
          <label className={`partner-photo-add ${busy ? "busy" : ""}`}>
            <ImagePlus size={22} />
            <span>{busy ? "Subiendo..." : "Añadir fotos"}</span>
            <input type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={busy} onChange={(event) => { void add(event.target.files); event.target.value = ""; }} />
          </label>
        )}
      </div>
      {error && <p className="form-message">{error}</p>}
      <p className="fine-print">Tus fotos son privadas: solo las ve el equipo de Tripya hasta que publiquemos tu oferta.</p>
    </div>
  );
}
