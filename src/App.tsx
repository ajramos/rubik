import React, { useEffect, useMemo, useState } from "react";
import algsRaw from "./data/algs.json";
import type { AlgItem, AlgSet } from "./types";
import { MiniTwisty } from "./components/MiniTwisty";
import { Twisty } from "./components/Twisty";

const algs = algsRaw as AlgItem[];

type CatalogGroup = {
  key: string;
  title: string;
  tone: "sand" | "sage" | "rose" | "sky";
  ids: string[];
};

const LEARNING_TRACKS = [
  {
    title: "Last Layer (CFOP)",
    state: "Active",
    detail: "OLL + PLL catalog, recognition thumbnails and play-through viewer.",
  },
  {
    title: "F2L Cases",
    state: "Planned",
    detail: "Case library with inserts, mirrors and intuitive triggers.",
  },
  {
    title: "One-Handed (OH)",
    state: "Planned",
    detail: "Ergonomic alg variants, regrips and fingertrick notes.",
  },
  {
    title: "Blindfolded (BLD)",
    state: "Backlog",
    detail: "Letter pairs, memo systems and execution drills.",
  },
] as const;

const PRACTICE_MODULES = [
  { name: "SRS Review", state: "Soon" },
  { name: "Recognition Drills", state: "Soon" },
  { name: "Timed Sessions", state: "Planned" },
  { name: "Progress Notes", state: "Planned" },
] as const;

const SET_META: Record<AlgSet, { short: string; long: string; description: string }> = {
  OLL: {
    short: "OLL",
    long: "Orientation of Last Layer",
    description: "Recognition patterns and algorithms for orienting the last layer.",
  },
  PLL: {
    short: "PLL",
    long: "Permutation of Last Layer",
    description: "Recognition patterns and algorithms for permuting the last layer.",
  },
};

function formatAlgForDisplay(alg: string, set?: AlgSet) {
  const cleaned = alg.trim().replace(/\s+/g, " ");
  if (!cleaned) return "";

  if (cleaned.includes("[")) {
    return cleaned
      .replace(/\]\s*\[/g, "]\n[")
      .replace(/\]\s+/g, "]\n")
      .replace(/\s+\[/g, "\n[");
  }

  const tokens = cleaned.split(" ");
  const chunkSize =
    set === "OLL"
      ? tokens.length <= 8
        ? 4
        : tokens.length <= 12
          ? 4
          : 5
      : 6;
  const lines: string[] = [];
  for (let i = 0; i < tokens.length; i += chunkSize) {
    lines.push(tokens.slice(i, i + chunkSize).join(" "));
  }
  return lines.join("\n");
}

function formatCaseNameForDisplay(item: AlgItem) {
  const name = item.name.trim();

  if (item.set === "OLL") {
    const m = name.match(/^OLL\s+(\d+)(?:\s+\((.+)\))?$/i);
    if (m) {
      const num = Number(m[1]);
      const tag = m[2]?.trim();
      return tag ? `OLL ${num} · ${tag}` : `OLL ${num}`;
    }
  }

  if (item.set === "PLL") {
    const m = name.match(/^([A-Za-z]+)-perm$/i);
    if (m) {
      const raw = m[1];
      const normalized = raw.length > 1
        ? raw[0].toUpperCase() + raw.slice(1).toLowerCase()
        : raw.toUpperCase();
      return `${normalized} Perm`;
    }
  }

  return name;
}

const PLL_GROUPS: CatalogGroup[] = [
  {
    key: "edge-only",
    title: "Edge Permutations Only",
    tone: "sand",
    ids: ["pll_ua", "pll_ub", "pll_z", "pll_h"],
  },
  {
    key: "corner-only",
    title: "Corner Permutations Only",
    tone: "sage",
    ids: ["pll_aa", "pll_ab", "pll_e"],
  },
  {
    key: "swap",
    title: "Corner & Edge Swap Permutations",
    tone: "rose",
    ids: ["pll_t", "pll_ja", "pll_jb", "pll_ra", "pll_rb", "pll_na", "pll_nb", "pll_f", "pll_v", "pll_y"],
  },
  {
    key: "g-perms",
    title: "Corner & Edge Cycle Permutations (G perms)",
    tone: "sky",
    ids: ["pll_ga", "pll_gb", "pll_gc", "pll_gd"],
  },
];

const OLL_GROUPS: CatalogGroup[] = [
  {
    key: "oll-no-edges",
    title: "No Edges Solved",
    tone: "rose",
    ids: ["oll_1", "oll_2", "oll_3", "oll_4", "oll_18", "oll_19", "oll_17", "oll_20"],
  },
  {
    key: "oll-l-no-corners",
    title: "L-Shaped Edges Solved · No Corners Solved",
    tone: "sky",
    ids: ["oll_48", "oll_47", "oll_53", "oll_54", "oll_49", "oll_50"],
  },
  {
    key: "oll-l-1-corner",
    title: "L-Shaped Edges Solved · 1 Corner Solved",
    tone: "sand",
    ids: ["oll_5", "oll_6", "oll_7", "oll_8", "oll_11", "oll_12", "oll_9", "oll_10"],
  },
  {
    key: "oll-l-2-corners",
    title: "L-Shaped Edges Solved · 2 Corners Solved",
    tone: "rose",
    ids: ["oll_44", "oll_43", "oll_31", "oll_32", "oll_35", "oll_37", "oll_36", "oll_38", "oll_29", "oll_30", "oll_41", "oll_42"],
  },
  {
    key: "oll-l-4-corners",
    title: "L-Shaped Edges Solved · 4 Corners Solved",
    tone: "sage",
    ids: ["oll_28"],
  },
  {
    key: "oll-bar-no-corners",
    title: "Bar-Shaped Edges Solved · No Corners Solved",
    tone: "sky",
    ids: ["oll_51", "oll_56", "oll_52", "oll_55"],
  },
  {
    key: "oll-bar-1-corner",
    title: "Bar-Shaped Edges Solved · 1 Corner Solved",
    tone: "sand",
    ids: ["oll_15", "oll_16", "oll_13", "oll_14"],
  },
  {
    key: "oll-bar-2-corners",
    title: "Bar-Shaped Edges Solved · 2 Corners Solved",
    tone: "rose",
    ids: ["oll_33", "oll_45", "oll_34", "oll_46", "oll_40", "oll_39"],
  },
  {
    key: "oll-bar-4-corners",
    title: "Bar-Shaped Edges Solved · 4 Corners Solved",
    tone: "sage",
    ids: ["oll_57"],
  },
  {
    key: "oll-4-edges",
    title: "4 Edges Solved (2-Look OLL Corners)",
    tone: "sage",
    ids: ["oll_21", "oll_22", "oll_27", "oll_26", "oll_25", "oll_23", "oll_24"],
  },
];

export default function App() {
  const [set, setSet] = useState<AlgSet>("OLL");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<AlgItem | null>(null);
  const [activeSectionAnchor, setActiveSectionAnchor] = useState<string>("all");

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return algs
      .filter((a) => a.set === set)
      .filter((a) => (query ? a.name.toLowerCase().includes(query) : true));
  }, [set, q]);

  const pllSections = useMemo(() => {
    if (set !== "PLL") return [];

    const byId = new Map(filtered.map((a) => [a.id, a] as const));
    const used = new Set<string>();
    const sections = PLL_GROUPS.map((group) => {
      const items = group.ids.map((id) => byId.get(id)).filter(Boolean) as AlgItem[];
      items.forEach((item) => used.add(item.id));
      return { ...group, items };
    }).filter((group) => group.items.length > 0);

    const remaining = filtered.filter((a) => !used.has(a.id));
    if (remaining.length) {
      sections.push({
        key: "other",
        title: "Other PLL",
        tone: "sand",
        ids: [],
        items: remaining,
      });
    }
    return sections;
  }, [filtered, set]);

  const ollSections = useMemo(() => {
    if (set !== "OLL") return [];

    const byId = new Map(filtered.map((a) => [a.id, a] as const));
    const used = new Set<string>();
    const sections = OLL_GROUPS.map((group) => {
      const items = group.ids.map((id) => byId.get(id)).filter(Boolean) as AlgItem[];
      items.forEach((item) => used.add(item.id));
      return { ...group, items };
    }).filter((group) => group.items.length > 0);

    const remaining = filtered.filter((a) => !used.has(a.id));
    if (remaining.length) {
      sections.push({
        key: "other-oll",
        title: "Other OLL",
        tone: "sand",
        ids: [],
        items: remaining,
      });
    }
    return sections;
  }, [filtered, set]);

  const ollCount = useMemo(() => algs.filter((a) => a.set === "OLL").length, []);
  const pllCount = useMemo(() => algs.filter((a) => a.set === "PLL").length, []);
  const visibleCount = filtered.length;
  const selectedSetTotal = set === "OLL" ? ollCount : pllCount;
  const currentSections = set === "OLL" ? ollSections : pllSections;

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    setActiveSectionAnchor(id === "catalog-top" ? "all" : id);
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  useEffect(() => {
    setActiveSectionAnchor("all");
  }, [set, q]);

  useEffect(() => {
    if (!currentSections.length) return;

    const sectionIds = currentSections.map((section) => `${set.toLowerCase()}-${section.key}`);

    const updateActiveSection = () => {
      const sticky = document.querySelector(".catalogSticky") as HTMLElement | null;
      const stickyHeight = sticky?.getBoundingClientRect().height ?? 0;
      const threshold = Math.max(100, Math.min(window.innerHeight * 0.45, stickyHeight + 28));

      const catalogTop = document.getElementById("catalog-top");
      if (catalogTop && catalogTop.getBoundingClientRect().top > threshold) {
        setActiveSectionAnchor((prev) => (prev === "all" ? prev : "all"));
        return;
      }

      let active = "all";
      for (const id of sectionIds) {
        const el = document.getElementById(id);
        if (!el) continue;
        const rect = el.getBoundingClientRect();

        if (rect.top <= threshold) {
          active = id;
          continue;
        }

        if (active === "all" && rect.top < window.innerHeight) {
          active = id;
        }
        break;
      }

      setActiveSectionAnchor((prev) => (prev === active ? prev : active));
    };

    updateActiveSection();
    window.addEventListener("scroll", updateActiveSection, { passive: true });
    window.addEventListener("resize", updateActiveSection);
    return () => {
      window.removeEventListener("scroll", updateActiveSection);
      window.removeEventListener("resize", updateActiveSection);
    };
  }, [currentSections, set]);

  const renderCard = (a: AlgItem) => (
    <button key={a.id} className="card" type="button" onClick={() => setSelected(a)}>
      <div className="cardTop">
        <div className="cardTitle">{formatCaseNameForDisplay(a)}</div>
        <MiniTwisty set={a.set} size={176} thumb={a.thumb} />
      </div>
      <pre className="cardAlg">{formatAlgForDisplay(a.alg, a.set)}</pre>
    </button>
  );

  return (
    <div className="app">
      <div className="appGlow appGlow--a" aria-hidden="true" />
      <div className="appGlow appGlow--b" aria-hidden="true" />
      <div className="appGridNoise" aria-hidden="true" />

      <main className="shell">
        <header className="hero">
          <div className="heroMain">
            <div className="heroEyebrow">3x3x3 Study System</div>
            <h1 className="heroTitle">Rubik Knowledge Atlas</h1>
            <p className="heroLead">
              A living study base for reviewing algorithms, recognition, and training. OLL/PLL
              today; SRS, OH, BLD, and the rest of your practice workflow next.
            </p>

            <div className="heroStats">
              <div className="statCard">
                <div className="statLabel">OLL Cases</div>
                <div className="statValue">{ollCount}</div>
              </div>
              <div className="statCard">
                <div className="statLabel">PLL Cases</div>
                <div className="statValue">{pllCount}</div>
              </div>
              <div className="statCard">
                <div className="statLabel">Current View</div>
                <div className="statValue">{set}</div>
              </div>
              <div className="statCard">
                <div className="statLabel">Visible</div>
                <div className="statValue">
                  {visibleCount}/{selectedSetTotal}
                </div>
              </div>
            </div>
          </div>

          <div className="heroPanels">
            <section className="heroPanel heroPanel--warm">
              <div className="panelKicker">Roadmap</div>
              <h2 className="panelTitle">Next Training Blocks</h2>
              <ul className="panelList">
                <li>SRS to space out OLL/PLL reviews and future sections.</li>
                <li>Case recognition drills and timed practice sessions.</li>
                <li>New sections: F2L, OH, BLD, and personal notes.</li>
              </ul>
            </section>

            <section className="heroPanel heroPanel--cool">
              <div className="panelKicker">Practice Focus</div>
              <div className="chipRow">
                <span className="chip chip--active">Recognition</span>
                <span className="chip">Execution</span>
                <span className="chip">Fingertricks</span>
                <span className="chip">Consistency</span>
              </div>
              <p className="panelText">
                Use the catalog as a quick visual reference and open any case to play the algorithm
                in the viewer.
              </p>
            </section>
          </div>
        </header>

        <div className="workspace">
          <aside className="rail" aria-label="Learning modules">
            <section className="railPanel">
              <div className="railHeader">
                <div className="railTitle">Learning Tracks</div>
                <div className="railBadge">3x3x3</div>
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

            <section className="railPanel railPanel--compact">
              <div className="railTitle">Practice Modules</div>
              <div className="moduleList">
                {PRACTICE_MODULES.map((mod) => (
                  <div key={mod.name} className="moduleRow">
                    <span>{mod.name}</span>
                    <span className="moduleState">{mod.state}</span>
                  </div>
                ))}
              </div>
            </section>
          </aside>

          <section className="catalogPanel" aria-label="Algorithm catalog">
            <div className="catalogSticky">
              <header className="catalogHeader">
                <div className="catalogHeaderTop">
                  <div>
                    <div className="catalogEyebrow">Catalog</div>
                    <h2 className="catalogTitle">{SET_META[set].long}</h2>
                    <p className="catalogDescription">{SET_META[set].description}</p>
                  </div>
                  <div className="catalogMeta">
                    <span className="metaPill">{SET_META[set].short}</span>
                    <span className="metaPill">Top color: Yellow</span>
                    <span className="metaPill">SVG thumbnails</span>
                  </div>
                </div>

                <div className="controls">
                  <div className="tabs" role="tablist" aria-label="Algorithm set">
                    <button
                      type="button"
                      className={set === "OLL" ? "active" : ""}
                      aria-pressed={set === "OLL"}
                      onClick={() => setSet("OLL")}
                    >
                      <span className="tabLong">Orientation of Last Layer</span>
                      <span className="tabShort">(OLL)</span>
                    </button>
                    <button
                      type="button"
                      className={set === "PLL" ? "active" : ""}
                      aria-pressed={set === "PLL"}
                      onClick={() => setSet("PLL")}
                    >
                      <span className="tabLong">Permutation of Last Layer</span>
                      <span className="tabShort">(PLL)</span>
                    </button>
                  </div>

                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder={`Search ${set} (e.g. ${set === "PLL" ? "Ga, T-perm" : "OLL 27, Sune"})...`}
                  />
                </div>

                <div className="catalogSubRow">
                  {set === "OLL" ? (
                    <div className="subtleNote">OLL loaded: {ollCount}/57 cases</div>
                  ) : (
                    <div className="subtleNote">PLL loaded: {pllCount}/21 cases</div>
                  )}
                  {!!q.trim() && <div className="searchEcho">Filter: “{q.trim()}”</div>}
                </div>
              </header>

              {!!currentSections.length && (
                <nav className="sectionNav" aria-label={`${SET_META[set].short} categories`}>
                <button
                  type="button"
                  className={`sectionNavChip sectionNavChip--all ${
                    activeSectionAnchor === "all" ? "isActive" : ""
                  }`}
                  onClick={() => scrollToSection("catalog-top")}
                  aria-pressed={activeSectionAnchor === "all"}
                >
                  All
                </button>
                {currentSections.map((section) => {
                  const sectionId = `${set.toLowerCase()}-${section.key}`;
                    return (
                      <button
                      key={section.key}
                      type="button"
                      className={`sectionNavChip sectionNavChip--${section.tone} ${
                        activeSectionAnchor === sectionId ? "isActive" : ""
                      }`}
                      onClick={() => scrollToSection(sectionId)}
                      title={section.title}
                      aria-pressed={activeSectionAnchor === sectionId}
                    >
                        <span className="sectionNavChipLabel">{section.title}</span>
                        <span className="sectionNavChipCount">{section.items.length}</span>
                      </button>
                    );
                  })}
                </nav>
              )}
            </div>

            {set === "PLL" ? (
              <div className="sections" id="catalog-top">
                {pllSections.map((section) => (
                  <section
                    key={section.key}
                    id={`pll-${section.key}`}
                    className={`section section--${section.tone}`}
                  >
                    <div className="sectionHeader">
                      <span>{section.title}</span>
                      <span className="sectionCount">{section.items.length}</span>
                    </div>
                    <div className="sectionGrid">{section.items.map(renderCard)}</div>
                  </section>
                ))}
              </div>
            ) : set === "OLL" ? (
              <div className="sections" id="catalog-top">
                {ollSections.map((section) => (
                  <section
                    key={section.key}
                    id={`oll-${section.key}`}
                    className={`section section--${section.tone}`}
                  >
                    <div className="sectionHeader">
                      <span>{section.title}</span>
                      <span className="sectionCount">{section.items.length}</span>
                    </div>
                    <div className="sectionGrid">{section.items.map(renderCard)}</div>
                  </section>
                ))}
              </div>
            ) : (
              <div className="grid">{filtered.map(renderCard)}</div>
            )}
          </section>
        </div>
      </main>

      {selected && (
        <div className="modalOverlay" onClick={() => setSelected(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modalHeader">
              <div className="modalTitleWrap">
                <div className="modalTagRow">
                  <span className="modalSetTag">{selected.set}</span>
                  <span className="modalCaseTag">{selected.id.replace(/^pll_|^oll_/, "").toUpperCase()}</span>
                </div>
                <div className="modalTitle">{formatCaseNameForDisplay(selected)}</div>
                <div className="modalSubtitle">Recognition + execution viewer</div>
              </div>
              <button className="close" type="button" onClick={() => setSelected(null)}>
                ✕
              </button>
            </div>

            <div className="modalLayout">
              <section className="viewerPanel">
                <div className="viewerPanelBar">
                  <span>Case Viewer</span>
                  <span className="viewerPanelHint">Yellow top · z2</span>
                </div>
                <div className="viewerPanelStage">
                  <Twisty alg={selected.alg} />
                </div>
              </section>

              <aside className="modalSide">
                <section className="recognitionPanel">
                  <div className="label">Recognition</div>
                  <div className="recognitionThumbWrap">
                    <MiniTwisty set={selected.set} size={210} thumb={selected.thumb} />
                  </div>
                </section>

                <section className="algBlock">
                  <div className="label">Algorithm</div>
                  <code>{formatAlgForDisplay(selected.alg, selected.set)}</code>
                </section>

                <section className="modalNoteCard">
                  <div className="modalNoteTitle">Study Notes (next)</div>
                  <p>
                    This is where OH variants, fingertricks, triggers, and per-case SRS scoring
                    will fit next.
                  </p>
                </section>
              </aside>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
