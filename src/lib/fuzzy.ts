// Forgiving text matching for search boxes: ignores accents and case, matches the start of any word
// ("la" → "La Paz", "paz" → "La Paz") and tolerates small typos ("cochabmba" → "Cochabamba", "uyni" → "Uyuni").

export function normalize(text: string) {
  return text.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, " ").trim();
}

/** Edit distance with adjacent swaps (optimal string alignment). */
function distance(a: string, b: string) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array<number>(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
  }
  return d[a.length][b.length];
}

const typoBudget = (length: number) => (length < 4 ? 0 : length < 7 ? 1 : 2);

/** How well `query` matches `text`: lower is better, null means no match. */
export function matchScore(query: string, text: string): number | null {
  const q = normalize(query);
  if (!q) return 0;
  const t = normalize(text);
  if (t.startsWith(q)) return 0;
  const words = t.split(/[\s,.\-–()«»"/]+/).filter(Boolean);
  if (words.some((word) => word.startsWith(q))) return 1;
  if (t.includes(q)) return 2;
  // Typos: compare against prefixes of the same length (so a partly typed word still counts).
  const budget = typoBudget(q.length);
  if (!budget) return null;
  const starts = [0, ...Array.from(t.matchAll(/[\s,.\-–()«»"/]+/g), (m) => (m.index ?? 0) + m[0].length)];
  let best = Infinity;
  for (const start of starts) {
    for (const length of [q.length - 1, q.length, q.length + 1]) {
      if (length <= 0 || start + length > t.length) continue;
      best = Math.min(best, distance(q, t.slice(start, start + length)));
    }
  }
  return best <= budget ? 3 + best : null;
}

/** Whether every word of the query matches the text (so "hotel paz" finds "Hotel con vista… · La Paz"). */
export function fuzzyMatches(query: string, text: string) {
  const words = normalize(query).split(" ").filter(Boolean);
  return words.length === 0 || matchScore(query, text) !== null || words.every((word) => matchScore(word, text) !== null);
}
