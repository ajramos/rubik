import React, { useEffect, useMemo, useState } from "react";
import algsRaw from "./data/algs.json";
import type { AlgItem, AlgSet } from "./types";
import { MiniTwisty } from "./components/MiniTwisty";
import { Twisty } from "./components/Twisty";

const algs = algsRaw as AlgItem[];

type CatalogGroup = {
  key: string;
  title: string;
  description: string;
  tone: "sand" | "sage" | "rose" | "sky";
  ids: string[];
};

type WorkspaceMode = "full-ll" | "4lll";
type CfopPhase = "f2l" | "last-layer";

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

type F2LCase = {
  id: string;
  name: string;
  alg: string;
  caseSetupAlg?: string;
  note: string;
  setup?: string;
  tags: Array<
    | "right-slot"
    | "left-slot"
    | "intuitive"
    | "trigger"
    | "recovery"
    | "extraction"
    | "connected"
    | "pairing"
    | "advanced"
  >;
};

type F2LSection = {
  key: string;
  title: string;
  description: string;
  tone: "sand" | "sage" | "rose" | "sky";
  cases: F2LCase[];
};

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

const LEARNING_TRACKS = [
  {
    title: "Last Layer (CFOP)",
    state: "Active",
    detail: "OLL + PLL catalog, recognition thumbnails and play-through viewer.",
  },
  {
    title: "F2L Cases",
    state: "Active",
    detail: "Canonical F2L case catalog with recognition thumbnails and expandable 41-case coverage.",
  },
  {
    title: "One-Handed (OH)",
    state: "Planned",
    detail: "Ergonomic alg variants, regrips and fingertrick notes.",
  },
  {
    title: "Blindfolded (BLD)",
    state: "Backlog",
    detail: "Letter pairs, memo systems and execution drills.",
  },
] as const;

const PRACTICE_MODULES = [
  { name: "SRS Review", state: "Soon" },
  { name: "Recognition Drills", state: "Soon" },
  { name: "Timed Sessions", state: "Planned" },
  { name: "Progress Notes", state: "Planned" },
] as const;

const SET_META: Record<Exclude<AlgSet, "F2L">, { short: string; long: string; description: string }> = {
  OLL: {
    short: "OLL",
    long: "Orientation of Last Layer",
    description: "Recognition patterns and algorithms for orienting the last layer.",
  },
  PLL: {
    short: "PLL",
    long: "Permutation of Last Layer",
    description: "Recognition patterns and algorithms for permuting the last layer.",
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
const F2L_CANONICAL_STARTER: F2LSection[] = [
  {
    key: "f2l-canonical-free-pairs",
    title: "Free Pairs",
    description:
      "Canonical F2L cases where the pair pieces are free. Initial numbered cases from the 41-case F2L catalog.",
    tone: "sand",
    cases: [
      {
        id: "f2l_1",
        name: "F2L 1",
        alg: "U R U' R'",
        caseSetupAlg: "F R' F' R",
        note: "Canonical Free Pairs case. Pair is free and inserts into the front-right slot.",
        setup: "F R' F' R",
        tags: ["right-slot", "intuitive", "pairing"],
      },
      {
        id: "f2l_2",
        name: "F2L 2",
        alg: "F R' F' R",
        caseSetupAlg: "R' F R F'",
        note: "Canonical Free Pairs case. Alternate free-pair orientation with a short trigger solution.",
        setup: "R' F R F'",
        tags: ["right-slot", "trigger", "pairing"],
      },
      {
        id: "f2l_3",
        name: "F2L 3",
        alg: "F' U' F",
        caseSetupAlg: "F' U F",
        note: "Canonical Free Pairs case with a simple three-move insert from a free-pair setup.",
        setup: "F' U F",
        tags: ["right-slot", "intuitive", "pairing"],
      },
      {
        id: "f2l_4",
        name: "F2L 4",
        alg: "R U R'",
        caseSetupAlg: "R U' R'",
        note: "Canonical Free Pairs case mirrored around the U/R trigger family.",
        setup: "R U' R'",
        tags: ["right-slot", "intuitive", "pairing"],
      },
    ],
  },
  {
    key: "f2l-canonical-disconnected-pairs",
    title: "Disconnected Pairs",
    description:
      "Canonical F2L cases where corner and edge are separated. These require pairing before insertion.",
    tone: "rose",
    cases: [
      {
        id: "f2l_5",
        name: "F2L 5",
        alg: "U' R U R' U2 R U' R'",
        caseSetupAlg: "R U R' U2 R U' R' U",
        note: "Disconnected pair case requiring a standard pair-then-insert sequence.",
        setup: "R U R' U2 R U' R' U",
        tags: ["right-slot", "pairing", "intuitive"],
      },
      {
        id: "f2l_6",
        name: "F2L 6",
        alg: "U' r U' R' U R U r'",
        caseSetupAlg: "F' U' F U2 F' U F U'",
        note: "Disconnected pair with a common right-side pairing pattern.",
        setup: "F' U' F U2 F' U F U'",
        tags: ["right-slot", "pairing", "advanced"],
      },
      {
        id: "f2l_7",
        name: "F2L 7",
        alg: "U' R U2 R' U' R U2 R'",
        caseSetupAlg: "R U R' U2 R U2 R' U",
        note: "Disconnected pair case with repeated U2 rhythm before insertion.",
        setup: "R U R' U2 R U2 R' U",
        tags: ["right-slot", "pairing", "advanced"],
      },
      {
        id: "f2l_8",
        name: "F2L 8",
        alg: "d R' U2 R U R' U2 R",
        caseSetupAlg: "r' U' R2 U' R2 U2 r",
        note: "Disconnected pair case often solved with a wide-turn or d-layer pairing route.",
        setup: "r' U' R2 U' R2 U2 r",
        tags: ["right-slot", "pairing", "advanced"],
      },
      {
        id: "f2l_9",
        name: "F2L 9",
        alg: "U' R U' R' U F' U' F",
        caseSetupAlg: "F' U F U' R U R' U",
        note: "Disconnected pair with mixed R/U/F pairing before the insert.",
        setup: "F' U F U' R U R' U",
        tags: ["right-slot", "pairing", "trigger"],
      },
      {
        id: "f2l_10",
        name: "F2L 10",
        alg: "U' R U R' U R U R'",
        caseSetupAlg: "R U' R' U' R U' R' U",
        note: "Disconnected pair case using a repeated R/U insertion rhythm.",
        setup: "R U' R' U' R U' R' U",
        tags: ["right-slot", "pairing", "intuitive"],
      },
      {
        id: "f2l_19",
        name: "F2L 19",
        alg: "U R U2 R' U R U' R'",
        caseSetupAlg: "R U R' U' R U2 R' U'",
        note: "Disconnected pair case with a U-adjust into a standard pair-then-insert flow.",
        setup: "R U R' U' R U2 R' U'",
        tags: ["right-slot", "pairing", "intuitive"],
      },
      {
        id: "f2l_20",
        name: "F2L 20",
        alg: "y' U' R' U2 R U' R' U R",
        caseSetupAlg: "R U R' F R' F' R2 U R' U",
        note: "Disconnected pair case with a longer setup and a standard U2 pairing resolution.",
        setup: "R U R' F R' F' R2 U R' U",
        tags: ["right-slot", "pairing", "advanced"],
      },
      {
        id: "f2l_21",
        name: "F2L 21",
        alg: "U2 R U R' U R U' R'",
        caseSetupAlg: "R U' R' U2 R U R'",
        note: "Disconnected pair case with a U2 pre-alignment before pairing and insertion.",
        setup: "R U' R' U2 R U R'",
        tags: ["right-slot", "pairing", "intuitive"],
      },
      {
        id: "f2l_22",
        name: "F2L 22",
        alg: "r U' r' U2 r U r'",
        caseSetupAlg: "F' L' U2 L F",
        note: "Disconnected pair case often solved with a compact wide-turn pairing sequence.",
        setup: "F' L' U2 L F",
        tags: ["right-slot", "pairing", "advanced"],
      },
    ],
  },
  {
    key: "f2l-canonical-connected-pairs",
    title: "Connected Pairs",
    description:
      "Canonical F2L cases where the corner-edge pair is already connected and must be inserted efficiently.",
    tone: "sage",
    cases: [
      {
        id: "f2l_11",
        name: "F2L 11",
        alg: "U' R U2 R' U F' U' F",
        caseSetupAlg: "F' U F U' R U2 R' U",
        note: "Connected pair case that typically inserts after a short U adjustment.",
        setup: "F' U F U' R U2 R' U",
        tags: ["right-slot", "connected", "intuitive", "pairing"],
      },
      {
        id: "f2l_12",
        name: "F2L 12",
        alg: "R U' R' U R U' R' U2 R U' R'",
        caseSetupAlg: "R U R' U2 R U R' U' R U R'",
        note: "Connected pair case with a longer U/R insertion sequence.",
        setup: "R U R' U2 R U R' U' R U R'",
        tags: ["right-slot", "connected", "advanced", "pairing"],
      },
      {
        id: "f2l_13",
        name: "F2L 13",
        alg: "y' U R' U R U' R' U' R",
        caseSetupAlg: "r U2 R' U R U' R' U M",
        note: "Connected pair case with a pre-built pair that inserts after a short U adjustment.",
        setup: "r U2 R' U R U' R' U M",
        tags: ["right-slot", "connected", "intuitive", "pairing"],
      },
      {
        id: "f2l_14",
        name: "F2L 14",
        alg: "U' R U' R' U R U R'",
        caseSetupAlg: "R U' R' U' R U R' U",
        note: "Connected pair case using mirrored U turns before a standard insert rhythm.",
        setup: "R U' R' U' R U R' U",
        tags: ["right-slot", "connected", "intuitive", "pairing"],
      },
      {
        id: "f2l_15",
        name: "F2L 15",
        alg: "R' D' R U' R' D R U R U' R'",
        caseSetupAlg: "R U R' U' R U R' U2 R U' R'",
        note: "Connected pair case often solved with a D-layer insert to preserve slot structure.",
        setup: "R U R' U' R U R' U2 R U' R'",
        tags: ["right-slot", "connected", "advanced", "pairing"],
      },
      {
        id: "f2l_16",
        name: "F2L 16",
        alg: "R U' R' U2 F' U' F",
        caseSetupAlg: "F' U F U2 R U R'",
        note: "Connected pair case with an F-trigger finish after a U2 alignment.",
        setup: "F' U F U2 R U R'",
        tags: ["right-slot", "connected", "trigger", "pairing"],
      },
      {
        id: "f2l_17",
        name: "F2L 17",
        alg: "R U2 R' U' R U R'",
        caseSetupAlg: "R U' R' U R U2 R'",
        note: "Connected pair case with a straightforward U2 insert pattern.",
        setup: "R U' R' U R U2 R'",
        tags: ["right-slot", "connected", "intuitive", "pairing"],
      },
      {
        id: "f2l_18",
        name: "F2L 18",
        alg: "y' R' U2 R U R' U' R",
        caseSetupAlg: "R U R' U' R U R' F R' F' R",
        note: "Connected pair case where the pair is preserved and inserted after a U2 trigger.",
        setup: "R U R' U' R U R' F R' F' R",
        tags: ["right-slot", "connected", "trigger", "advanced", "pairing"],
      },
      {
        id: "f2l_23",
        name: "F2L 23",
        alg: "U R U' R' U' R U' R' U R U' R'",
        caseSetupAlg: "R U' R' U R U' R' U2 R U' R'",
        note: "Connected pair case with a long U/R sequence to preserve orientation into insertion.",
        setup: "R U' R' U R U' R' U2 R U' R'",
        tags: ["right-slot", "connected", "advanced", "pairing"],
      },
      {
        id: "f2l_24",
        name: "F2L 24",
        alg: "F U R U' R' F' R U' R'",
        caseSetupAlg: "R U R' F R U R' U' F'",
        note: "Connected pair case solved with an F trigger sandwich before final insertion.",
        setup: "R U R' F R U R' U' F'",
        tags: ["right-slot", "connected", "trigger", "advanced", "pairing"],
      },
    ],
  },
  {
    key: "f2l-canonical-corner-in-slot",
    title: "Corner In Slot",
    description:
      "Canonical F2L cases where the corner is already in a slot and must be paired/extracted efficiently with the matching edge.",
    tone: "sky",
    cases: [
      {
        id: "f2l_25",
        name: "F2L 25",
        alg: "U' R' F R F' R U R'",
        caseSetupAlg: "F' R U R' U' R' F R",
        note: "Corner-in-slot recovery case with an F/R pairing sequence before reinsertion.",
        setup: "F' R U R' U' R' F R",
        tags: ["right-slot", "recovery", "extraction", "advanced"],
      },
      {
        id: "f2l_26",
        name: "F2L 26",
        alg: "U R U' R' F R' F' R",
        caseSetupAlg: "F' U' F U R U R' U'",
        note: "Corner-in-slot case using a short U-adjust followed by an F-trigger recovery.",
        setup: "F' U' F U R U R' U'",
        tags: ["right-slot", "recovery", "extraction", "trigger"],
      },
      {
        id: "f2l_27",
        name: "F2L 27",
        alg: "R U' R' U R U' R'",
        caseSetupAlg: "R U R' U' R U R'",
        note: "Corner-in-slot case with a compact R/U extraction and reinsertion rhythm.",
        setup: "R U R' U' R U R'",
        tags: ["right-slot", "recovery", "extraction", "intuitive"],
      },
      {
        id: "f2l_28",
        name: "F2L 28",
        alg: "R U R' U' F R' F' R",
        caseSetupAlg: "R' F R F' U R U' R'",
        note: "Corner-in-slot case combining a U/R trigger and F-trigger to rebuild the pair.",
        setup: "R' F R F' U R U' R'",
        tags: ["right-slot", "recovery", "extraction", "trigger"],
      },
      {
        id: "f2l_29",
        name: "F2L 29",
        alg: "R' F R F' U R U' R'",
        caseSetupAlg: "F R' F' R F R' F' R",
        note: "Corner-in-slot case with repeated F/R structure before a standard insert finish.",
        setup: "F R' F' R F R' F' R",
        tags: ["right-slot", "recovery", "extraction", "advanced"],
      },
      {
        id: "f2l_30",
        name: "F2L 30",
        alg: "R U R' U' R U R'",
        caseSetupAlg: "R U' R' U R U' R'",
        note: "Corner-in-slot case using a repeated R/U rhythm to extract, pair and reinsert.",
        setup: "R U' R' U R U' R'",
        tags: ["right-slot", "recovery", "extraction", "intuitive"],
      },
    ],
  },
];

const F2L_SECTIONS: F2LSection[] = [
  {
    key: "f2l-free-pairs",
    title: "Free Pairs",
    description:
      "Both pieces are free and easy to pair. Great starting point for building intuitive F2L habits.",
    tone: "sand",
    cases: [
      {
        id: "f2l_free_1",
        name: "Basic Pair Insert (Right Slot)",
        alg: "U R U' R'",
        caseSetupAlg: "U R U' R' U2",
        note: "Simple pair-and-insert trigger when the pair is already aligned for the right slot.",
        tags: ["right-slot", "intuitive", "pairing"],
      },
      {
        id: "f2l_free_1b",
        name: "Basic Pair Insert (Left Slot)",
        alg: "U' L' U L",
        note: "Mirror of the basic free-pair insert for the front-left slot.",
        tags: ["left-slot", "intuitive", "pairing"],
      },
      {
        id: "f2l_free_2",
        name: "Sledge Setup Pair",
        alg: "R' F R F'",
        note: "Common pairing trigger used to connect and control pair orientation.",
        tags: ["right-slot", "trigger", "pairing"],
      },
      {
        id: "f2l_free_3",
        name: "Front Pair Lift",
        alg: "F' U F",
        note: "Useful to free or pair pieces while preserving solved slots.",
        tags: ["intuitive", "pairing"],
      },
      {
        id: "f2l_free_4",
        name: "Keyhole Pair and Drop",
        alg: "R U R' U' R U R'",
        note: "Uses an open slot as a keyhole to pair pieces before insertion.",
        tags: ["right-slot", "advanced", "pairing"],
        setup: "Keep one slot open for keyhole usage.",
      },
      {
        id: "f2l_free_5",
        name: "Split Pair Preparation",
        alg: "U R U2 R' U' R U R'",
        note: "Separates awkward free pieces into a cleaner pairing angle.",
        tags: ["right-slot", "advanced", "pairing"],
      },
    ],
  },
  {
    key: "f2l-connected",
    title: "Connected Pairs",
    description:
      "Corner and edge are already paired. Focus on recognizing slot and inserting with minimal rotations.",
    tone: "sage",
    cases: [
      {
        id: "f2l_conn_1",
        name: "Connected Pair Insert (Right)",
        alg: "R U' R'",
        caseSetupAlg: "y U R U' R'",
        note: "Direct insert for a connected pair targeting the front-right slot.",
        tags: ["right-slot", "intuitive"],
      },
      {
        id: "f2l_conn_2",
        name: "Connected Pair Insert (Left)",
        alg: "L' U L",
        note: "Mirror insert for front-left slot.",
        tags: ["left-slot", "intuitive"],
      },
      {
        id: "f2l_conn_3",
        name: "U-Adjust + Insert",
        alg: "U R U' R'",
        note: "Use a U turn first when the pair is connected but misaligned with its target slot.",
        tags: ["right-slot", "intuitive"],
      },
      {
        id: "f2l_conn_4",
        name: "U'-Adjust + Left Insert",
        alg: "U' L' U L",
        note: "Mirror adjustment for a connected pair aiming at the left slot.",
        tags: ["left-slot", "intuitive"],
      },
      {
        id: "f2l_conn_5",
        name: "Back Slot to Front Insert",
        alg: "U2 R U' R'",
        note: "Rotate the pair over the front-right slot without cube rotation.",
        tags: ["right-slot", "advanced"],
      },
      {
        id: "f2l_conn_6",
        name: "Connected Pair with Keyhole Finish",
        alg: "R U' R' U R U' R'",
        note: "Useful when a direct insert would disturb another pair.",
        tags: ["right-slot", "advanced", "recovery"],
        setup: "Preserve adjacent solved slot by using a short keyhole path.",
      },
    ],
  },
  {
    key: "f2l-disconnected",
    title: "Disconnected Pairs",
    description:
      "Corner and edge are separated. The key skill is pairing them while preserving existing slots.",
    tone: "rose",
    cases: [
      {
        id: "f2l_disc_1",
        name: "Pair Then Insert (Right)",
        alg: "U R U' R' U' F' U F",
        caseSetupAlg: "R U R' U' y R U' R'",
        note: "Classic pairing sequence followed by insertion into the right slot.",
        tags: ["right-slot", "pairing", "intuitive"],
      },
      {
        id: "f2l_disc_2",
        name: "Pair Then Insert (Left)",
        alg: "U' L' U L U F U' F'",
        note: "Mirror concept for the left side.",
        tags: ["left-slot", "pairing", "intuitive"],
      },
      {
        id: "f2l_disc_3",
        name: "Pair with Sledge Influence",
        alg: "R U R' U' R' F R F'",
        note: "Pairs pieces while controlling orientation of the pair.",
        tags: ["right-slot", "trigger", "pairing"],
      },
      {
        id: "f2l_disc_4",
        name: "Pair with Sexy Trigger",
        alg: "R U R' U' U' R U R'",
        note: "Uses a SEXY-style rhythm to build a cleaner insert angle.",
        tags: ["right-slot", "trigger", "pairing"],
      },
      {
        id: "f2l_disc_5",
        name: "Back Pairing to Left Slot",
        alg: "U L' U' L U' L' U L",
        note: "Pairs on top then inserts on the left without cube rotation.",
        tags: ["left-slot", "advanced", "pairing"],
      },
    ],
  },
  {
    key: "f2l-corner-in-slot",
    title: "Corner In Slot",
    description:
      "Corner is trapped in a slot while the edge is out. First extract efficiently, then pair and insert.",
    tone: "sky",
    cases: [
      {
        id: "f2l_corner_slot_1",
        name: "Corner Extraction (Right)",
        alg: "R U R' U' R U R'",
        caseSetupAlg: "R U2 R' y U R U' R'",
        note: "Takes the corner out while keeping control of the edge for a follow-up insert.",
        tags: ["right-slot", "extraction", "recovery"],
      },
      {
        id: "f2l_corner_slot_2",
        name: "Corner Extraction (Left)",
        alg: "L' U' L U L' U' L",
        note: "Mirror extraction for left slots.",
        tags: ["left-slot", "extraction", "recovery"],
      },
      {
        id: "f2l_corner_slot_3",
        name: "Corner Pop + Pair (Right)",
        alg: "R U2 R' U' R U R'",
        note: "Pops the corner to U-layer and immediately begins pairing.",
        tags: ["right-slot", "extraction", "pairing", "advanced"],
      },
      {
        id: "f2l_corner_slot_4",
        name: "Keyhole Corner Rescue",
        alg: "R U' R' U R U R'",
        note: "Alternative rescue path when standard extraction conflicts with another slot.",
        tags: ["right-slot", "recovery", "advanced", "extraction"],
      },
    ],
  },
  {
    key: "f2l-edge-in-slot",
    title: "Edge In Slot",
    description:
      "Edge is stuck in a slot while the corner is free. Use extraction patterns that preserve solved pairs.",
    tone: "sand",
    cases: [
      {
        id: "f2l_edge_slot_1",
        name: "Edge Extraction + Pair",
        alg: "R U' R' U F' U F",
        caseSetupAlg: "y' U R U' R' U2",
        note: "Pulls out the edge and transitions into a pairing sequence.",
        tags: ["right-slot", "extraction", "pairing", "recovery"],
      },
      {
        id: "f2l_edge_slot_2",
        name: "Mirror Edge Extraction",
        alg: "L' U L U' F U' F'",
        note: "Mirror logic for left slots.",
        tags: ["left-slot", "extraction", "pairing", "recovery"],
      },
      {
        id: "f2l_edge_slot_3",
        name: "Edge Pop with Sledge Follow-up",
        alg: "R U R' U' R' F R F'",
        note: "Extracts and repairs with a sledge-style trigger.",
        tags: ["right-slot", "trigger", "extraction", "advanced"],
      },
      {
        id: "f2l_edge_slot_4",
        name: "Rotationless Edge Rescue",
        alg: "U R U' R' U' F' U F",
        note: "Rescue pattern for an edge trapped in slot while preserving flow on top.",
        tags: ["right-slot", "recovery", "advanced", "extraction"],
      },
    ],
  },
  {
    key: "f2l-pieces-in-slot",
    title: "Pieces In Slot",
    description:
      "Both F2L pieces are in slots (often incorrect). These are recovery cases before standard pairing.",
    tone: "rose",
    cases: [
      {
        id: "f2l_both_slot_1",
        name: "Extract Both (Right Recovery)",
        alg: "R U R' U' R U R'",
        note: "Recovery sequence to free pieces and transition back into normal F2L flow.",
        tags: ["right-slot", "recovery", "extraction"],
      },
      {
        id: "f2l_both_slot_2",
        name: "Extract Both (Left Recovery)",
        alg: "L' U' L U L' U' L",
        note: "Mirror recovery for left-side slots.",
        tags: ["left-slot", "recovery", "extraction"],
      },
      {
        id: "f2l_both_slot_3",
        name: "Double Slot Break (Right Bias)",
        alg: "R U' R' U R U2 R'",
        note: "Breaks an awkward in-slot pair and repositions pieces to the U-layer.",
        tags: ["right-slot", "recovery", "advanced", "extraction"],
      },
      {
        id: "f2l_both_slot_4",
        name: "Protected Recovery with Front Lift",
        alg: "F' U F U R U' R'",
        note: "Recovery route that protects adjacent solved pieces while freeing the target pair.",
        tags: ["recovery", "advanced", "extraction"],
        setup: "Useful when one neighboring slot is already solved.",
      },
    ],
  },
];

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
    title: "Edge Permutations Only",
    description: "Only edges move. Corner pieces stay in place while you finish PLL with edge cycles.",
    tone: "sand",
    ids: ["pll_ua", "pll_ub", "pll_z", "pll_h"],
  },
  {
    key: "corner-only",
    title: "Corner Permutations Only",
    description: "Only corners move. Useful as the corner step in 2-Look PLL / 4LLL workflows.",
    tone: "sage",
    ids: ["pll_aa", "pll_ab", "pll_e"],
  },
  {
    key: "swap",
    title: "Corner & Edge Swap Permutations",
    description: "Both corners and edges move with swaps. These are core full-PLL recognition cases.",
    tone: "rose",
    ids: ["pll_t", "pll_ja", "pll_jb", "pll_ra", "pll_rb", "pll_na", "pll_nb", "pll_f", "pll_v", "pll_y"],
  },
  {
    key: "g-perms",
    title: "Corner & Edge Cycle Permutations (G perms)",
    description: "Complex corner-edge cycles. Recognition quality matters more than raw turning speed here.",
    tone: "sky",
    ids: ["pll_ga", "pll_gb", "pll_gc", "pll_gd"],
  },
];

const OLL_GROUPS: CatalogGroup[] = [
  {
    key: "oll-no-edges",
    title: "No Edges Solved",
    description: "No top-layer edges are oriented yet. These are the most visually scrambled OLL starts.",
    tone: "rose",
    ids: ["oll_1", "oll_2", "oll_3", "oll_4", "oll_18", "oll_19", "oll_17", "oll_20"],
  },
  {
    key: "oll-l-no-corners",
    title: "L-Shaped Edges Solved · No Corners Solved",
    description: "L-shape edge orientation is already present, but corners still need full orientation work.",
    tone: "sky",
    ids: ["oll_48", "oll_47", "oll_53", "oll_54", "oll_49", "oll_50"],
  },
  {
    key: "oll-l-1-corner",
    title: "L-Shaped Edges Solved · 1 Corner Solved",
    description: "L-shape edges plus one correctly oriented corner. Great recognition practice for partial patterns.",
    tone: "sand",
    ids: ["oll_5", "oll_6", "oll_7", "oll_8", "oll_11", "oll_12", "oll_9", "oll_10"],
  },
  {
    key: "oll-l-2-corners",
    title: "L-Shaped Edges Solved · 2 Corners Solved",
    description: "L-shape edge base with two oriented corners. Recognition depends on corner arrangement.",
    tone: "rose",
    ids: ["oll_44", "oll_43", "oll_31", "oll_32", "oll_35", "oll_37", "oll_36", "oll_38", "oll_29", "oll_30", "oll_41", "oll_42"],
  },
  {
    key: "oll-l-4-corners",
    title: "L-Shaped Edges Solved · 4 Corners Solved",
    description: "Corners are already oriented; only the remaining edge orientation pattern needs finishing.",
    tone: "sage",
    ids: ["oll_28"],
  },
  {
    key: "oll-bar-no-corners",
    title: "Bar-Shaped Edges Solved · No Corners Solved",
    description: "A bar edge pattern is present while corners are still fully unoriented.",
    tone: "sky",
    ids: ["oll_51", "oll_56", "oll_52", "oll_55"],
  },
  {
    key: "oll-bar-1-corner",
    title: "Bar-Shaped Edges Solved · 1 Corner Solved",
    description: "Bar edge pattern plus one oriented corner. Focus on fast corner-recognition cues.",
    tone: "sand",
    ids: ["oll_15", "oll_16", "oll_13", "oll_14"],
  },
  {
    key: "oll-bar-2-corners",
    title: "Bar-Shaped Edges Solved · 2 Corners Solved",
    description: "Bar edge base with two corners oriented. Similar shapes split by corner placement.",
    tone: "rose",
    ids: ["oll_33", "oll_45", "oll_34", "oll_46", "oll_40", "oll_39"],
  },
  {
    key: "oll-bar-4-corners",
    title: "Bar-Shaped Edges Solved · 4 Corners Solved",
    description: "Corners are solved and bar edges remain. Usually quick recognition and execution.",
    tone: "sage",
    ids: ["oll_57"],
  },
  {
    key: "oll-4-edges",
    title: "4 Edges Solved (2-Look OLL Corners)",
    description: "All top edges are oriented. These are the corner-orientation cases used in 2-Look OLL / 4LLL.",
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
  const [cfopPhase, setCfopPhase] = useState<CfopPhase>("last-layer");
  const [workspaceMode, setWorkspaceMode] = useState<WorkspaceMode>("full-ll");
  const [set, setSet] = useState<AlgSet>("OLL");
  const [f2lFilter, setF2lFilter] = useState<F2LFilterKey>("all");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<SelectedCase | null>(null);
  const [activeSectionAnchor, setActiveSectionAnchor] = useState<string>("all");

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
        title: "Other PLL",
        description: "PLL cases outside the current grouped list or filtered remnants from the active search.",
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
        title: "Other OLL",
        description: "OLL cases outside the current grouped list or filtered remnants from the active search.",
        tone: "sand",
        ids: [],
        items: remaining,
      });
    }
    return sections;
  }, [filtered, set]);

  const ollCount = useMemo(() => algs.filter((a) => a.set === "OLL").length, []);
  const pllCount = useMemo(() => algs.filter((a) => a.set === "PLL").length, []);
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
  const fourLookSections = useMemo(() => FOUR_LOOK_STAGES, []);
  const fourLookCaseCount = useMemo(
    () => FOUR_LOOK_STAGES.reduce((sum, stage) => sum + stage.cases.length, 0),
    []
  );
  const algById = useMemo(() => {
    const byId = new Map<string, AlgItem>();
    for (const item of algs) byId.set(item.id, item);
    return byId;
  }, []);
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

  const renderCard = (a: AlgItem, sectionTitle?: string) => (
    <button key={a.id} className="card" type="button" onClick={() => setSelected(a)}>
      <div className="cardTop">
        <div className="cardTitle">{formatCaseNameForDisplay(a)}</div>
        <MiniTwisty set={a.set} size={176} thumb={a.thumb} />
      </div>
      <div className="cardHint">{getCatalogCardHint(a, sectionTitle)}</div>
      <pre className="cardAlg">{formatAlgForDisplay(a.alg, a.set)}</pre>
    </button>
  );

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
                <MiniTwisty set={c.set} size={176} thumb={canonicalThumb} />
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
              <pre className="methodCardAlg">{formatAlgForDisplay(c.alg, c.set)}</pre>
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
              <pre className="f2lCardAlg">{formatAlgForDisplay(c.alg, "F2L")}</pre>
            </button>
          );
        })}
      </div>
    </section>
  );

  const selectedCanonical =
    selected?.canonicalCaseId ? algById.get(selected.canonicalCaseId) : undefined;

  return (
    <div className="app">
      <div className="appGlow appGlow--a" aria-hidden="true" />
      <div className="appGlow appGlow--b" aria-hidden="true" />
      <div className="appGridNoise" aria-hidden="true" />

      <main className="shell">
        <header className="hero">
          <div className="heroMain">
            <div className="heroEyebrow">3x3x3 Study System</div>
            <h1 className="heroTitle">Rubik Knowledge Atlas</h1>
            <p className="heroLead">
              A living study base for reviewing algorithms, recognition, and training. OLL/PLL
              today; SRS, OH, BLD, and the rest of your practice workflow next.
            </p>

            <div className="heroStats">
              <div className="statCard">
                <div className="statLabel">OLL Cases</div>
                <div className="statValue">{ollCount}</div>
              </div>
              <div className="statCard">
                <div className="statLabel">PLL Cases</div>
                <div className="statValue">{pllCount}</div>
              </div>
              <div className="statCard">
                <div className="statLabel">Method</div>
                <div className="statValue">CFOP</div>
              </div>
              <div className="statCard">
                <div className="statLabel">{workspaceMode === "full-ll" ? "Path" : "Path"}</div>
                <div className="statValue">
                  {cfopPhase === "f2l"
                    ? `F2L (${visibleF2LCaseCount})`
                    : workspaceMode === "full-ll"
                      ? `Full (${set})`
                      : `4LLL (${fourLookCaseCount})`}
                </div>
              </div>
            </div>
          </div>

          <div className="heroPanels">
            <section className="heroPanel heroPanel--warm">
              <div className="panelKicker">Roadmap</div>
              <h2 className="panelTitle">Next Training Blocks</h2>
              <ul className="panelList">
                <li>SRS to space out OLL/PLL reviews and future sections.</li>
                <li>Case recognition drills and timed practice sessions.</li>
                <li>New sections: F2L, OH, BLD, and personal notes.</li>
              </ul>
            </section>

            <section className="heroPanel heroPanel--cool">
              <div className="panelKicker">Practice Focus</div>
              <div className="chipRow">
                <span className="chip chip--active">Recognition</span>
                <span className="chip">Execution</span>
                <span className="chip">Fingertricks</span>
                <span className="chip">Consistency</span>
              </div>
              <p className="panelText">
                Use the catalog as a quick visual reference and open any case to play the algorithm
                in the viewer.
              </p>
            </section>
          </div>
        </header>

        <div className="workspace">
          <aside className="rail" aria-label="Learning modules">
            <section className="railPanel">
              <div className="railHeader">
                <div className="railTitle">Learning Tracks</div>
                <div className="railBadge">3x3x3</div>
              </div>
              <div className="trackList">
                {LEARNING_TRACKS.map((track) => (
                  <article key={track.title} className="trackCard">
                    <div className="trackTop">
                      <h3>{track.title}</h3>
                      <span
                        className={`pill ${
                          track.state === "Active"
                            ? "pill--active"
                            : track.state === "Planned"
                              ? "pill--planned"
                              : "pill--backlog"
                        }`}
                      >
                        {track.state}
                      </span>
                    </div>
                    <p>{track.detail}</p>
                  </article>
                ))}
              </div>
            </section>

            <section className="railPanel railPanel--compact">
              <div className="railTitle">Practice Modules</div>
              <div className="moduleList">
                {PRACTICE_MODULES.map((mod) => (
                  <div key={mod.name} className="moduleRow">
                    <span>{mod.name}</span>
                    <span className="moduleState">{mod.state}</span>
                  </div>
                ))}
              </div>
            </section>
          </aside>

          <section className="catalogPanel" aria-label="Algorithm catalog">
            <div className="catalogSticky">
              <div className="pathControls">
                <div className="pathControlsLabel">CFOP › Phase</div>
                <div className="workspaceTabs" role="tablist" aria-label="CFOP phase">
                  <button
                    type="button"
                    className={cfopPhase === "f2l" ? "active" : ""}
                    aria-pressed={cfopPhase === "f2l"}
                    onClick={() => setCfopPhase("f2l")}
                  >
                    F2L
                  </button>
                  <button
                    type="button"
                    className={cfopPhase === "last-layer" ? "active" : ""}
                    aria-pressed={cfopPhase === "last-layer"}
                    onClick={() => setCfopPhase("last-layer")}
                  >
                    Last Layer
                  </button>
                </div>
              </div>

              {cfopPhase === "last-layer" && (
                <div className="pathControls">
                  <div className="pathControlsLabel">CFOP › Last Layer › Path</div>
                  <div className="workspaceTabs" role="tablist" aria-label="Last layer path">
                    <button
                      type="button"
                      className={workspaceMode === "full-ll" ? "active" : ""}
                      aria-pressed={workspaceMode === "full-ll"}
                      onClick={() => setWorkspaceMode("full-ll")}
                    >
                      Full OLL + PLL
                    </button>
                    <button
                      type="button"
                      className={workspaceMode === "4lll" ? "active" : ""}
                      aria-pressed={workspaceMode === "4lll"}
                      onClick={() => setWorkspaceMode("4lll")}
                    >
                      4LLL Guided Path
                    </button>
                  </div>
                </div>
              )}

              <header className="catalogHeader">
                <div className="catalogHeaderTop">
                  <div>
                    <div className="catalogEyebrow">CFOP · {cfopPhase === "f2l" ? "F2L" : "Last Layer"}</div>
                    <h2 className="catalogTitle">
                      {cfopPhase === "f2l"
                        ? "F2L Cases (Canonical) · 41-Case Catalog"
                        : workspaceMode === "full-ll"
                          ? "Full Last Layer Library (OLL + PLL)"
                          : "4-Look Last Layer (4LLL) · Guided Simplification"}
                    </h2>
                    <p className="catalogDescription">
                      {cfopPhase === "f2l"
                        ? "Canonical F2L catalog (F2L 1–41). Current starter build includes F2L 1–30 and will expand case-by-case with exact recognition thumbnails."
                        : workspaceMode === "full-ll"
                          ? "Canonical OLL and PLL case library inside CFOP. Browse recognition categories and drill exact cases."
                          : "A simplified path for the same CFOP last-layer concepts: 2-Look OLL + 2-Look PLL in four total looks."}
                    </p>
                  </div>
                  <div className="catalogMeta">
                    <span className="metaPill">Method: CFOP</span>
                    <span className="metaPill">Phase: {cfopPhase === "f2l" ? "F2L" : "Last Layer"}</span>
                    {cfopPhase === "last-layer" && (
                      <span className="metaPill">
                        Path: {workspaceMode === "full-ll" ? `Full ${SET_META[lastLayerSet].short}` : "4LLL"}
                      </span>
                    )}
                    {cfopPhase === "f2l" && <span className="metaPill">Canonical 41-case target</span>}
                    <span className="metaPill">Top color: Yellow</span>
                  </div>
                </div>

                {cfopPhase === "f2l" ? (
                  <div className="controls">
                    <input
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      placeholder="Search canonical F2L (e.g. F2L 1, free pairs, U R U' R')..."
                    />
                    {!SHOW_F2L_DRILLS && (
                      <div className="f2lCanonicalBanner">
                        <strong>Starter subset:</strong> `F2L 1–30` loaded (Free, Disconnected, Connected, and
                        Corner-in-Slot starter block). Next steps are the remaining canonical groups up to `41`.
                      </div>
                    )}
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
                    <div className="tabs" role="tablist" aria-label="Algorithm set">
                      <button
                        type="button"
                        className={set === "OLL" ? "active" : ""}
                        aria-pressed={set === "OLL"}
                        onClick={() => setSet("OLL")}
                      >
                        <span className="tabLong">Orientation of Last Layer</span>
                        <span className="tabShort">(OLL)</span>
                      </button>
                      <button
                        type="button"
                        className={set === "PLL" ? "active" : ""}
                        aria-pressed={set === "PLL"}
                        onClick={() => setSet("PLL")}
                      >
                        <span className="tabLong">Permutation of Last Layer</span>
                        <span className="tabShort">(PLL)</span>
                      </button>
                    </div>

                    <input
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      placeholder={`Search ${set} (e.g. ${set === "PLL" ? "Ga, T-perm" : "OLL 27, Sune"})...`}
                    />
                  </div>
                ) : (
                  <div className="methodSummaryRow">
                    <div className="methodSummaryCard">
                      <span className="methodSummaryLabel">Stage 1</span>
                      <strong>OLL Edges</strong>
                    </div>
                    <div className="methodSummaryCard">
                      <span className="methodSummaryLabel">Stage 2</span>
                      <strong>OLL Corners</strong>
                    </div>
                    <div className="methodSummaryCard">
                      <span className="methodSummaryLabel">Stage 3</span>
                      <strong>PLL Corners</strong>
                    </div>
                    <div className="methodSummaryCard">
                      <span className="methodSummaryLabel">Stage 4</span>
                      <strong>PLL Edges</strong>
                    </div>
                  </div>
                )}

                <div className="catalogSubRow">
                  {cfopPhase === "f2l" ? (
                    <div className="subtleNote">
                      Canonical F2L loaded: {visibleF2LCaseCount}/{F2L_CANONICAL_TOTAL} cases
                    </div>
                  ) : workspaceMode === "full-ll" ? (
                    set === "OLL" ? (
                      <div className="subtleNote">OLL loaded: {ollCount}/57 cases</div>
                    ) : (
                      <div className="subtleNote">PLL loaded: {pllCount}/21 cases</div>
                    )
                  ) : (
                    <div className="subtleNote">
                      4LLL is a simplified route through CFOP last layer concepts (OLL + PLL subset)
                    </div>
                  )}
                  {!!q.trim() && (
                    <div className="searchEcho">Filter: “{q.trim()}”</div>
                  )}
                  {cfopPhase === "f2l" && SHOW_F2L_DRILLS && f2lFilter !== "all" && (
                    <div className="searchEcho">Focus: {F2L_FILTERS.find((f) => f.key === f2lFilter)?.label}</div>
                  )}
                </div>
              </header>

              {!!navSections.length && (
                <nav
                  className="sectionNav"
                  aria-label={
                    cfopPhase === "f2l"
                      ? "F2L categories"
                      : workspaceMode === "full-ll"
                      ? `${SET_META[lastLayerSet].short} categories`
                      : "4-Look stages"
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
                  All
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
          </section>
        </div>
      </main>

      {selected && (
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
                    : "Recognition + execution viewer"}
                </div>
              </div>
              <button className="close" type="button" onClick={() => setSelected(null)}>
                ✕
              </button>
            </div>

            <div className="modalLayout">
              <section className="viewerPanel">
                <div className="viewerPanelBar">
                  <span>Case Viewer</span>
                  <span className="viewerPanelHint">
                    {selected.set === "F2L" ? "CFOP F2L stickering · U-top" : "Yellow top · z2"}
                  </span>
                </div>
                <div className="viewerPanelStage">
                  <Twisty
                    alg={selected.alg}
                    setupAlg={selected.set === "F2L" ? selected.f2lMeta?.caseSetupAlg : undefined}
                    experimentalStickering={selected.set === "F2L" ? "F2L" : undefined}
                  />
                </div>
              </section>

              <aside className="modalSide">
                <section className="recognitionPanel">
                  <div className="label">Recognition</div>
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
                      <MiniTwisty set={selected.set} size={210} thumb={selected.thumb} />
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
                  <div className="label">Algorithm</div>
                  <code>{formatAlgForDisplay(selected.alg, selected.set)}</code>
                </section>

                {selected.sourceMethod === "4LLL" && selectedCanonical && (
                  <section className="canonicalPanel">
                    <div className="label">Canonical CFOP Case</div>
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
                        Open Case
                      </button>
                    </div>
                  </section>
                )}

                <section className="modalNoteCard">
                  <div className="modalNoteTitle">
                    {selected.set === "F2L" ? "Case Notes" : "Study Notes (next)"}
                  </div>
                  {selected.set === "F2L" && selected.f2lMeta ? (
                    <>
                      <p>Recognition preview matches the viewer start state for this case setup.</p>
                      <p>{selected.f2lMeta.note}</p>
                      {selected.f2lMeta.caseSetupAlg && (
                        <p><strong>Recognition setup (pilot):</strong> {selected.f2lMeta.caseSetupAlg}</p>
                      )}
                      {selected.f2lMeta.setup && <p><strong>Setup:</strong> {selected.f2lMeta.setup}</p>}
                    </>
                  ) : (
                    <p>
                      This is where OH variants, fingertricks, triggers, and per-case SRS scoring
                      will fit next.
                    </p>
                  )}
                </section>
              </aside>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
