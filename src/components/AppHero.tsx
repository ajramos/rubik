import React from "react";
import type { CubeScheme } from "../utils/faceColors";

type Props = {
  heroEyebrow: string;
  ohMode: boolean;
  cubeScheme: CubeScheme;
  onToggleOhMode: () => void;
  onSetCubeScheme: (s: CubeScheme) => void;
};

export function AppHero({ heroEyebrow, ohMode, cubeScheme, onToggleOhMode, onSetCubeScheme }: Props) {
  return (
    <header className="hero">
      <div className="heroLeft">
        <div className="heroBrand">
          <span className="heroBrandMark" aria-hidden="true">◆</span>
          Rubik Knowledge Atlas
        </div>
        <div className="heroEyebrow">{heroEyebrow}</div>
      </div>

      <div className="heroRight">
        <div className="cubeSchemeToggle" title="Cube colour scheme">
          <button
            type="button"
            className={`cubeSchemeBtn ${cubeScheme === "wca" ? "cubeSchemeBtn--active" : ""}`}
            onClick={() => onSetCubeScheme("wca")}
          >
            WCA
          </button>
          <button
            type="button"
            className={`cubeSchemeBtn ${cubeScheme === "yellow-top" ? "cubeSchemeBtn--active" : ""}`}
            onClick={() => onSetCubeScheme("yellow-top")}
          >
            🟡 Top
          </button>
        </div>
        <button
          type="button"
          className={`ohToggle ${ohMode ? "ohToggle--on" : ""}`}
          onClick={onToggleOhMode}
          title="One-Handed mode — drills use your preferred OH alg"
        >
          🤚 OH {ohMode ? "ON" : "OFF"}
        </button>
      </div>
    </header>
  );
}
