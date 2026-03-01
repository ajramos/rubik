import React, { useMemo, useState } from "react";
import type { SRSCard, SRSRating } from "../utils/srs";
import { isDue } from "../utils/srs";
import type { BldTarget } from "../data/bld-data";

const SESSION_MAX = 20;

type Props = {
  targets: BldTarget[];
  label: string;
  bldSrsData: Record<string, SRSCard>;
  onRate: (id: string, rating: SRSRating) => void;
  onClose: () => void;
};

type SessionResult = { id: string; rating: SRSRating };

const RATING_CONFIG: { rating: SRSRating; label: string; mod: string }[] = [
  { rating: 1, label: "Again", mod: "again" },
  { rating: 2, label: "Hard", mod: "hard" },
  { rating: 3, label: "Good", mod: "good" },
  { rating: 4, label: "Easy", mod: "easy" },
];

function buildQueue(targets: BldTarget[], srsData: Record<string, SRSCard>): BldTarget[] {
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

export function BldDrillModal({ targets, label, bldSrsData, onRate, onClose }: Props) {
  const queue = useMemo(() => buildQueue(targets, bldSrsData), [targets, bldSrsData]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState<"question" | "answer">("question");
  const [results, setResults] = useState<SessionResult[]>([]);

  const current = queue[currentIndex];
  const isComplete = currentIndex >= queue.length;
  const countByRating = (r: SRSRating) => results.filter((x) => x.rating === r).length;

  function handleRate(rating: SRSRating) {
    if (!current) return;
    onRate(current.id, rating);
    setResults((prev) => [...prev, { id: current.id, rating }]);
    setCurrentIndex((i) => i + 1);
    setPhase("question");
  }

  return (
    <div className="drillOverlay" onClick={onClose}>
      <div className="drillModal" onClick={(e) => e.stopPropagation()}>
        <div className="drillHeader">
          <div className="drillHeaderTitle">BLD Drill · {label}</div>
          <button className="close" type="button" onClick={onClose}>✕</button>
        </div>

        {queue.length === 0 ? (
          <div className="drillComplete">
            <div className="drillCompleteIcon">✓</div>
            <h2 className="drillCompleteTitle">Nothing due</h2>
            <p className="drillCompleteLead">All {label} positions are up to date. Come back tomorrow!</p>
            <button className="drillDoneBtn" type="button" onClick={onClose}>Close</button>
          </div>
        ) : isComplete ? (
          <div className="drillComplete">
            <div className="drillCompleteIcon">🎯</div>
            <h2 className="drillCompleteTitle">Session Complete</h2>
            <p className="drillCompleteLead">{results.length} positions reviewed</p>
            <div className="drillSummaryRow">
              {RATING_CONFIG.map(({ rating, label: lbl, mod }) => (
                <div key={rating} className={`drillSummaryChip drillSummaryChip--${mod}`}>
                  <span className="drillSummaryCount">{countByRating(rating)}</span>
                  <span className="drillSummaryLabel">{lbl}</span>
                </div>
              ))}
            </div>
            <button className="drillDoneBtn" type="button" onClick={onClose}>Done</button>
          </div>
        ) : (
          <>
            <div className="drillProgress">
              <div className="drillProgressBar">
                <div
                  className="drillProgressFill"
                  style={{ width: `${(currentIndex / queue.length) * 100}%` }}
                />
              </div>
              <span className="drillProgressLabel">{currentIndex + 1} / {queue.length}</span>
            </div>

            <div className="drillCard">
              {/* BLD letter display replaces MiniTwisty */}
              <div className="bldDrillThumb">
                <div className="bldDrillLetter">{current.letter}</div>
                <div className="bldDrillPos">{current.position}</div>
                <div className="bldDrillFaceName">{current.faceName}</div>
              </div>

              {phase === "question" ? (
                <div className="drillQuestion">
                  {current.note && (
                    <p className="drillQuestionHint" style={{ fontStyle: "normal", color: "var(--muted-2)" }}>
                      {current.note}
                    </p>
                  )}
                  <p className="drillQuestionHint">Recall the setup alg and commutator for this position.</p>
                  <button
                    className="drillRevealBtn"
                    type="button"
                    onClick={() => setPhase("answer")}
                  >
                    Reveal
                  </button>
                </div>
              ) : (
                <div className="drillAnswer">
                  {current.setupAlg && (
                    <>
                      <div className="drillCaseId">SETUP</div>
                      <code className="drillAlg">{current.setupAlg}</code>
                    </>
                  )}
                  <div className="drillCaseId">FULL ALG</div>
                  <code className="drillAlg">{current.fullAlg}</code>
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
          </>
        )}
      </div>
    </div>
  );
}
