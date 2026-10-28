"use client";

import { useId, useMemo, useState } from "react";
import { MapPin, Tag } from "lucide-react";
import { matchScore } from "@/lib/fuzzy";

export type Suggestion = { id: string; kind: "place" | "offer"; label: string; detail?: string };

type Props = {
  value: string;
  onChange: (text: string) => void;
  onPick: (suggestion: Suggestion) => void;
  suggestions: Suggestion[];
  /** Group titles shown above each kind of suggestion. */
  groupLabels: { place: string; offer: string };
  placeholder?: string;
  ariaLabel?: string;
  max?: number;
};

/**
 * Text input with a dropdown of matching places and offers, updated as you type.
 * Matching ignores accents and tolerates typos, so "la" shows "La Paz" and "cochabmba" still finds Cochabamba.
 */
export function SearchSuggest({ value, onChange, onPick, suggestions, groupLabels, placeholder, ariaLabel, max = 7 }: Props) {
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);

  const matches = useMemo(() => {
    if (!value.trim()) return suggestions.filter((item) => item.kind === "place").slice(0, max);
    return suggestions
      .map((item) => ({ item, score: Math.min(matchScore(value, item.label) ?? Infinity, (matchScore(value, item.detail ?? "") ?? Infinity) + 1) }))
      .filter((entry) => entry.score !== Infinity)
      // Places first, then the best matches.
      .sort((a, b) => Number(a.item.kind === "offer") - Number(b.item.kind === "offer") || a.score - b.score || a.item.label.localeCompare(b.item.label))
      .slice(0, max)
      .map((entry) => entry.item);
  }, [value, suggestions, max]);

  const show = open && matches.length > 0;

  function pick(item: Suggestion) {
    onPick(item);
    setOpen(false);
    setActive(-1);
  }

  return (
    <span className="suggest">
      <input
        value={value}
        placeholder={placeholder}
        aria-label={ariaLabel}
        role="combobox"
        aria-expanded={show}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={show && active >= 0 ? `${listId}-${active}` : undefined}
        autoComplete="off"
        onChange={(event) => { onChange(event.target.value); setOpen(true); setActive(-1); }}
        onFocus={() => setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 120)}
        onKeyDown={(event) => {
          if (!show) return;
          if (event.key === "ArrowDown") { event.preventDefault(); setActive((index) => (index + 1) % matches.length); }
          else if (event.key === "ArrowUp") { event.preventDefault(); setActive((index) => (index <= 0 ? matches.length - 1 : index - 1)); }
          else if (event.key === "Enter" && active >= 0) { event.preventDefault(); pick(matches[active]); }
          else if (event.key === "Escape") setOpen(false);
        }}
      />
      {show && (
        <ul className="suggest-list" id={listId} role="listbox">
          {matches.map((item, index) => {
            const firstOfKind = index === 0 || matches[index - 1].kind !== item.kind;
            return (
              <li key={`${item.kind}-${item.id}`} role="presentation">
                {firstOfKind && <span className="suggest-group">{groupLabels[item.kind]}</span>}
                <button
                  type="button"
                  id={`${listId}-${index}`}
                  role="option"
                  aria-selected={index === active}
                  className={index === active ? "active" : ""}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => pick(item)}
                >
                  {item.kind === "place" ? <MapPin size={16} /> : <Tag size={16} />}
                  <span><strong>{item.label}</strong>{item.detail && <small>{item.detail}</small>}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </span>
  );
}

/** Best place for free text (used when someone types and submits without picking a suggestion). */
export function bestPlace(text: string, suggestions: Suggestion[]) {
  if (!text.trim()) return null;
  let best: { item: Suggestion; score: number } | null = null;
  for (const item of suggestions) {
    if (item.kind !== "place") continue;
    const score = matchScore(text, item.label);
    if (score !== null && (!best || score < best.score)) best = { item, score };
  }
  return best?.item ?? null;
}
