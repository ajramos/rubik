import React from "react";

type AppSection = "home" | "study" | "practice" | "progress" | "reference";

type Props = {
  totalDueCount: number;
  currentStreak: number;
  ollLearned: number;
  ollTotal: number;
  pllLearned: number;
  pllTotal: number;
  onNavigate: (section: AppSection) => void;
  onStartTodayQueue?: () => void;
};

const NAV_CARDS: Array<{
  key: AppSection;
  label: string;
  desc: string;
  mod: string;
}> = [
  { key: "study",     label: "Study",     desc: "OLL, PLL, F2L algorithm catalog with 3D interactive viewer.", mod: "study" },
  { key: "practice",  label: "Practice",  desc: "SRS recognition & execution drills, timed blocks, scramble timer.", mod: "practice" },
  { key: "progress",  label: "Progress",  desc: "Coverage stats, weak cases, streak tracking and review forecast.", mod: "progress" },
  { key: "reference", label: "Reference", desc: "Notation guide, trigger library, fingertricks and method notes.", mod: "reference" },
];

export function HomeSection({
  totalDueCount,
  currentStreak,
  ollLearned,
  ollTotal,
  pllLearned,
  pllTotal,
  onNavigate,
  onStartTodayQueue,
}: Props) {
  const allCaughtUp = totalDueCount === 0;

  return (
    <div className="workspaceSectionShell">
      <section className="homeSection">

        {/* ── Today queue ── */}
        <div className={`homeQueueCard ${allCaughtUp ? "homeQueueCard--done" : "homeQueueCard--due"}`}>
          {allCaughtUp ? (
            <div className="homeQueueDone">
              <span className="homeQueueDoneIcon">✓</span>
              <div>
                <div className="homeQueueDoneTitle">All caught up!</div>
                <div className="homeQueueDoneSub">No cards due today — come back tomorrow.</div>
              </div>
            </div>
          ) : (
            <div className="homeQueueDue">
              <div className="homeQueueDueLeft">
                <span className="homeQueueCount">{totalDueCount}</span>
                <span className="homeQueueCountLabel">cards due today</span>
              </div>
              <button
                type="button"
                className="homeQueueCTA"
                onClick={onStartTodayQueue}
                disabled={!onStartTodayQueue}
              >
                Start Review →
              </button>
            </div>
          )}
        </div>

        {/* ── Section navigation cards ── */}
        <div className="homeNavGrid">
          {NAV_CARDS.map(({ key, label, desc, mod }) => (
            <button
              key={key}
              type="button"
              className={`homeNavCard homeNavCard--${mod}`}
              onClick={() => onNavigate(key)}
            >
              <div className="homeNavCardLabel">{label}</div>
              <div className="homeNavCardDesc">{desc}</div>
              <span className="homeNavCardArrow">→</span>
            </button>
          ))}
        </div>

        {/* ── Stats strip ── */}
        <div className="homeStatsStrip">
          {currentStreak > 0 && (
            <>
              <span className="homeStatItem homeStatItem--streak">
                🔥 {currentStreak}d streak
              </span>
              <span className="homeStatSep">·</span>
            </>
          )}
          <span className="homeStatItem">OLL {ollLearned}/{ollTotal}</span>
          <span className="homeStatSep">·</span>
          <span className="homeStatItem">PLL {pllLearned}/{pllTotal}</span>
        </div>

      </section>
    </div>
  );
}
