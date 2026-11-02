import { LLAMA_PATH } from "@/components/site/brand-paths";

/**
 * The Tripya llama as the partner-panel assistant, with a speech bubble.
 * "business" dresses it for negotiating: suit, tie, sunglasses and briefcase (drawn over the 100x100 llama).
 */
export function PartnerLlama({ message, variant = "guide", size = "md" }: { message?: React.ReactNode; variant?: "guide" | "business"; size?: "sm" | "md" | "lg" }) {
  return (
    <div className={`partner-llama partner-llama-${size} ${variant}`}>
      <svg className="partner-llama-art" viewBox="0 0 100 100" aria-hidden="true">
        <g transform="translate(3 1.5)">
          <path fill="#FF4A0B" d={LLAMA_PATH} />
          {variant === "business" && (
            <>
              {/* suit jacket over neck and body, tail left out */}
              <path fill="#213F3B" d="M58.5 39 H73.5 V65 Q73.5 72.5 66 72.5 H30 Q21.5 72.5 21.5 63 V57 Q21.5 46.5 32 46.5 H58.5 Z" />
              {/* shirt and tie */}
              <path fill="#FFFFFF" d="M63 39 H73.5 V55 Z" />
              <path fill="#FFE040" d="M69.6 40.5 H72.6 L73 55 L71.1 58.5 L69.2 55 Z" />
              <path fill="none" stroke="#3E625D" strokeWidth="1" strokeLinecap="round" d="M63 39 L68.5 52 M58.5 47 Q62 52 68.5 52" />
              <circle cx="67" cy="62" r="1.1" fill="#FFE040" />
              <circle cx="67" cy="67" r="1.1" fill="#FFE040" />
              {/* sunglasses */}
              <path fill="none" stroke="#111" strokeWidth="1.3" strokeLinecap="round" d="M63 20.5 H73" />
              <rect x="72.5" y="17.6" width="11.5" height="6.6" rx="3.2" fill="#111" />
              <path fill="none" stroke="#fff" strokeOpacity=".7" strokeWidth="1" strokeLinecap="round" d="M75 19.6 L78 19.6" />
              {/* briefcase by the front legs */}
              <path fill="none" stroke="#5C3A21" strokeWidth="1.8" d="M80 80 V77.5 Q80 76 81.5 76 H87.5 Q89 76 89 77.5 V80" />
              <rect x="75" y="80" width="19" height="13" rx="2" fill="#7A4B2A" />
              <rect x="75" y="84.5" width="19" height="1.6" fill="#5C3A21" />
              <rect x="83" y="83.6" width="3" height="3.4" rx=".6" fill="#FFE040" />
            </>
          )}
        </g>
      </svg>
      {message && <div className="partner-bubble">{message}</div>}
    </div>
  );
}
