import React, { useMemo, useState } from "react";
import type { AlgItem } from "../types";
import type { SRSCard, SRSRating } from "../utils/srs";
import { isDue, getSRSCard } from "../utils/srs";
import { MiniTwisty } from "./MiniTwisty";

const SESSION_MAX = 20;

type Props = {
  cases: AlgItem[];
  label: string;
  mode?: "recognition" | "execution";
  srsData: Record<string, SRSCard>;
  preferredAlgs?: Record<string, string>;
  ohMode?: boolean;
  onRate: (id: string, rating: SRSRating) => void;
  onClose: () => void;
};

type SessionResult = { id: string; rating: SRSRating };

function buildQueue(cases: AlgItem[], srsData: Record<string, SRSCard>): AlgItem[] {
  const due: AlgItem[] = [];
  const newCards: AlgItem[] = [];

  for (const c of cases) {
    const card = srsData[c.id];
    if (!card) {
      newCards.push(c);
    } else if (isDue(card)) {
      due.push(c);
    }
  }

  // Sort due cards by dueDate ascending (most overdue first)
  due.sort((a, b) => {
    const da = srsData[a.id]!.dueDate;
    const db = srsData[b.id]!.dueDate;
    return da < db ? -1 : da > db ? 1 : 0;
  });

  return [...due, ...newCards].slice(0, SESSION_MAX);
}

const RATING_CONFIG: { rating: SRSRating; label: string; mod: string }[] = [
  { rating: 1, label: "Again", mod: "again" },
  { rating: 2, label: "Hard", mod: "hard" },
  { rating: 3, label: "Good", mod: "good" },
  { rating: 4, label: "Easy", mod: "easy" },
];

export function DrillModal({ cases, label, mode = "recognition", srsData, preferredAlgs, ohMode = false, onRate, onClose }: Props) {
  const queue = useMemo(() => buildQueue(cases, srsData), [cases, srsData]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState<"question" | "answer">("question");
  const [results, setResults] = useState<SessionResult[]>([]);

  const current = queue[currentIndex];
  const isComplete = currentIndex >= queue.length;

  function handleRate(rating: SRSRating) {
    if (!current) return;
    onRate(current.id, rating);
    setResults((prev) => [...prev, { id: current.id, rating }]);
    setCurrentIndex((i) => i + 1);
    setPhase("question");
  }

  const countByRating = (r: SRSRating) => results.filter((x) => x.rating === r).length;

  return (
    <div className="drillOverlay" onClick={onClose}>
      <div className="drillModal" onClick={(e) => e.stopPropagation()}>
        <div className="drillHeader">
          <div className="drillHeaderTitle">
            {mode === "execution" ? "Execution Drills" : "Recognition Drills"} · {label}
            {ohMode && <span className="ohBadge ohBadge--drill">🤚 OH</span>}
          </div>
          <button className="close" type="button" onClick={onClose}>✕</button>
        </div>

        {queue.length === 0 ? (
          <div className="drillComplete">
            <div className="drillCompleteIcon">✓</div>
            <h2 className="drillCompleteTitle">Nothing due</h2>
            <p className="drillCompleteLead">All OLL cases are up to date. Come back tomorrow!</p>
            <button className="drillDoneBtn" type="button" onClick={onClose}>Close</button>
          </div>
        ) : isComplete ? (
          <div className="drillComplete">
            <div className="drillCompleteIcon">🎯</div>
            <h2 className="drillCompleteTitle">Session Complete</h2>
            <p className="drillCompleteLead">{results.length} cards reviewed</p>
            <div className="drillSummaryRow">
              {RATING_CONFIG.map(({ rating, label, mod }) => (
                <div key={rating} className={`drillSummaryChip drillSummaryChip--${mod}`}>
                  <span className="drillSummaryCount">{countByRating(rating)}</span>
                  <span className="drillSummaryLabel">{label}</span>
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
              <div className="drillThumbWrap">
                <MiniTwisty
                  set={current.set}
                  size={200}
                  thumb={current.thumb}
                  alg={current.set === "F2L" ? current.alg : undefined}
                  setupAlg={current.set === "F2L" ? current.caseSetupAlg : undefined}
                />
              </div>

              {phase === "question" ? (
                <div className="drillQuestion">
                  {mode === "execution" ? (
                    <>
                      <div className="drillExecCaseName">{current.name}</div>
                      <div className="drillCaseId">{current.id.replace(/^(oll|pll|f2l)_/, (m) => m.slice(0, -1).toUpperCase() + " ").toUpperCase()}</div>
                      <p className="drillQuestionHint">Execute this algorithm on your cube, then reveal.</p>
                    </>
                  ) : (
                    <p className="drillQuestionHint">
                      {current.set === "F2L"
                        ? "Recall the algorithm for this F2L case"
                        : `Which ${current.set} case is this?`}
                    </p>
                  )}
                  <button
                    className="drillRevealBtn"
                    type="button"
                    onClick={() => setPhase("answer")}
                  >
                    {mode === "execution" ? "Show Algorithm" : "Reveal"}
                  </button>
                </div>
              ) : (
                <div className="drillAnswer">
                  {mode === "recognition" && (
                    <>
                      <div className="drillCaseName">{current.name}</div>
                      <div className="drillCaseId">{current.id.replace(/^(oll|pll|f2l)_/, (m) => m.slice(0, -1).toUpperCase() + " ").toUpperCase()}</div>
                    </>
                  )}
                  <code className="drillAlg">{preferredAlgs?.[current.id] ?? current.alg}</code>
                  {mode === "execution" && (
                    <div className="drillExecPlayer">
                      <twisty-player
                        puzzle="3x3x3"
                        alg={preferredAlgs?.[current.id] ?? current.alg}
                        experimental-setup-anchor="end"
                        background="none"
                        hint-facelets="none"
                        style={{ width: "180px", height: "180px", display: "block", margin: "0 auto" }}
                      ></twisty-player>
                    </div>
                  )}
                  <div className="ratingRow">
                    {RATING_CONFIG.map(({ rating, label, mod }) => (
                      <button
                        key={rating}
                        type="button"
                        className={`ratingBtn ratingBtn--${mod}`}
                        onClick={() => handleRate(rating)}
                      >
                        {label}
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
