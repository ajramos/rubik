import React, { useState } from "react";
import { MovePreviewModal } from "./MovePreviewModal";

const FACE_COLOR: Record<string, string> = {
  U: "#f0f0ee", D: "#f5c518",
  R: "#c41e3a", L: "#ff6000",
  F: "#009b48", B: "#0046ad",
};
const FACE_TEXT_COLOR: Record<string, string> = {
  U: "#333", D: "#333", R: "#fff", L: "#fff", F: "#fff", B: "#fff",
};

const FACE_MOVES = [
  { symbol: "R", name: "Right" },
  { symbol: "L", name: "Left" },
  { symbol: "U", name: "Up" },
  { symbol: "D", name: "Down" },
  { symbol: "F", name: "Front" },
  { symbol: "B", name: "Back" },
];

const MODIFIERS = [
  { label: "R",  icon: "↻", title: "Clockwise",         desc: "90° clockwise (facing the face)" },
  { label: "R'", icon: "↺", title: "Counter-clockwise",  desc: "90° counter-clockwise" },
  { label: "R2", icon: "↕", title: "Double turn",        desc: "180° — direction doesn't matter" },
];

const WIDE_MOVES = [
  { symbol: "R", wide: "r", name: "Right" },
  { symbol: "L", wide: "l", name: "Left" },
  { symbol: "U", wide: "u", name: "Up" },
  { symbol: "D", wide: "d", name: "Down" },
  { symbol: "F", wide: "f", name: "Front" },
  { symbol: "B", wide: "b", name: "Back" },
];

type SliceType = "M" | "E" | "S";
type RotType = "x" | "y" | "z";

const SLICES: { symbol: SliceType; desc: string; viewNote: string }[] = [
  { symbol: "M", desc: "Middle layer — same direction as L", viewNote: "front view" },
  { symbol: "E", desc: "Equatorial layer — same direction as D", viewNote: "front view" },
  { symbol: "S", desc: "Standing layer — same direction as F", viewNote: "top view" },
];

const ROTATIONS: { symbol: RotType; face: string; desc: string }[] = [
  { symbol: "x", face: "R", desc: "Whole cube rotates like R" },
  { symbol: "y", face: "U", desc: "Whole cube rotates like U" },
  { symbol: "z", face: "F", desc: "Whole cube rotates like F" },
];

function SliceDiagram({ type }: { type: SliceType }) {
  const configs = {
    M: { direction: "col" as const, a: "L", b: "R" },
    E: { direction: "row" as const, a: "U", b: "D" },
    S: { direction: "row" as const, a: "B", b: "F" },
  };
  const { direction, a, b } = configs[type];

  return (
    <div className={`notationSliceDiag notationSliceDiag--${direction}`}>
      <div className="notationSliceBand notationSliceBand--outer"
        style={{ background: FACE_COLOR[a], color: FACE_TEXT_COLOR[a] }}>
        {a}
      </div>
      <div className="notationSliceBand notationSliceBand--active">
        <span className="notationSliceActiveLabel">{type}</span>
      </div>
      <div className="notationSliceBand notationSliceBand--outer"
        style={{ background: FACE_COLOR[b], color: FACE_TEXT_COLOR[b] }}>
        {b}
      </div>
    </div>
  );
}

function RotDiagram({ face }: { face: string }) {
  return (
    <div className="notationRotDiag"
      style={{ background: FACE_COLOR[face], color: FACE_TEXT_COLOR[face] }}>
      <span className="notationRotFace">{face}</span>
      <span className="notationRotArrow">↻</span>
    </div>
  );
}

function FaceBadge({ face, size = 28 }: { face: string; size?: number }) {
  return (
    <span className="notationFaceBadge"
      style={{
        background: FACE_COLOR[face],
        color: FACE_TEXT_COLOR[face],
        width: size,
        height: size,
        fontSize: size * 0.43,
      }}>
      {face}
    </span>
  );
}

function CubeNet() {
  const cell = (face: string) => (
    <div key={face} className="notationNetCell"
      style={{ background: FACE_COLOR[face], color: FACE_TEXT_COLOR[face] }}>
      {face}
    </div>
  );
  return (
    <div className="notationNet">
      <div className="notationNetRow notationNetRow--center">{cell("U")}</div>
      <div className="notationNetRow">{cell("L")}{cell("F")}{cell("R")}{cell("B")}</div>
      <div className="notationNetRow notationNetRow--center">{cell("D")}</div>
    </div>
  );
}

export function NotationReference() {
  const [preview, setPreview] = useState<string | null>(null);

  return (
    <>
      <section className="notationSection">

        {/* Block 1 — Face orientation */}
        <div className="notationBlock">
          <div className="notationBlockTitle">Face Orientation</div>
          <div className="notationOrientationLayout">
            <CubeNet />
            <div className="notationFaceList">
              {FACE_MOVES.map(({ symbol, name }) => (
                <div key={symbol} className="notationFaceListRow">
                  <FaceBadge face={symbol} />
                  <span className="notationFaceListSymbol">{symbol}</span>
                  <span className="notationFaceListName">{name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Block 2 — Modifiers */}
        <div className="notationBlock">
          <div className="notationBlockTitle">Move Notation</div>
          <div className="notationModRow">
            {MODIFIERS.map(({ label, icon, title, desc }) => (
              <div key={label} className="notationMod">
                <div className="notationModHeader">
                  <code className="notationModCode">{label}</code>
                  <span className="notationModIcon">{icon}</span>
                </div>
                <div className="notationModBody">
                  <span className="notationModTitle">{title}</span>
                  <span className="notationModDesc">{desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Block 3 — Face moves grid */}
        <div className="notationBlock">
          <div className="notationBlockTitle">
            Face Moves
            <span className="notationClickHint">click any chip to preview</span>
          </div>
          <div className="notationMoveGrid">
            {FACE_MOVES.map(({ symbol, name }) => (
              <div key={symbol} className="notationMoveRow">
                <FaceBadge face={symbol} />
                <span className="notationFaceName">{name}</span>
                <div className="notationMoveChips">
                  {[symbol, `${symbol}'`, `${symbol}2`].map((move) => (
                    <code
                      key={move}
                      className="notationMove notationMove--clickable"
                      onClick={() => setPreview(move)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === "Enter" && setPreview(move)}
                    >
                      {move}
                    </code>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Block 4 — Wide moves */}
        <div className="notationBlock">
          <div className="notationBlockTitle">
            Wide Moves — 2 layers
            <span className="notationClickHint">click any chip to preview</span>
          </div>
          <p className="notationWideDesc">
            Lowercase letter = face + the adjacent inner layer move together.
          </p>
          <div className="notationMoveGrid">
            {WIDE_MOVES.map(({ symbol, wide, name }) => (
              <div key={wide} className="notationMoveRow">
                <FaceBadge face={symbol} />
                <span className="notationFaceName">{name}</span>
                <div className="notationMoveChips">
                  {[wide, `${wide}'`, `${wide}2`].map((move) => (
                    <code
                      key={move}
                      className="notationMove notationMove--wide notationMove--clickable"
                      onClick={() => setPreview(move)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === "Enter" && setPreview(move)}
                    >
                      {move}
                    </code>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Block 5 — Slices */}
        <div className="notationBlock">
          <div className="notationBlockTitle">
            Slice Moves
            <span className="notationClickHint">click to preview</span>
          </div>
          <div className="notationDiagRow">
            {SLICES.map(({ symbol, desc, viewNote }) => (
              <div
                key={symbol}
                className="notationDiagCard notationDiagCard--clickable"
                onClick={() => setPreview(symbol)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && setPreview(symbol)}
              >
                <SliceDiagram type={symbol} />
                <div className="notationDiagCardBody">
                  <span className="notationDiagSymbol">{symbol}</span>
                  <span className="notationDiagDesc">{desc}</span>
                  <span className="notationDiagNote">{viewNote}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Block 6 — Cube rotations */}
        <div className="notationBlock">
          <div className="notationBlockTitle">
            Cube Rotations
            <span className="notationClickHint">click to preview</span>
          </div>
          <div className="notationDiagRow">
            {ROTATIONS.map(({ symbol, face, desc }) => (
              <div
                key={symbol}
                className="notationDiagCard notationDiagCard--clickable"
                onClick={() => setPreview(symbol)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && setPreview(symbol)}
              >
                <RotDiagram face={face} />
                <div className="notationDiagCardBody">
                  <span className="notationDiagSymbol">{symbol}</span>
                  <span className="notationDiagDesc">{desc}</span>
                  <span className="notationDiagNote">like {face}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </section>

      {preview && (
        <MovePreviewModal move={preview} onClose={() => setPreview(null)} />
      )}
    </>
  );
}
