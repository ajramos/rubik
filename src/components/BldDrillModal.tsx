import React, { useMemo, useState } from "react";
import type { SRSCard, SRSRating } from "../utils/srs";
import { isDue } from "../utils/srs";
import type { BldTarget } from "../data/bld-data";
import { Y_PERM } from "../data/bld-data";
import type { CubeScheme } from "../utils/faceColors";
import { getFaceScheme } from "../utils/faceColors";
import { detectTriggers, injectNamedTokens, splitNamedTokenSegments } from "../utils/triggers";

const SESSION_MAX = 20;

type Props = {
  targets: BldTarget[];
  label: string;
  bldSrsData: Record<string, SRSCard>;
  cubeScheme: CubeScheme;
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

function renderNamedTokens(value: string): React.ReactNode {
  return splitNamedTokenSegments(value).map((segment, i) => {
    if (segment.type === "token") {
      return (
        <span
          key={i}
          className={`algNamedToken algNamedToken--${segment.info.color}`}
          data-moves={segment.info.moves}
        >
          {segment.text}
        </span>
      );
    }
    return <React.Fragment key={i}>{segment.text}</React.Fragment>;
  });
}

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

export function BldDrillModal({ targets, label, bldSrsData, cubeScheme, onRate, onClose }: Props) {
  const scheme = getFaceScheme(cubeScheme);
  const queue = useMemo(() => buildQueue(targets, bldSrsData), [targets, bldSrsData]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState<"question" | "answer">("question");
  const [results, setResults] = useState<SessionResult[]>([]);

  const current = queue[currentIndex];
  const isComplete = currentIndex >= queue.length;
  const countByRating = (r: SRSRating) => results.filter((x) => x.rating === r).length;
  const isCorner = current?.id.startsWith("corner_");
  const fullAlgTriggers = current ? detectTriggers(current.fullAlg) : [];

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
              {/* ── BLD letter display ── */}
              {(() => {
                const f = current.position[0] ?? "U";
                const face = scheme[f] ?? scheme["U"];
                const faceName = current.faceName.replace(/ \([A-Z] sticker\)$/, "");
                return (
                  <div className="bldDrillThumb">
                    <div className="bldDrillLetterWrap">
                      <span className="bldDrillLetter" style={{ color: face.bg }}>
                        {current.letter}
                      </span>
                    </div>
                    <div className="bldDrillMeta">
                      <span className="bldDrillFaceBadge" style={{ background: face.bg, color: face.text }}>
                        {face.label}
                      </span>
                      <span className="bldDrillPos">{current.position}</span>
                      <span className="bldDrillFaceName">{faceName}</span>
                    </div>
                  </div>
                );
              })()}

              {phase === "question" ? (
                <div className="drillQuestion">
                  {current.note && (
                    <p className="bldDrillNote">{current.note}</p>
                  )}
                  <p className="drillQuestionHint">
                    {isCorner
                      ? "Say the setup first, then execute without pauses: setup · Y-perm · undo."
                      : "Say the setup first, then execute without pauses: setup · M2 · undo."}
                  </p>
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
                  <div className="bldAlgBreakdown">
                    {current.setupAlg ? (
                      <>
                        <div className="bldAlgRow">
                          <span className="bldAlgRowLabel">Setup</span>
                          <code className="bldAlgRowCode">{renderNamedTokens(injectNamedTokens(current.setupAlg))}</code>
                        </div>
                        <div className="bldAlgRow">
                          <span className="bldAlgRowLabel">{isCorner ? "Y-perm" : "M2"}</span>
                          <code className="bldAlgRowCode bldAlgRowCode--core">
                            {isCorner ? renderNamedTokens(injectNamedTokens(Y_PERM)) : "M2"}
                          </code>
                        </div>
                        <div className="bldAlgRow">
                          <span className="bldAlgRowLabel">Undo</span>
                          <code className="bldAlgRowCode bldAlgRowCode--undo">
                            {current.fullAlg.split("  ").at(-1) ?? ""}
                          </code>
                        </div>
                        <div className="bldAlgDivider" />
                      </>
                    ) : (
                      <div className="bldAlgRow">
                        <span className="bldAlgRowLabel">{isCorner ? "Y-perm" : "M2"}</span>
                        <code className="bldAlgRowCode bldAlgRowCode--core">
                          {isCorner ? renderNamedTokens(injectNamedTokens(Y_PERM)) : "M2"}
                        </code>
                      </div>
                    )}
                    <div className="bldAlgRow bldAlgRow--full">
                      <span className="bldAlgRowLabel">Full</span>
                      <code className="drillAlg">{renderNamedTokens(injectNamedTokens(current.fullAlg))}</code>
                    </div>
                  </div>
                  {fullAlgTriggers.length > 0 && (
                    <section className="triggersPanel bldTriggersPanel">
                      <div className="bldTriggerLabel">Detected Triggers</div>
                      <div className="triggerChipRow">
                        {fullAlgTriggers.map((t) => (
                          <span key={t.name} className={`triggerChip triggerChip--${t.color}`} data-moves={t.moves}>
                            {t.name}
                          </span>
                        ))}
                      </div>
                    </section>
                  )}

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
                  <p className="bldRatingHint">
                    Again = wrong/blank · Hard = correct but slow · Good = correct at normal pace ·
                    Easy = instant.
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
