"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Images } from "lucide-react";
import type { ListingImage } from "@/lib/listing";
import { Modal } from "@/components/site/Modal";

type Props = { images: ListingImage[]; title: string; showAllLabel: string };

export function Gallery({ images, title, showAllLabel }: Props) {
  const [open, setOpen] = useState<number | null>(null);
  if (images.length === 0) return <div className="gallery gallery-empty"><div className="image-placeholder" /></div>;

  const visible = images.slice(0, 5);
  const show = (index: number) => setOpen(index);
  const step = (delta: number) => setOpen((current) => current === null ? null : (current + delta + images.length) % images.length);

  return (
    <>
      <div className={`gallery gallery-${Math.min(visible.length, 5)}`}>
        {visible.map((image, index) => (
          <button key={image.url} className={`gallery-item ${index === 0 ? "main" : ""}`} onClick={() => show(index)} aria-label={`${title} ${index + 1}`}>
            <Image src={image.url} alt={image.alt} fill priority={index === 0} sizes={index === 0 ? "(max-width: 800px) 100vw, 60vw" : "25vw"} />
          </button>
        ))}
        {images.length > 1 && <button className="gallery-all" onClick={() => show(0)}><Images size={16} /> {showAllLabel}</button>}
        <span className="gallery-counter">1 / {images.length}</span>
      </div>
      {open !== null && (
        <Modal title={title} onClose={() => setOpen(null)} className="lightbox">
          <div className="lightbox-image">
            <Image src={images[open].url} alt={images[open].alt} fill sizes="100vw" />
          </div>
          {images.length > 1 && (
            <div className="lightbox-nav">
              <button aria-label="Anterior" onClick={() => step(-1)}><ChevronLeft /></button>
              <span>{open + 1} / {images.length}</span>
              <button aria-label="Siguiente" onClick={() => step(1)}><ChevronRight /></button>
            </div>
          )}
        </Modal>
      )}
    </>
  );
}
