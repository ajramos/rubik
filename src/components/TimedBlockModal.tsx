import React, { useState, useEffect } from "react";
import type { AlgItem } from "../types";
import type { SRSCard, SRSRating } from "../utils/srs";
import { MiniTwisty } from "./MiniTwisty";

type Phase = "setup" | "question" | "answer" | "complete";
type SetChoice = "OLL" | "PLL" | "F2L" | "mixed";
type FocusChoice = "all" | "weak";
type Duration = 3 | 5 | 10;
type SessionResult = { id: string; rating: SRSRating };

const RATING_CONFIG = [
  { rating: 1 as SRSRating, label: "Again", mod: "again" },
  { rating: 2 as SRSRating, label: "Hard",  mod: "hard"  },
  { rating: 3 as SRSRating, label: "Good",  mod: "good"  },
  { rating: 4 as SRSRating, label: "Easy",  mod: "easy"  },
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function fmt(s: number): string {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

type Props = {
  ollCases: AlgItem[];
  pllCases: AlgItem[];
  f2lCases?: AlgItem[];
  srsData: Record<string, SRSCard>;
  preferredAlgs?: Record<string, string>;
  onRate: (id: string, rating: SRSRating) => void;
  onClose: () => void;
};

export function TimedBlockModal({ ollCases, pllCases, f2lCases = [], srsData, preferredAlgs, onRate, onClose }: Props) {
  const [phase, setPhase]         = useState<Phase>("setup");
  const [duration, setDuration]   = useState<Duration>(5);
  const [setChoice, setSetChoice] = useState<SetChoice>("OLL");
  const [focus, setFocus]         = useState<FocusChoice>("all");
  const [timeLeft, setTimeLeft]   = useState(0);
  const [totalSecs, setTotalSecs] = useState(0);
  const [queue, setQueue]         = useState<AlgItem[]>([]);
  const [queueIdx, setQueueIdx]   = useState(0);
  const [results, setResults]     = useState<SessionResult[]>([]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);

  // Countdown — runs while drilling
  useEffect(() => {
    if (phase !== "question" && phase !== "answer") return;
    const id = setInterval(() => setTimeLeft(t => Math.max(0, t - 1)), 1000);
    return () => clearInterval(id);
  }, [phase]);

  // Time-up
  useEffect(() => {
    if (timeLeft === 0 && (phase === "question" || phase === "answer")) {
      setPhase("complete");
    }
  }, [timeLeft, phase]);

  function buildPool(): AlgItem[] {
    let base: AlgItem[];
    if (setChoice === "OLL")       base = ollCases;
    else if (setChoice === "PLL")  base = pllCases;
    else if (setChoice === "F2L")  base = f2lCases;
    else                           base = [...ollCases, ...pllCases];

    if (focus === "weak") {
      const weak = base
        .filter(c => !!srsData[c.id])
        .sort((a, b) => srsData[a.id]!.easeFactor - srsData[b.id]!.easeFactor)
        .slice(0, 20);
      return weak.length >= 3 ? weak : base; // fallback if not enough data
    }
    return base;
  }

  function start() {
    const secs = duration * 60;
    setQueue(shuffle(buildPool()));
    setQueueIdx(0);
    setTimeLeft(secs);
    setTotalSecs(secs);
    setResults([]);
    setPhase("question");
  }

  function advance() {
    const next = queueIdx + 1;
    if (next >= queue.length) {
      setQueue(q => shuffle([...q]));
      setQueueIdx(0);
    } else {
      setQueueIdx(next);
    }
    setPhase("question");
  }

  function handleRate(rating: SRSRating) {
    const c = queue[queueIdx];
    if (!c) return;
    onRate(c.id, rating);
    setResults(r => [...r, { id: c.id, rating }]);
    advance();
  }

  const current = queue[queueIdx];
  const countByRating = (r: SRSRating) => results.filter(x => x.rating === r).length;
  const timerPct = totalSecs > 0 ? (timeLeft / totalSecs) * 100 : 100;
  const isWarning = timerPct < 20;

  return (
    <div className="drillOverlay" onClick={onClose}>
      <div className="drillModal" onClick={e => e.stopPropagation()}>
        <div className="drillHeader">
          <div className="drillHeaderTitle">Timed Block</div>
          <button className="close" type="button" onClick={onClose}>✕</button>
        </div>

        {/* ── Setup ─────────────────────────────────────── */}
        {phase === "setup" && (
          <div className="timedSetup">
            <div className="timedSetupGroup">
              <div className="timedSetupLabel">Duration</div>
              <div className="timedChips">
                {([3, 5, 10] as Duration[]).map(d => (
                  <button
                    key={d}
                    type="button"
                    className={`timedChip ${duration === d ? "timedChip--active" : ""}`}
                    onClick={() => setDuration(d)}
                  >
                    {d} min
                  </button>
                ))}
              </div>
            </div>

            <div className="timedSetupGroup">
              <div className="timedSetupLabel">Set</div>
              <div className="timedChips">
                {(["OLL", "PLL", "F2L", "mixed"] as SetChoice[]).map(s => (
                  <button
                    key={s}
                    type="button"
                    className={`timedChip ${setChoice === s ? "timedChip--active" : ""}`}
                    onClick={() => setSetChoice(s)}
                  >
                    {s === "mixed" ? "OLL + PLL" : s}
                  </button>
                ))}
              </div>
            </div>

            <div className="timedSetupGroup">
              <div className="timedSetupLabel">Focus</div>
              <div className="timedChips">
                <button
                  type="button"
                  className={`timedChip ${focus === "all" ? "timedChip--active" : ""}`}
                  onClick={() => setFocus("all")}
                >
                  All cases
                </button>
                <button
                  type="button"
                  className={`timedChip ${focus === "weak" ? "timedChip--active" : ""}`}
                  onClick={() => setFocus("weak")}
                >
                  Weak only
                </button>
              </div>
            </div>

            <button type="button" className="timedStartBtn" onClick={start}>
              Start {duration} min block →
            </button>
          </div>
        )}

        {/* ── Drilling ──────────────────────────────────── */}
        {(phase === "question" || phase === "answer") && current && (
          <>
            <div className="timedTimerRow">
              <span className={`timedTimerDisplay ${isWarning ? "timedTimerDisplay--warn" : ""}`}>
                {fmt(timeLeft)}
              </span>
              <div className="timedTimerBar">
                <div
                  className={`timedTimerFill ${isWarning ? "timedTimerFill--warn" : ""}`}
                  style={{ width: `${timerPct}%` }}
                />
              </div>
              <span className="drillProgressLabel">{results.length} done</span>
            </div>

            <div className="drillCard">
              <div className="drillThumbWrap">
                <MiniTwisty set={current.set} size={200} thumb={current.thumb} />
              </div>

              {phase === "question" ? (
                <div className="drillQuestion">
                  <p className="drillQuestionHint">Which {current.set} case is this?</p>
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
                  <div className="drillCaseName">{current.name}</div>
                  <div className="drillCaseId">
                    {current.id.replace(/^(oll|pll|f2l)_/, m => m.slice(0, -1).toUpperCase() + " ").toUpperCase()}
                  </div>
                  <code className="drillAlg">{preferredAlgs?.[current.id] ?? current.alg}</code>
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

        {/* ── Complete ──────────────────────────────────── */}
        {phase === "complete" && (
          <div className="drillComplete">
            <div className="drillCompleteIcon">⏱</div>
            <h2 className="drillCompleteTitle">Time's Up!</h2>
            <p className="drillCompleteLead">{results.length} cards reviewed in {duration} min</p>
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
        )}
      </div>
    </div>
  );
}
