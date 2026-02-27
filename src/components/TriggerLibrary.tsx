import React, { useState } from "react";
import { MovePreviewModal } from "./MovePreviewModal";

type Trigger = {
  key: string;
  name: string;
  notation: string;
  occurrences: string[];
  desc: string;
};

type TriggerFamily = {
  title: string;
  key: string;
  triggers: Trigger[];
};

const TRIGGER_FAMILIES: TriggerFamily[] = [
  {
    title: "Sexy Move Family",
    key: "sexy-family",
    triggers: [
      {
        key: "sexy",
        name: "Sexy Move",
        notation: "R U R' U'",
        occurrences: ["F2L pairs", "OLL", "PLL"],
        desc: "The most common CFOP building block. Memorise the feel of this before anything else.",
      },
      {
        key: "anti-sexy",
        name: "Anti-Sexy",
        notation: "U R U' R'",
        occurrences: ["F2L pairs", "OLL"],
        desc: "Rotation-shifted version of the sexy move. Same effect, different grip orientation.",
      },
      {
        key: "double-sexy",
        name: "Double Sexy",
        notation: "R U R' U' R U R' U'",
        occurrences: ["OLL dot cases", "Slot recovery"],
        desc: "Two consecutive sexy moves back-to-back. Appears in several OLL dot and line cases.",
      },
    ],
  },
  {
    title: "Sledgehammer Family",
    key: "sledge-family",
    triggers: [
      {
        key: "sledge",
        name: "Sledgehammer",
        notation: "R' F R F'",
        occurrences: ["OLL 29, 30", "F2L edge cases"],
        desc: "F-face insertion. Generates the same corner orientation as the sexy move from a different angle.",
      },
      {
        key: "hedge",
        name: "Hedge",
        notation: "F R' F' R",
        occurrences: ["OLL 32", "F2L recovery"],
        desc: "Reverse sledgehammer. Hedge and Sledge are inverses of each other.",
      },
    ],
  },
  {
    title: "Sune Family",
    key: "sune-family",
    triggers: [
      {
        key: "sune",
        name: "Sune",
        notation: "R U R' U R U2 R'",
        occurrences: ["OLL 27", "4LLL corners"],
        desc: "Orients one corner correctly and cycles the other three. Foundation of 2-Look OLL corners.",
      },
      {
        key: "antisune",
        name: "Antisune",
        notation: "R U2 R' U' R U' R'",
        occurrences: ["OLL 26", "4LLL corners"],
        desc: "Mirror of Sune. Together Sune + Antisune cover all OLL corner orientation cases.",
      },
    ],
  },
];

const SET_COLORS: Record<string, string> = {
  "F2L pairs": "f2l",
  "OLL": "oll",
  "PLL": "pll",
};
function occTone(label: string): string {
  for (const [key, tone] of Object.entries(SET_COLORS)) {
    if (label.startsWith(key)) return tone;
  }
  return "neutral";
}

export function TriggerLibrary() {
  const [preview, setPreview] = useState<string | null>(null);

  return (
    <>
      <section className="triggerSection">
        <div className="triggerSectionHeader">
          <span className="triggerSectionTitle">Trigger Library</span>
          <span className="notationClickHint">click notation to preview</span>
        </div>

        {TRIGGER_FAMILIES.map((family) => (
          <div key={family.key} className="triggerFamily">
            <div className="triggerFamilyLabel">{family.title}</div>
            <div className="triggerCardGrid">
              {family.triggers.map((t) => (
                <article key={t.key} className="triggerCard">
                  <div className="triggerCardTop">
                    <span className="triggerName">{t.name}</span>
                    <button
                      type="button"
                      className="triggerNotationBtn"
                      onClick={() => setPreview(t.key)}
                      title={`Preview ${t.name}`}
                    >
                      <code className="triggerNotationCode">{t.notation}</code>
                      <span className="triggerPlayIcon">▶</span>
                    </button>
                  </div>
                  <p className="triggerDesc">{t.desc}</p>
                  <div className="triggerOccurrences">
                    {t.occurrences.map((o) => (
                      <span key={o} className={`triggerOccTag triggerOccTag--${occTone(o)}`}>{o}</span>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </div>
        ))}
      </section>

      {preview && (
        <MovePreviewModal move={preview} onClose={() => setPreview(null)} />
      )}
    </>
  );
}
