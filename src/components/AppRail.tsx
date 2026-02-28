import React from "react";

type AppSection = "study" | "practice" | "progress" | "reference";
type CfopPhase = "f2l" | "last-layer";
type WorkspaceMode = "full-ll" | "4lll";
type LastLayerSet = "OLL" | "PLL";

const PRIMARY_MENU_ITEMS: Array<{ key: AppSection; label: string; status?: "beta" }> = [
  { key: "study", label: "Study" },
  { key: "practice", label: "Practice" },
  { key: "progress", label: "Progress" },
  { key: "reference", label: "Reference" },
];

const LEARNING_TRACKS = [
  {
    title: "Last Layer (CFOP)",
    state: "Active",
    detail: "OLL + PLL catalog with recognition thumbnails and viewer.",
  },
  {
    title: "F2L Cases",
    state: "Active",
    detail: "Complete 41-case canonical catalog with viewer.",
  },
  {
    title: "One-Handed (OH)",
    state: "Planned",
    detail: "Ergonomic alg variants and fingertrick notes.",
  },
  {
    title: "Blindfolded (BLD)",
    state: "Backlog",
    detail: "Letter pairs, memo systems, execution drills.",
  },
] as const;

type Props = {
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
  return (
    <aside className="rail" aria-label="Learning modules">
      <section className="railPanel railPanel--nav">
        <div className="railHeader">
          <div className="railTitle">Navigation</div>
          <div className="railBadge">IA v1</div>
        </div>

        <nav className="mainMenu" aria-label="Primary navigation">
          {PRIMARY_MENU_ITEMS.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`mainMenuItem ${appSection === item.key ? "isActive" : ""}`}
              aria-current={appSection === item.key ? "page" : undefined}
              onClick={() => onAppSectionChange(item.key)}
              title={item.label}
            >
              <span className="mainMenuLabel">{item.label}</span>
              {item.status === "beta" && (
                <span className="mainMenuState mainMenuState--soon">Beta</span>
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
              <span className="studyMapTitle">Study Map</span>
              <span className="studyMapMeta">3x3 › CFOP</span>
            </div>

            <div className="studyTree">
              <div className="treeLine">
                <span className="treeNode treeNode--root">3x3</span>
              </div>
              <div className="treeLine treeLine--indent">
                <span className="treeNode treeNode--branch isActive">CFOP</span>
              </div>
              <div className="treeLine treeLine--indent2">
                <button
                  type="button"
                  className={`treeButton ${cfopPhase === "f2l" ? "isActive" : ""}`}
                  onClick={() => onCfopPhaseChange("f2l")}
                  aria-pressed={cfopPhase === "f2l"}
                >
                  First 2 Layers (F2L)
                </button>
              </div>
              <div className="treeLine treeLine--indent2">
                <button
                  type="button"
                  className={`treeButton ${cfopPhase === "last-layer" ? "isActive" : ""}`}
                  onClick={() => onCfopPhaseChange("last-layer")}
                  aria-pressed={cfopPhase === "last-layer"}
                >
                  Last Layer
                </button>
              </div>

              {cfopPhase === "last-layer" && (
                <>
                  <div className="treeLine treeLine--indent3">
                    <button
                      type="button"
                      className={`treeButton treeButton--small ${
                        workspaceMode === "4lll" ? "isActive" : ""
                      }`}
                      onClick={() => onWorkspaceModeChange("4lll")}
                      aria-pressed={workspaceMode === "4lll"}
                    >
                      4-Look Last Layer
                    </button>
                  </div>
                  <div className="treeLine treeLine--indent3">
                    <button
                      type="button"
                      className={`treeButton treeButton--small ${
                        workspaceMode === "full-ll" ? "isActive" : ""
                      }`}
                      onClick={() => onWorkspaceModeChange("full-ll")}
                      aria-pressed={workspaceMode === "full-ll"}
                    >
                      Full OLL + PLL
                    </button>
                  </div>
                  {workspaceMode === "full-ll" && (
                    <>
                      <div className="treeLine treeLine--indent4">
                        <button
                          type="button"
                          className={`treeButton treeButton--small ${
                            lastLayerSet === "OLL" ? "isActive" : ""
                          }`}
                          onClick={() => onLastLayerSetChange("OLL")}
                          aria-pressed={lastLayerSet === "OLL"}
                        >
                          Orientation of Last Layer
                        </button>
                      </div>
                      <div className="treeLine treeLine--indent4">
                        <button
                          type="button"
                          className={`treeButton treeButton--small ${
                            lastLayerSet === "PLL" ? "isActive" : ""
                          }`}
                          onClick={() => onLastLayerSetChange("PLL")}
                          aria-pressed={lastLayerSet === "PLL"}
                        >
                          Permutation of Last Layer
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
          <div className="railTitle">Roadmap</div>
          <div className="railBadge">Planning</div>
        </div>
        <div className="trackList">
          {LEARNING_TRACKS.map((track) => (
            <article key={track.title} className="trackCard">
              <div className="trackTop">
                <h3>{track.title}</h3>
                <span
                  className={`pill ${
                    track.state === "Active"
                      ? "pill--active"
                      : track.state === "Planned"
                        ? "pill--planned"
                        : "pill--backlog"
                  }`}
                >
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
