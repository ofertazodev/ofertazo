"use client";

import { useId } from "react";

export const PRICE_MIN = 50;
export const PRICE_MAX = 6000;
const STEP = 50;
const BINS = 24;

type Labels = { title: string; min: string; max: string; hint: string; hintOne: string };
type Props = {
  /** Offer prices in whole Bs, used for the histogram. */
  prices: number[];
  min: number;
  max: number;
  onChange: (min: number, max: number) => void;
  labels: Labels;
  locale: string;
};

const clamp = (value: number) => Math.min(PRICE_MAX, Math.max(PRICE_MIN, value));

/**
 * Price filter: a histogram of how many offers fall in each price band, with a two-handle
 * slider to pick the range. The top handle at PRICE_MAX means "no upper limit".
 */
export function PriceRange({ prices, min, max, onChange, labels, locale }: Props) {
  const id = useId();
  const width = (PRICE_MAX - PRICE_MIN) / BINS;
  const counts = Array.from({ length: BINS }, (_, index) => {
    const from = PRICE_MIN + index * width;
    const to = from + width;
    return prices.filter((price) => (index === 0 ? price < to : index === BINS - 1 ? price >= from : price >= from && price < to)).length;
  });
  const peak = Math.max(1, ...counts);
  const pct = (value: number) => ((value - PRICE_MIN) / (PRICE_MAX - PRICE_MIN)) * 100;
  const format = (value: number) => `Bs ${value.toLocaleString(locale)}${value >= PRICE_MAX ? "+" : ""}`;
  const inRange = prices.filter((price) => price >= min && (max >= PRICE_MAX || price <= max)).length;

  return (
    <div className="price-range">
      <div className="price-boxes">
        <label htmlFor={`${id}-min`}><span>{labels.min}</span>
          <input id={`${id}-min`} type="number" inputMode="numeric" min={PRICE_MIN} max={PRICE_MAX} step={STEP} value={min}
            onChange={(event) => onChange(Math.min(clamp(Number(event.target.value) || PRICE_MIN), max - STEP), max)} />
        </label>
        <span className="price-dash" aria-hidden="true">—</span>
        <label htmlFor={`${id}-max`}><span>{labels.max}</span>
          <input id={`${id}-max`} type="number" inputMode="numeric" min={PRICE_MIN} max={PRICE_MAX} step={STEP} value={max}
            onChange={(event) => onChange(min, Math.max(clamp(Number(event.target.value) || PRICE_MAX), min + STEP))} />
        </label>
      </div>

      <div className="price-histogram" aria-hidden="true">
        {counts.map((count, index) => {
          const from = PRICE_MIN + index * width;
          const active = count > 0 && from + width > min && from < max;
          return <span key={index} className={active ? "active" : count ? "" : "empty"} style={{ height: count ? `${18 + (count / peak) * 82}%` : "6%" }} />;
        })}
      </div>

      <div className="price-slider" style={{ ["--from" as string]: `${pct(min)}%`, ["--to" as string]: `${pct(max)}%` }}>
        <input type="range" min={PRICE_MIN} max={PRICE_MAX} step={STEP} value={min} aria-label={labels.min} aria-valuetext={format(min)}
          onChange={(event) => onChange(Math.min(Number(event.target.value), max - STEP), max)} />
        <input type="range" min={PRICE_MIN} max={PRICE_MAX} step={STEP} value={max} aria-label={labels.max} aria-valuetext={format(max)}
          onChange={(event) => onChange(min, Math.max(Number(event.target.value), min + STEP))} />
      </div>
      <p className="price-summary">{format(min)} – {format(max)} · {inRange === 1 ? labels.hintOne : labels.hint.replace("{n}", String(inRange))}</p>
    </div>
  );
}
