import React, { useMemo, useState } from "react";
import type { SRSCard, SRSRating } from "../utils/srs";
import { isDue, getSRSCard } from "../utils/srs";
import { SPEFFZ_EDGES, SPEFFZ_CORNERS, Y_PERM, type BldTarget } from "../data/bld-data";

const SESSION_MAX = 20;

type BldTab = "reference" | "edge-drill" | "corner-drill";

type Props = {
  bldSrsData: Record<string, SRSCard>;
  onRate: (id: string, rating: SRSRating) => void;
};

const RATING_CONFIG: { rating: SRSRating; label: string; mod: string }[] = [
  { rating: 1, label: "Again", mod: "again" },
  { rating: 2, label: "Hard", mod: "hard" },
  { rating: 3, label: "Good", mod: "good" },
  { rating: 4, label: "Easy", mod: "easy" },
];

function buildDrillQueue(targets: BldTarget[], srsData: Record<string, SRSCard>): BldTarget[] {
  const active = targets.filter((t) => !t.isBuffer);
  const due: BldTarget[] = [];
  const newCards: BldTarget[] = [];

  for (const t of active) {
    const card = srsData[t.id];
    if (!card) {
      newCards.push(t);
    } else if (isDue(card)) {
      due.push(t);
    }
  }

  due.sort((a, b) => {
    const da = srsData[a.id]!.dueDate;
    const db = srsData[b.id]!.dueDate;
    return da < db ? -1 : da > db ? 1 : 0;
  });

  return [...due, ...newCards].slice(0, SESSION_MAX);
}

function DrillPanel({
  targets,
  label,
  bldSrsData,
  onRate,
}: {
  targets: BldTarget[];
  label: string;
  bldSrsData: Record<string, SRSCard>;
  onRate: (id: string, rating: SRSRating) => void;
}) {
  const queue = useMemo(() => buildDrillQueue(targets, bldSrsData), [targets, bldSrsData]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState<"question" | "answer">("question");
  const [results, setResults] = useState<{ id: string; rating: SRSRating }[]>([]);

  const current = queue[currentIndex];
  const isComplete = currentIndex >= queue.length;

  function handleRate(rating: SRSRating) {
    if (!current) return;
    onRate(current.id, rating);
    setResults((prev) => [...prev, { id: current.id, rating }]);
    setCurrentIndex((i) => i + 1);
    setPhase("question");
  }

  function countByRating(r: SRSRating) {
    return results.filter((x) => x.rating === r).length;
  }

  if (queue.length === 0) {
    return (
      <div className="bldDrillComplete">
        <div className="bldDrillCompleteIcon">✓</div>
        <h3 className="bldDrillCompleteTitle">Nothing due</h3>
        <p className="bldDrillCompleteLead">All {label} positions are up to date.</p>
      </div>
    );
  }

  if (isComplete) {
    return (
      <div className="bldDrillComplete">
        <div className="bldDrillCompleteIcon">🎯</div>
        <h3 className="bldDrillCompleteTitle">Session Complete</h3>
        <p className="bldDrillCompleteLead">{results.length} positions reviewed</p>
        <div className="drillSummaryRow">
          {RATING_CONFIG.map(({ rating, label: lbl, mod }) => (
            <div key={rating} className={`drillSummaryChip drillSummaryChip--${mod}`}>
              <span className="drillSummaryCount">{countByRating(rating)}</span>
              <span className="drillSummaryLabel">{lbl}</span>
            </div>
          ))}
        </div>
        <button
          className="bldDrillRestartBtn"
          type="button"
          onClick={() => {
            setCurrentIndex(0);
            setPhase("question");
            setResults([]);
          }}
        >
          Start over
        </button>
      </div>
    );
  }

  return (
    <div className="bldDrillWrap">
      <div className="drillProgress">
        <div className="drillProgressBar">
          <div
            className="drillProgressFill"
            style={{ width: `${(currentIndex / queue.length) * 100}%` }}
          />
        </div>
        <span className="drillProgressLabel">{currentIndex + 1} / {queue.length}</span>
      </div>

      <div className="bldCard">
        {phase === "question" ? (
          <div className="bldCardFront">
            <div className="bldCardLetter">{current.letter}</div>
            <div className="bldCardPosition">{current.position}</div>
            <div className="bldCardFaceName">{current.faceName}</div>
            {current.note && <div className="bldCardNote">{current.note}</div>}
            <p className="bldCardHint">Recall the setup alg and commutator for this position.</p>
            <button
              className="drillRevealBtn"
              type="button"
              onClick={() => setPhase("answer")}
            >
              Reveal
            </button>
          </div>
        ) : (
          <div className="bldCardBack">
            <div className="bldCardLetter">{current.letter}</div>
            <div className="bldCardPosition">{current.position}</div>
            {current.setupAlg && (
              <div className="bldCardAlgBlock">
                <div className="bldCardAlgLabel">Setup</div>
                <code className="bldCardAlg">{current.setupAlg}</code>
              </div>
            )}
            <div className="bldCardAlgBlock">
              <div className="bldCardAlgLabel">Full alg</div>
              <code className="bldCardAlg">{current.fullAlg}</code>
            </div>
            <div className="ratingRow">
              {RATING_CONFIG.map(({ rating, label: lbl, mod }) => (
                <button
                  key={rating}
                  type="button"
                  className={`ratingBtn ratingBtn--${mod}`}
                  onClick={() => handleRate(rating)}
                >
                  {lbl}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function EdgeTable({ srsData }: { srsData: Record<string, SRSCard> }) {
  const active = SPEFFZ_EDGES.filter((t) => !t.isBuffer);

  return (
    <div className="bldTableWrap">
      <h3 className="bldTableTitle">Edges — M2 Method</h3>
      <p className="bldTableDesc">
        Buffer: <strong>C (UF)</strong>. Each alg cycles the target with the buffer using M2.
        Format: setup · M2 · undo setup.
      </p>
      <div className="bldTableScroll">
        <table className="bldTable">
          <thead>
            <tr>
              <th>Letter</th>
              <th>Position</th>
              <th>Setup</th>
              <th>Full Alg</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {SPEFFZ_EDGES.map((t) => {
              const card = getSRSCard(t.id, srsData);
              const status = !srsData[t.id]
                ? "new"
                : isDue(card)
                  ? "due"
                  : "learned";
              return (
                <tr key={t.id} className={t.isBuffer ? "bldTableRowBuffer" : ""}>
                  <td className="bldTableLetter">{t.letter}</td>
                  <td className="bldTablePos">{t.position}</td>
                  <td>
                    {t.isBuffer ? (
                      <em className="bldTableBufferNote">buffer</em>
                    ) : t.setupAlg ? (
                      <code className="bldTableAlg">{t.setupAlg}</code>
                    ) : (
                      <em>—</em>
                    )}
                  </td>
                  <td>
                    {t.isBuffer ? (
                      <em className="bldTableBufferNote">skip</em>
                    ) : (
                      <code className="bldTableAlg">{t.fullAlg}</code>
                    )}
                  </td>
                  <td>
                    {!t.isBuffer && (
                      <span className={`bldSrsStatus bldSrsStatus--${status}`}>
                        {status}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="bldTableFootnote">
        Unused edges (buffer piece C + I): skipped automatically in drills.
      </p>
    </div>
  );
}

function CornerTable({ srsData }: { srsData: Record<string, SRSCard> }) {
  return (
    <div className="bldTableWrap">
      <h3 className="bldTableTitle">Corners — Old Pochmann (OP) Method</h3>
      <p className="bldTableDesc">
        Buffer: <strong>B (URF, U sticker)</strong>. Each alg uses the Y-perm as the base commutator.
        Y-perm: <code className="bldTableAlgInline">{Y_PERM}</code>
      </p>
      <div className="bldTableScroll">
        <table className="bldTable">
          <thead>
            <tr>
              <th>Letter</th>
              <th>Position</th>
              <th>Setup</th>
              <th>Full Alg</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {SPEFFZ_CORNERS.map((t) => {
              const card = getSRSCard(t.id, srsData);
              const status = !srsData[t.id]
                ? "new"
                : isDue(card)
                  ? "due"
                  : "learned";
              return (
                <tr key={t.id} className={t.isBuffer ? "bldTableRowBuffer" : ""}>
                  <td className="bldTableLetter">{t.letter}</td>
                  <td className="bldTablePos">{t.position}</td>
                  <td>
                    {t.isBuffer ? (
                      <em className="bldTableBufferNote">buffer</em>
                    ) : t.setupAlg ? (
                      <code className="bldTableAlg">{t.setupAlg}</code>
                    ) : (
                      <em>—</em>
                    )}
                  </td>
                  <td>
                    {t.isBuffer ? (
                      <em className="bldTableBufferNote">skip</em>
                    ) : (
                      <code className="bldTableAlg">{t.fullAlg}</code>
                    )}
                  </td>
                  <td>
                    {!t.isBuffer && (
                      <span className={`bldSrsStatus bldSrsStatus--${status}`}>
                        {status}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="bldTableFootnote">
        Buffer stickers (B, H, P) are skipped automatically in drills.
        Algs shown as [setup] (Y-perm) [undo] — verify corner setups against your reference.
      </p>
    </div>
  );
}

function SpeffzDiagram() {
  // 2D unfolded net showing the letter for each sticker group
  // Layout: Back | Left | Up | Right | Front | Down (standard cross net)
  const faceData = [
    {
      face: "U",
      label: "Up",
      letters: ["D", "A", "B", "E·M", "C·I", "H·P", "G", "V", "J"],
      note: "Center omitted",
    },
    {
      face: "F",
      label: "Front",
      letters: ["I", "J", "K"],
      note: "",
    },
  ];

  return (
    <div className="bldDiagramWrap">
      <h3 className="bldTableTitle">Speffz Letter Scheme — Quick Reference</h3>
      <p className="bldTableDesc">
        Letters A–X are assigned to the 24 edge sticker positions and separately to the 24 corner
        sticker positions. The same letter refers to a different physical sticker for edges vs. corners.
      </p>
      <div className="bldLetterGrid">
        <div className="bldLetterFace">
          <div className="bldLetterFaceLabel">Edges (M2)</div>
          <div className="bldLetterFaceRows">
            {[
              ["—", "A·Q", "—"],
              ["D·H", "C(buf)·I(buf)", "B·N"],
              ["—", "V·X", "—"],
              ["E·G", "F·L", "M·O"],
              ["—", "K·S", "—"],
              ["U·W", "J·T", "P·R"],
            ].map((row, ri) => (
              <div key={ri} className="bldLetterRow">
                {row.map((cell, ci) => (
                  <div
                    key={ci}
                    className={`bldLetterCell ${cell === "—" ? "bldLetterCellEmpty" : ""} ${cell.includes("buf") ? "bldLetterCellBuffer" : ""}`}
                  >
                    {cell !== "—" ? cell : ""}
                  </div>
                ))}
              </div>
            ))}
          </div>
          <p className="bldLetterFaceNote">
            Left column = L face stickers · Right = R face · Top = U face (A,B,D) ·
            Bottom = D face (U,V,W,X) · Middle column top = UB/UF · Mid bottom = FD/BD
          </p>
        </div>

        <div className="bldLetterFace">
          <div className="bldLetterFaceLabel">Full position list (edges)</div>
          <div className="bldLetterList">
            {SPEFFZ_EDGES.map((t) => (
              <div key={t.id} className={`bldLetterListItem ${t.isBuffer ? "bldLetterListItemBuffer" : ""}`}>
                <span className="bldLetterListLetter">{t.letter}</span>
                <span className="bldLetterListPos">{t.position}</span>
                <span className="bldLetterListFace">{t.faceName}</span>
                {t.isBuffer && <span className="bldLetterListBufferTag">buffer</span>}
              </div>
            ))}
          </div>
        </div>

        <div className="bldLetterFace">
          <div className="bldLetterFaceLabel">Full position list (corners)</div>
          <div className="bldLetterList">
            {SPEFFZ_CORNERS.map((t) => (
              <div key={t.id} className={`bldLetterListItem ${t.isBuffer ? "bldLetterListItemBuffer" : ""}`}>
                <span className="bldLetterListLetter">{t.letter}</span>
                <span className="bldLetterListPos">{t.position}</span>
                <span className="bldLetterListFace">{t.faceName}</span>
                {t.isBuffer && <span className="bldLetterListBufferTag">buffer</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function BldSection({ bldSrsData, onRate }: Props) {
  const [tab, setTab] = useState<BldTab>("reference");

  const edgeDueCount = SPEFFZ_EDGES.filter(
    (t) => !t.isBuffer && (!bldSrsData[t.id] || isDue(getSRSCard(t.id, bldSrsData)))
  ).length;

  const cornerDueCount = SPEFFZ_CORNERS.filter(
    (t) => !t.isBuffer && (!bldSrsData[t.id] || isDue(getSRSCard(t.id, bldSrsData)))
  ).length;

  return (
    <div className="bldSection">
      <header className="bldHeader">
        <div className="bldHeaderTop">
          <h2 className="bldTitle">Blindfolded (BLD)</h2>
          <span className="bldMethodBadge">M2 / OP · Speffz</span>
        </div>
        <p className="bldSubtitle">
          Reference tables and spaced-repetition drills for M2 edges and Old Pochmann corners.
        </p>
      </header>

      <div className="bldTabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "reference"}
          className={`bldTab ${tab === "reference" ? "isActive" : ""}`}
          onClick={() => setTab("reference")}
        >
          Reference
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "edge-drill"}
          className={`bldTab ${tab === "edge-drill" ? "isActive" : ""}`}
          onClick={() => setTab("edge-drill")}
        >
          Edge Drill
          {edgeDueCount > 0 && (
            <span className="bldTabBadge">{edgeDueCount}</span>
          )}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "corner-drill"}
          className={`bldTab ${tab === "corner-drill" ? "isActive" : ""}`}
          onClick={() => setTab("corner-drill")}
        >
          Corner Drill
          {cornerDueCount > 0 && (
            <span className="bldTabBadge">{cornerDueCount}</span>
          )}
        </button>
      </div>

      <div className="bldTabContent">
        {tab === "reference" && (
          <>
            <SpeffzDiagram />
            <EdgeTable srsData={bldSrsData} />
            <CornerTable srsData={bldSrsData} />
          </>
        )}
        {tab === "edge-drill" && (
          <DrillPanel
            targets={SPEFFZ_EDGES}
            label="M2 Edges"
            bldSrsData={bldSrsData}
            onRate={onRate}
          />
        )}
        {tab === "corner-drill" && (
          <DrillPanel
            targets={SPEFFZ_CORNERS}
            label="OP Corners"
            bldSrsData={bldSrsData}
            onRate={onRate}
          />
        )}
      </div>
    </div>
  );
}
