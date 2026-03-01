/**
 * Lightweight algorithm normalizer:
 * - Removes bracket notation
 * - Expands a few common macros (optional)
 * - Normalizes whitespace
 */
const MACROS: Record<string, string> = {
  SEXY: "R U R' U'",
  ANTI_SEXY: "R U' R' U",
  SLEDGEHAMMER: "R' F R F'",
  SLEDGEHMR: "R' F R F'",
  SLEDGEHR: "R' F R F'",
};

export function normalizeAlg(input: string): string {
  let s = input.replace(/\[|\]/g, " ");

  for (const [key, value] of Object.entries(MACROS)) {
    const re = new RegExp(`\\b${key}\\b`, "g");
    s = s.replace(re, value);
  }

  return s.replace(/\s+/g, " ").trim();
}

export function invertAlg(input: string): string {
  const normalized = normalizeAlg(input);
  const tokens = normalized.split(/\s+/).filter(Boolean);
  return tokens
    .reverse()
    .map((move) => {
      if (move.endsWith("2")) return move;
      if (move.endsWith("'")) return move.slice(0, -1);
      return `${move}'`;
    })
    .join(" ");
}
