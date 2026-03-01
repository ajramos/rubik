import React, { useState } from "react";

/**
 * SpeffzNet — unfolded cube net with Speffz A–X letter mapping.
 *
 * Grid orientation:
 *   U: top=B side, right=R side (as seen looking down)
 *   F: top=U, right=R (standard front view)
 *   R: top=U, left=F, right=B (as seen from right side)
 *   B: top=U, left=R, right=L (as seen from back — unfolded right of R)
 *   L: top=U, right=F (as seen from left side)
 *   D: top=F, right=R (as seen from below)
 *
 * Each 3×3 face has:
 *   [0][0] [0][1] [0][2]    corner  edge  corner
 *   [1][0] [1][1] [1][2]    edge   CENTER  edge
 *   [2][0] [2][1] [2][2]    corner  edge  corner
 *
 * The Speffz scheme assigns the SAME letter to the edge sticker and the
 * adjacent corner sticker on each face. E.g. on U face: A = UB edge (top-center)
 * and A = UBR corner (top-right). Hovering highlights all occurrences of a letter.
 */

// ── Types ──────────────────────────────────────────────────────────────────

type Cell =
  | { l: string; buf?: true }   // sticker with Speffz letter
  | null;                        // center (no label)

// ── Face color palette (standard cube, slightly muted for UI) ─────────────

const FACE_COLOR: Record<string, string> = {
  U: "#c8c8c8",
  F: "#3dba68",
  R: "#de4e3a",
  B: "#4877e4",
  L: "#ed8c28",
  D: "#e4be18",
};

// ── Grid data ─────────────────────────────────────────────────────────────
//
// Buffer positions (skip in memo):
//   Edges   — C (UF), I (FU)
//   Corners — B (URF, U sticker), H (UFL, L sticker), P (URF, R sticker)

const GRIDS: Record<string, Cell[][]> = {
  U: [
    [{ l: "D" }, { l: "A" },              { l: "A" }],
    [{ l: "D" }, null,                    { l: "B" }],
    [{ l: "C" }, { l: "C", buf: true },   { l: "B", buf: true }],
  ],
  F: [
    [{ l: "I" }, { l: "I", buf: true },   { l: "L" }],
    [{ l: "L" }, null,                    { l: "J" }],
    [{ l: "K" }, { l: "K" },              { l: "J" }],
  ],
  R: [
    [{ l: "P", buf: true }, { l: "M" },   { l: "M" }],
    [{ l: "P" },            null,          { l: "N" }],
    [{ l: "O" },            { l: "O" },   { l: "N" }],
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

// Net layout: each face's [row, col] position in the cross
const NET_POS: Record<string, [number, number]> = {
  U: [0, 1],
  L: [1, 0],
  F: [1, 1],
  R: [1, 2],
  B: [1, 3],
  D: [2, 1],
};

// ── Metrics ──────────────────────────────────────────────────────────────

const CELL = 27;      // px per sticker
const CGAP = 1;       // gap between cells within a face
const FS   = 3 * CELL + 2 * CGAP;   // face size = 83px
const FG   = 4;       // gap between faces in the net
const STEP = FS + FG; // step between face origins = 87px

const SVG_W = 4 * STEP - FG;   // 344px
const SVG_H = 3 * STEP - FG;   // 257px

// ── Component ─────────────────────────────────────────────────────────────

export function SpeffzNet() {
  const [hl, setHl] = useState<string | null>(null);

  return (
    <div className="speffzNetWrap">
      {/* Face-colour legend */}
      <div className="speffzNetFaceLegend">
        {(["U", "F", "R", "B", "L", "D"] as const).map((f) => (
          <span key={f} className="speffzNetFaceChip">
            <svg width={10} height={10}>
              <rect x={0} y={0} width={10} height={10} rx={2} fill={FACE_COLOR[f]} />
            </svg>
            {f}
          </span>
        ))}
      </div>

      {/* Main SVG */}
      <div className="speffzNetSvgWrap">
        <svg
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          className="speffzNetSvg"
          role="img"
          aria-label="Speffz cube net — each sticker shows its A–X letter"
        >
          {Object.entries(NET_POS).map(([face, [row, col]]) => {
            const fx = col * STEP;
            const fy = row * STEP;
            const fc = FACE_COLOR[face];
            const grid = GRIDS[face];

            return (
              <g key={face}>
                {/* Face background */}
                <rect x={fx} y={fy} width={FS} height={FS} fill={fc} rx={3} />

                {grid.map((rowCells, r) =>
                  rowCells.map((cell, c) => {
                    const cx = fx + c * (CELL + CGAP);
                    const cy = fy + r * (CELL + CGAP);
                    const tx = cx + CELL / 2;
                    const ty = cy + CELL / 2 + 4;

                    // Centre cell — just face colour + tiny face label
                    if (cell === null) {
                      return (
                        <g key={`${r}-${c}`}>
                          <rect x={cx} y={cy} width={CELL} height={CELL} fill={fc} rx={2} />
                          <text
                            x={tx} y={ty}
                            textAnchor="middle"
                            fill="rgba(0,0,0,0.3)"
                            fontSize={9}
                            fontFamily="Space Grotesk, sans-serif"
                            fontWeight="700"
                            style={{ userSelect: "none" }}
                          >
                            {face}
                          </text>
                        </g>
                      );
                    }

                    const isBuf = !!cell.buf;
                    const isHl  = hl === cell.l;

                    return (
                      <g
                        key={`${r}-${c}`}
                        style={{ cursor: "default" }}
                        onMouseEnter={() => setHl(cell.l)}
                        onMouseLeave={() => setHl(null)}
                      >
                        {/* Sticker background */}
                        <rect
                          x={cx} y={cy} width={CELL} height={CELL} rx={2}
                          fill={
                            isHl  ? "rgba(255,255,255,0.55)"
                            : isBuf ? "rgba(0,0,0,0.15)"
                            :          "rgba(255,255,255,0.2)"
                          }
                          stroke={
                            isHl  ? "rgba(0,0,0,0.55)"
                            : isBuf ? "rgba(0,0,0,0.2)"
                            :          "rgba(0,0,0,0.07)"
                          }
                          strokeWidth={isHl ? 1.5 : 0.5}
                        />
                        {/* Letter */}
                        <text
                          x={tx} y={ty}
                          textAnchor="middle"
                          fill={
                            isHl  ? "rgba(0,0,0,0.92)"
                            : isBuf ? "rgba(0,0,0,0.38)"
                            :          "rgba(0,0,0,0.78)"
                          }
                          fontSize={10}
                          fontFamily="IBM Plex Mono, monospace"
                          fontWeight={isHl ? "700" : isBuf ? "400" : "600"}
                          fontStyle={isBuf ? "italic" : "normal"}
                          style={{ userSelect: "none" }}
                        >
                          {cell.l}
                        </text>
                        {/* Buffer dot in top-right corner of sticker */}
                        {isBuf && (
                          <circle
                            cx={cx + CELL - 4} cy={cy + 4} r={2.5}
                            fill="rgba(0,0,0,0.32)"
                          />
                        )}
                      </g>
                    );
                  })
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="speffzNetLegend">
        <span className="speffzNetLegendItem">
          <svg width={13} height={13} style={{ verticalAlign: "middle", flexShrink: 0 }}>
            <rect x={1} y={1} width={11} height={11} rx={2}
                  fill="rgba(255,255,255,0.2)" stroke="rgba(0,0,0,0.1)" strokeWidth={0.5} />
          </svg>
          Normal sticker
        </span>
        <span className="speffzNetLegendSep">·</span>
        <span className="speffzNetLegendItem">
          <svg width={13} height={13} style={{ verticalAlign: "middle", flexShrink: 0 }}>
            <rect x={1} y={1} width={11} height={11} rx={2}
                  fill="rgba(0,0,0,0.15)" stroke="rgba(0,0,0,0.2)" strokeWidth={0.5} />
            <circle cx={10} cy={3} r={2} fill="rgba(0,0,0,0.32)" />
          </svg>
          Buffer — skip in memo
        </span>
        <span className="speffzNetLegendSep">·</span>
        <span className="speffzNetLegendItem speffzNetLegendHint">
          Hover any letter to highlight all its positions
        </span>
      </div>

      <p className="speffzNetNote">
        Each letter appears twice per face: once on an <strong>edge sticker</strong> (center of a
        side) and once on the adjacent <strong>corner sticker</strong>. That's by design — Speffz
        groups the edge and its nearest corner under the same letter.
      </p>
    </div>
  );
}
