import React, { useEffect, useMemo, useState } from "react";
import algsDataRaw from "./data/algs.json";
import type { AlgItem, AlgSet, AlgsData, F2LCase, F2LSection } from "./types";
import { AppHero } from "./components/AppHero";
import { AppRail } from "./components/AppRail";
import { MiniTwisty } from "./components/MiniTwisty";
import { Twisty } from "./components/Twisty";
import { WorkspaceScaffold } from "./components/WorkspaceScaffold";
import { DrillModal } from "./components/DrillModal";
import { TimedBlockModal } from "./components/TimedBlockModal";
import { ScrambleTimerModal } from "./components/ScrambleTimerModal";
import { loadSRS, saveSRS, scheduleCard, getSRSCard, isDue } from "./utils/srs";
import type { SRSCard, SRSRating } from "./utils/srs";
import { loadBldSRS, saveBldSRS, getBldCard } from "./utils/bld-srs";
import { SPEFFZ_EDGES, SPEFFZ_CORNERS } from "./data/bld-data";
import { loadStreaks, recordPractice } from "./utils/streaks";
import type { StreakData } from "./utils/streaks";
import { loadPrefs, setPreferredAlg, clearPreferredAlg, toggleOhMode, setCubeScheme } from "./utils/prefs";
import { invertAlg } from "./utils/alg";
import type { PrefsData } from "./utils/prefs";
import type { CubeScheme } from "./utils/faceColors";
import { HomeSection } from "./components/HomeSection";


type CatalogGroup = {
  key: string;
  title: string;
  description: string;
  tone: "sand" | "sage" | "rose" | "sky";
  ids: string[];
};

type WorkspaceMode = "full-ll" | "4lll";
type CfopPhase = "f2l" | "last-layer";
type AppSection = "home" | "study" | "practice" | "progress" | "reference";
type Language = "es" | "en";

type MethodCase = {
  name: string;
  alg: string;
  set: AlgSet;
  note?: string;
  canonicalCaseId?: string;
};

type MethodStage = {
  key: string;
  title: string;
  subtitle: string;
  tone: "sand" | "sage" | "rose" | "sky";
  cases: MethodCase[];
};

const algsData = algsDataRaw as AlgsData;
const algs = [...algsData.oll, ...algsData.pll];

type F2LFilterKey =
  | "all"
  | "intuitive"
  | "trigger"
  | "recovery"
  | "right-slot"
  | "left-slot"
  | "advanced";

type SelectedCase = AlgItem & {
  sourceMethod?: "4LLL";
  canonicalCaseId?: string;
  f2lMeta?: {
    note: string;
    setup?: string;
    caseSetupAlg?: string;
    tags: F2LCase["tags"];
    sectionTitle: string;
  };
};

const APP_SECTION_LABELS: Record<Language, Record<AppSection, string>> = {
  es: {
    home: "Inicio",
    study: "Estudio",
    practice: "Práctica",
    progress: "Progreso",
    reference: "Referencia",
  },
  en: {
    home: "Home",
    study: "Study",
    practice: "Practice",
    progress: "Progress",
    reference: "Reference",
  },
};

const SET_META: Record<Exclude<AlgSet, "F2L">, { short: string; long: string; description: string }> = {
  OLL: {
    short: "OLL",
    long: "Orientación de la última capa",
    description: "Patrones de reconocimiento y algoritmos para orientar la última capa.",
  },
  PLL: {
    short: "PLL",
    long: "Permutación de la última capa",
    description: "Patrones de reconocimiento y algoritmos para permutar la última capa.",
  },
};

const FOUR_LOOK_STAGES: MethodStage[] = [
  {
    key: "4lll-oll-edges",
    title: "OLL Cross Stage",
    subtitle: "Orient the last-layer edges first (2-Look OLL step 1).",
    tone: "sand",
    cases: [
      {
        name: "Horizontal Bar",
        set: "OLL",
        alg: "F R U R' U' F'",
        note: "Line case to build the yellow cross.",
        canonicalCaseId: "oll_45",
      },
      {
        name: "L Shape (Top-Left)",
        set: "OLL",
        alg: "F U R U' R' F'",
        note: "Rotate so the L sits on the top-left before executing.",
        canonicalCaseId: "oll_48",
      },
      {
        name: "Dot (No Solved Edges)",
        set: "OLL",
        alg: "F R U R' U' S R U R' U' f'",
        note: "No edges oriented on top.",
        canonicalCaseId: "oll_1",
      },
    ],
  },
  {
    key: "4lll-oll-corners",
    title: "OLL Corner Stage",
    subtitle: "Finish orientation of last-layer corners (2-Look OLL step 2).",
    tone: "rose",
    cases: [
      {
        name: "Headlights on Both Sides",
        set: "OLL",
        alg: "F R U R' U' R U R' U' R U R' U' F'",
        canonicalCaseId: "oll_21",
      },
      {
        name: "Headlights on Left",
        set: "OLL",
        alg: "R U2 R2 U' R2 U' R2 U2 R",
        canonicalCaseId: "oll_22",
      },
      {
        name: "Sune (Right)",
        set: "OLL",
        alg: "R U R' U R U2 R'",
        canonicalCaseId: "oll_27",
      },
      {
        name: "Anti-Sune / Left Sune",
        set: "OLL",
        alg: "L' U' L U' L' U2 L",
        canonicalCaseId: "oll_26",
      },
      {
        name: "Headlights in Front",
        set: "OLL",
        alg: "R2 D R' U2 R D' R' U2 R'",
        canonicalCaseId: "oll_23",
      },
      {
        name: "Hammerhead (Left)",
        set: "OLL",
        alg: "r U R' U' r' F R F'",
        canonicalCaseId: "oll_24",
      },
      {
        name: "Opposite Corners",
        set: "OLL",
        alg: "R' F R B' R' F' R B",
        canonicalCaseId: "oll_25",
      },
    ],
  },
  {
    key: "4lll-pll-corners",
    title: "PLL Corner Stage",
    subtitle: "Permute corners only (2-Look PLL step 1).",
    tone: "sage",
    cases: [
      {
        name: "A-Perm (Headlights in Back)",
        set: "PLL",
        alg: "R' F R' B2 R F' R' B2 R2",
        canonicalCaseId: "pll_aa",
      },
      {
        name: "N-Perm (No Headlights)",
        set: "PLL",
        alg: "R' U L' U2 R U' L R' U L' U2 R U' L",
        canonicalCaseId: "pll_na",
      },
    ],
  },
  {
    key: "4lll-pll-edges",
    title: "PLL Edge Stage",
    subtitle: "Finish by permuting last-layer edges (2-Look PLL step 2).",
    tone: "sky",
    cases: [
      {
        name: "U-Perm (Counterclockwise)",
        set: "PLL",
        alg: "R U' R U R U R U' R' U' R2",
        canonicalCaseId: "pll_ua",
      },
      {
        name: "U-Perm (Clockwise)",
        set: "PLL",
        alg: "L' U L' U' L' U' L' U L U L2",
        canonicalCaseId: "pll_ub",
      },
      {
        name: "H-Perm",
        set: "PLL",
        alg: "M2 U M2 U2 M2 U M2",
        canonicalCaseId: "pll_h",
      },
      {
        name: "Z-Perm",
        set: "PLL",
        alg: "M2 U M2 U M' U2 M2 U2 M' U2",
        canonicalCaseId: "pll_z",
      },
    ],
  },
];

const F2L_CANONICAL_TOTAL = 41;
const SHOW_F2L_DRILLS = false;
const F2L_CANONICAL_STARTER = algsData.f2lCanonicalSections;
const F2L_SECTIONS = algsData.f2lDrillSections;

const F2L_FILTERS: Array<{ key: F2LFilterKey; label: string }> = [
  { key: "all", label: "All Cases" },
  { key: "intuitive", label: "Intuitive" },
  { key: "trigger", label: "Trigger-heavy" },
  { key: "recovery", label: "Recovery" },
  { key: "right-slot", label: "Right Slot" },
  { key: "left-slot", label: "Left Slot" },
  { key: "advanced", label: "Advanced" },
];

const F2L_TAG_LABELS: Record<
  Exclude<F2LFilterKey, "all"> | "pairing" | "extraction" | "connected",
  string
> = {
  intuitive: "Intuitive",
  trigger: "Trigger",
  recovery: "Recovery",
  "right-slot": "Right",
  "left-slot": "Left",
  advanced: "Advanced",
  pairing: "Pairing",
  extraction: "Extraction",
  connected: "Connected",
};

const KNOWN_TRIGGERS: Array<{ name: string; color: string; moves: string; patterns: string[] }> = [
  { name: "Sexy Move",    color: "teal",   moves: "R U R' U'",          patterns: ["R U R' U'", "L' U' L U"] },
  { name: "Sledgehammer", color: "indigo", moves: "R' F R F'",          patterns: ["R' F R F'", "L F' L' F"] },
  { name: "Sune",         color: "amber",  moves: "R U R' U R U2 R'",   patterns: ["R U R' U R U2 R'", "L U L' U L U2 L'"] },
  { name: "Anti-Sune",    color: "amber",  moves: "R' U' R U' R' U2 R", patterns: ["R' U' R U' R' U2 R", "L' U' L U' L' U2 L"] },
  { name: "Niklas",       color: "rose",   moves: "R U' L' U R' U' L",  patterns: ["R U' L' U R' U' L", "L' U R U' L U R'"] },
];

// Expand shorthand tokens (e.g. [SEXY] → moves) before pattern matching
function expandNamedTokens(alg: string): string {
  return alg
    .replace(/\[SEXY\]/gi, "R U R' U'")
    .replace(/\[SLEDGEHMR\]/gi, "R' F R F'")
    .replace(/\[SLEDGEHAMMER\]/gi, "R' F R F'");
}

function detectTriggers(alg: string): typeof KNOWN_TRIGGERS {
  const clean = expandNamedTokens(alg).replace(/[\[\]]/g, "").replace(/\s+/g, " ").trim();
  return KNOWN_TRIGGERS.filter((t) => t.patterns.some((p) => clean.includes(p)));
}

const NAMED_TOKEN_MAP: Record<string, { name: string; moves: string; color: string }> = {
  "SEXY":        { name: "Sexy Move",    moves: "R U R' U'", color: "teal"   },
  "SLEDGEHMR":   { name: "Sledgehammer", moves: "R' F R F'", color: "indigo" },
  "SLEDGEHAMMER":{ name: "Sledgehammer", moves: "R' F R F'", color: "indigo" },
};

// Inject named tokens into plain-move algorithms (no existing bracket notation)
function injectNamedTokens(alg: string): string {
  if (alg.includes("[")) return alg; // already uses bracket notation — leave as-is
  return alg
    .replace(/R U R' U'/g, "[SEXY]")
    .replace(/R' F R F'/g, "[SLEDGEHMR]");
}

function renderAlgLine(line: string): React.ReactNode {
  const parts = line.split(/(\[[A-Z]+\])/g);
  return parts.map((part, i) => {
    const match = part.match(/^\[([A-Z]+)\]$/);
    if (match) {
      const info = NAMED_TOKEN_MAP[match[1]];
      if (info) {
        return (
          <span
            key={i}
            className={`algNamedToken algNamedToken--${info.color}`}
            data-moves={info.moves}
          >
            {part}
          </span>
        );
      }
    }
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });
}

function renderAlgBlock(alg: string, set?: AlgSet, compact = false): React.ReactNode {
  const processed = injectNamedTokens(alg);
  let formatted: string;

  // Detect complex bracket groups like [R U R' F'] (PLL-style) vs. named-token-only brackets
  const hasComplexBrackets = /\[(?!SEXY]|SLEDGEHMR]|SLEDGEHAMMER])/.test(alg);
  if (compact && !hasComplexBrackets) {
    // Card context with plain-move alg: chunk-based, treating [NAMEDTOKEN] as a single token
    // so triggers don't get split across line breaks
    const tokens = processed.match(/\[[A-Z]+\]|[^\s]+/g) ?? [];
    const chunkSize =
      set === "OLL"
        ? tokens.length <= 12 ? 4 : 5
        : 6;
    const lines: string[] = [];
    for (let i = 0; i < tokens.length; i += chunkSize)
      lines.push(tokens.slice(i, i + chunkSize).join(" "));
    formatted = lines.join("\n");
  } else {
    formatted = formatAlgForDisplay(processed, set);
  }

  return formatted.split("\n").map((line, i, arr) => (
    <React.Fragment key={i}>
      {renderAlgLine(line)}
      {i < arr.length - 1 ? "\n" : ""}
    </React.Fragment>
  ));
}

function formatAlgForDisplay(alg: string, set?: AlgSet) {
  const cleaned = alg.trim().replace(/\s+/g, " ");
  if (!cleaned) return "";

  if (cleaned.includes("[")) {
    return cleaned
      .replace(/\]\s*\[/g, "]\n[")
      .replace(/\]\s+/g, "]\n")
      .replace(/\s+\[/g, "\n[");
  }

  const tokens = cleaned.split(" ");
  const chunkSize =
    set === "OLL"
      ? tokens.length <= 8
        ? 4
        : tokens.length <= 12
          ? 4
          : 5
      : 6;
  const lines: string[] = [];
  for (let i = 0; i < tokens.length; i += chunkSize) {
    lines.push(tokens.slice(i, i + chunkSize).join(" "));
  }
  return lines.join("\n");
}

function formatCaseNameForDisplay(item: AlgItem) {
  const name = item.name.trim();

  if (item.set === "OLL") {
    const m = name.match(/^OLL\s+(\d+)(?:\s+\((.+)\))?$/i);
    if (m) {
      const num = Number(m[1]);
      const tag = m[2]?.trim();
      return tag ? `OLL ${num} · ${tag}` : `OLL ${num}`;
    }
  }

  if (item.set === "PLL") {
    const m = name.match(/^([A-Za-z]+)-perm$/i);
    if (m) {
      const raw = m[1];
      const normalized = raw.length > 1
        ? raw[0].toUpperCase() + raw.slice(1).toLowerCase()
        : raw.toUpperCase();
      return `${normalized} Perm`;
    }
  }

  return name;
}

const PLL_GROUPS: CatalogGroup[] = [
  {
    key: "edge-only",
    title: "Solo permutaciones de aristas",
    description: "Solo se mueven las aristas. Las esquinas quedan fijas mientras completas PLL con ciclos de aristas.",
    tone: "sand",
    ids: ["pll_ua", "pll_ub", "pll_z", "pll_h"],
  },
  {
    key: "corner-only",
    title: "Solo permutaciones de esquinas",
    description: "Solo se mueven las esquinas. Útil como paso de esquinas en 2-Look PLL / 4LLL.",
    tone: "sage",
    ids: ["pll_aa", "pll_ab", "pll_e"],
  },
  {
    key: "swap",
    title: "Permutaciones con intercambio de esquinas y aristas",
    description: "Se mueven esquinas y aristas con intercambios. Son casos clave de reconocimiento en PLL completo.",
    tone: "rose",
    ids: ["pll_t", "pll_ja", "pll_jb", "pll_ra", "pll_rb", "pll_na", "pll_nb", "pll_f", "pll_v", "pll_y"],
  },
  {
    key: "g-perms",
    title: "Permutaciones de ciclos de esquinas y aristas (G perms)",
    description: "Ciclos complejos de esquinas y aristas. Aquí importa más la calidad de reconocimiento que la velocidad bruta.",
    tone: "sky",
    ids: ["pll_ga", "pll_gb", "pll_gc", "pll_gd"],
  },
];

const OLL_GROUPS: CatalogGroup[] = [
  {
    key: "oll-no-edges",
    title: "Sin aristas orientadas",
    description: "Aún no hay aristas de la capa superior orientadas. Son los inicios de OLL más desordenados visualmente.",
    tone: "rose",
    ids: ["oll_1", "oll_2", "oll_3", "oll_4", "oll_18", "oll_19", "oll_17", "oll_20"],
  },
  {
    key: "oll-l-no-corners",
    title: "Aristas en L orientadas · Sin esquinas orientadas",
    description: "La orientación en L de aristas ya está, pero las esquinas aún necesitan orientación completa.",
    tone: "sky",
    ids: ["oll_48", "oll_47", "oll_53", "oll_54", "oll_49", "oll_50"],
  },
  {
    key: "oll-l-1-corner",
    title: "Aristas en L orientadas · 1 esquina orientada",
    description: "Aristas en L más una esquina correctamente orientada. Muy útil para practicar reconocimiento parcial.",
    tone: "sand",
    ids: ["oll_5", "oll_6", "oll_7", "oll_8", "oll_11", "oll_12", "oll_9", "oll_10"],
  },
  {
    key: "oll-l-2-corners",
    title: "Aristas en L orientadas · 2 esquinas orientadas",
    description: "Base de aristas en L con dos esquinas orientadas. El reconocimiento depende de la disposición de esquinas.",
    tone: "rose",
    ids: ["oll_44", "oll_43", "oll_31", "oll_32", "oll_35", "oll_37", "oll_36", "oll_38", "oll_29", "oll_30", "oll_41", "oll_42"],
  },
  {
    key: "oll-l-4-corners",
    title: "Aristas en L orientadas · 4 esquinas orientadas",
    description: "Las esquinas ya están orientadas; solo falta terminar el patrón de orientación de aristas.",
    tone: "sage",
    ids: ["oll_28"],
  },
  {
    key: "oll-bar-no-corners",
    title: "Aristas en barra orientadas · Sin esquinas orientadas",
    description: "Hay un patrón de barra en aristas mientras las esquinas siguen completamente sin orientar.",
    tone: "sky",
    ids: ["oll_51", "oll_56", "oll_52", "oll_55"],
  },
  {
    key: "oll-bar-1-corner",
    title: "Aristas en barra orientadas · 1 esquina orientada",
    description: "Patrón de barra en aristas más una esquina orientada. Enfócate en señales rápidas de reconocimiento de esquinas.",
    tone: "sand",
    ids: ["oll_15", "oll_16", "oll_13", "oll_14"],
  },
  {
    key: "oll-bar-2-corners",
    title: "Aristas en barra orientadas · 2 esquinas orientadas",
    description: "Base de barra en aristas con dos esquinas orientadas. Formas parecidas que se distinguen por la posición de esquinas.",
    tone: "rose",
    ids: ["oll_33", "oll_45", "oll_34", "oll_46", "oll_40", "oll_39"],
  },
  {
    key: "oll-bar-4-corners",
    title: "Aristas en barra orientadas · 4 esquinas orientadas",
    description: "Las esquinas están resueltas y queda el patrón de barra en aristas. Suele ser de reconocimiento y ejecución rápidos.",
    tone: "sage",
    ids: ["oll_57"],
  },
  {
    key: "oll-4-edges",
    title: "4 aristas orientadas (esquinas de 2-Look OLL)",
    description: "Todas las aristas superiores están orientadas. Estos son los casos de orientación de esquinas en 2-Look OLL / 4LLL.",
    tone: "sage",
    ids: ["oll_21", "oll_22", "oll_27", "oll_26", "oll_25", "oll_23", "oll_24"],
  },
];

function getCatalogCardHint(item: AlgItem, sectionTitle?: string) {
  const shapeTag = item.name.match(/\(([^)]+)\)\s*$/)?.[1];

  if (item.set === "OLL") {
    if (shapeTag) return `${shapeTag} recognition pattern · CFOP OLL`;
    if (sectionTitle) return `Orientation case · ${sectionTitle}`;
    return "Orientation case · CFOP OLL";
  }

  if (sectionTitle) return `Permutation case · ${sectionTitle}`;
  return "Permutation case · CFOP PLL";
}

function matchesF2LFilter(c: F2LCase, filter: F2LFilterKey) {
  if (filter === "all") return true;
  return c.tags.includes(filter);
}

export default function App() {
  const [appSection, setAppSection] = useState<AppSection>("home");
  const [language, setLanguage] = useState<Language>("es");
  const [cfopPhase, setCfopPhase] = useState<CfopPhase>("last-layer");
  const [workspaceMode, setWorkspaceMode] = useState<WorkspaceMode>("full-ll");
  const [set, setSet] = useState<AlgSet>("OLL");
  const [f2lFilter, setF2lFilter] = useState<F2LFilterKey>("all");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<SelectedCase | null>(null);
  const [activeSectionAnchor, setActiveSectionAnchor] = useState<string>("all");
  const [srsData, setSrsData] = useState<Record<string, SRSCard>>(() => loadSRS());
  const [bldSrsData, setBldSrsData] = useState<Record<string, SRSCard>>(() => loadBldSRS());
  const [streaks, setStreaks] = useState<StreakData>(() => loadStreaks());
  const [prefs, setPrefs] = useState<PrefsData>(() => loadPrefs());
  const [drillSet, setDrillSet] = useState<"OLL" | "PLL" | "OLL_EXEC" | "PLL_EXEC" | "TODAY" | "F2L" | "F2L_EXEC" | null>(null);
  const [timedBlockOpen, setTimedBlockOpen] = useState(false);
  const [scrambleTimerOpen, setScrambleTimerOpen] = useState(false);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return algs
      .filter((a) => a.set === set)
      .filter((a) => (query ? a.name.toLowerCase().includes(query) : true));
  }, [set, q]);

  const pllSections = useMemo(() => {
    if (set !== "PLL") return [];

    const byId = new Map(filtered.map((a) => [a.id, a] as const));
    const used = new Set<string>();
    const sections = PLL_GROUPS.map((group) => {
      const items = group.ids.map((id) => byId.get(id)).filter(Boolean) as AlgItem[];
      items.forEach((item) => used.add(item.id));
      return { ...group, items };
    }).filter((group) => group.items.length > 0);

    const remaining = filtered.filter((a) => !used.has(a.id));
    if (remaining.length) {
      sections.push({
        key: "other",
        title: "Otros PLL",
        description: "Casos PLL fuera del agrupado actual o remanentes filtrados de la búsqueda activa.",
        tone: "sand",
        ids: [],
        items: remaining,
      });
    }
    return sections;
  }, [filtered, set]);

  const ollSections = useMemo(() => {
    if (set !== "OLL") return [];

    const byId = new Map(filtered.map((a) => [a.id, a] as const));
    const used = new Set<string>();
    const sections = OLL_GROUPS.map((group) => {
      const items = group.ids.map((id) => byId.get(id)).filter(Boolean) as AlgItem[];
      items.forEach((item) => used.add(item.id));
      return { ...group, items };
    }).filter((group) => group.items.length > 0);

    const remaining = filtered.filter((a) => !used.has(a.id));
    if (remaining.length) {
      sections.push({
        key: "other-oll",
        title: "Otros OLL",
        description: "Casos OLL fuera del agrupado actual o remanentes filtrados de la búsqueda activa.",
        tone: "sand",
        ids: [],
        items: remaining,
      });
    }
    return sections;
  }, [filtered, set]);

  const catalogNavList = useMemo<AlgItem[]>(() => {
    if (set === "OLL") return ollSections.flatMap((s) => s.items);
    if (set === "PLL") return pllSections.flatMap((s) => s.items);
    return [];
  }, [set, ollSections, pllSections]);

  const ollCount = useMemo(() => algs.filter((a) => a.set === "OLL").length, []);
  const pllCount = useMemo(() => algs.filter((a) => a.set === "PLL").length, []);
  const ollCases = useMemo(() => algs.filter((a) => a.set === "OLL"), []);
  const pllCases = useMemo(() => algs.filter((a) => a.set === "PLL"), []);
  const f2lDrillCases = useMemo<AlgItem[]>(() =>
    F2L_CANONICAL_STARTER.flatMap((section) =>
      section.cases.map((c) => ({
        id: c.id,
        set: "F2L" as const,
        name: c.name,
        alg: c.alg,
        caseSetupAlg: c.caseSetupAlg,
      }))
    ), []);

  const ollDueCount = useMemo(
    () => ollCases.filter((c) => { const card = srsData[c.id]; return !!card && isDue(card); }).length,
    [ollCases, srsData]
  );
  const pllDueCount = useMemo(
    () => pllCases.filter((c) => { const card = srsData[c.id]; return !!card && isDue(card); }).length,
    [pllCases, srsData]
  );
  const todayDueCases = useMemo(() => {
    const due = [...ollCases, ...pllCases, ...f2lDrillCases].filter((c) => {
      const card = srsData[c.id];
      return !!card && isDue(card);
    });
    due.sort((a, b) => {
      const da = srsData[a.id]!.dueDate;
      const db = srsData[b.id]!.dueDate;
      return da < db ? -1 : da > db ? 1 : 0;
    });
    return due;
  }, [ollCases, pllCases, f2lDrillCases, srsData]);

  const ollStats = useMemo(() => {
    let newCount = 0, due = 0, learning = 0, learned = 0;
    for (const c of ollCases) {
      const card = srsData[c.id];
      if (!card) { newCount++; continue; }
      if (isDue(card)) { due++; continue; }
      if (card.reps <= 2) learning++; else learned++;
    }
    return { new: newCount, due, learning, learned, total: ollCases.length };
  }, [ollCases, srsData]);

  const pllStats = useMemo(() => {
    let newCount = 0, due = 0, learning = 0, learned = 0;
    for (const c of pllCases) {
      const card = srsData[c.id];
      if (!card) { newCount++; continue; }
      if (isDue(card)) { due++; continue; }
      if (card.reps <= 2) learning++; else learned++;
    }
    return { new: newCount, due, learning, learned, total: pllCases.length };
  }, [pllCases, srsData]);

  const bldTargets = useMemo(
    () => [...SPEFFZ_EDGES, ...SPEFFZ_CORNERS].filter((t) => !t.isBuffer),
    []
  );

  const bldStats = useMemo(() => {
    let newCount = 0, due = 0, learning = 0, learned = 0;
    for (const t of bldTargets) {
      const card = bldSrsData[t.id];
      if (!card) { newCount++; continue; }
      if (isDue(card)) { due++; continue; }
      if (card.reps <= 2) learning++; else learned++;
    }
    return { new: newCount, due, learning, learned, total: bldTargets.length };
  }, [bldTargets, bldSrsData]);

  const reviewForecast = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const base = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(base);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().slice(0, 10);
      const ollPllCount = [...ollCases, ...pllCases].filter((c) => {
        const card = srsData[c.id];
        if (!card) return false;
        return i === 0 ? card.dueDate <= todayStr : card.dueDate === dateStr;
      }).length;
      const label = i === 0 ? "Today" : ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"][d.getDay()];
      return { label, count: ollPllCount, isToday: i === 0 };
    });
  }, [ollCases, pllCases, srsData]);

  const weakCases = useMemo(() => {
    const ollPll = [...ollCases, ...pllCases]
      .filter((c) => !!srsData[c.id])
      .map((c) => ({
        id: c.id,
        label: formatCaseNameForDisplay(c),
        set: c.set as "OLL" | "PLL",
        easeFactor: srsData[c.id]!.easeFactor,
        reps: srsData[c.id]!.reps,
      }));
    return ollPll
      .sort((a, b) => a.easeFactor - b.easeFactor)
      .slice(0, 8);
  }, [ollCases, pllCases, srsData]);

  function handleRate(id: string, rating: SRSRating) {
    const card = getSRSCard(id, srsData);
    const updated = scheduleCard(card, rating);
    const next = { ...srsData, [id]: updated };
    setSrsData(next);
    saveSRS(next);
    setStreaks((s) => recordPractice(s));
  }

  function handleBldRate(id: string, rating: SRSRating) {
    const card = getBldCard(id, bldSrsData);
    const updated = scheduleCard(card, rating);
    const next = { ...bldSrsData, [id]: updated };
    setBldSrsData(next);
    saveBldSRS(next);
    setStreaks((s) => recordPractice(s));
  }
  const visibleCount = filtered.length;
  const selectedSetTotal = set === "OLL" ? ollCount : pllCount;
  const currentSections = set === "OLL" ? ollSections : pllSections;
  const lastLayerSet: Exclude<AlgSet, "F2L"> = set === "PLL" ? "PLL" : "OLL";
  const f2lSections = useMemo(() => {
    const sourceSections = SHOW_F2L_DRILLS ? F2L_SECTIONS : F2L_CANONICAL_STARTER;
    const query = q.trim().toLowerCase();
    return sourceSections.map((section) => {
      const cases = section.cases.filter((c) =>
        matchesF2LFilter(c, f2lFilter) &&
        (query
          ? [c.name, c.note, c.alg, c.setup ?? "", ...c.tags].some((part) =>
              part.toLowerCase().includes(query)
            )
          : true)
      );
      return { ...section, cases };
    }).filter((section) => section.cases.length > 0);
  }, [q, f2lFilter]);
  const totalF2LCaseCount = useMemo(
    () =>
      (SHOW_F2L_DRILLS ? F2L_SECTIONS : F2L_CANONICAL_STARTER).reduce(
        (sum, section) => sum + section.cases.length,
        0
      ),
    []
  );
  const visibleF2LCaseCount = useMemo(
    () => f2lSections.reduce((sum, section) => sum + section.cases.length, 0),
    [f2lSections]
  );
  const visibleF2LPilotCount = useMemo(
    () =>
      f2lSections.reduce(
        (sum, section) => sum + section.cases.filter((c) => !!c.caseSetupAlg).length,
        0
      ),
    [f2lSections]
  );
  const algById = useMemo(() => {
    const byId = new Map<string, AlgItem>();
    for (const item of algs) byId.set(item.id, item);
    return byId;
  }, []);
  const fourLookSections = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return FOUR_LOOK_STAGES;
    return FOUR_LOOK_STAGES.map((stage) => ({
      ...stage,
      cases: stage.cases.filter((c) => {
        const canonicalName = c.canonicalCaseId ? algById.get(c.canonicalCaseId)?.name ?? "" : "";
        return [c.name, c.note ?? "", c.alg, canonicalName].some((part) =>
          part.toLowerCase().includes(query)
        );
      }),
    })).filter((stage) => stage.cases.length > 0);
  }, [q, algById]);
  const fourLookCaseCount = useMemo(
    () => FOUR_LOOK_STAGES.reduce((sum, stage) => sum + stage.cases.length, 0),
    []
  );
  const visibleFourLookCaseCount = useMemo(
    () => fourLookSections.reduce((sum, stage) => sum + stage.cases.length, 0),
    [fourLookSections]
  );
  const navSections =
    cfopPhase === "f2l"
      ? f2lSections
      : workspaceMode === "full-ll"
        ? currentSections
        : fourLookSections;

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    setActiveSectionAnchor(id === "catalog-top" ? "all" : id);
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  useEffect(() => {
    setActiveSectionAnchor("all");
  }, [cfopPhase, workspaceMode, set, q, f2lFilter]);

  // Keyboard nav for catalog modal
  useEffect(() => {
    if (!selected) return;
    const isOllPll = selected.set === "OLL" || selected.set === "PLL";
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setSelected(null); return; }
      if (!isOllPll || (e.key !== "ArrowLeft" && e.key !== "ArrowRight")) return;
      const idx = catalogNavList.findIndex((a) => a.id === selected.id);
      if (idx === -1) return;
      e.preventDefault();
      const next = e.key === "ArrowRight" ? idx + 1 : idx - 1;
      if (next >= 0 && next < catalogNavList.length) setSelected(catalogNavList[next]);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selected, catalogNavList]);

  useEffect(() => {
    const supportsSpy = cfopPhase === "f2l" || workspaceMode === "full-ll";
    if (!supportsSpy) return;

    const sectionIds =
      cfopPhase === "f2l"
        ? f2lSections.map((section) => section.key)
        : currentSections.map((section) => `${set.toLowerCase()}-${section.key}`);
    if (!sectionIds.length) return;

    const updateActiveSection = () => {
      const sticky = document.querySelector(".catalogSticky") as HTMLElement | null;
      const stickyHeight = sticky?.getBoundingClientRect().height ?? 0;
      const threshold = Math.max(100, Math.min(window.innerHeight * 0.45, stickyHeight + 28));

      const catalogTop = document.getElementById("catalog-top");
      if (catalogTop && catalogTop.getBoundingClientRect().top > threshold) {
        setActiveSectionAnchor((prev) => (prev === "all" ? prev : "all"));
        return;
      }

      let active = "all";
      for (const id of sectionIds) {
        const el = document.getElementById(id);
        if (!el) continue;
        const rect = el.getBoundingClientRect();

        if (rect.top <= threshold) {
          active = id;
          continue;
        }

        if (active === "all" && rect.top < window.innerHeight) {
          active = id;
        }
        break;
      }

      setActiveSectionAnchor((prev) => (prev === active ? prev : active));
    };

    updateActiveSection();
    window.addEventListener("scroll", updateActiveSection, { passive: true });
    window.addEventListener("resize", updateActiveSection);
    return () => {
      window.removeEventListener("scroll", updateActiveSection);
      window.removeEventListener("resize", updateActiveSection);
    };
  }, [cfopPhase, workspaceMode, f2lSections, currentSections, set]);

  const getCanonicalCase = (c: MethodCase) =>
    c.canonicalCaseId ? algById.get(c.canonicalCaseId) : undefined;

  const openMethodCase = (stage: MethodStage, c: MethodCase, index: number) => {
    const canonical = getCanonicalCase(c);
    setSelected({
      id: `method_${stage.key}_${index}`,
      set: c.set,
      name: c.name,
      alg: c.alg,
      thumb: canonical?.thumb,
      sourceMethod: "4LLL",
      canonicalCaseId: c.canonicalCaseId,
    });
  };

  const openCanonicalCase = (item: AlgItem) => {
    setCfopPhase("last-layer");
    setWorkspaceMode("full-ll");
    setSet(item.set);
    setQ("");
    setSelected(item);
  };

  const openF2LCase = (section: F2LSection, c: F2LCase) => {
    setSelected({
      id: c.id,
      set: "F2L",
      name: c.name,
      alg: c.alg,
      f2lMeta: {
        note: c.note,
        setup: c.setup,
        caseSetupAlg: c.caseSetupAlg,
        tags: c.tags,
        sectionTitle: section.title,
      },
    });
  };

  const renderCard = (a: AlgItem, sectionTitle?: string) => {
    const isOllOrPll = a.set === "OLL" || a.set === "PLL";
    const srsCard = isOllOrPll ? srsData[a.id] : null;
    const srsState: "new" | "due" | "learning" | "learned" | null = isOllOrPll
      ? srsCard
        ? isDue(srsCard)
          ? "due"
          : srsCard.interval < 7
            ? "learning"
            : "learned"
        : "new"
      : null;
    const srsTitles: Record<string, string> = {
      new: "Never practiced",
      due: "Due for review",
      learning: "In progress",
      learned: "Learned",
    };
    return (
      <button key={a.id} className="card" type="button" onClick={() => setSelected(a)}>
        {srsState && (
          <span
            className={`srsStateDot srsStateDot--${srsState}`}
            title={srsTitles[srsState]}
          />
        )}
        <div className="cardTop">
          <div className="cardTitle">{formatCaseNameForDisplay(a)}</div>
          <MiniTwisty
            set={a.set}
            size={176}
            thumb={a.thumb}
            alg={a.alg}
            setupAlg={invertAlg(a.alg)}
            preferRuntime={!a.thumb}
          />
        </div>
        <div className="cardHint">{getCatalogCardHint(a, sectionTitle)}</div>
        <div className="setupHint">Setup: {invertAlg(a.alg)}</div>
        <pre className="cardAlg">{renderAlgBlock(a.alg, a.set, true)}</pre>
      </button>
    );
  };

  const renderMethodStage = (stage: MethodStage) => (
    <section key={stage.key} id={stage.key} className={`section methodSection section--${stage.tone}`}>
      <div className="sectionHeader">
        <span>{stage.title}</span>
        <span className="sectionCount">{stage.cases.length}</span>
      </div>
      <div className="methodStageIntro">{stage.subtitle}</div>
      <div className="methodGrid">
        {stage.cases.map((c, index) => {
          const canonical = getCanonicalCase(c);
          const canonicalThumb = canonical?.thumb;
          return (
            <button
              key={`${stage.key}-${c.name}`}
              type="button"
              className="methodCard"
              onClick={() => openMethodCase(stage, c, index)}
            >
              <div className="methodCardTop">
                <div className="methodCardTitle">{c.name}</div>
                <span className={`methodTag methodTag--${c.set.toLowerCase()}`}>{c.set}</span>
              </div>
              <div className="methodThumb">
                <MiniTwisty
                  set={c.set}
                  size={176}
                  thumb={canonicalThumb}
                  alg={c.alg}
                  setupAlg={invertAlg(c.alg)}
                  preferRuntime={!canonicalThumb}
                />
              </div>
              {canonical && (
                <div className="methodCardMap">
                  Maps to <strong>{formatCaseNameForDisplay(canonical)}</strong>
                </div>
              )}
              {!canonicalThumb && (
                <div className="methodCardHint">No canonical thumbnail mapped yet</div>
              )}
              {c.note && <div className="methodCardNote">{c.note}</div>}
              <div className="setupHint">Setup: {invertAlg(c.alg)}</div>
              <pre className="methodCardAlg">{renderAlgBlock(c.alg, c.set, true)}</pre>
            </button>
          );
        })}
      </div>
    </section>
  );

  const renderF2LSection = (section: F2LSection) => (
    <section key={section.key} id={section.key} className={`section f2lSection section--${section.tone}`}>
      <div className="sectionHeader">
        <span>{section.title}</span>
        <span className="sectionCount">{section.cases.length}</span>
      </div>
      <div className="sectionIntro">{section.description}</div>
      <div className="f2lGrid">
        {section.cases.map((c) => {
          return (
            <button key={c.id} type="button" className="f2lCard" onClick={() => openF2LCase(section, c)}>
              <div className="f2lCardTop">
                <div className="f2lCardTitleWrap">
                  <div className="f2lCardTitle">{c.name}</div>
                </div>
                <span className="methodTag methodTag--f2l">F2L</span>
              </div>
              <div className="f2lCardVisual">
                <MiniTwisty
                  set="F2L"
                  size={176}
                  alg={c.alg}
                  setupAlg={c.caseSetupAlg}
                  exactF2L
                  experimentalStickering="F2L"
                />
              </div>
              <div className="f2lCardNote">{c.note}</div>
              <div className="f2lTagRow" aria-label="F2L case tags">
                {c.tags.slice(0, 4).map((tag) => (
                  <span key={`${c.id}-${tag}`} className="f2lTagChip">
                    {F2L_TAG_LABELS[tag as keyof typeof F2L_TAG_LABELS] ?? tag}
                  </span>
                ))}
              </div>
              {c.setup && <div className="f2lCardSetup">Setup: {c.setup}</div>}
              <pre className="f2lCardAlg">{renderAlgBlock(c.alg, "F2L", true)}</pre>
            </button>
          );
        })}
      </div>
    </section>
  );

  const selectedCanonical =
    selected?.canonicalCaseId ? algById.get(selected.canonicalCaseId) : undefined;

  const activePrimaryLabel = APP_SECTION_LABELS[language][appSection];
  const heroEyebrow =
    appSection === "home"
      ? language === "es" ? "Sistema de estudio 3x3x3" : "3x3x3 Study System"
      : appSection === "study"
        ? language === "es" ? "Catálogo de algoritmos 3x3x3" : "3x3x3 Algorithm Catalog"
        : appSection === "practice"
          ? language === "es" ? "Espacio de práctica 3x3x3" : "3x3x3 Practice Workspace"
          : appSection === "progress"
            ? language === "es" ? "Seguimiento de progreso 3x3x3" : "3x3x3 Progress Tracking"
            : language === "es" ? "Mesa de referencia 3x3x3" : "3x3x3 Reference Desk";
  const breadcrumbParts = [
    appSection === "study" ? APP_SECTION_LABELS[language].study : activePrimaryLabel,
    ...(appSection === "study"
      ? [
          "3x3",
          "CFOP",
          cfopPhase === "f2l" ? (language === "es" ? "Primeras 2 capas (F2L)" : "First 2 Layers (F2L)") : (language === "es" ? "Última capa" : "Last Layer"),
          ...(cfopPhase === "f2l"
            ? []
            : workspaceMode === "4lll"
              ? ["4-Look Last Layer"]
              : [
                  language === "es" ? "OLL + PLL completo" : "Full OLL+PLL",
                  set === "OLL" ? (language === "es" ? "Orientación de la última capa" : "Orientation of Last Layer") : (language === "es" ? "Permutación de la última capa" : "Permutation of Last Layer"),
                ]),
        ]
      : []),
  ];
  const fullLastLayerTitle =
    set === "OLL"
      ? (language === "es" ? "Orientación de la última capa (OLL)" : "Orientation of Last Layer (OLL)")
      : (language === "es" ? "Permutación de la última capa (PLL)" : "Permutation of Last Layer (PLL)");
  const fullLastLayerDescription =
    set === "OLL"
      ? (language === "es" ? "Biblioteca canónica de OLL dentro de la última capa de CFOP. Explora categorías de reconocimiento y practica casos exactos de orientación." : "Canonical OLL library inside CFOP Last Layer. Browse recognition categories and drill exact orientation cases.")
      : (language === "es" ? "Biblioteca canónica de PLL dentro de la última capa de CFOP. Explora categorías de reconocimiento y practica casos exactos de permutación." : "Canonical PLL library inside CFOP Last Layer. Browse recognition categories and drill exact permutation cases.");
  const catalogDescriptionText =
    cfopPhase === "f2l"
      ? (language === "es" ? "Biblioteca de casos de las primeras 2 capas de CFOP. Incluye los 41 casos canónicos completos: pares libres, desconectados, conectados, esquina-en-slot, arista-en-slot y ambos-en-slot." : "CFOP First 2 Layers case library. Complete canonical 41-case set: Free, Disconnected, Connected, Corner-in-Slot, Edge-in-Slot, and Both-in-Slot.")
      : workspaceMode === "full-ll"
        ? fullLastLayerDescription
        : (language === "es" ? "Ruta simplificada de última capa en CFOP: 2-Look OLL + 2-Look PLL resuelto en cuatro miradas." : "Simplified CFOP Last Layer path: 2-Look OLL + 2-Look PLL solved in four looks.");
  return (
    <div className="app">
      <div className="appGlow appGlow--a" aria-hidden="true" />
      <div className="appGlow appGlow--b" aria-hidden="true" />
      <div className="appGridNoise" aria-hidden="true" />

      <main className="shell">
        <AppHero
          heroEyebrow={heroEyebrow}
          language={language}
          ohMode={prefs.ohMode}
          cubeScheme={prefs.cubeScheme}
          onToggleLanguage={() => setLanguage((l) => (l === "es" ? "en" : "es"))}
          onToggleOhMode={() => setPrefs((p) => toggleOhMode(p))}
          onSetCubeScheme={(s: CubeScheme) => setPrefs((p) => setCubeScheme(p, s))}
        />

        <div className="workspace">
          <AppRail
            language={language}
            appSection={appSection}
            cfopPhase={cfopPhase}
            workspaceMode={workspaceMode}
            lastLayerSet={lastLayerSet}
            totalDueCount={ollDueCount + pllDueCount}
            onAppSectionChange={setAppSection}
            onCfopPhaseChange={setCfopPhase}
            onWorkspaceModeChange={setWorkspaceMode}
            onLastLayerSetChange={setSet}
          />

          <section
            className="catalogPanel"
            aria-label={appSection === "study" ? (language === "es" ? "Catálogo de algoritmos" : "Algorithm catalog") : `${activePrimaryLabel} ${language === "es" ? "espacio" : "workspace"}`}
          >
            {appSection === "home" ? (
              <HomeSection
                language={language}
                totalDueCount={ollDueCount + pllDueCount}
                currentStreak={streaks.currentStreak}
                ollLearned={ollStats.learned}
                ollTotal={ollStats.total}
                pllLearned={pllStats.learned}
                pllTotal={pllStats.total}
                onNavigate={setAppSection}
                onStartTodayQueue={ollDueCount + pllDueCount > 0 ? () => setDrillSet("TODAY") : undefined}
              />
            ) : appSection !== "study" ? (
              <WorkspaceScaffold
                language={language}
                appSection={appSection}
                activePrimaryLabel={activePrimaryLabel}
                totalF2LCaseCount={totalF2LCaseCount}
                f2lCanonicalTotal={F2L_CANONICAL_TOTAL}
                ollCount={ollCount}
                pllCount={pllCount}
                ollDueCount={ollDueCount}
                pllDueCount={pllDueCount}
                ollStats={ollStats}
                pllStats={pllStats}
                weakCases={weakCases}
                streaks={streaks}
                reviewForecast={reviewForecast}
                ohMode={prefs.ohMode}
                cubeScheme={prefs.cubeScheme}
                onStartTodayQueue={appSection === "practice" ? () => setDrillSet("TODAY") : undefined}
                onStartDrill={appSection === "practice" ? (s: "OLL" | "PLL" | "OLL_EXEC" | "PLL_EXEC" | "F2L" | "F2L_EXEC") => setDrillSet(s) : undefined}
                onStartTimedBlock={appSection === "practice" ? () => setTimedBlockOpen(true) : undefined}
                onStartScrambleTimer={appSection === "practice" ? () => setScrambleTimerOpen(true) : undefined}
              />
            ) : (
            <>
            <div className="catalogSticky">
              <header className="catalogHeader">
                <div className="catalogHeaderTop">
                  <div>
                    <div className="catalogBreadcrumb" aria-label="Current location">
                      {breadcrumbParts.map((part, index) => (
                        <React.Fragment key={`${part}-${index}`}>
                          {index > 0 && <span className="catalogBreadcrumbSep">›</span>}
                          <span
                            className={`catalogBreadcrumbItem ${
                              index === breadcrumbParts.length - 1 ? "isCurrent" : ""
                            }`}
                          >
                            {part}
                          </span>
                        </React.Fragment>
                      ))}
                    </div>
                    <h2 className="catalogTitle">
                      {cfopPhase === "f2l"
                        ? (language === "es" ? "Casos de primeras 2 capas" : "First 2 Layers Cases")
                        : workspaceMode === "full-ll"
                          ? fullLastLayerTitle
                          : (language === "es" ? "Última capa en 4 miradas (4LLL)" : "4-Look Last Layer (4LLL)")}
                    </h2>
                    {catalogDescriptionText && (
                      <p className="catalogDescription">{catalogDescriptionText}</p>
                    )}
                  </div>
                </div>

                {cfopPhase === "f2l" ? (
                  <div className="controls">
                    <input
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      placeholder={language === "es" ? "Buscar F2L canónico (ej. F2L 1, pares libres, U R U' R')..." : "Search canonical F2L (e.g. F2L 1, free pairs, U R U' R')..."}
                    />
                    {SHOW_F2L_DRILLS && (
                      <div className="f2lFilterRow" role="toolbar" aria-label="F2L quick filters">
                        {F2L_FILTERS.map((filter) => (
                          <button
                            key={filter.key}
                            type="button"
                            className={`f2lFilterChip ${f2lFilter === filter.key ? "isActive" : ""}`}
                            onClick={() => setF2lFilter(filter.key)}
                            aria-pressed={f2lFilter === filter.key}
                          >
                            {filter.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : workspaceMode === "full-ll" ? (
                  <div className="controls">
                    <input
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      placeholder={language === "es" ? `Buscar ${set} (ej. ${set === "PLL" ? "Ga, T-perm" : "OLL 27, Sune"})...` : `Search ${set} (e.g. ${set === "PLL" ? "Ga, T-perm" : "OLL 27, Sune"})...`}
                    />
                  </div>
                ) : (
                  <div className="controls">
                    <input
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      placeholder={language === "es" ? "Buscar 4LLL (ej. Sune, H-perm, esquinas OLL)..." : "Search 4LLL (e.g. Sune, H-perm, OLL corners)..."}
                    />
                  </div>
                )}

                <div className="catalogSubRow">
                  {cfopPhase === "f2l" ? (
                    <div className="subtleNote">
                      F2L: {visibleF2LCaseCount}/{F2L_CANONICAL_TOTAL} {language === "es" ? "casos" : "cases"}
                    </div>
                  ) : workspaceMode === "full-ll" ? (
                    set === "OLL" ? (
                      <div className="subtleNote">{language === "es" ? "OLL cargados" : "OLL loaded"}: {ollCount}/57 {language === "es" ? "casos" : "cases"}</div>
                    ) : (
                      <div className="subtleNote">{language === "es" ? "PLL cargados" : "PLL loaded"}: {pllCount}/21 {language === "es" ? "casos" : "cases"}</div>
                    )
                  ) : (
                    <div className="subtleNote">
                      {language === "es" ? "4LLL cargados" : "4LLL loaded"}: {visibleFourLookCaseCount}
                      {q.trim() ? `/${fourLookCaseCount}` : ""} {language === "es" ? "casos" : "cases"}
                    </div>
                  )}
                  {!!q.trim() && (
                    <div className="searchEcho">{language === "es" ? "Filtro" : "Filter"}: “{q.trim()}”</div>
                  )}
                  {cfopPhase === "f2l" && SHOW_F2L_DRILLS && f2lFilter !== "all" && (
                    <div className="searchEcho">{language === "es" ? "Enfoque" : "Focus"}: {F2L_FILTERS.find((f) => f.key === f2lFilter)?.label}</div>
                  )}
                </div>
              </header>

              {!!navSections.length && (
                <nav
                  className="sectionNav"
                  aria-label={
                    cfopPhase === "f2l"
                      ? (language === "es" ? "Categorías F2L" : "F2L categories")
                      : workspaceMode === "full-ll"
                      ? `${SET_META[lastLayerSet].short} categories`
                      : (language === "es" ? "Etapas de 4-Look" : "4-Look stages")
                  }
                >
                <button
                  type="button"
                  className={`sectionNavChip sectionNavChip--all ${
                    activeSectionAnchor === "all" ? "isActive" : ""
                  }`}
                  onClick={() => scrollToSection("catalog-top")}
                  aria-pressed={activeSectionAnchor === "all"}
                >
                  {language === "es" ? "Todo" : "All"}
                </button>
                  {navSections.map((section) => {
                    const sectionId =
                    cfopPhase === "f2l"
                      ? section.key
                      : workspaceMode === "full-ll"
                      ? `${set.toLowerCase()}-${section.key}`
                      : section.key;
                  const count =
                    "items" in section ? section.items.length : section.cases.length;
                    return (
                      <button
                      key={section.key}
                      type="button"
                      className={`sectionNavChip sectionNavChip--${section.tone} ${
                        activeSectionAnchor === sectionId ? "isActive" : ""
                      }`}
                      onClick={() => scrollToSection(sectionId)}
                      title={section.title}
                      aria-pressed={activeSectionAnchor === sectionId}
                    >
                        <span className="sectionNavChipLabel">{section.title}</span>
                        <span className="sectionNavChipCount">{count}</span>
                      </button>
                    );
                  })}
                </nav>
              )}
            </div>

            {cfopPhase === "f2l" ? (
              <div className="sections f2lSections" id="catalog-top">
                {f2lSections.length ? (
                  f2lSections.map(renderF2LSection)
                ) : (
                  <section className="section section--sand f2lEmptyState">
                    <div className="sectionHeader">
                      <span>F2L Canonical Catalog (Coming Next)</span>
                      <span className="sectionCount">0/{F2L_CANONICAL_TOTAL}</span>
                    </div>
                    <div className="sectionIntro">
                      The drill-style F2L cards have been removed. Next step is a canonical `F2L 1–41`
                      library with exact case names, groups, and recognition thumbnails.
                    </div>
                    <div className="f2lEmptyBody">
                      <div className="f2lEmptyCard">
                        <div className="f2lEmptyTitle">Planned structure</div>
                        <ul className="f2lEmptyList">
                          <li>Free Pairs</li>
                          <li>Connected Pairs</li>
                          <li>Disconnected Pairs</li>
                          <li>Slot cases / recovery variants</li>
                        </ul>
                      </div>
                      <div className="f2lEmptyCard">
                        <div className="f2lEmptyTitle">Per-case data</div>
                        <ul className="f2lEmptyList">
                          <li>Canonical id (`F2L 1`, `F2L 2`, ...)</li>
                          <li>Recognition thumbnail (database-style)</li>
                          <li>Alg variants and notes</li>
                        </ul>
                      </div>
                    </div>
                  </section>
                )}
              </div>
            ) : workspaceMode === "4lll" ? (
              <div className="sections methodSections" id="catalog-top">
                {fourLookSections.map(renderMethodStage)}
              </div>
            ) : set === "PLL" ? (
              <div className="sections" id="catalog-top">
                {pllSections.map((section) => (
                  <section
                    key={section.key}
                    id={`pll-${section.key}`}
                    className={`section section--${section.tone}`}
                  >
                    <div className="sectionHeader">
                      <span>{section.title}</span>
                      <span className="sectionCount">{section.items.length}</span>
                    </div>
                    <div className="sectionIntro">{section.description}</div>
                    <div className="sectionGrid">
                      {section.items.map((item) => renderCard(item, section.title))}
                    </div>
                  </section>
                ))}
              </div>
            ) : set === "OLL" ? (
              <div className="sections" id="catalog-top">
                {ollSections.map((section) => (
                  <section
                    key={section.key}
                    id={`oll-${section.key}`}
                    className={`section section--${section.tone}`}
                  >
                    <div className="sectionHeader">
                      <span>{section.title}</span>
                      <span className="sectionCount">{section.items.length}</span>
                    </div>
                    <div className="sectionIntro">{section.description}</div>
                    <div className="sectionGrid">
                      {section.items.map((item) => renderCard(item, section.title))}
                    </div>
                  </section>
                ))}
              </div>
            ) : (
              <div className="grid">{filtered.map((item) => renderCard(item))}</div>
            )}
            </>
            )}
          </section>
        </div>
      </main>

      {selected && (() => {
        const isOllPll = selected.set === "OLL" || selected.set === "PLL";
        const navIdx = isOllPll ? catalogNavList.findIndex((a) => a.id === selected.id) : -1;
        return (
        <div className="modalOverlay" onClick={() => setSelected(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modalHeader">
              <div className="modalTitleWrap">
                <div className="modalTagRow">
                  <span className="modalSetTag">{selected.set}</span>
                  <span className="modalCaseTag">{selected.id.replace(/^pll_|^oll_/, "").toUpperCase()}</span>
                </div>
                <div className="modalTitle">{formatCaseNameForDisplay(selected)}</div>
                <div className="modalSubtitle">
                  {selected.sourceMethod === "4LLL" && selectedCanonical
                    ? `4LLL method case · maps to ${formatCaseNameForDisplay(selectedCanonical)}`
                    : language === "es" ? "Visor de reconocimiento + ejecución" : "Recognition + execution viewer"}
                </div>
              </div>
              <div className="modalHeaderRight">
                {isOllPll && navIdx !== -1 && (
                  <div className="modalNav">
                    <button
                      className="modalNavBtn"
                      type="button"
                      disabled={navIdx === 0}
                      onClick={() => setSelected(catalogNavList[navIdx - 1])}
                      title={language === "es" ? "Caso anterior (←)" : "Previous case (←)"}
                    >←</button>
                    <span className="modalNavCount">{navIdx + 1} / {catalogNavList.length}</span>
                    <button
                      className="modalNavBtn"
                      type="button"
                      disabled={navIdx === catalogNavList.length - 1}
                      onClick={() => setSelected(catalogNavList[navIdx + 1])}
                      title={language === "es" ? "Caso siguiente (→)" : "Next case (→)"}
                    >→</button>
                  </div>
                )}
                <button className="close" type="button" onClick={() => setSelected(null)}>
                  ✕
                </button>
              </div>
            </div>

            <div className="modalLayout">
              <section className="viewerPanel">
                <div className="viewerPanelBar">
                  <span>{language === "es" ? "Visor del caso" : "Case Viewer"}</span>
                  <span className="viewerPanelHint">
                    {selected.set === "F2L" ? (language === "es" ? "Pegatinas CFOP F2L · U arriba" : "CFOP F2L stickering · U-top") : (language === "es" ? "Amarillo arriba · z2" : "Yellow top · z2")}
                  </span>
                </div>
                <div className="viewerPanelStage">
                  <Twisty
                    alg={prefs.preferredAlgs[selected.id] ?? selected.alg}
                    setupAlg={
                      selected.set === "F2L"
                        ? selected.f2lMeta?.caseSetupAlg
                        : invertAlg(prefs.preferredAlgs[selected.id] ?? selected.alg)
                    }
                    experimentalStickering={selected.set === "F2L" ? "F2L" : undefined}
                  />
                </div>
              </section>

              <aside className="modalSide">
                <section className="recognitionPanel">
                  <div className="label">{language === "es" ? "Reconocimiento" : "Recognition"}</div>
                  <div className="recognitionThumbWrap">
                    {selected.set === "F2L" && selected.f2lMeta ? (
                      <MiniTwisty
                        set="F2L"
                        size={210}
                        alg={selected.alg}
                        setupAlg={selected.f2lMeta.caseSetupAlg}
                        exactF2L
                        experimentalStickering="F2L"
                      />
                    ) : (
                      <MiniTwisty
                        set={selected.set}
                        size={210}
                        thumb={selected.thumb}
                        alg={prefs.preferredAlgs[selected.id] ?? selected.alg}
                        setupAlg={invertAlg(prefs.preferredAlgs[selected.id] ?? selected.alg)}
                        preferRuntime={!selected.thumb}
                      />
                    )}
                  </div>
                  {selected.set === "F2L" && selected.f2lMeta && (
                    <div className="f2lModalMeta">
                      <div className="f2lModalMetaTitle">{selected.f2lMeta.sectionTitle}</div>
                      <div className="f2lTagRow">
                        {selected.f2lMeta.tags.map((tag) => (
                          <span key={`modal-${selected.id}-${tag}`} className="f2lTagChip">
                            {F2L_TAG_LABELS[tag as keyof typeof F2L_TAG_LABELS] ?? tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </section>

                <section className="algBlock">
                  <div className="label">
                    Algorithm
                    {prefs.ohMode && (
                      <span className="ohAlgHint">
                        {prefs.preferredAlgs[selected.id]
                          ? (language === "es" ? "🤚 Alg de OH configurado" : "🤚 OH alg set")
                          : (language === "es" ? "🤚 Modo OH — elige tu alg de OH abajo" : "🤚 OH mode — pick your OH alg below")}
                      </span>
                    )}
                  </div>
                  {selected.alts && selected.alts.length > 0 && (
                    <div className="algAltPicker">
                      <button
                        type="button"
                        className={`algAltBtn${!prefs.preferredAlgs[selected.id] ? " algAltBtn--active" : ""}`}
                        onClick={() => setPrefs((p) => clearPreferredAlg(p, selected.id))}
                      >
                        {language === "es" ? "Por defecto" : "Default"}
                      </button>
                      {selected.alts.map((alt, i) => (
                        <button
                          key={i}
                          type="button"
                          className={`algAltBtn${prefs.preferredAlgs[selected.id] === alt ? " algAltBtn--active" : ""}`}
                          onClick={() => setPrefs((p) => setPreferredAlg(p, selected.id, alt))}
                        >
                          {language === "es" ? `Alternativa ${i + 1}` : `Alt ${i + 1}`}
                        </button>
                      ))}
                    </div>
                  )}
                  <code className="algDisplay">
                    {renderAlgBlock(prefs.preferredAlgs[selected.id] ?? selected.alg, selected.set)}
                  </code>
                </section>

                {selected.set !== "F2L" && (
                  <section className="setupBlock">
                    <div className="label">{language === "es" ? "Setup desde resuelto" : "Setup from solved"}</div>
                    <code className="setupDisplay">{invertAlg(prefs.preferredAlgs[selected.id] ?? selected.alg)}</code>
                  </section>
                )}

                {detectTriggers(selected.alg).length > 0 && (
                  <section className="triggersPanel">
                    <div className="label">{language === "es" ? "Triggers" : "Triggers"}</div>
                    <div className="triggerChipRow">
                      {detectTriggers(selected.alg).map((t) => (
                        <span
                          key={t.name}
                          className={`triggerChip triggerChip--${t.color}`}
                          data-moves={t.moves}
                        >
                          {t.name}
                        </span>
                      ))}
                    </div>
                  </section>
                )}

                {selected.sourceMethod === "4LLL" && selectedCanonical && (
                  <section className="canonicalPanel">
                    <div className="label">{language === "es" ? "Caso canónico de CFOP" : "Canonical CFOP Case"}</div>
                    <div className="canonicalPanelRow">
                      <div className="canonicalPanelText">
                        <div className="canonicalPanelTitle">
                          {formatCaseNameForDisplay(selectedCanonical)}
                        </div>
                        <div className="canonicalPanelMeta">{selectedCanonical.set}</div>
                      </div>
                      <button
                        type="button"
                        className="canonicalOpenButton"
                        onClick={() => openCanonicalCase(selectedCanonical)}
                      >
                        {language === "es" ? "Abrir caso" : "Open Case"}
                      </button>
                    </div>
                  </section>
                )}

                <section className="modalNoteCard">
                  <div className="modalNoteTitle">
                    {selected.set === "F2L" ? (language === "es" ? "Notas del caso" : "Case Notes") : (language === "es" ? "Notas de estudio (próx.)" : "Study Notes (next)")}
                  </div>
                  {selected.set === "F2L" && selected.f2lMeta ? (
                    <>
                      <p>{language === "es" ? "La vista previa de reconocimiento coincide con el estado inicial del visor para este setup." : "Recognition preview matches the viewer start state for this case setup."}</p>
                      <p>{selected.f2lMeta.note}</p>
                      {selected.f2lMeta.caseSetupAlg && (
                        <p><strong>{language === "es" ? "Setup de reconocimiento (piloto):" : "Recognition setup (pilot):"}</strong> {selected.f2lMeta.caseSetupAlg}</p>
                      )}
                      {selected.f2lMeta.setup && <p><strong>{language === "es" ? "Setup:" : "Setup:"}</strong> {selected.f2lMeta.setup}</p>}
                    </>
                  ) : (
                    <p>
                      {language === "es" ? "Aquí se mostrarán después variantes OH, fingertricks, triggers y puntuación SRS por caso." : "This is where OH variants, fingertricks, triggers, and per-case SRS scoring will fit next."}
                    </p>
                  )}
                </section>
              </aside>
            </div>
          </div>
        </div>
        );
      })()}

      {drillSet && (
        <DrillModal
          language={language}
          cases={
            drillSet === "TODAY"
              ? todayDueCases
              : drillSet === "F2L" || drillSet === "F2L_EXEC"
                ? f2lDrillCases
                : drillSet === "OLL" || drillSet === "OLL_EXEC"
                  ? ollCases
                  : pllCases
          }
          label={
            drillSet === "TODAY" ? (language === "es" ? "Cola de hoy" : "Today's Queue") :
            drillSet === "OLL_EXEC" ? "OLL" :
            drillSet === "PLL_EXEC" ? "PLL" :
            drillSet === "F2L_EXEC" ? "F2L" :
            drillSet ?? ""
          }
          mode={drillSet === "OLL_EXEC" || drillSet === "PLL_EXEC" || drillSet === "F2L_EXEC" ? "execution" : "recognition"}
          srsData={srsData}
          preferredAlgs={prefs.preferredAlgs}
          ohMode={prefs.ohMode}
          onRate={handleRate}
          onClose={() => setDrillSet(null)}
        />
      )}

      {timedBlockOpen && (
        <TimedBlockModal
          ollCases={ollCases}
          pllCases={pllCases}
          f2lCases={f2lDrillCases}
          srsData={srsData}
          preferredAlgs={prefs.preferredAlgs}
          onRate={handleRate}
          onClose={() => setTimedBlockOpen(false)}
        />
      )}

      {scrambleTimerOpen && (
        <ScrambleTimerModal cubeScheme={prefs.cubeScheme} onClose={() => setScrambleTimerOpen(false)} />
      )}
    </div>
  );
}
