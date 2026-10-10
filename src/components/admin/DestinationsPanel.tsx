"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { Eye, EyeOff, Link2, Pencil, Plus, RefreshCw, Save, Trash2, X } from "lucide-react";
import { supabase } from "@/lib/supabase-browser";

type DestinationRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
  is_published: boolean;
  products: { count: number }[];
};

type Draft = { name: string; description: string; sortOrder: string; published: boolean };
const emptyDraft: Draft = { name: "", description: "", sortOrder: "", published: true };

function slugify(text: string) {
  return text.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
}

/** Cities shown in the "Lugares" filter, the destinations page and the offer form. */
export function DestinationsPanel() {
  const [rows, setRows] = useState<DestinationRow[]>([]);
  const [message, setMessage] = useState("");
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!supabase) return;
    const { data, error } = await supabase
      .from("destinations")
      .select("id,name,slug,description,sort_order,is_published,products(count)")
      .eq("kind", "city")
      .not("slug", "like", "%-destination")
      .order("sort_order")
      .order("name");
    if (error) { setMessage(error.message); return; }
    setRows((data ?? []) as DestinationRow[]);
  }, []);

  useEffect(() => { void load(); }, [load]);

  function startEdit(row: DestinationRow | null) {
    setMessage("");
    if (!row) {
      const nextOrder = rows.reduce((max, item) => Math.max(max, item.sort_order), 0) + 1;
      setDraft({ ...emptyDraft, sortOrder: String(nextOrder) });
      setEditing("new");
      return;
    }
    setDraft({ name: row.name, description: row.description ?? "", sortOrder: String(row.sort_order), published: row.is_published });
    setEditing(row.id);
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;
    const name = draft.name.trim();
    if (name.length < 2) { setMessage("Escribe el nombre del lugar."); return; }
    const values = { name, description: draft.description.trim() || null, sort_order: Number(draft.sortOrder) || 100, is_published: draft.published };
    setSaving(true);
    const result = editing === "new"
      ? await supabase.from("destinations").insert({ ...values, slug: slugify(name), country_code: "BO", kind: "city" })
      : await supabase.from("destinations").update(values).eq("id", editing!);
    setSaving(false);
    if (result.error) {
      setMessage(result.error.code === "23505" ? "Ya existe un lugar con ese nombre." : result.error.message);
      return;
    }
    setMessage(editing === "new" ? `«${name}» añadido.` : `«${name}» guardado.`);
    setEditing(null);
    void load();
  }

  async function togglePublished(row: DestinationRow) {
    if (!supabase) return;
    const { error } = await supabase.from("destinations").update({ is_published: !row.is_published }).eq("id", row.id);
    setMessage(error?.message ?? (row.is_published ? `«${row.name}» oculto: ya no aparece en la web.` : `«${row.name}» visible en la web.`));
    void load();
  }

  async function remove(row: DestinationRow) {
    if (!supabase) return;
    if (!window.confirm(`¿Eliminar «${row.name}»? Esta acción no se puede deshacer.`)) return;
    const { error } = await supabase.from("destinations").delete().eq("id", row.id);
    if (error) {
      // Offers keep their city (foreign key), so a city in use can only be hidden.
      setMessage(error.code === "23503" ? `«${row.name}» tiene ofertas asociadas. Ocúltalo en lugar de eliminarlo, o cambia primero la ciudad de esas ofertas.` : error.message);
      return;
    }
    setMessage(`«${row.name}» eliminado.`);
    void load();
  }

  const form = (
    <form className="admin-offer-form destination-form" onSubmit={save}>
      <div className="admin-form-grid">
        <label>Nombre<input required minLength={2} maxLength={80} value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder="Ej. Samaipata" /></label>
        <label>Orden en la lista<input type="number" min={1} value={draft.sortOrder} onChange={(event) => setDraft({ ...draft, sortOrder: event.target.value })} /><small>Los números más bajos salen primero.</small></label>
      </div>
      <label>Descripción corta (se ve en «Destinos»)<input maxLength={200} value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} placeholder="Ej. Pueblo de valle, El Fuerte y el Parque Amboró." /></label>
      <label className="check-row"><input type="checkbox" checked={draft.published} onChange={(event) => setDraft({ ...draft, published: event.target.checked })} /> Visible en la web</label>
      <div className="admin-row-buttons">
        <button className="dark-button" disabled={saving}><Save size={15} /> {saving ? "Guardando..." : "Guardar"}</button>
        <button type="button" onClick={() => setEditing(null)}><X size={15} /> Cancelar</button>
      </div>
    </form>
  );

  return (
    <section>
      <div className="admin-toolbar">
        <h1>Destinos</h1>
        <button className="dark-button" onClick={() => startEdit(null)}><Plus size={16} /> Nuevo lugar</button>
        <button className="admin-action-link" onClick={() => void load()}><RefreshCw size={15} /> Actualizar</button>
      </div>
      <p className="muted">Estos lugares aparecen en el filtro «Lugares», en la página de destinos y al crear una oferta. Ocultar un lugar lo quita de la web sin borrar sus ofertas.</p>
      {message && <p className="admin-notice">{message}</p>}
      {editing === "new" && <div className="admin-panel-card">{form}</div>}

      <div className="admin-table">
        {rows.length === 0 && <p className="admin-empty">Todavía no hay lugares.</p>}
        {rows.map((row) => {
          const offers = row.products[0]?.count ?? 0;
          return (
            <article key={row.id} className="admin-row">
              {editing === row.id ? form : (
                <div className="admin-row-head static destination-row">
                  <b>{row.name}</b>
                  <span>{offers === 1 ? "1 oferta" : `${offers} ofertas`}</span>
                  <span>Orden {row.sort_order}</span>
                  <span className={`status-pill ${row.is_published ? "status-confirmed" : "status-expired"}`}>{row.is_published ? "Visible" : "Oculto"}</span>
                  <span className="admin-row-buttons">
                    <button onClick={() => startEdit(row)}><Pencil size={15} /> Editar</button>
                    <button onClick={() => void togglePublished(row)}>{row.is_published ? <><EyeOff size={15} /> Ocultar</> : <><Eye size={15} /> Mostrar</>}</button>
                    {row.is_published && <a href={`/es/destinos/${row.slug}`} target="_blank" rel="noreferrer"><Link2 size={15} /> Ver</a>}
                    <button onClick={() => void remove(row)} aria-label={`Eliminar ${row.name}`}><Trash2 size={15} /> Eliminar</button>
                  </span>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
