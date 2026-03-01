// Cube face colour schemes for the app.
//
// Two presets:
//   "wca"        — WCA standard:  U=white, D=yellow, R=red,   L=orange, F=green,  B=blue
//   "yellow-top" — Yellow on top: U=yellow, D=white, R=green, L=blue,   F=red,    B=orange

export type CubeScheme = "wca" | "yellow-top";

export type FaceMeta = {
  bg: string;         // muted/dark variant — used for BLD group headers and letter colouring
  text: string;       // text/icon colour on bg background (usually #fff)
  bright: string;     // actual cube face colour — used for cube net diagrams, SpeffzNet
  brightText: string; // text colour on bright background (#333 for light faces, #fff for dark)
  label: string;      // e.g. "U — Up (white)"
};

const WCA: Record<string, FaceMeta> = {
  U: { bg: "#6b7280", text: "#fff", bright: "#e8e8e6", brightText: "#333", label: "U — Up (white)" },
  D: { bg: "#c8980a", text: "#fff", bright: "#f5c518", brightText: "#333", label: "D — Down (yellow)" },
  R: { bg: "#c41e3a", text: "#fff", bright: "#c41e3a", brightText: "#fff", label: "R — Right (red)" },
  L: { bg: "#d45000", text: "#fff", bright: "#ff6000", brightText: "#fff", label: "L — Left (orange)" },
  F: { bg: "#007a3a", text: "#fff", bright: "#009b48", brightText: "#fff", label: "F — Front (green)" },
  B: { bg: "#0046ad", text: "#fff", bright: "#0046ad", brightText: "#fff", label: "B — Back (blue)" },
};

const YELLOW_TOP: Record<string, FaceMeta> = {
  U: { bg: "#c8980a", text: "#fff", bright: "#f5c518", brightText: "#333", label: "U — Up (yellow)" },
  D: { bg: "#6b7280", text: "#fff", bright: "#e8e8e6", brightText: "#333", label: "D — Down (white)" },
  R: { bg: "#007a3a", text: "#fff", bright: "#009b48", brightText: "#fff", label: "R — Right (green)" },
  L: { bg: "#0046ad", text: "#fff", bright: "#0046ad", brightText: "#fff", label: "L — Left (blue)" },
  F: { bg: "#c41e3a", text: "#fff", bright: "#c41e3a", brightText: "#fff", label: "F — Front (red)" },
  B: { bg: "#d45000", text: "#fff", bright: "#ff6000", brightText: "#fff", label: "B — Back (orange)" },
};

export const FACE_SCHEMES: Record<CubeScheme, Record<string, FaceMeta>> = {
  "wca": WCA,
  "yellow-top": YELLOW_TOP,
};

export function getFaceScheme(scheme: CubeScheme): Record<string, FaceMeta> {
  return FACE_SCHEMES[scheme];
}
