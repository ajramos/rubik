import React, { useEffect, useMemo, useState } from "react";
import algsRaw from "./data/algs.json";
import type { AlgItem, AlgSet } from "./types";
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
import { loadStreaks, recordPractice } from "./utils/streaks";
import type { StreakData } from "./utils/streaks";
import { loadPrefs, setPreferredAlg, clearPreferredAlg } from "./utils/prefs";
import type { PrefsData } from "./utils/prefs";

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
type AppSection = "study" | "practice" | "progress" | "reference";

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

const APP_SECTION_LABELS: Record<AppSection, string> = {
  study: "Study",
  practice: "Practice",
  progress: "Progress",
  reference: "Reference",
};

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
  {
    key: "f2l-canonical-edge-in-slot",
    title: "Edge In Slot",
    description:
      "F2L cases where the edge piece is already sitting in the FR slot. The corner is free in the U layer. Strategy: disrupt the edge, pair it with the corner, and reinsert.",
    tone: "sky",
    cases: [
      {
        id: "f2l_31",
        name: "F2L 31",
        alg: "R U' R' U2 R U' R'",
        caseSetupAlg: "R U R' U2 R U R'",
        note: "Edge correctly in slot, corner on U (case 1). U2 realignment sequence before clean pair insertion.",
        setup: "R U R' U2 R U R'",
        tags: ["right-slot", "extraction", "pairing"],
      },
      {
        id: "f2l_32",
        name: "F2L 32",
        alg: "U R U2 R' U' R U R'",
        caseSetupAlg: "R U' R' U R U2 R' U'",
        note: "Edge correctly in slot, corner on U (case 2). Pre-AUF into a U2 pair-and-insert sequence.",
        setup: "R U' R' U R U2 R' U'",
        tags: ["right-slot", "extraction", "pairing"],
      },
      {
        id: "f2l_33",
        name: "F2L 33",
        alg: "U' R U2 R' U R U' R'",
        caseSetupAlg: "R U R' U' R U2 R' U",
        note: "Edge correctly in slot, corner on U (case 3). U' pre-adjust, then U2 pivot before final insert.",
        setup: "R U R' U' R U2 R' U",
        tags: ["right-slot", "extraction", "advanced"],
      },
      {
        id: "f2l_34",
        name: "F2L 34",
        alg: "F' U F U R U' R'",
        caseSetupAlg: "R U R' U' F' U' F",
        note: "Edge flipped in slot, corner on U (case 1). F-trigger extracts the flipped edge, then standard R/U insert.",
        setup: "R U R' U' F' U' F",
        tags: ["right-slot", "extraction", "trigger"],
      },
      {
        id: "f2l_35",
        name: "F2L 35",
        alg: "F' U' F U2 R U' R'",
        caseSetupAlg: "R U R' U2 F' U F",
        note: "Edge flipped in slot, corner on U (case 2). F-trigger with U' and U2 realignment after extraction.",
        setup: "R U R' U2 F' U F",
        tags: ["right-slot", "extraction", "trigger", "advanced"],
      },
      {
        id: "f2l_36",
        name: "F2L 36",
        alg: "R U' R' F' U2 F",
        caseSetupAlg: "F' U2 F R U R'",
        note: "Edge flipped in slot, corner on U (case 3). Compact R/U opener followed by F-trigger finish.",
        setup: "F' U2 F R U R'",
        tags: ["right-slot", "extraction", "trigger"],
      },
    ],
  },
  {
    key: "f2l-canonical-both-in-slot",
    title: "Both In Slot",
    description:
      "The final 5 canonical F2L cases: both the corner and edge are stuck in slot positions. These are the most complex recovery cases in the 41-case set and require multi-phase extraction.",
    tone: "sage",
    cases: [
      {
        id: "f2l_37",
        name: "F2L 37",
        alg: "R U R' U' R U R' U' R U' R'",
        caseSetupAlg: "R U R' U R U' R' U R U' R'",
        note: "Both pieces in slot (case 1). Repeated R/U rhythm dislodges corner, pairs with edge, then reinserts.",
        setup: "R U R' U R U' R' U R U' R'",
        tags: ["right-slot", "recovery", "extraction", "advanced"],
      },
      {
        id: "f2l_38",
        name: "F2L 38",
        alg: "R U' R' U2 R U R' U R U' R'",
        caseSetupAlg: "R U R' U' R U' R' U2 R U R'",
        note: "Both pieces in slot (case 2). U2 realignment mid-sequence before the pair locks in.",
        setup: "R U R' U' R U' R' U2 R U R'",
        tags: ["right-slot", "recovery", "extraction", "advanced"],
      },
      {
        id: "f2l_39",
        name: "F2L 39",
        alg: "R U2 R' U' R U' R' U R U R'",
        caseSetupAlg: "R U' R' U R U R' U R U2 R'",
        note: "Both pieces in slot (case 3). U2 opener before a pair-then-insert with double U finish.",
        setup: "R U' R' U R U R' U R U2 R'",
        tags: ["right-slot", "recovery", "extraction", "advanced"],
      },
      {
        id: "f2l_40",
        name: "F2L 40",
        alg: "R U' R' U R U' R' U2 R U R'",
        caseSetupAlg: "R U' R' U2 R U R' U' R U R'",
        note: "Both pieces in slot (case 4). Three-phase extraction: dislodge, U2-adjust, reinsert.",
        setup: "R U' R' U2 R U R' U' R U R'",
        tags: ["right-slot", "recovery", "extraction", "advanced"],
      },
      {
        id: "f2l_41",
        name: "F2L 41",
        alg: "R U R' U' R U2 R' U' R U R'",
        caseSetupAlg: "R U' R' U R U2 R' U R U' R'",
        note: "Canonical case 41: the hardest both-in-slot scenario. The U2 pivot mid-sequence is the key recognition cue.",
        setup: "R U' R' U R U2 R' U R U' R'",
        tags: ["right-slot", "recovery", "extraction", "advanced"],
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

function invertAlg(alg: string): string {
  const expanded = expandNamedTokens(alg);
  const stripped = expanded.replace(/[\[\]]/g, "");
  const tokens = stripped.trim().split(/\s+/).filter(Boolean);
  return tokens
    .reverse()
    .map((m) => {
      if (m.endsWith("2")) return m;
      if (m.endsWith("'")) return m.slice(0, -1);
      return m + "'";
    })
    .join(" ");
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
  const [appSection, setAppSection] = useState<AppSection>("study");
  const [cfopPhase, setCfopPhase] = useState<CfopPhase>("last-layer");
  const [workspaceMode, setWorkspaceMode] = useState<WorkspaceMode>("full-ll");
  const [set, setSet] = useState<AlgSet>("OLL");
  const [f2lFilter, setF2lFilter] = useState<F2LFilterKey>("all");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<SelectedCase | null>(null);
  const [activeSectionAnchor, setActiveSectionAnchor] = useState<string>("all");
  const [srsData, setSrsData] = useState<Record<string, SRSCard>>(() => loadSRS());
  const [streaks, setStreaks] = useState<StreakData>(() => loadStreaks());
  const [prefs, setPrefs] = useState<PrefsData>(() => loadPrefs());
  const [drillSet, setDrillSet] = useState<"OLL" | "PLL" | "OLL_EXEC" | "PLL_EXEC" | "TODAY" | null>(null);
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
  const ollCases = useMemo(() => algs.filter((a) => a.set === "OLL"), []);
  const pllCases = useMemo(() => algs.filter((a) => a.set === "PLL"), []);

  const ollDueCount = useMemo(
    () => ollCases.filter((c) => { const card = srsData[c.id]; return !!card && isDue(card); }).length,
    [ollCases, srsData]
  );
  const pllDueCount = useMemo(
    () => pllCases.filter((c) => { const card = srsData[c.id]; return !!card && isDue(card); }).length,
    [pllCases, srsData]
  );
  const todayDueCases = useMemo(() => {
    const due = [...ollCases, ...pllCases].filter((c) => {
      const card = srsData[c.id];
      return !!card && isDue(card);
    });
    due.sort((a, b) => {
      const da = srsData[a.id]!.dueDate;
      const db = srsData[b.id]!.dueDate;
      return da < db ? -1 : da > db ? 1 : 0;
    });
    return due;
  }, [ollCases, pllCases, srsData]);

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

  const weakCases = useMemo(() => {
    return [...ollCases, ...pllCases]
      .filter((c) => !!srsData[c.id])
      .sort((a, b) => srsData[a.id]!.easeFactor - srsData[b.id]!.easeFactor)
      .slice(0, 8)
      .map((c) => ({
        id: c.id,
        label: formatCaseNameForDisplay(c),
        set: c.set as "OLL" | "PLL",
        easeFactor: srsData[c.id]!.easeFactor,
        reps: srsData[c.id]!.reps,
      }));
  }, [ollCases, pllCases, srsData]);

  function handleRate(id: string, rating: SRSRating) {
    const card = getSRSCard(id, srsData);
    const updated = scheduleCard(card, rating);
    const next = { ...srsData, [id]: updated };
    setSrsData(next);
    saveSRS(next);
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
          <MiniTwisty set={a.set} size={176} thumb={a.thumb} />
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

  const activePrimaryLabel = APP_SECTION_LABELS[appSection];
  const heroEyebrow =
    appSection === "study"
      ? "3x3x3 Study System"
      : appSection === "practice"
        ? "3x3x3 Practice Workspace"
        : appSection === "progress"
          ? "3x3x3 Progress Tracking"
          : "3x3x3 Reference Desk";
  const breadcrumbParts = [
    appSection === "study" ? "Study" : activePrimaryLabel,
    ...(appSection === "study"
      ? [
          "3x3",
          "CFOP",
          cfopPhase === "f2l" ? "First 2 Layers (F2L)" : "Last Layer",
          ...(cfopPhase === "f2l"
            ? []
            : workspaceMode === "4lll"
              ? ["4-Look Last Layer"]
              : [
                  "Full OLL+PLL",
                  set === "OLL" ? "Orientation of Last Layer" : "Permutation of Last Layer",
                ]),
        ]
      : []),
  ];
  const fullLastLayerTitle =
    set === "OLL"
      ? "Orientation of Last Layer (OLL)"
      : "Permutation of Last Layer (PLL)";
  const fullLastLayerDescription =
    set === "OLL"
      ? "Canonical OLL library inside CFOP Last Layer. Browse recognition categories and drill exact orientation cases."
      : "Canonical PLL library inside CFOP Last Layer. Browse recognition categories and drill exact permutation cases.";
  const catalogDescriptionText =
    cfopPhase === "f2l"
      ? "CFOP First 2 Layers case library. Complete canonical 41-case set: Free, Disconnected, Connected, Corner-in-Slot, Edge-in-Slot, and Both-in-Slot."
      : workspaceMode === "full-ll"
        ? fullLastLayerDescription
        : "Simplified CFOP Last Layer path: 2-Look OLL + 2-Look PLL solved in four looks.";
  return (
    <div className="app">
      <div className="appGlow appGlow--a" aria-hidden="true" />
      <div className="appGlow appGlow--b" aria-hidden="true" />
      <div className="appGridNoise" aria-hidden="true" />

      <main className="shell">
        <AppHero heroEyebrow={heroEyebrow} />

        <div className="workspace">
          <AppRail
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
            aria-label={appSection === "study" ? "Algorithm catalog" : `${activePrimaryLabel} workspace`}
          >
            {appSection !== "study" ? (
              <WorkspaceScaffold
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
                onStartTodayQueue={appSection === "practice" ? () => setDrillSet("TODAY") : undefined}
                onStartDrill={appSection === "practice" ? (s: "OLL" | "PLL" | "OLL_EXEC" | "PLL_EXEC") => setDrillSet(s) : undefined}
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
                        ? "First 2 Layers Cases"
                        : workspaceMode === "full-ll"
                          ? fullLastLayerTitle
                          : "4-Look Last Layer (4LLL)"}
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
                      placeholder="Search canonical F2L (e.g. F2L 1, free pairs, U R U' R')..."
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
                      placeholder={`Search ${set} (e.g. ${set === "PLL" ? "Ga, T-perm" : "OLL 27, Sune"})...`}
                    />
                  </div>
                ) : (
                  <div className="controls">
                    <input
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      placeholder="Search 4LLL (e.g. Sune, H-perm, OLL corners)..."
                    />
                  </div>
                )}

                <div className="catalogSubRow">
                  {cfopPhase === "f2l" ? (
                    <div className="subtleNote">
                      F2L: {visibleF2LCaseCount}/{F2L_CANONICAL_TOTAL} cases
                    </div>
                  ) : workspaceMode === "full-ll" ? (
                    set === "OLL" ? (
                      <div className="subtleNote">OLL loaded: {ollCount}/57 cases</div>
                    ) : (
                      <div className="subtleNote">PLL loaded: {pllCount}/21 cases</div>
                    )
                  ) : (
                    <div className="subtleNote">
                      4LLL loaded: {visibleFourLookCaseCount}
                      {q.trim() ? `/${fourLookCaseCount}` : ""} cases
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
            </>
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
                  {selected.alts && selected.alts.length > 0 && (
                    <div className="algAltPicker">
                      <button
                        type="button"
                        className={`algAltBtn${!prefs.preferredAlgs[selected.id] ? " algAltBtn--active" : ""}`}
                        onClick={() => setPrefs((p) => clearPreferredAlg(p, selected.id))}
                      >
                        Default
                      </button>
                      {selected.alts.map((alt, i) => (
                        <button
                          key={i}
                          type="button"
                          className={`algAltBtn${prefs.preferredAlgs[selected.id] === alt ? " algAltBtn--active" : ""}`}
                          onClick={() => setPrefs((p) => setPreferredAlg(p, selected.id, alt))}
                        >
                          Alt {i + 1}
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
                    <div className="label">Setup from solved</div>
                    <code className="setupDisplay">{invertAlg(prefs.preferredAlgs[selected.id] ?? selected.alg)}</code>
                  </section>
                )}

                {detectTriggers(selected.alg).length > 0 && (
                  <section className="triggersPanel">
                    <div className="label">Triggers</div>
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

      {drillSet && (
        <DrillModal
          cases={
            drillSet === "TODAY"
              ? todayDueCases
              : drillSet === "OLL" || drillSet === "OLL_EXEC"
                ? ollCases
                : pllCases
          }
          label={
            drillSet === "TODAY" ? "Today's Queue" :
            drillSet === "OLL_EXEC" ? "OLL" :
            drillSet === "PLL_EXEC" ? "PLL" :
            drillSet
          }
          mode={drillSet === "OLL_EXEC" || drillSet === "PLL_EXEC" ? "execution" : "recognition"}
          srsData={srsData}
          preferredAlgs={prefs.preferredAlgs}
          onRate={handleRate}
          onClose={() => setDrillSet(null)}
        />
      )}

      {timedBlockOpen && (
        <TimedBlockModal
          ollCases={ollCases}
          pllCases={pllCases}
          srsData={srsData}
          preferredAlgs={prefs.preferredAlgs}
          onRate={handleRate}
          onClose={() => setTimedBlockOpen(false)}
        />
      )}

      {scrambleTimerOpen && (
        <ScrambleTimerModal onClose={() => setScrambleTimerOpen(false)} />
      )}
    </div>
  );
}
