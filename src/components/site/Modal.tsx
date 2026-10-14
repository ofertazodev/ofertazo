"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

export function Modal({ title, onClose, children, className = "", closeLabel = "Cerrar" }: { title: string; onClose: () => void; children: React.ReactNode; className?: string; closeLabel?: string }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!mounted) return null;

  // Rendered in <body>: a parent with backdrop-filter (the sticky header) would otherwise become the
  // containing block of this fixed overlay and squeeze it into the header's 82px.
  return createPortal(
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className={`modal-card ${className}`} role="dialog" aria-modal="true" aria-label={title} onMouseDown={(event) => event.stopPropagation()}>
        <button className="modal-close" aria-label={closeLabel} onClick={onClose}><X size={19} /></button>
        {children}
      </section>
    </div>,
    document.body
  );
}
