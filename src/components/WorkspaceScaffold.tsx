import React from "react";
import { NotationReference } from "./NotationReference";

type AppSection = "practice" | "progress" | "reference";

type SRSStats = {
  new: number;
  due: number;
  learning: number;
  learned: number;
  total: number;
};

type WeakCase = {
  id: string;
  label: string;
  set: "OLL" | "PLL";
  easeFactor: number;
  reps: number;
};

type Props = {
  appSection: AppSection;
  activePrimaryLabel: string;
  totalF2LCaseCount: number;
  f2lCanonicalTotal: number;
  ollCount: number;
  pllCount: number;
  ollDueCount: number;
  pllDueCount: number;
  ollStats: SRSStats;
  pllStats: SRSStats;
  weakCases: WeakCase[];
  onStartTodayQueue?: () => void;
  onStartDrill?: (set: "OLL" | "PLL") => void;
};

function SRSBar({ stats }: { stats: SRSStats }) {
  const { new: newCount, due, learning, learned, total } = stats;
  const pct = (n: number) => `${((n / total) * 100).toFixed(1)}%`;
  return (
    <div className="srsBarWrap">
      <div className="srsBar">
        {learned > 0 && <div className="srsBarSeg srsBarSeg--learned" style={{ width: pct(learned) }} />}
        {learning > 0 && <div className="srsBarSeg srsBarSeg--learning" style={{ width: pct(learning) }} />}
        {due > 0 && <div className="srsBarSeg srsBarSeg--due" style={{ width: pct(due) }} />}
        {newCount > 0 && <div className="srsBarSeg srsBarSeg--new" style={{ width: pct(newCount) }} />}
      </div>
      <div className="srsLegend">
        {learned > 0 && <span className="srsLegendItem srsLegendItem--learned"><span className="srsLegendDot" />Learned <strong>{learned}</strong></span>}
        {learning > 0 && <span className="srsLegendItem srsLegendItem--learning"><span className="srsLegendDot" />Learning <strong>{learning}</strong></span>}
        {due > 0 && <span className="srsLegendItem srsLegendItem--due"><span className="srsLegendDot" />Due <strong>{due}</strong></span>}
        <span className="srsLegendItem srsLegendItem--new"><span className="srsLegendDot" />New <strong>{newCount}</strong></span>
      </div>
    </div>
  );
}

export function WorkspaceScaffold({
  appSection,
  activePrimaryLabel,
  totalF2LCaseCount,
  f2lCanonicalTotal,
  ollCount,
  pllCount,
  ollDueCount,
  pllDueCount,
  ollStats,
  pllStats,
  weakCases,
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
    const totalSeen = ollStats.learned + ollStats.learning + ollStats.due +
                      pllStats.learned + pllStats.learning + pllStats.due;
    return (
      <div className="workspaceSectionShell">
        <section className="workspaceSectionCard workspaceSectionCard--cool">
          <div className="workspaceSectionKicker">Progress</div>
          <h2 className="workspaceSectionTitle">Coverage & Confidence</h2>
          <p className="workspaceSectionLead">
            What you've learned, what's due, and where to focus next.
          </p>
          <div className="workspaceSectionGrid">

            {/* SRS Coverage */}
            <article className="workspaceTile progressCoverageTile">
              <h3 className="progressTileTitle">SRS Coverage</h3>
              <div className="progressSetRow">
                <div className="progressSetLabel">
                  <span className="progressSetName">OLL</span>
                  <span className="progressSetCount">{ollCount}/57</span>
                </div>
                <SRSBar stats={ollStats} />
              </div>
              <div className="progressSetRow">
                <div className="progressSetLabel">
                  <span className="progressSetName">PLL</span>
                  <span className="progressSetCount">{pllCount}/21</span>
                </div>
                <SRSBar stats={pllStats} />
              </div>
              <div className="progressCatalogNote">
                F2L: {totalF2LCaseCount}/{f2lCanonicalTotal} cases loaded
              </div>
            </article>

            {/* Weak Cases */}
            <article className="workspaceTile">
              <h3 className="progressTileTitle">Weak Cases</h3>
              {weakCases.length === 0 ? (
                <p className="progressEmpty">Practice some drills to see your weakest cases here.</p>
              ) : (
                <div className="weakCaseList">
                  {weakCases.map((c) => (
                    <div key={c.id} className="weakCaseRow">
                      <span className={`weakCaseSet weakCaseSet--${c.set.toLowerCase()}`}>{c.set}</span>
                      <span className="weakCaseLabel">{c.label}</span>
                      <span className="weakCaseEF">EF {c.easeFactor.toFixed(2)}</span>
                      <span className="weakCaseReps">×{c.reps}</span>
                    </div>
                  ))}
                </div>
              )}
              {weakCases.length > 0 && totalSeen > 0 && (
                <span className="workspaceTileMeta">{weakCases.length} of {totalSeen} seen cases</span>
              )}
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
