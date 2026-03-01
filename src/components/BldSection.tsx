import React, { useState } from "react";
import type { SRSCard, SRSRating } from "../utils/srs";
import { isDue, getSRSCard } from "../utils/srs";
import { SPEFFZ_EDGES, SPEFFZ_CORNERS, Y_PERM, type BldTarget } from "../data/bld-data";
import { BldDrillModal } from "./BldDrillModal";

type Props = {
  bldSrsData: Record<string, SRSCard>;
  onRate: (id: string, rating: SRSRating) => void;
};

function dueCount(targets: BldTarget[], srsData: Record<string, SRSCard>): number {
  return targets.filter(
    (t) => !t.isBuffer && (!srsData[t.id] || isDue(getSRSCard(t.id, srsData)))
  ).length;
}

function statusOf(t: BldTarget, srsData: Record<string, SRSCard>): "new" | "due" | "learned" {
  if (!srsData[t.id]) return "new";
  return isDue(getSRSCard(t.id, srsData)) ? "due" : "learned";
}

// ── Reference tables (toggled from landing) ───────────────────────────────────

function ReferenceSection({ srsData }: { srsData: Record<string, SRSCard> }) {
  return (
    <section className="workspaceSectionCard workspaceSectionCard--bld bldRefSection">
      <div className="workspaceSectionKicker">Speffz Reference</div>

      <h3 className="workspaceSectionTitle" style={{ fontSize: 18, marginTop: 0 }}>
        M2 Edges
      </h3>
      <p className="workspaceSectionLead" style={{ marginTop: 4 }}>
        Buffer: <strong>UF (letter C)</strong>. Each alg = setup · M2 · undo setup.
        Letters C and I are the same piece (the buffer) — skipped automatically in drills.
      </p>
      <div className="bldTableScroll">
        <table className="bldTable">
          <thead>
            <tr>
              <th>Letter</th>
              <th>Position</th>
              <th>Setup</th>
              <th>Full Alg</th>
              <th>SRS</th>
            </tr>
          </thead>
          <tbody>
            {SPEFFZ_EDGES.map((t) => (
              <tr key={t.id} className={t.isBuffer ? "bldTableRowBuffer" : ""}>
                <td className="bldTableLetter">{t.letter}</td>
                <td className="bldTablePos">{t.position}</td>
                <td>
                  {t.isBuffer ? (
                    <em className="bldTableMuted">buffer</em>
                  ) : t.setupAlg ? (
                    <code className="bldTableAlg">{t.setupAlg}</code>
                  ) : (
                    <em className="bldTableMuted">—</em>
                  )}
                </td>
                <td>
                  {t.isBuffer ? (
                    <em className="bldTableMuted">skip</em>
                  ) : (
                    <code className="bldTableAlg">{t.fullAlg}</code>
                  )}
                </td>
                <td>
                  {!t.isBuffer && (
                    <span className={`bldSrsStatus bldSrsStatus--${statusOf(t, srsData)}`}>
                      {statusOf(t, srsData)}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 className="workspaceSectionTitle" style={{ fontSize: 18, marginTop: 20 }}>
        OP Corners
      </h3>
      <p className="workspaceSectionLead" style={{ marginTop: 4 }}>
        Buffer: <strong>URF U-sticker (letter B)</strong>. Each alg = setup · Y-perm · undo setup.
        Letters B, H, and P are the three stickers of the buffer piece — skipped in drills.
      </p>
      <p className="workspaceSectionLead" style={{ marginTop: 4 }}>
        Y-perm: <code className="bldTableAlgInline">{Y_PERM}</code>
      </p>
      <div className="bldTableScroll">
        <table className="bldTable">
          <thead>
            <tr>
              <th>Letter</th>
              <th>Position</th>
              <th>Setup</th>
              <th>Full Alg</th>
              <th>SRS</th>
            </tr>
          </thead>
          <tbody>
            {SPEFFZ_CORNERS.map((t) => (
              <tr key={t.id} className={t.isBuffer ? "bldTableRowBuffer" : ""}>
                <td className="bldTableLetter">{t.letter}</td>
                <td className="bldTablePos">{t.position}</td>
                <td>
                  {t.isBuffer ? (
                    <em className="bldTableMuted">buffer</em>
                  ) : t.setupAlg ? (
                    <code className="bldTableAlg">{t.setupAlg}</code>
                  ) : (
                    <em className="bldTableMuted">—</em>
                  )}
                </td>
                <td>
                  {t.isBuffer ? (
                    <em className="bldTableMuted">skip</em>
                  ) : (
                    <code className="bldTableAlg">{t.fullAlg}</code>
                  )}
                </td>
                <td>
                  {!t.isBuffer && (
                    <span className={`bldSrsStatus bldSrsStatus--${statusOf(t, srsData)}`}>
                      {statusOf(t, srsData)}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="bldTableFootnote">
        Corner setups use the Y-perm as the base commutator.
        Verify algs against your preferred reference while you're learning them.
      </p>
    </section>
  );
}

// ── Landing page ──────────────────────────────────────────────────────────────

export function BldSection({ bldSrsData, onRate }: Props) {
  const [openDrill, setOpenDrill] = useState<null | "edges" | "corners">(null);
  const [showRef, setShowRef] = useState(false);

  const edgeDue = dueCount(SPEFFZ_EDGES, bldSrsData);
  const cornerDue = dueCount(SPEFFZ_CORNERS, bldSrsData);

  return (
    <div className="workspaceSectionShell">
      <section className="workspaceSectionCard workspaceSectionCard--bld">
        <div className="workspaceSectionKicker">BLD · Speffz Scheme</div>
        <h2 className="workspaceSectionTitle">Blindfolded Training</h2>
        <p className="workspaceSectionLead">
          M2 edges and Old Pochmann corners. Each sticker on the cube gets a unique letter (A–X)
          in the Speffz scheme — the drills build your algorithm recall for each position.
        </p>
        <p className="bldBufferNote">
          Edge buffer: <strong>UF → C</strong>
          <span className="bldBufferSep">·</span>
          Corner buffer: <strong>URF → B</strong>
        </p>

        <div className="workspaceSectionGrid">

          {/* M2 Edges drill tile */}
          <article
            className={`workspaceTile todayQueueTile ${edgeDue > 0 ? "todayQueueTile--due" : ""}`}
          >
            <h3 className="todayQueueTitle">M2 Edges</h3>
            <p>Flashcards for all 22 edge positions. See the letter — recall the setup alg — reveal and rate your confidence.</p>
            {edgeDue === 0 ? (
              <div className="todayQueueDone">
                <span className="todayQueueDoneIcon">✓</span>
                <span className="todayQueueDoneText">All caught up!</span>
                <span className="todayQueueDoneSub">No edge positions due today</span>
              </div>
            ) : (
              <div className="todayQueueHero">
                <span className="todayQueueCount">{edgeDue}</span>
                <span className="todayQueueCountLabel">positions due</span>
              </div>
            )}
            <button
              type="button"
              className="todayQueueCTA"
              onClick={() => setOpenDrill("edges")}
            >
              Start Edge Drill →
            </button>
          </article>

          {/* OP Corners drill tile */}
          <article
            className={`workspaceTile todayQueueTile ${cornerDue > 0 ? "todayQueueTile--due" : ""}`}
          >
            <h3 className="todayQueueTitle">OP Corners</h3>
            <p>Flashcards for all 21 corner positions. See the letter — recall the Y-perm setup — reveal and rate.</p>
            {cornerDue === 0 ? (
              <div className="todayQueueDone">
                <span className="todayQueueDoneIcon">✓</span>
                <span className="todayQueueDoneText">All caught up!</span>
                <span className="todayQueueDoneSub">No corner positions due today</span>
              </div>
            ) : (
              <div className="todayQueueHero">
                <span className="todayQueueCount">{cornerDue}</span>
                <span className="todayQueueCountLabel">positions due</span>
              </div>
            )}
            <button
              type="button"
              className="todayQueueCTA"
              onClick={() => setOpenDrill("corners")}
            >
              Start Corner Drill →
            </button>
          </article>

          {/* How it works tile */}
          <article className="workspaceTile">
            <h3>New to BLD?</h3>
            <p>
              Each sticker on the cube has a letter (A–X). To solve blindfolded: memorise which
              letter goes where, close your eyes, and execute one algorithm per piece.
              The buffer piece (UF for edges, URF for corners) acts as the anchor — M2 or
              Y-perm cycles it against each target.
            </p>
          </article>

          {/* Reference tile */}
          <article className="workspaceTile">
            <h3>Algorithm Reference</h3>
            <p>Full list of all 24 edge and corner positions with their Speffz letter, setup move, and complete alg. Handy until you have them memorised.</p>
            <button
              type="button"
              className="timedStartTileBtn"
              onClick={() => setShowRef((v) => !v)}
            >
              {showRef ? "Hide Reference" : "Show M2 / OP Table"}
            </button>
          </article>

        </div>
      </section>

      {showRef && <ReferenceSection srsData={bldSrsData} />}

      {openDrill === "edges" && (
        <BldDrillModal
          targets={SPEFFZ_EDGES}
          label="Edges (M2)"
          bldSrsData={bldSrsData}
          onRate={onRate}
          onClose={() => setOpenDrill(null)}
        />
      )}

      {openDrill === "corners" && (
        <BldDrillModal
          targets={SPEFFZ_CORNERS}
          label="Corners (OP)"
          bldSrsData={bldSrsData}
          onRate={onRate}
          onClose={() => setOpenDrill(null)}
        />
      )}
    </div>
  );
}
