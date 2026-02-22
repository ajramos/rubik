import React, { useMemo, useState } from "react";
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
  const [set, setSet] = useState<AlgSet>("PLL");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<AlgItem | null>(null);

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

  const renderCard = (a: AlgItem) => (
    <button key={a.id} className="card" onClick={() => setSelected(a)}>
      <div className="cardTop">
        <div className="cardTitle">{a.name}</div>
        <MiniTwisty set={a.set} size={140} thumb={a.thumb} />
      </div>
      <div className="cardAlg">{a.alg}</div>
    </button>
  );

  return (
    <div className="app">
      <header className="header">
        <h1>OLL / PLL Catalog</h1>
        {set === "OLL" && <div className="subtleNote">OLL loaded: {ollCount}/57 cases</div>}

        <div className="controls">
          <div className="tabs">
            <button
              className={set === "PLL" ? "active" : ""}
              onClick={() => setSet("PLL")}
            >
              PLL
            </button>
            <button
              className={set === "OLL" ? "active" : ""}
              onClick={() => setSet("OLL")}
            >
              OLL
            </button>
          </div>

          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search (e.g. Ga, T-perm, Sune)..."
          />
        </div>
      </header>

      <main>
        {set === "PLL" ? (
          <div className="sections">
            {pllSections.map((section) => (
              <section key={section.key} className={`section section--${section.tone}`}>
                <div className="sectionHeader">{section.title}</div>
                <div className="sectionGrid">{section.items.map(renderCard)}</div>
              </section>
            ))}
          </div>
        ) : set === "OLL" ? (
          <div className="sections">
            {ollSections.map((section) => (
              <section key={section.key} className={`section section--${section.tone}`}>
                <div className="sectionHeader">{section.title}</div>
                <div className="sectionGrid">{section.items.map(renderCard)}</div>
              </section>
            ))}
          </div>
        ) : (
          <div className="grid">{filtered.map(renderCard)}</div>
        )}
      </main>

      {selected && (
        <div className="modalOverlay" onClick={() => setSelected(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modalHeader">
              <div>
                <div className="modalTitle">{selected.name}</div>
                <div className="modalSubtitle">{selected.set}</div>
              </div>
              <button className="close" onClick={() => setSelected(null)}>
                ✕
              </button>
            </div>

            <Twisty alg={selected.alg} />

            <div className="algBlock">
              <div className="label">Algorithm</div>
              <code>{selected.alg}</code>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
