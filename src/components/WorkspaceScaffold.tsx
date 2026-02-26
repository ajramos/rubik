import React from "react";

type AppSection = "practice" | "progress" | "reference";

type Props = {
  appSection: AppSection;
  activePrimaryLabel: string;
  totalF2LCaseCount: number;
  f2lCanonicalTotal: number;
  ollCount: number;
  pllCount: number;
  onStartDrill?: (set: "OLL" | "PLL") => void;
};

export function WorkspaceScaffold({
  appSection,
  activePrimaryLabel,
  totalF2LCaseCount,
  f2lCanonicalTotal,
  ollCount,
  pllCount,
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
            <article className="workspaceTile">
              <h3>Today Queue</h3>
              <p>Daily SRS cases due across F2L, OLL, and PLL.</p>
              <span className="workspaceTileMeta">Next: localStorage queue</span>
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
        <h2 className="workspaceSectionTitle">Notes & Quick Reference (v1 scaffold)</h2>
        <p className="workspaceSectionLead">
          Keep durable reference material here so the Study catalog stays focused on cases.
        </p>
        <div className="workspaceSectionGrid">
          <article className="workspaceTile">
            <h3>Notation & Rotations</h3>
            <p>Standard move notation, wide turns, slices, and cube rotations.</p>
          </article>
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
