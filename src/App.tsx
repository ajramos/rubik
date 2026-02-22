import React, { useMemo, useState } from "react";
import algsRaw from "./data/algs.json";
import type { AlgItem, AlgSet } from "./types";
import { MiniTwisty } from "./components/MiniTwisty";
import { Twisty } from "./components/Twisty";

const algs = algsRaw as AlgItem[];

type PllGroup = {
  key: string;
  title: string;
  tone: "sand" | "sage" | "rose" | "sky";
  ids: string[];
};

const PLL_GROUPS: PllGroup[] = [
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
