// BLD (Blindfolded) data — Speffz letter scheme + M2/OP commutators
// Speffz is the standard letter scheme used by most BLD solvers.
//
// EDGES — M2 method, buffer = UF sticker (Speffz letter C)
// CORNERS — Old Pochmann (OP) method, using URF as corner buffer (Speffz letter B)
// Note: some tutorials choose a different corner buffer/lettering convention.
//
// Alg format: full sequence (setup + commutator move + undo setup)
// The "setupAlg" is shown separately so learners can understand the pattern.
//
// Corner fullAlg = setup · Y-perm · undo(setup)
// Y-perm: R U' R' U' R U R' F' R U R' U' R' F R

export type BldTarget = {
  id: string;       // e.g. "edge_A", "corner_A"
  letter: string;   // Speffz letter A–X
  position: string; // sticker label, e.g. "UB" (face + face order)
  faceName: string; // human-readable face description, e.g. "Up-Back"
  setupAlg: string; // setup moves only (before the core commutator)
  fullAlg: string;  // complete executable sequence
  isBuffer: boolean;
  note?: string;
};

// ---------------------------------------------------------------------------
// EDGES — M2 method
// Buffer: UF edge piece. C = U sticker of UF, I = F sticker of UF (same piece).
// Both C and I are skipped in drills.
// Reference: https://www.speedsolving.com/wiki/index.php/M2/OP
// ---------------------------------------------------------------------------

export const SPEFFZ_EDGES: BldTarget[] = [
  {
    id: "edge_A",
    letter: "A",
    position: "UB",
    faceName: "Up-Back",
    setupAlg: "U2",
    fullAlg: "U2 M2 U2",
    isBuffer: false,
    note: "Direct M-slice position. Simple U2 setup.",
  },
  {
    id: "edge_B",
    letter: "B",
    position: "UR",
    faceName: "Up-Right",
    setupAlg: "R U' R'",
    fullAlg: "R U' R' M2 R U R'",
    isBuffer: false,
  },
  {
    id: "edge_C",
    letter: "C",
    position: "UF",
    faceName: "Up-Front",
    setupAlg: "",
    fullAlg: "",
    isBuffer: true,
    note: "Buffer piece — skip in memo.",
  },
  {
    id: "edge_D",
    letter: "D",
    position: "UL",
    faceName: "Up-Left",
    setupAlg: "L' U L",
    fullAlg: "L' U L M2 L' U' L",
    isBuffer: false,
  },
  {
    id: "edge_E",
    letter: "E",
    position: "LU",
    faceName: "Left-Up",
    setupAlg: "U L' U'",
    fullAlg: "U L' U' M2 U L U'",
    isBuffer: false,
  },
  {
    id: "edge_F",
    letter: "F",
    position: "LF",
    faceName: "Left-Front",
    setupAlg: "L2",
    fullAlg: "L2 M2 L2",
    isBuffer: false,
  },
  {
    id: "edge_G",
    letter: "G",
    position: "LD",
    faceName: "Left-Down",
    setupAlg: "U' L U",
    fullAlg: "U' L U M2 U' L' U",
    isBuffer: false,
  },
  {
    id: "edge_H",
    letter: "H",
    position: "LB",
    faceName: "Left-Back",
    setupAlg: "L",
    fullAlg: "L M2 L'",
    isBuffer: false,
  },
  {
    id: "edge_I",
    letter: "I",
    position: "FU",
    faceName: "Front-Up",
    setupAlg: "",
    fullAlg: "",
    isBuffer: true,
    note: "Buffer piece (F sticker of UF) — skip in memo.",
  },
  {
    id: "edge_J",
    letter: "J",
    position: "FR",
    faceName: "Front-Right",
    setupAlg: "U R U'",
    fullAlg: "U R U' M2 U R' U'",
    isBuffer: false,
  },
  {
    id: "edge_K",
    letter: "K",
    position: "FD",
    faceName: "Front-Down",
    setupAlg: "D R' D'",
    fullAlg: "D R' D' M2 D R D'",
    isBuffer: false,
  },
  {
    id: "edge_L",
    letter: "L",
    position: "FL",
    faceName: "Front-Left",
    setupAlg: "L'",
    fullAlg: "L' M2 L",
    isBuffer: false,
  },
  {
    id: "edge_M",
    letter: "M",
    position: "RU",
    faceName: "Right-Up",
    setupAlg: "U' R' U",
    fullAlg: "U' R' U M2 U' R U",
    isBuffer: false,
  },
  {
    id: "edge_N",
    letter: "N",
    position: "RB",
    faceName: "Right-Back",
    setupAlg: "R'",
    fullAlg: "R' M2 R",
    isBuffer: false,
  },
  {
    id: "edge_O",
    letter: "O",
    position: "RD",
    faceName: "Right-Down",
    setupAlg: "D' R D",
    fullAlg: "D' R D M2 D' R' D",
    isBuffer: false,
  },
  {
    id: "edge_P",
    letter: "P",
    position: "RF",
    faceName: "Right-Front",
    setupAlg: "R",
    fullAlg: "R M2 R'",
    isBuffer: false,
  },
  {
    id: "edge_Q",
    letter: "Q",
    position: "BU",
    faceName: "Back-Up",
    setupAlg: "U' B' U",
    fullAlg: "U' B' U M2 U' B U",
    isBuffer: false,
  },
  {
    id: "edge_R",
    letter: "R",
    position: "BL",
    faceName: "Back-Left",
    setupAlg: "B' L' B",
    fullAlg: "B' L' B M2 B' L B",
    isBuffer: false,
  },
  {
    id: "edge_S",
    letter: "S",
    position: "BD",
    faceName: "Back-Down",
    setupAlg: "D' B D",
    fullAlg: "D' B D M2 D' B' D",
    isBuffer: false,
  },
  {
    id: "edge_T",
    letter: "T",
    position: "BR",
    faceName: "Back-Right",
    setupAlg: "B R B'",
    fullAlg: "B R B' M2 B R' B'",
    isBuffer: false,
  },
  {
    id: "edge_U",
    letter: "U",
    position: "DL",
    faceName: "Down-Left",
    setupAlg: "D' L' D",
    fullAlg: "D' L' D M2 D' L D",
    isBuffer: false,
  },
  {
    id: "edge_V",
    letter: "V",
    position: "DF",
    faceName: "Down-Front",
    setupAlg: "",
    fullAlg: "M2",
    isBuffer: false,
    note: "Direct M2 — no setup needed.",
  },
  {
    id: "edge_W",
    letter: "W",
    position: "DR",
    faceName: "Down-Right",
    setupAlg: "D R D'",
    fullAlg: "D R D' M2 D R' D'",
    isBuffer: false,
  },
  {
    id: "edge_X",
    letter: "X",
    position: "DB",
    faceName: "Down-Back",
    setupAlg: "D2",
    fullAlg: "D2 M2 D2",
    isBuffer: false,
    note: "Direct M-slice position opposite to A.",
  },
];

// ---------------------------------------------------------------------------
// CORNERS — Old Pochmann (OP) method
// Buffer: URF corner piece. B = U sticker of URF (facing Up).
// This is a valid OP convention; other guides may pick a different corner buffer.
// Y-perm: R U' R' U' R U R' F' R U R' U' R' F R
// fullAlg = setup · Y-perm · undo(setup)
// B, H and P (the three stickers of URF) are buffer — skipped in drills.
// ---------------------------------------------------------------------------

// Y_PERM inline value used to build each fullAlg
const Y = "R U' R' U' R U R' F' R U R' U' R' F R";

export const SPEFFZ_CORNERS: BldTarget[] = [
  {
    id: "corner_A",
    letter: "A",
    position: "UBR",
    faceName: "Up-Back-Right (U sticker)",
    setupAlg: "R' F R",
    fullAlg: `R' F R  ${Y}  R' F' R`,
    isBuffer: false,
  },
  {
    id: "corner_B",
    letter: "B",
    position: "URF",
    faceName: "Up-Right-Front (U sticker)",
    setupAlg: "",
    fullAlg: "",
    isBuffer: true,
    note: "Buffer piece — skip in memo.",
  },
  {
    id: "corner_C",
    letter: "C",
    position: "UFL",
    faceName: "Up-Front-Left (U sticker)",
    setupAlg: "F'",
    fullAlg: `F'  ${Y}  F`,
    isBuffer: false,
  },
  {
    id: "corner_D",
    letter: "D",
    position: "ULB",
    faceName: "Up-Left-Back (U sticker)",
    setupAlg: "F' L F",
    fullAlg: `F' L F  ${Y}  F' L' F`,
    isBuffer: false,
  },
  {
    id: "corner_E",
    letter: "E",
    position: "LUB",
    faceName: "Left-Up-Back (L sticker)",
    setupAlg: "F' L2 F",
    fullAlg: `F' L2 F  ${Y}  F' L2 F`,
    isBuffer: false,
  },
  {
    id: "corner_F",
    letter: "F",
    position: "LBD",
    faceName: "Left-Back-Down (L sticker)",
    setupAlg: "F' L' F",
    fullAlg: `F' L' F  ${Y}  F' L F`,
    isBuffer: false,
  },
  {
    id: "corner_G",
    letter: "G",
    position: "LDF",
    faceName: "Left-Down-Front (L sticker)",
    setupAlg: "D F' D'",
    fullAlg: `D F' D'  ${Y}  D F D'`,
    isBuffer: false,
  },
  {
    id: "corner_H",
    letter: "H",
    position: "LFU",
    faceName: "Left-Front-Up (L sticker)",
    setupAlg: "",
    fullAlg: "",
    isBuffer: true,
    note: "Buffer piece (L sticker of URF) — skip.",
  },
  {
    id: "corner_I",
    letter: "I",
    position: "FUL",
    faceName: "Front-Up-Left (F sticker)",
    setupAlg: "L",
    fullAlg: `L  ${Y}  L'`,
    isBuffer: false,
  },
  {
    id: "corner_J",
    letter: "J",
    position: "FRD",
    faceName: "Front-Right-Down (F sticker)",
    setupAlg: "R2",
    fullAlg: `R2  ${Y}  R2`,
    isBuffer: false,
  },
  {
    id: "corner_K",
    letter: "K",
    position: "FDL",
    faceName: "Front-Down-Left (F sticker)",
    setupAlg: "L2",
    fullAlg: `L2  ${Y}  L2`,
    isBuffer: false,
  },
  {
    id: "corner_L",
    letter: "L",
    position: "FLU",
    faceName: "Front-Left-Up (F sticker)",
    setupAlg: "L'",
    fullAlg: `L'  ${Y}  L`,
    isBuffer: false,
  },
  {
    id: "corner_M",
    letter: "M",
    position: "RUB",
    faceName: "Right-Up-Back (R sticker)",
    setupAlg: "F",
    fullAlg: `F  ${Y}  F'`,
    isBuffer: false,
  },
  {
    id: "corner_N",
    letter: "N",
    position: "RBD",
    faceName: "Right-Back-Down (R sticker)",
    setupAlg: "R' F2 R",
    fullAlg: `R' F2 R  ${Y}  R' F2 R`,
    isBuffer: false,
  },
  {
    id: "corner_O",
    letter: "O",
    position: "RDF",
    faceName: "Right-Down-Front (R sticker)",
    setupAlg: "F2",
    fullAlg: `F2  ${Y}  F2`,
    isBuffer: false,
  },
  {
    id: "corner_P",
    letter: "P",
    position: "RFU",
    faceName: "Right-Front-Up (R sticker)",
    setupAlg: "",
    fullAlg: "",
    isBuffer: true,
    note: "Buffer piece (R sticker of URF) — skip.",
  },
  {
    id: "corner_Q",
    letter: "Q",
    position: "BUL",
    faceName: "Back-Up-Left (B sticker)",
    setupAlg: "R' F' R",
    fullAlg: `R' F' R  ${Y}  R' F R`,
    isBuffer: false,
  },
  {
    id: "corner_R",
    letter: "R",
    position: "BLD",
    faceName: "Back-Left-Down (B sticker)",
    setupAlg: "F' L2 F",
    fullAlg: `F' L2 F  ${Y}  F' L2 F`,
    isBuffer: false,
  },
  {
    id: "corner_S",
    letter: "S",
    position: "BDR",
    faceName: "Back-Down-Right (B sticker)",
    setupAlg: "F R' F'",
    fullAlg: `F R' F'  ${Y}  F R F'`,
    isBuffer: false,
  },
  {
    id: "corner_T",
    letter: "T",
    position: "BRU",
    faceName: "Back-Right-Up (B sticker)",
    setupAlg: "R' F' R",
    fullAlg: `R' F' R  ${Y}  R' F R`,
    isBuffer: false,
    note: "Same full alg as Q — both B-face corners share this setup.",
  },
  {
    id: "corner_U",
    letter: "U",
    position: "DFL",
    faceName: "Down-Front-Left (D sticker)",
    setupAlg: "F2 L",
    fullAlg: `F2 L  ${Y}  L' F2`,
    isBuffer: false,
  },
  {
    id: "corner_V",
    letter: "V",
    position: "DRF",
    faceName: "Down-Right-Front (D sticker)",
    setupAlg: "R2 F2",
    fullAlg: `R2 F2  ${Y}  F2 R2`,
    isBuffer: false,
  },
  {
    id: "corner_W",
    letter: "W",
    position: "DBR",
    faceName: "Down-Back-Right (D sticker)",
    setupAlg: "R' F' R",
    fullAlg: `R' F' R  ${Y}  R' F R`,
    isBuffer: false,
  },
  {
    id: "corner_X",
    letter: "X",
    position: "DLB",
    faceName: "Down-Left-Back (D sticker)",
    setupAlg: "F2 L'",
    fullAlg: `F2 L'  ${Y}  L F2`,
    isBuffer: false,
  },
];

// Y-perm (used in OP corners) for reference display
export const Y_PERM = "R U' R' U' R U R' F' R U R' U' R' F R";

// M2 core move
export const M2_MOVE = "M2";
