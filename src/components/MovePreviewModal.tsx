import React, { useEffect } from "react";

const FACE_COLOR: Record<string, string> = {
  U: "#f0f0ee", D: "#f5c518",
  R: "#c41e3a", L: "#ff6000",
  F: "#009b48", B: "#0046ad",
};
const FACE_TEXT: Record<string, string> = {
  U: "#333", D: "#333", R: "#fff", L: "#fff", F: "#fff", B: "#fff",
};

type MoveInfo = { title: string; desc: string; face?: string; alg?: string };

const MOVE_INFO: Record<string, MoveInfo> = {
  // Right
  "R":  { face: "R", title: "Right — Clockwise",         desc: "Right layer turns 90° clockwise (when facing it)." },
  "R'": { face: "R", title: "Right — Counter-clockwise", desc: "Right layer turns 90° counter-clockwise." },
  "R2": { face: "R", title: "Right — 180°",              desc: "Right layer turns 180°. Direction doesn't matter." },
  // Left
  "L":  { face: "L", title: "Left — Clockwise",          desc: "Left layer turns 90° clockwise (when facing it)." },
  "L'": { face: "L", title: "Left — Counter-clockwise",  desc: "Left layer turns 90° counter-clockwise." },
  "L2": { face: "L", title: "Left — 180°",               desc: "Left layer turns 180°." },
  // Up
  "U":  { face: "U", title: "Up — Clockwise",            desc: "Top layer turns 90° clockwise (looking down)." },
  "U'": { face: "U", title: "Up — Counter-clockwise",    desc: "Top layer turns 90° counter-clockwise." },
  "U2": { face: "U", title: "Up — 180°",                 desc: "Top layer turns 180°." },
  // Down
  "D":  { face: "D", title: "Down — Clockwise",          desc: "Bottom layer turns 90° clockwise (looking up from below)." },
  "D'": { face: "D", title: "Down — Counter-clockwise",  desc: "Bottom layer turns 90° counter-clockwise." },
  "D2": { face: "D", title: "Down — 180°",               desc: "Bottom layer turns 180°." },
  // Front
  "F":  { face: "F", title: "Front — Clockwise",         desc: "Front layer turns 90° clockwise (when facing it)." },
  "F'": { face: "F", title: "Front — Counter-clockwise", desc: "Front layer turns 90° counter-clockwise." },
  "F2": { face: "F", title: "Front — 180°",              desc: "Front layer turns 180°." },
  // Back
  "B":  { face: "B", title: "Back — Clockwise",          desc: "Back layer turns 90° clockwise (when facing the back)." },
  "B'": { face: "B", title: "Back — Counter-clockwise",  desc: "Back layer turns 90° counter-clockwise." },
  "B2": { face: "B", title: "Back — 180°",               desc: "Back layer turns 180°." },
  // Wide moves (2 layers)
  "r":  { face: "R", title: "r — Wide Right (2 layers)",  desc: "Right face + adjacent inner layer, clockwise." },
  "r'": { face: "R", title: "r' — Wide Right (2 layers)", desc: "Right face + adjacent inner layer, counter-clockwise." },
  "r2": { face: "R", title: "r2 — Wide Right (2 layers)", desc: "Right face + adjacent inner layer, 180°." },
  "l":  { face: "L", title: "l — Wide Left (2 layers)",   desc: "Left face + adjacent inner layer, clockwise." },
  "l'": { face: "L", title: "l' — Wide Left (2 layers)",  desc: "Left face + adjacent inner layer, counter-clockwise." },
  "l2": { face: "L", title: "l2 — Wide Left (2 layers)",  desc: "Left face + adjacent inner layer, 180°." },
  "u":  { face: "U", title: "u — Wide Up (2 layers)",     desc: "Top face + adjacent inner layer, clockwise." },
  "u'": { face: "U", title: "u' — Wide Up (2 layers)",    desc: "Top face + adjacent inner layer, counter-clockwise." },
  "u2": { face: "U", title: "u2 — Wide Up (2 layers)",    desc: "Top face + adjacent inner layer, 180°." },
  "d":  { face: "D", title: "d — Wide Down (2 layers)",   desc: "Bottom face + adjacent inner layer, clockwise." },
  "d'": { face: "D", title: "d' — Wide Down (2 layers)",  desc: "Bottom face + adjacent inner layer, counter-clockwise." },
  "d2": { face: "D", title: "d2 — Wide Down (2 layers)",  desc: "Bottom face + adjacent inner layer, 180°." },
  "f":  { face: "F", title: "f — Wide Front (2 layers)",  desc: "Front face + adjacent inner layer, clockwise." },
  "f'": { face: "F", title: "f' — Wide Front (2 layers)", desc: "Front face + adjacent inner layer, counter-clockwise." },
  "f2": { face: "F", title: "f2 — Wide Front (2 layers)", desc: "Front face + adjacent inner layer, 180°." },
  "b":  { face: "B", title: "b — Wide Back (2 layers)",   desc: "Back face + adjacent inner layer, clockwise." },
  "b'": { face: "B", title: "b' — Wide Back (2 layers)",  desc: "Back face + adjacent inner layer, counter-clockwise." },
  "b2": { face: "B", title: "b2 — Wide Back (2 layers)",  desc: "Back face + adjacent inner layer, 180°." },
  // Slices
  "M":  { title: "M — Middle Slice",       desc: "Middle vertical layer. Same direction as L (left column going up)." },
  "E":  { title: "E — Equatorial Slice",   desc: "Middle horizontal layer. Same direction as D." },
  "S":  { title: "S — Standing Slice",     desc: "Middle standing layer. Same direction as F." },
  // Rotations
  "x":  { face: "R", title: "x — Cube Rotation",  desc: "Entire cube rotates on the x-axis, equivalent to turning R." },
  "y":  { face: "U", title: "y — Cube Rotation",  desc: "Entire cube rotates on the y-axis, equivalent to turning U." },
  "z":  { face: "F", title: "z — Cube Rotation",  desc: "Entire cube rotates on the z-axis, equivalent to turning F." },
  // Triggers
  "sexy":        { face: "R", title: "Sexy Move",    alg: "R U R' U'",           desc: "R U R' U' — Most common CFOP building block. Drill until automatic." },
  "anti-sexy":   { face: "U", title: "Anti-Sexy",    alg: "U R U' R'",           desc: "U R U' R' — Rotation-shifted version. Common in F2L and OLL." },
  "double-sexy": { face: "R", title: "Double Sexy",  alg: "R U R' U' R U R' U'", desc: "Two consecutive sexy moves. Appears in OLL dot cases." },
  "sledge":      { face: "R", title: "Sledgehammer", alg: "R' F R F'",           desc: "R' F R F' — F-face insertion. Pairs with Hedge as inverses." },
  "hedge":       { face: "F", title: "Hedge",        alg: "F R' F' R",           desc: "F R' F' R — Reverse sledgehammer." },
  "sune":        { face: "R", title: "Sune",         alg: "R U R' U R U2 R'",   desc: "R U R' U R U2 R' — OLL 27. Foundation of 2-Look OLL corners." },
  "antisune":    { face: "R", title: "Antisune",     alg: "R U2 R' U' R U' R'", desc: "R U2 R' U' R U' R' — OLL 26. Mirror of Sune." },
};

type Props = {
  move: string;
  onClose: () => void;
};

export function MovePreviewModal({ move, onClose }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const info = MOVE_INFO[move] ?? { title: move, desc: "" };
  const face = info.face;

  return (
    <div className="modalOverlay movePreviewOverlay" onClick={onClose}>
      <div className="moveModal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="moveModalHeader">
          <div className="moveModalBadgeWrap">
            {face ? (
              <span
                className="moveModalFaceBadge"
                style={{ background: FACE_COLOR[face], color: FACE_TEXT[face] }}
              >
                {face}
              </span>
            ) : (
              <span className="moveModalFaceBadge moveModalFaceBadge--slice">
                {move[0]}
              </span>
            )}
            <div className="moveModalTitleGroup">
              <code className="moveModalSymbol">{move}</code>
              <span className="moveModalTitle">{info.title}</span>
            </div>
          </div>
          <button className="moveModalClose" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {/* Twisty player */}
        <div className="moveModalPlayer">
          <twisty-player
            puzzle="3x3x3"
            alg={info.alg ?? move}
            experimental-setup-anchor="end"
            background="none"
            hint-facelets="none"
            style={{
              width: "240px",
              height: "240px",
              display: "block",
              margin: "0 auto",
            }}
          ></twisty-player>
        </div>

        {/* Description */}
        {info.desc && <p className="moveModalDesc">{info.desc}</p>}
      </div>
    </div>
  );
}
