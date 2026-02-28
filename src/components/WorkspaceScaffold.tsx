import React from "react";
import { NotationReference } from "./NotationReference";
import { TriggerLibrary } from "./TriggerLibrary";
import type { StreakData } from "../utils/streaks";

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

type DayForecast = { label: string; count: number; isToday: boolean };

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
  streaks: StreakData;
  reviewForecast: DayForecast[];
  onStartTodayQueue?: () => void;
  onStartDrill?: (set: "OLL" | "PLL" | "OLL_EXEC" | "PLL_EXEC" | "F2L") => void;
  onStartTimedBlock?: () => void;
  onStartScrambleTimer?: () => void;
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
  streaks,
  reviewForecast,
  onStartTodayQueue,
  onStartDrill,
  onStartTimedBlock,
  onStartScrambleTimer,
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
                <button
                  type="button"
                  className="drillSetBtn drillSetBtn--f2l"
                  onClick={() => onStartDrill?.("F2L")}
                  disabled={!onStartDrill}
                >
                  F2L
                </button>
              </div>
            </article>
            <article className="workspaceTile">
              <h3>Execution Drills</h3>
              <p>Recall and execute each algorithm from memory — then reveal to verify.</p>
              <div className="drillSetRow">
                <button
                  type="button"
                  className="drillSetBtn drillSetBtn--oll"
                  onClick={() => onStartDrill?.("OLL_EXEC")}
                  disabled={!onStartDrill}
                >
                  OLL
                </button>
                <button
                  type="button"
                  className="drillSetBtn drillSetBtn--pll"
                  onClick={() => onStartDrill?.("PLL_EXEC")}
                  disabled={!onStartDrill}
                >
                  PLL
                </button>
              </div>
            </article>
            <article className="workspaceTile">
              <h3>Timed Blocks</h3>
              <p>3 / 5 / 10 min sessions. Pick your set and focus — cases loop until time's up.</p>
              <button
                type="button"
                className="timedStartTileBtn"
                onClick={onStartTimedBlock}
                disabled={!onStartTimedBlock}
              >
                Start Block
              </button>
            </article>
            <article className="workspaceTile">
              <h3>Scramble & Timer</h3>
              <p>WCA scramble, 15s inspection, and hold-to-ready timer. Session history with ao5 and ao12.</p>
              <button
                type="button"
                className="timedStartTileBtn"
                onClick={onStartScrambleTimer}
                disabled={!onStartScrambleTimer}
              >
                Open Timer
              </button>
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

            <article className="workspaceTile phaseSnapshotTile">
              <h3 className="progressTileTitle">Phase Snapshot</h3>
              <div className="phaseList">
                {/* Cross — manual skill, no SRS */}
                <div className="phaseRow">
                  <span className="phaseLabel phaseLabel--cross">Cross</span>
                  <div className="phaseBarWrap">
                    <div className="phaseBar">
                      <div className="phaseBarFill phaseBarFill--cross" style={{ width: "100%" }} />
                    </div>
                  </div>
                  <span className="phaseFraction">Manual</span>
                  <span className="phaseReadiness phaseReadiness--foundation">Foundation</span>
                </div>
                {/* F2L — catalog coverage, no SRS yet */}
                <div className="phaseRow">
                  <span className="phaseLabel phaseLabel--f2l">F2L</span>
                  <div className="phaseBarWrap">
                    <div className="phaseBar">
                      <div
                        className="phaseBarFill phaseBarFill--f2l"
                        style={{ width: `${Math.round((totalF2LCaseCount / f2lCanonicalTotal) * 100)}%` }}
                      />
                    </div>
                  </div>
                  <span className="phaseFraction">{totalF2LCaseCount}/{f2lCanonicalTotal}</span>
                  <span className="phaseReadiness phaseReadiness--catalog">Catalog</span>
                </div>
                {/* OLL */}
                {(() => {
                  const pct = ollStats.total > 0 ? ollStats.learned / ollStats.total : 0;
                  const label = pct === 0 ? "Not started" : pct < 0.25 ? "Learning" : pct < 0.6 ? "Developing" : pct < 0.9 ? "Proficient" : "Mastered";
                  const mod = pct === 0 ? "none" : pct < 0.25 ? "learning" : pct < 0.6 ? "developing" : pct < 0.9 ? "proficient" : "mastered";
                  return (
                    <div className="phaseRow">
                      <span className="phaseLabel phaseLabel--oll">OLL</span>
                      <div className="phaseBarWrap">
                        <div className="phaseBar">
                          <div className="phaseBarFill phaseBarFill--oll" style={{ width: `${Math.round(pct * 100)}%` }} />
                        </div>
                      </div>
                      <span className="phaseFraction">{ollStats.learned}/{ollStats.total}</span>
                      <span className={`phaseReadiness phaseReadiness--${mod}`}>{label}</span>
                    </div>
                  );
                })()}
                {/* PLL */}
                {(() => {
                  const pct = pllStats.total > 0 ? pllStats.learned / pllStats.total : 0;
                  const label = pct === 0 ? "Not started" : pct < 0.25 ? "Learning" : pct < 0.6 ? "Developing" : pct < 0.9 ? "Proficient" : "Mastered";
                  const mod = pct === 0 ? "none" : pct < 0.25 ? "learning" : pct < 0.6 ? "developing" : pct < 0.9 ? "proficient" : "mastered";
                  return (
                    <div className="phaseRow">
                      <span className="phaseLabel phaseLabel--pll">PLL</span>
                      <div className="phaseBarWrap">
                        <div className="phaseBar">
                          <div className="phaseBarFill phaseBarFill--pll" style={{ width: `${Math.round(pct * 100)}%` }} />
                        </div>
                      </div>
                      <span className="phaseFraction">{pllStats.learned}/{pllStats.total}</span>
                      <span className={`phaseReadiness phaseReadiness--${mod}`}>{label}</span>
                    </div>
                  );
                })()}
              </div>
            </article>
            <article className="workspaceTile streakTile">
              <h3 className="progressTileTitle">Streaks</h3>
              {streaks.totalDays === 0 ? (
                <p className="progressEmpty">Complete your first review session to start tracking your streak.</p>
              ) : (
                <>
                  <div className="streakHeroRow">
                    <div className="streakHeroBlock">
                      <span className="streakHeroNum">{streaks.currentStreak}</span>
                      <span className="streakHeroLabel">day streak</span>
                    </div>
                    <div className="streakSecondary">
                      <div className="streakStatRow">
                        <span className="streakStatLabel">Longest</span>
                        <span className="streakStatVal">{streaks.longestStreak}d</span>
                      </div>
                      <div className="streakStatRow">
                        <span className="streakStatLabel">Total days</span>
                        <span className="streakStatVal">{streaks.totalDays}</span>
                      </div>
                    </div>
                  </div>
                  <div className="streakDots">
                    {Array.from({ length: 7 }, (_, i) => {
                      const d = new Date();
                      d.setDate(d.getDate() - (6 - i));
                      const dateStr = d.toISOString().slice(0, 10);
                      const todayDate = new Date().toISOString().slice(0, 10);
                      const isToday = dateStr === todayDate;
                      const active = streaks.recentDays.includes(dateStr);
                      const dayLabel = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"][d.getDay()];
                      return (
                        <div key={dateStr} className="streakDotCol">
                          <div className={`streakDot${active ? " streakDot--active" : ""}${isToday ? " streakDot--today" : ""}`} />
                          <span className={`streakDotLabel${isToday ? " streakDotLabel--today" : ""}`}>{dayLabel}</span>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </article>

            {/* Review Forecast */}
            <article className="workspaceTile forecastTile">
              <h3 className="progressTileTitle">Review Forecast</h3>
              {(() => {
                const maxCount = Math.max(...reviewForecast.map((d) => d.count), 1);
                const totalNext7 = reviewForecast.slice(1).reduce((s, d) => s + d.count, 0);
                return (
                  <>
                    <div className="forecastBars">
                      {reviewForecast.map((day, i) => (
                        <div key={i} className={`forecastBarCol${day.isToday ? " forecastBarCol--today" : ""}`}>
                          <span className="forecastBarCount">{day.count > 0 ? day.count : ""}</span>
                          <div className="forecastBarTrack">
                            <div
                              className={`forecastBarFill${day.isToday ? " forecastBarFill--today" : ""}`}
                              style={{ height: `${Math.max(2, (day.count / maxCount) * 100)}%` }}
                            />
                          </div>
                          <span className="forecastBarLabel">{day.label}</span>
                        </div>
                      ))}
                    </div>
                    <p className="forecastNote">
                      {totalNext7 > 0
                        ? `${totalNext7} card${totalNext7 === 1 ? "" : "s"} due in the next 6 days`
                        : "No upcoming reviews scheduled"}
                    </p>
                  </>
                );
              })()}
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

        <TriggerLibrary />

        <div className="workspaceSectionGrid">
          <article className="workspaceTile">
            <h3>Fingertricks</h3>
            <p>OH and two-handed execution notes by trigger/case family.</p>
            <span className="workspaceTileMeta">Planned</span>
          </article>
          <article className="workspaceTile">
            <h3>Method Notes</h3>
            <p>CFOP heuristics now, plus room for OH/BLD/other methods later.</p>
            <span className="workspaceTileMeta">Planned</span>
          </article>
        </div>
      </section>
    </div>
  );
}
