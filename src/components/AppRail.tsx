import React from "react";

type AppSection = "home" | "study" | "practice" | "progress" | "reference";
type CfopPhase = "f2l" | "last-layer";
type WorkspaceMode = "full-ll" | "4lll";
type LastLayerSet = "OLL" | "PLL";
type Language = "es" | "en";

type MenuItem = { key: AppSection; label: Record<Language, string>; status?: "beta" };

const PRIMARY_MENU_ITEMS: MenuItem[] = [
  { key: "home", label: { es: "Inicio", en: "Home" } },
  { key: "study", label: { es: "Estudio", en: "Study" } },
  { key: "practice", label: { es: "Práctica", en: "Practice" } },
  { key: "progress", label: { es: "Progreso", en: "Progress" } },
  { key: "reference", label: { es: "Referencia", en: "Reference" } },
];

const LEARNING_TRACKS = {
  es: [
    { title: "Última capa (CFOP)", state: "Activo", detail: "Catálogo OLL + PLL con miniaturas de reconocimiento y visor." },
    { title: "Casos F2L", state: "Activo", detail: "Catálogo canónico completo de 41 casos con visor." },
    { title: "One-Handed (OH)", state: "Planificado", detail: "Variantes ergonómicas de algoritmos y notas de fingertricks." },
  ],
  en: [
    { title: "Last Layer (CFOP)", state: "Active", detail: "OLL + PLL catalog with recognition thumbnails and viewer." },
    { title: "F2L Cases", state: "Active", detail: "Complete 41-case canonical catalog with viewer." },
    { title: "One-Handed (OH)", state: "Planned", detail: "Ergonomic alg variants and fingertrick notes." },
  ],
} as const;

type Props = {
  language: Language;
  appSection: AppSection;
  cfopPhase: CfopPhase;
  workspaceMode: WorkspaceMode;
  lastLayerSet: LastLayerSet;
  totalDueCount: number;
  onAppSectionChange: (section: AppSection) => void;
  onCfopPhaseChange: (phase: CfopPhase) => void;
  onWorkspaceModeChange: (mode: WorkspaceMode) => void;
  onLastLayerSetChange: (set: LastLayerSet) => void;
};

export function AppRail({
  language,
  appSection,
  cfopPhase,
  workspaceMode,
  lastLayerSet,
  totalDueCount,
  onAppSectionChange,
  onCfopPhaseChange,
  onWorkspaceModeChange,
  onLastLayerSetChange,
}: Props) {
  const t = language === "es"
    ? {
        railAria: "Módulos de aprendizaje",
        navigation: "Navegación",
        primaryNavigation: "Navegación principal",
        beta: "Beta",
        studyMap: "Mapa de estudio",
        first2Layers: "Primeras 2 capas (F2L)",
        lastLayer: "Última capa",
        fourLook: "Última capa en 4 miradas",
        full: "OLL + PLL completo",
        ollLong: "Orientación de la última capa",
        pllLong: "Permutación de la última capa",
        roadmap: "Roadmap",
        planning: "Planificación",
      }
    : {
        railAria: "Learning modules",
        navigation: "Navigation",
        primaryNavigation: "Primary navigation",
        beta: "Beta",
        studyMap: "Study Map",
        first2Layers: "First 2 Layers (F2L)",
        lastLayer: "Last Layer",
        fourLook: "4-Look Last Layer",
        full: "Full OLL + PLL",
        ollLong: "Orientation of Last Layer",
        pllLong: "Permutation of Last Layer",
        roadmap: "Roadmap",
        planning: "Planning",
      };

  return (
    <aside className={`rail rail--${appSection}`} aria-label={t.railAria}>
      <section className="railPanel railPanel--nav">
        <div className="railHeader">
          <div className="railTitle">{t.navigation}</div>
          <div className="railBadge">IA v1</div>
        </div>

        <nav className="mainMenu" aria-label={t.primaryNavigation}>
          {PRIMARY_MENU_ITEMS.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`mainMenuItem ${appSection === item.key ? "isActive" : ""}`}
              aria-current={appSection === item.key ? "page" : undefined}
              onClick={() => onAppSectionChange(item.key)}
              title={item.label[language]}
            >
              <span className="mainMenuLabel">{item.label[language]}</span>
              {item.status === "beta" && (
                <span className="mainMenuState mainMenuState--soon">{t.beta}</span>
              )}
              {item.key === "practice" && totalDueCount > 0 && (
                <span className="mainMenuDueBadge">{totalDueCount}</span>
              )}
            </button>
          ))}
        </nav>

        {appSection === "study" && (
          <div className="studyMap">
            <div className="studyMapHeader">
              <div className="studyMapHeading">
                <span className="studyMapTitle">{t.studyMap}</span>
                <span className="studyMapMeta">3x3 › CFOP</span>
              </div>
            </div>

            <div id="study-map-tree" className="studyTree">
              <div className="treeLine">
                <span className="treeNode treeNode--root">3x3</span>
              </div>
              <div className="treeLine treeLine--indent">
                <span className="treeNode treeNode--branch isActive">CFOP</span>
              </div>
              <div className="treeLine treeLine--indent2">
                <button type="button" className={`treeButton ${cfopPhase === "f2l" ? "isActive" : ""}`} onClick={() => onCfopPhaseChange("f2l")} aria-pressed={cfopPhase === "f2l"}>
                  {t.first2Layers}
                </button>
              </div>
              <div className="treeLine treeLine--indent2">
                <button type="button" className={`treeButton ${cfopPhase === "last-layer" ? "isActive" : ""}`} onClick={() => onCfopPhaseChange("last-layer")} aria-pressed={cfopPhase === "last-layer"}>
                  {t.lastLayer}
                </button>
              </div>

              {cfopPhase === "last-layer" && (
                <>
                  <div className="treeLine treeLine--indent3">
                    <button type="button" className={`treeButton treeButton--small ${workspaceMode === "4lll" ? "isActive" : ""}`} onClick={() => onWorkspaceModeChange("4lll")} aria-pressed={workspaceMode === "4lll"}>
                      {t.fourLook}
                    </button>
                  </div>
                  <div className="treeLine treeLine--indent3">
                    <button type="button" className={`treeButton treeButton--small ${workspaceMode === "full-ll" ? "isActive" : ""}`} onClick={() => onWorkspaceModeChange("full-ll")} aria-pressed={workspaceMode === "full-ll"}>
                      {t.full}
                    </button>
                  </div>
                  {workspaceMode === "full-ll" && (
                    <>
                      <div className="treeLine treeLine--indent4">
                        <button type="button" className={`treeButton treeButton--small ${lastLayerSet === "OLL" ? "isActive" : ""}`} onClick={() => onLastLayerSetChange("OLL")} aria-pressed={lastLayerSet === "OLL"}>
                          {t.ollLong}
                        </button>
                      </div>
                      <div className="treeLine treeLine--indent4">
                        <button type="button" className={`treeButton treeButton--small ${lastLayerSet === "PLL" ? "isActive" : ""}`} onClick={() => onLastLayerSetChange("PLL")} aria-pressed={lastLayerSet === "PLL"}>
                          {t.pllLong}
                        </button>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </section>

      <section className="railPanel">
        <div className="railHeader">
          <div className="railTitle">{t.roadmap}</div>
          <div className="railBadge">{t.planning}</div>
        </div>
        <div className="trackList">
          {LEARNING_TRACKS[language].map((track) => (
            <article key={track.title} className="trackCard">
              <div className="trackTop">
                <h3>{track.title}</h3>
                <span className={`pill ${track.state === "Active" || track.state === "Activo" ? "pill--active" : track.state === "Planned" || track.state === "Planificado" ? "pill--planned" : "pill--backlog"}`}>
                  {track.state}
                </span>
              </div>
              <p>{track.detail}</p>
            </article>
          ))}
        </div>
      </section>
    </aside>
  );
}
