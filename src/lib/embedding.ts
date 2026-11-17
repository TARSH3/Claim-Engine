// Dependency-free text embedding (feature hashing of unigrams + bigrams, L2-normalised).
// Vectors are unit length, so dot product == cosine similarity.
// To upgrade: replace embedText() with a call to any embedding API; keep EMBEDDING_DIM in sync.
export const EMBEDDING_DIM = 256;
const STOP = new Set(["the","a","an","and","or","of","to","in","on","at","is","was","it","my","i","we","with","for","by","this","that"]);

function fnv1a(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h >>> 0;
}

export function embedText(text: string): number[] {
  const tokens = text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((t) => t && !STOP.has(t));
  const feats = [...tokens, ...tokens.slice(1).map((t, i) => `${tokens[i]}_${t}`)];
  const v = new Array<number>(EMBEDDING_DIM).fill(0);
  for (const f of feats) {
    const h = fnv1a(f);
    v[h % EMBEDDING_DIM] += (h >>> 16) & 1 ? 1 : -1;
  }
  const norm = Math.sqrt(v.reduce((s, x) => s + x * x, 0)) || 1;
  return v.map((x) => x / norm);
}
