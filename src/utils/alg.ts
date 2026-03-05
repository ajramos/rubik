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

type AlgToken = { type: "move"; move: string } | { type: "group"; inner: AlgToken[] };

function parseAlgTokens(normalized: string): AlgToken[] {
  const tokens: AlgToken[] = [];
  let i = 0;
  const s = normalized.trim();

  while (i < s.length) {
    // skip spaces
    if (/\s/.test(s[i])) {
      i++;
      continue;
    }
    if (s[i] === "(") {
      let depth = 1;
      let j = i + 1;
      while (j < s.length && depth > 0) {
        if (s[j] === "(") depth++;
        else if (s[j] === ")") depth--;
        j++;
      }
      const innerStr = s.slice(i + 1, j - 1).trim();
      tokens.push({ type: "group", inner: parseAlgTokens(innerStr) });
      i = j;
      continue;
    }
    // read one move: face + optional ' or 2
    const rest = s.slice(i);
    const match = rest.match(/^([RLUDFBMSxyzrludfbms]('|2)?)/);
    if (match) {
      tokens.push({ type: "move", move: match[1] });
      i += match[1].length;
      continue;
    }
    i++;
  }
  return tokens;
}

function invertMove(move: string): string {
  if (move.endsWith("2")) return move;
  if (move.endsWith("'")) return move.slice(0, -1);
  return move + "'";
}

function invertToken(token: AlgToken): AlgToken {
  if (token.type === "move") return { type: "move", move: invertMove(token.move) };
  return { type: "group", inner: token.inner.slice().reverse().map(invertToken) };
}

function tokensToString(tokens: AlgToken[]): string {
  return tokens
    .map((t) => {
      if (t.type === "move") return t.move;
      return "(" + tokensToString(t.inner) + ")";
    })
    .join(" ");
}

export function invertAlg(input: string): string {
  const normalized = normalizeAlg(input);
  const tokens = parseAlgTokens(normalized);
  const inverted = tokens.map(invertToken).reverse();
  return tokensToString(inverted);
}
