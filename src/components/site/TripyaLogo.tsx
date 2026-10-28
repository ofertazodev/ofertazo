import { LLAMA_PATH } from "./brand-paths";
import { LOGO_LETTERS, LOGO_LLAMA, LOGO_VIEWBOX } from "./logo-paths";

const ORANGE = "#FF4A0B";
const DARK_GREEN = "#213F3B";

/** Horizontal Tripya logo. `inverse` paints the dark letters white for dark backgrounds. */
export function TripyaLogo({ inverse = false, className }: { inverse?: boolean; className?: string }) {
  return (
    <svg className={className} viewBox={LOGO_VIEWBOX} role="img" aria-label="Tripya">
      <path fill={ORANGE} d={LOGO_LLAMA} />
      {/* The original artwork gives the letters a soft drop shadow. */}
      <defs>
        <filter id="tripya-letter-shadow" x="-5%" y="-5%" width="115%" height="120%">
          <feDropShadow dx="3" dy="4" stdDeviation="3" floodColor="#000" floodOpacity="0.16" />
        </filter>
      </defs>
      <g filter="url(#tripya-letter-shadow)">
        {LOGO_LETTERS.map((letter, index) => <path key={index} fill={letter.accent ? ORANGE : inverse ? "#fff" : DARK_GREEN} transform={`translate(${letter.x} ${letter.y})`} d={letter.d} />)}
      </g>
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
