export type TriggerColor = "teal" | "indigo" | "amber" | "rose";

export type TriggerDef = {
  name: string;
  color: TriggerColor;
  moves: string;
  patterns: string[];
};

export type NamedTokenInfo = {
  name: string;
  moves: string;
  color: TriggerColor;
};

export const KNOWN_TRIGGERS: TriggerDef[] = [
  { name: "Sexy Move", color: "teal", moves: "R U R' U'", patterns: ["R U R' U'", "L' U' L U"] },
  { name: "Sledgehammer", color: "indigo", moves: "R' F R F'", patterns: ["R' F R F'", "L F' L' F"] },
  { name: "Sune", color: "amber", moves: "R U R' U R U2 R'", patterns: ["R U R' U R U2 R'", "L U L' U L U2 L'"] },
  {
    name: "Anti-Sune",
    color: "amber",
    moves: "R' U' R U' R' U2 R",
    patterns: ["R' U' R U' R' U2 R", "L' U' L U' L' U2 L"],
  },
  { name: "Niklas", color: "rose", moves: "R U' L' U R' U' L", patterns: ["R U' L' U R' U' L", "L' U R U' L U R'"] },
];

export const NAMED_TOKEN_MAP: Record<string, NamedTokenInfo> = {
  SEXY: { name: "Sexy Move", moves: "R U R' U'", color: "teal" },
  SLEDGEHMR: { name: "Sledgehammer", moves: "R' F R F'", color: "indigo" },
  SLEDGEHAMMER: { name: "Sledgehammer", moves: "R' F R F'", color: "indigo" },
};

export function expandNamedTokens(alg: string): string {
  return alg
    .replace(/\[SEXY\]/gi, "R U R' U'")
    .replace(/\[SLEDGEHMR\]/gi, "R' F R F'")
    .replace(/\[SLEDGEHAMMER\]/gi, "R' F R F'");
}

export function detectTriggers(alg: string): TriggerDef[] {
  const clean = expandNamedTokens(alg).replace(/[\[\]]/g, "").replace(/\s+/g, " ").trim();
  return KNOWN_TRIGGERS.filter((t) => t.patterns.some((p) => clean.includes(p)));
}

export function injectNamedTokens(alg: string): string {
  if (alg.includes("[")) return alg;
  return alg.replace(/R U R' U'/g, "[SEXY]").replace(/R' F R F'/g, "[SLEDGEHMR]");
}

export type NamedTokenSegment =
  | { type: "token"; text: string; info: NamedTokenInfo }
  | { type: "text"; text: string };

export function splitNamedTokenSegments(value: string): NamedTokenSegment[] {
  const parts = value.split(/(\[[A-Z_]+\])/g).filter(Boolean);
  return parts.map((part) => {
    const match = part.match(/^\[([A-Z_]+)\]$/);
    if (match) {
      const info = NAMED_TOKEN_MAP[match[1]];
      if (info) return { type: "token", text: part, info };
    }
    return { type: "text", text: part };
  });
}
