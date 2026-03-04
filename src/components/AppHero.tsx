import React from "react";
import type { CubeScheme } from "../utils/faceColors";

type Props = {
  heroEyebrow: string;
  language: "es" | "en";
  ohMode: boolean;
  cubeScheme: CubeScheme;
  onToggleLanguage: () => void;
  onToggleOhMode: () => void;
  onSetCubeScheme: (s: CubeScheme) => void;
};

export function AppHero({ heroEyebrow, language, ohMode, cubeScheme, onToggleLanguage, onToggleOhMode, onSetCubeScheme }: Props) {
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
        <button
          type="button"
          className="langToggle"
          onClick={onToggleLanguage}
          title={language === "es" ? "Cambiar a inglés" : "Switch to Spanish"}
        >
          <span aria-hidden="true">{language === "es" ? "🇪🇸" : "🇬🇧"}</span>
          {language === "es" ? "ES" : "EN"}
        </button>
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
          title={language === "es" ? "Modo a una mano — usa tu alg OH preferido" : "One-Handed mode — drills use your preferred OH alg"}
        >
          🤚 OH {ohMode ? (language === "es" ? "ACT" : "ON") : (language === "es" ? "DES" : "OFF")}
        </button>
      </div>
    </header>
  );
}
