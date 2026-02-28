import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  loadTimer,
  saveTimer,
  addSolve,
  effectiveTime,
  ao,
  fmtTime,
  generateScramble,
} from "../utils/timer";
import type { Penalty, Solve, TimerData } from "../utils/timer";

type Phase = "idle" | "holding" | "ready" | "inspection" | "solving" | "result";

type Props = {
  onClose: () => void;
};

export function ScrambleTimerModal({ onClose }: Props) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [scramble, setScramble] = useState<string>("");
  const [startTime, setStartTime] = useState<number>(0);
  const [elapsed, setElapsed] = useState<number>(0);
  const [inspLeft, setInspLeft] = useState<number>(15);
  const [penalty, setPenalty] = useState<Penalty>(null);
  const [timerData, setTimerData] = useState<TimerData>(() => loadTimer());
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const phaseRef = useRef<Phase>("idle");
  const startTimeRef = useRef<number>(0);
  const inspEnabledRef = useRef(timerData.inspectionEnabled);

  // Keep refs in sync
  phaseRef.current = phase;
  startTimeRef.current = startTime;
  inspEnabledRef.current = timerData.inspectionEnabled;

  // Generate initial scramble
  useEffect(() => {
    setScramble(generateScramble());
  }, []);

  // Timer interval (10ms)
  useEffect(() => {
    if (phase !== "solving") return;
    const id = setInterval(() => setElapsed(Date.now() - startTime), 10);
    return () => clearInterval(id);
  }, [phase, startTime]);

  // Inspection countdown (1s)
  useEffect(() => {
    if (phase !== "inspection") return;
    const id = setInterval(() => {
      setInspLeft((t) => {
        if (t <= 1) {
          const now = Date.now();
          setPhase("solving");
          setStartTime(now);
          startTimeRef.current = now;
          return 15;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [phase]);

  const stopTimer = useCallback(() => {
    const t = Date.now() - startTimeRef.current;
    setElapsed(t);
    setPhase("result");
    setPenalty(null);
  }, []);

  const generateNextScramble = useCallback(() => {
    setScramble(generateScramble());
  }, []);

  const confirmSolve = useCallback(
    (pen: Penalty) => {
      const solve: Solve = {
        time: elapsed,
        scramble,
        date: new Date().toISOString(),
        penalty: pen,
      };
      const next = addSolve(timerData, solve);
      setTimerData(next);
      saveTimer(next);
      generateNextScramble();
      setPhase("idle");
      setElapsed(0);
      setPenalty(null);
    },
    [elapsed, scramble, timerData, generateNextScramble]
  );

  // Keyboard hold-to-ready
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== "Space" || e.repeat) return;
      e.preventDefault();
      const cur = phaseRef.current;
      if (cur === "idle" || cur === "result") {
        setPhase("holding");
        holdTimer.current = setTimeout(() => setPhase("ready"), 500);
      } else if (cur === "solving") {
        stopTimer();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code !== "Space") return;
      e.preventDefault();
      const cur = phaseRef.current;
      if (cur === "holding") {
        if (holdTimer.current) clearTimeout(holdTimer.current);
        setPhase("idle");
      } else if (cur === "ready") {
        if (inspEnabledRef.current) {
          setPhase("inspection");
          setInspLeft(15);
        } else {
          const now = Date.now();
          setPhase("solving");
          setStartTime(now);
          startTimeRef.current = now;
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [stopTimer]);

  // Touch hold-to-ready handlers for timer display
  const touchHoldTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const cur = phaseRef.current;
    if (cur === "idle" || cur === "result") {
      setPhase("holding");
      touchHoldTimer.current = setTimeout(() => setPhase("ready"), 500);
    } else if (cur === "solving") {
      stopTimer();
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const cur = phaseRef.current;
    if (cur === "holding") {
      if (touchHoldTimer.current) clearTimeout(touchHoldTimer.current);
      setPhase("idle");
    } else if (cur === "ready") {
      if (inspEnabledRef.current) {
        setPhase("inspection");
        setInspLeft(15);
      } else {
        const now = Date.now();
        setPhase("solving");
        setStartTime(now);
        startTimeRef.current = now;
      }
    }
  };

  // Persist inspectionEnabled toggle
  const toggleInspection = () => {
    setTimerData((prev) => {
      const next = { ...prev, inspectionEnabled: !prev.inspectionEnabled };
      saveTimer(next);
      return next;
    });
  };

  // Derived stats
  const { solves } = timerData;
  const best = solves.length === 0
    ? null
    : solves.reduce<number | null>((acc, s) => {
        const t = effectiveTime(s);
        if (t === null) return acc;
        return acc === null || t < acc ? t : acc;
      }, null);
  const ao5 = ao(solves, 5);
  const ao12 = ao(solves, 12);

  // Timer display modifier
  const timerMod =
    phase === "holding" ? "timerDisplay--holding"
    : phase === "ready" ? "timerDisplay--ready"
    : phase === "solving" ? "timerDisplay--solving"
    : phase === "result" ? "timerDisplay--result"
    : phase === "inspection" ? "timerDisplay--inspection"
    : "";

  const isSolving = phase === "solving";
  const isResult = phase === "result";

  // Display value
  let displayValue: string;
  if (phase === "inspection") {
    displayValue = String(inspLeft);
  } else if (phase === "idle" || (phase === "holding") || phase === "ready") {
    displayValue = "0:00.00";
  } else {
    const t = isResult && penalty === "+2" ? elapsed + 2000 : elapsed;
    displayValue = fmtTime(t);
  }

  return (
    <div className="scrambleTimerOverlay" role="dialog" aria-modal="true">
      <div className="scrambleTimerModal">
        {/* Header */}
        <div className="scrambleTimerHeader">
          <span className="scrambleTimerHeaderTitle">Scramble & Timer</span>
          <button className="scrambleTimerClose" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {/* Body */}
        <div className={`scrambleTimerBody${isSolving ? " scrambleTimerBody--solving" : ""}`}>
          {/* Main panel */}
          <div className="scrambleMain">
            {!isSolving && (
              <div className="scrambleTextWrap">
                <p className="scrambleText">{scramble || "Generating…"}</p>
              </div>
            )}

            {/* Timer display — touch target */}
            <div
              className={`timerDisplay ${timerMod}`}
              onPointerDown={onPointerDown}
              onPointerUp={onPointerUp}
              style={{ touchAction: "none", userSelect: "none" }}
            >
              {displayValue}
            </div>

            {/* Hint text */}
            {!isSolving && !isResult && (
              <p className="timerHint">
                {phase === "idle" && "Hold Space (or hold here) to ready"}
                {phase === "holding" && "Hold…"}
                {phase === "ready" && "Release to start"}
                {phase === "inspection" && `Inspection: ${inspLeft}s`}
              </p>
            )}

            {/* Result actions */}
            {isResult && (
              <div className="timerPenaltyRow">
                <button
                  className={`timerPenaltyBtn${penalty === "+2" ? " timerPenaltyBtn--active" : ""}`}
                  onClick={() => setPenalty(prev => prev === "+2" ? null : "+2")}
                >+2</button>
                <button
                  className={`timerPenaltyBtn${penalty === "DNF" ? " timerPenaltyBtn--active" : ""}`}
                  onClick={() => setPenalty(prev => prev === "DNF" ? null : "DNF")}
                >DNF</button>
                <button
                  className="timerNextBtn"
                  onClick={() => confirmSolve(penalty)}
                >Next →</button>
              </div>
            )}

            {/* Inspection toggle */}
            {!isSolving && (
              <button className="timerInspToggle" onClick={toggleInspection}>
                Inspection: {timerData.inspectionEnabled ? "ON" : "OFF"}
              </button>
            )}
          </div>

          {/* Session sidebar */}
          {!isSolving && (
            <aside className="timerSidebar">
              <div className="timerStatRow">
                <div className="timerStat">
                  <span className="timerStatLabel">Best</span>
                  <span className="timerStatVal">{best !== null ? fmtTime(best) : "—"}</span>
                </div>
                <div className="timerStat">
                  <span className="timerStatLabel">ao5</span>
                  <span className="timerStatVal">{ao5 !== null ? fmtTime(ao5) : "—"}</span>
                </div>
                <div className="timerStat">
                  <span className="timerStatLabel">ao12</span>
                  <span className="timerStatVal">{ao12 !== null ? fmtTime(ao12) : "—"}</span>
                </div>
              </div>

              <div className="timerSolveList">
                {solves.length === 0 ? (
                  <p className="timerSolveEmpty">No solves yet this session.</p>
                ) : (
                  solves.slice(0, 20).map((s, i) => {
                    const t = effectiveTime(s);
                    return (
                      <div key={s.date + i} className="timerSolveRow">
                        <span className="timerSolveIdx">{i + 1}.</span>
                        <span className="timerSolveTime">
                          {s.penalty === "DNF" ? "DNF" : t !== null ? fmtTime(t) : "—"}
                          {s.penalty === "+2" && <span className="timerSolvePenalty"> +2</span>}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}
