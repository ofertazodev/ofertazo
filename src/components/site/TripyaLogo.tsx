import { LLAMA_PATH, WORDMARK_PATHS } from "./brand-paths";

const ORANGE = "#FF4A0B";
const DARK_GREEN = "#213F3B";

/** Horizontal Tripya logo. `inverse` paints the dark letters white for dark backgrounds. */
export function TripyaLogo({ inverse = false, className }: { inverse?: boolean; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 440.4 141.2" role="img" aria-label="Tripya">
      <path fill={ORANGE} transform="translate(4 12.4) scale(1.2)" d={LLAMA_PATH} />
      {WORDMARK_PATHS.map((letter, index) => <path key={index} fill={letter.accent ? ORANGE : inverse ? "#fff" : DARK_GREEN} d={letter.d} />)}
    </svg>
  );
}

/** The llama on its own (100x100), e.g. for loaders and small marks. */
export function LlamaMark({ className, color = ORANGE }: { className?: string; color?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" aria-hidden="true">
      <path fill={color} transform="translate(3 1.5)" d={LLAMA_PATH} />
    </svg>
  );
}

/**
 * Loading state with the Tripya llama trotting in place, used everywhere something loads
 * so people associate the llama with us.
 */
export function LlamaLoader({ label, size = "md" }: { label?: string; size?: "sm" | "md" | "lg" }) {
  return (
    <div className={`llama-loader llama-loader-${size}`} role="status" aria-live="polite">
      <div className="llama-stage">
        <LlamaMark className="llama-body" />
        <span className="llama-shadow" />
        <span className="llama-ground" />
      </div>
      {label ? <p>{label}</p> : <span className="sr-only">Tripya</span>}
    </div>
  );
}
