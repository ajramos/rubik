import React, { useState } from "react";

/**
 * SpeffzNet — unfolded cube net using CSS divs for rich visual styling.
 *
 * Net layout (cross):
 *        [U]
 *   [L] [F] [R] [B]
 *        [D]
 *
 * Each face is a 3×3 grid of sticker divs.
 * Corner positions: [0][0], [0][2], [2][0], [2][2]
 * Edge positions:   [0][1], [1][0], [1][2], [2][1]
 * Centre:           [1][1] — unlabelled, shows face letter watermark
 *
 * Hover any letter to highlight all its positions across the net.
 * The same letter appears twice per face region (edge + adjacent corner)
 * by design of the Speffz scheme.
 */

// ── Types ──────────────────────────────────────────────────────────────────

type Sticker = { l: string; buf?: boolean } | null;  // null = centre cell

// ── Data ──────────────────────────────────────────────────────────────────

/** Standard Rubik's cube face colours (slightly saturated for visibility). */
const FACE_BG: Record<string, string> = {
  U: "#cccccc",   // white / light grey
  F: "#28b558",   // green
  R: "#de4035",   // red
  B: "#3c6fd4",   // blue
  L: "#e07a20",   // orange
  D: "#d0b012",   // yellow
};

const FACE_TITLE: Record<string, string> = {
  U: "U — Up (white)",
  F: "F — Front (green)",
  R: "R — Right (red)",
  B: "B — Back (blue)",
  L: "L — Left (orange)",
  D: "D — Down (yellow)",
};

/**
 * Face grids — [row][col].
 *
 * Orientation:
 *   U: top row = Back side, bottom row = Front side
 *   F: top = U side, right = R side
 *   R: top = U side, left = F side, right = B side (unfolded)
 *   B: top = U side, left = R side, right = L side (unfolded past R)
 *   L: top = U side, right = F side
 *   D: top = F side, right = R side
 *
 * Buffer positions (skip in memo):
 *   Edges:   C = UF,  I = FU
 *   Corners: B = URF (U sticker),  H = UFL (L sticker),  P = URF (R sticker)
 */
const GRIDS: Record<string, Sticker[][]> = {
  U: [
    [{ l: "D" }, { l: "A" },             { l: "A" }],
    [{ l: "D" }, null,                   { l: "B" }],
    [{ l: "C" }, { l: "C", buf: true },  { l: "B", buf: true }],
  ],
  F: [
    [{ l: "I" }, { l: "I", buf: true },  { l: "L" }],
    [{ l: "L" }, null,                   { l: "J" }],
    [{ l: "K" }, { l: "K" },             { l: "J" }],
  ],
  R: [
    [{ l: "P", buf: true }, { l: "M" },  { l: "M" }],
    [{ l: "P" },            null,         { l: "N" }],
    [{ l: "O" },            { l: "O" },  { l: "N" }],
  ],
  B: [
    [{ l: "T" }, { l: "Q" }, { l: "Q" }],
    [{ l: "T" }, null,       { l: "R" }],
    [{ l: "S" }, { l: "S" }, { l: "R" }],
  ],
  L: [
    [{ l: "E" }, { l: "E" }, { l: "H", buf: true }],
    [{ l: "H" }, null,       { l: "F" }],
    [{ l: "F" }, { l: "G" }, { l: "G" }],
  ],
  D: [
    [{ l: "U" }, { l: "V" }, { l: "V" }],
    [{ l: "U" }, null,       { l: "W" }],
    [{ l: "X" }, { l: "X" }, { l: "W" }],
  ],
};

const FACE_ORDER = ["U", "L", "F", "R", "B", "D"] as const;

// ── Component ─────────────────────────────────────────────────────────────

export function SpeffzNet() {
  const [hl, setHl] = useState<string | null>(null);

  return (
    <div className="speffzNetWrap">
      {/* Cube net */}
      <div className="speffzNetScroll">
        <div className="speffzNet">
          {FACE_ORDER.map((face) => (
            <div
              key={face}
              className={`speffzFace speffzFace--${face}`}
              style={{ "--face-bg": FACE_BG[face] } as React.CSSProperties}
              title={FACE_TITLE[face]}
            >
              {GRIDS[face].map((row, r) =>
                row.map((cell, c) => {
                  if (cell === null) {
                    return (
                      <div key={`${r}-${c}`} className="speffzSt speffzSt--center">
                        {face}
                      </div>
                    );
                  }
                  return (
                    <div
                      key={`${r}-${c}`}
                      className={[
                        "speffzSt",
                        cell.buf ? "speffzSt--buf" : "",
                        hl === cell.l ? "speffzSt--hl" : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      onMouseEnter={() => setHl(cell.l)}
                      onMouseLeave={() => setHl(null)}
                    >
                      {cell.l}
                    </div>
                  );
                })
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Face colour key + hint */}
      <div className="speffzFaceKey">
        {FACE_ORDER.map((f) => (
          <span
            key={f}
            className="speffzFaceKeyChip"
            style={{ background: FACE_BG[f] }}
            title={FACE_TITLE[f]}
          >
            {f}
          </span>
        ))}
        <span className="speffzFaceKeySep">·</span>
        <span className="speffzFaceKeyHint">Hover a letter to highlight all its positions</span>
      </div>

      <p className="speffzNetNote">
        Each letter appears <strong>twice per face region</strong>: on an{" "}
        <strong>edge sticker</strong> (centre of a side) and on the adjacent{" "}
        <strong>corner sticker</strong>. For example, A = UB edge (top-centre of U) + UBR
        corner (top-right of U). Faded italic stickers are <strong>buffer positions</strong>{" "}
        — skip them when memorising.
      </p>
    </div>
  );
}
