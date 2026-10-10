// TripYa icon set, drawn in the same language as the llama logo: solid shapes, rounded ends,
// "legs" and "ears" made of pill shapes. Each icon is a list of shapes that either add ink ("fill")
// or cut it away ("cut"), composed through an SVG mask so the icon inherits `currentColor`.

type Shape =
  | { k: "r"; x: number; y: number; w: number; h: number; r: number }
  | { k: "c"; cx: number; cy: number; r: number }
  /** Filled path; `round` softens its corners with a stroke of that width. */
  | { k: "p"; d: string; round?: number }
  /** Open stroke, e.g. a check mark. */
  | { k: "s"; d: string; w: number };
type Op = { op: "fill" | "cut" } & Shape;

const fill = (shape: Shape): Op => ({ op: "fill", ...shape });
const cut = (shape: Shape): Op => ({ op: "cut", ...shape });
const rr = (x: number, y: number, w: number, h: number, r: number): Shape => ({ k: "r", x, y, w, h, r });
const circle = (cx: number, cy: number, r: number): Shape => ({ k: "c", cx, cy, r });

const TAG = "M7 23 L25 5 H40 Q43 5 43 8 V23 L25 41 Q23 43 21 41 L7 27 Q5 25 7 23 Z";

const ICONS = {
  /** Accommodation: a bed standing on llama legs. */
  bed: [fill(rr(4, 10, 6, 30, 3)), fill(rr(4, 25, 40, 9, 4.5)), fill(rr(37, 30, 6, 10, 3)), fill(rr(13, 16, 13, 7, 3.5))],
  /** Getaways: a backpack whose straps are llama ears. */
  backpack: [fill(rr(10, 14, 28, 29, 9)), fill(rr(16, 4, 5, 13, 2.5)), fill(rr(27, 4, 5, 13, 2.5)), cut(rr(16, 28, 16, 9, 4.5)), fill(rr(20, 31, 8, 3, 1.5))],
  /** Experiences: Andean peaks under the sun. */
  mountain: [
    fill({ k: "p", d: "M3 41 L17 16 Q19 12.5 21 16 L29 30 L33 23.5 Q35 20 37 23.5 L45 38 Q46.5 41 43 41 Z", round: 2.5 }),
    fill(circle(37, 9, 4.5)),
    cut({ k: "s", d: "M13.5 23.5 L17 26.5 L20.5 23.5 L23.5 27", w: 2.6 })
  ],
  /** Flash deals. */
  bolt: [fill({ k: "p", d: "M28 3 L9 27 H22 L19 45 L39 19 H26 Z", round: 3 })],
  /** All deals: a price tag with the llama's eye and a percent sign. */
  tag: [fill({ k: "p", d: TAG, round: 2 }), cut(circle(35, 13, 3.5)), cut(circle(20, 21.5, 2.4)), cut(circle(28, 30.5, 2.4)), cut({ k: "s", d: "M29.5 20 L18.5 32", w: 2.6 })],
  /** Destinations. */
  pin: [fill({ k: "p", d: "M24 44 C24 44 9 30 9 19 C9 10.5 15.8 4 24 4 C32.2 4 39 10.5 39 19 C39 30 24 44 24 44 Z" }), cut(circle(24, 19, 6.5))],
  /** Verified: the llama's head with a check badge. */
  verified: [
    fill(rr(13, 3, 4, 11, 2)), fill(rr(19, 3, 4, 11, 2)), fill(rr(11, 10, 24, 10, 5)), fill(rr(11, 12, 11, 32, 5.5)), cut(circle(28.5, 15, 2.2)),
    cut(circle(35, 35, 12)), fill(circle(35, 35, 9.5)), cut({ k: "s", d: "M30.5 35 L34 38.5 L40 32", w: 3 })
  ],
  /** Honest prices: a tag with an equals sign — what you see is what you pay. */
  fairPrice: [fill({ k: "p", d: TAG, round: 2 }), cut(circle(35, 13, 3.5)), cut(rr(15, 20, 14, 3.6, 1.8)), cut(rr(15, 27, 14, 3.6, 1.8))],
  /** Real people: a chat bubble with llama ears. */
  support: [
    fill(rr(13, 4, 5, 13, 2.5)), fill(rr(21, 4, 5, 13, 2.5)), fill(rr(5, 12, 38, 24, 11)), fill({ k: "p", d: "M14 32 L11 43 L24 34 Z", round: 2 }),
    cut(circle(16, 24, 2.6)), cut(circle(24, 24, 2.6)), cut(circle(32, 24, 2.6))
  ]
} satisfies Record<string, Op[]>;

export type BrandIconName = keyof typeof ICONS;

function Draw({ shape, color }: { shape: Op; color: string }) {
  switch (shape.k) {
    case "r": return <rect x={shape.x} y={shape.y} width={shape.w} height={shape.h} rx={shape.r} fill={color} />;
    case "c": return <circle cx={shape.cx} cy={shape.cy} r={shape.r} fill={color} />;
    case "p": return <path d={shape.d} fill={color} stroke={shape.round ? color : undefined} strokeWidth={shape.round} strokeLinejoin="round" />;
    case "s": return <path d={shape.d} fill="none" stroke={color} strokeWidth={shape.w} strokeLinecap="round" strokeLinejoin="round" />;
  }
}

export function BrandIcon({ name, size = 24, className }: { name: BrandIconName; size?: number; className?: string }) {
  // Identical icons share identical masks, so a per-name id is safe even when repeated on a page.
  const maskId = `tripya-icon-${name}`;
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <defs>
        <mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width="48" height="48">
          <rect width="48" height="48" fill="#000" />
          {ICONS[name].map((shape, index) => <Draw key={index} shape={shape} color={shape.op === "fill" ? "#fff" : "#000"} />)}
        </mask>
      </defs>
      <rect width="48" height="48" fill="currentColor" mask={`url(#${maskId})`} />
    </svg>
  );
}
