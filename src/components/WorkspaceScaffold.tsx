import React from "react";
import { NotationReference } from "./NotationReference";

type AppSection = "practice" | "progress" | "reference";

type Props = {
  appSection: AppSection;
  activePrimaryLabel: string;
  totalF2LCaseCount: number;
  f2lCanonicalTotal: number;
  ollCount: number;
  pllCount: number;
  ollDueCount: number;
  pllDueCount: number;
  onStartTodayQueue?: () => void;
  onStartDrill?: (set: "OLL" | "PLL") => void;
};

export function WorkspaceScaffold({
  appSection,
  activePrimaryLabel,
  totalF2LCaseCount,
  f2lCanonicalTotal,
  ollCount,
  pllCount,
  ollDueCount,
  pllDueCount,
  onStartTodayQueue,
  onStartDrill,
}: Props) {
  if (appSection === "practice") {
    return (
      <div className="workspaceSectionShell">
        <section className="workspaceSectionCard workspaceSectionCard--warm">
          <div className="workspaceSectionKicker">Practice</div>
          <h2 className="workspaceSectionTitle">Session Modes (v1 scaffold)</h2>
          <p className="workspaceSectionLead">
            Keep practice flows separate from the canonical library. Start here once the SRS and
            drill engines are wired.
          </p>
          <div className="workspaceSectionGrid">
            <article className={`workspaceTile todayQueueTile ${ollDueCount + pllDueCount === 0 ? "todayQueueTile--empty" : "todayQueueTile--due"}`}>
              <h3 className="todayQueueTitle">Today Queue</h3>
              {ollDueCount + pllDueCount === 0 ? (
                <div className="todayQueueDone">
                  <span className="todayQueueDoneIcon">✓</span>
                  <span className="todayQueueDoneText">All caught up!</span>
                  <span className="todayQueueDoneSub">No cards due today</span>
                </div>
              ) : (
                <>
                  <div className="todayQueueHero">
                    <span className="todayQueueCount">{ollDueCount + pllDueCount}</span>
                    <span className="todayQueueCountLabel">cards due</span>
                  </div>
                  <div className="todayQueueBreakdown">
                    <span className="todayQueueBreakdownItem todayQueueBreakdownItem--oll">
                      OLL <strong>{ollDueCount}</strong>
                    </span>
                    <span className="todayQueueBreakdownDot">·</span>
                    <span className="todayQueueBreakdownItem todayQueueBreakdownItem--pll">
                      PLL <strong>{pllDueCount}</strong>
                    </span>
                  </div>
                  <button
                    type="button"
                    className="todayQueueCTA"
                    onClick={onStartTodayQueue}
                    disabled={!onStartTodayQueue}
                  >
                    Start Review →
                  </button>
                </>
              )}
            </article>
            <article className="workspaceTile">
              <h3>Recognition Drills</h3>
              <p>Case-only identification with reveal and confidence rating.</p>
              <div className="drillSetRow">
                <button
                  type="button"
                  className="drillSetBtn drillSetBtn--oll"
                  onClick={() => onStartDrill?.("OLL")}
                  disabled={!onStartDrill}
                >
                  OLL
                </button>
                <button
                  type="button"
                  className="drillSetBtn drillSetBtn--pll"
                  onClick={() => onStartDrill?.("PLL")}
                  disabled={!onStartDrill}
                >
                  PLL
                </button>
              </div>
            </article>
            <article className="workspaceTile">
              <h3>Execution Drills</h3>
              <p>Algorithm playback, timer, and fingertrick notes by case.</p>
              <span className="workspaceTileMeta">Twisty viewer ready</span>
            </article>
            <article className="workspaceTile">
              <h3>Timed Blocks</h3>
              <p>Short sessions (5/10/15 min) focused on weak subsets.</p>
              <span className="workspaceTileMeta">Planned</span>
            </article>
          </div>
        </section>
      </div>
    );
  }

  if (appSection === "progress") {
    return (
      <div className="workspaceSectionShell">
        <section className="workspaceSectionCard workspaceSectionCard--cool">
          <div className="workspaceSectionKicker">Progress</div>
          <h2 className="workspaceSectionTitle">Coverage & Confidence (v1 scaffold)</h2>
          <p className="workspaceSectionLead">
            A dedicated view for what is learned, what is weak, and what should be reviewed next.
          </p>
          <div className="workspaceSectionGrid">
            <article className="workspaceTile">
              <h3>Coverage</h3>
              <p>
                F2L canonical loaded: {totalF2LCaseCount}/{f2lCanonicalTotal}
              </p>
              <p>
                OLL: {ollCount}/57 · PLL: {pllCount}/21
              </p>
            </article>
            <article className="workspaceTile">
              <h3>Weak Cases</h3>
              <p>Future list ranked by misses, hesitation, or SRS difficulty.</p>
              <span className="workspaceTileMeta">Derived from Practice</span>
            </article>
            <article className="workspaceTile">
              <h3>Phase Snapshot</h3>
              <p>Cross / F2L / LL readiness indicators and consistency trends.</p>
              <span className="workspaceTileMeta">Planned</span>
            </article>
            <article className="workspaceTile">
              <h3>Streaks</h3>
              <p>Practice streaks, review completion, and recovery after breaks.</p>
              <span className="workspaceTileMeta">Planned</span>
            </article>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="workspaceSectionShell">
      <section className="workspaceSectionCard workspaceSectionCard--neutral">
        <div className="workspaceSectionKicker">{activePrimaryLabel}</div>
        <h2 className="workspaceSectionTitle">Reference</h2>
        <p className="workspaceSectionLead">
          Notation, triggers, fingertricks, and method notes for quick lookup.
        </p>

        <NotationReference />

        <div className="workspaceSectionGrid">
          <article className="workspaceTile">
            <h3>Trigger Library</h3>
            <p>Sexy, sledge, hedge, antisune families and when they appear.</p>
          </article>
          <article className="workspaceTile">
            <h3>Fingertricks</h3>
            <p>OH and two-handed execution notes by trigger/case family.</p>
          </article>
          <article className="workspaceTile">
            <h3>Method Notes</h3>
            <p>CFOP heuristics now, plus room for OH/BLD/other methods later.</p>
          </article>
        </div>
      </section>
    </div>
  );
}
