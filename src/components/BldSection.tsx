import React, { useState } from "react";
import type { SRSCard, SRSRating } from "../utils/srs";
import { isDue, getSRSCard } from "../utils/srs";
import { SPEFFZ_EDGES, SPEFFZ_CORNERS, Y_PERM, type BldTarget } from "../data/bld-data";
import { BldDrillModal } from "./BldDrillModal";
import { SpeffzNet } from "./SpeffzNet";
import type { CubeScheme } from "../utils/faceColors";
import { getFaceScheme } from "../utils/faceColors";

type Props = {
  bldSrsData: Record<string, SRSCard>;
  cubeScheme: CubeScheme;
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

const FACE_ORDER = ["U", "L", "F", "R", "B", "D"] as const;

function groupByFace(targets: BldTarget[]) {
  const groups: Record<string, BldTarget[]> = {};
  for (const face of FACE_ORDER) groups[face] = [];
  for (const t of targets) {
    const face = t.position[0];
    if (face && groups[face]) groups[face].push(t);
  }
  return groups;
}

// ── Grouped reference ─────────────────────────────────────────────────────────

function FaceGroup({
  face,
  targets,
  srsData,
  type,
  scheme,
}: {
  face: string;
  targets: BldTarget[];
  srsData: Record<string, SRSCard>;
  type: "edge" | "corner";
  scheme: ReturnType<typeof getFaceScheme>;
}) {
  const meta = scheme[face] ?? { bg: "#6b7280", text: "#fff", label: face };
  if (targets.length === 0) return null;

  return (
    <div className="bldFaceGroup">
      <div className="bldFaceGroupHeader" style={{ background: meta.bg, color: meta.text }}>
        {meta.label}
        <span className="bldFaceGroupCount">{targets.filter((t) => !t.isBuffer).length} positions</span>
      </div>
      <div className="bldFaceGroupBody">
        {targets.map((t) => {
          const faceName = t.faceName.replace(/ \([A-Z] sticker\)$/, "");
          return (
            <div key={t.id} className={`bldRefRow ${t.isBuffer ? "bldRefRow--buffer" : ""}`}>
              <span className="bldRefLetter" style={{ color: t.isBuffer ? "var(--muted-2)" : meta.bg }}>
                {t.letter}
              </span>
              <span className="bldRefPos">{t.position}</span>
              <span className="bldRefFaceName">{faceName}</span>
              <span className="bldRefSetup">
                {t.isBuffer ? (
                  <em className="bldTableMuted">buffer</em>
                ) : t.setupAlg ? (
                  <code className="bldTableAlg">{t.setupAlg}</code>
                ) : type === "edge" ? (
                  <code className="bldTableAlg">— direct</code>
                ) : (
                  <em className="bldTableMuted">no setup</em>
                )}
              </span>
              <span className="bldRefSrs">
                {!t.isBuffer && (
                  <span
                    className={`bldSrsDot bldSrsDot--${statusOf(t, srsData)}`}
                    title={statusOf(t, srsData)}
                  />
                )}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ReferenceSection({ srsData, cubeScheme }: { srsData: Record<string, SRSCard>; cubeScheme: CubeScheme }) {
  const [tab, setTab] = useState<"edges" | "corners">("edges");
  const edgeGroups = groupByFace(SPEFFZ_EDGES);
  const cornerGroups = groupByFace(SPEFFZ_CORNERS);
  const scheme = getFaceScheme(cubeScheme);

  return (
    <section className="workspaceSectionCard workspaceSectionCard--bld bldRefSection">
      <div className="workspaceSectionKicker">Speffz Reference</div>

      {/* Cube net */}
      <h3 className="workspaceSectionTitle" style={{ fontSize: 18, marginTop: 0 }}>
        Letter Mapping — Cube Net
      </h3>
      <p className="workspaceSectionLead" style={{ marginTop: 4, marginBottom: 12 }}>
        Every non-center sticker gets a unique letter A–X. Each face has 4 edge stickers
        and 4 corner stickers — the net below shows all 48 positions labeled. In this trainer,
        UF (C/I) and URF (B/H/P) are the buffer stickers and appear faded.
      </p>
      <SpeffzNet cubeScheme={cubeScheme} />

      {/* Y-perm reference */}
      <div className="bldYpermRef">
        <span className="bldYpermLabel">Y-perm (OP base commutator)</span>
        <code className="bldYpermCode">{Y_PERM}</code>
      </div>

      {/* Tab switcher */}
      <div className="bldRefTabs">
        <button
          type="button"
          className={`bldRefTab ${tab === "edges" ? "bldRefTab--active" : ""}`}
          onClick={() => setTab("edges")}
        >
          M2 Edges
          <span className="bldRefTabSub">buffer: C (UF)</span>
        </button>
        <button
          type="button"
          className={`bldRefTab ${tab === "corners" ? "bldRefTab--active" : ""}`}
          onClick={() => setTab("corners")}
        >
          OP Corners
          <span className="bldRefTabSub">buffer: B (URF)</span>
        </button>
      </div>

      {/* Face-grouped list */}
      <div className="bldFaceGroups">
        {FACE_ORDER.map((face) => (
          <FaceGroup
            key={face}
            face={face}
            targets={tab === "edges" ? edgeGroups[face] : cornerGroups[face]}
            srsData={srsData}
            type={tab === "edges" ? "edge" : "corner"}
            scheme={scheme}
          />
        ))}
      </div>

      {tab === "corners" && (
        <p className="bldTableFootnote">
          fullAlg = setup · Y-perm · undo(setup). Drill view shows each step separately.
        </p>
      )}
    </section>
  );
}

// ── Landing page ──────────────────────────────────────────────────────────────

export function BldSection({ bldSrsData, cubeScheme, onRate }: Props) {
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
          This module trains letter-to-algorithm recall for 3BLD using one fixed convention:
          M2 for edges + Old Pochmann for corners, with Speffz lettering (A-X).
        </p>
        <p className="bldBufferNote">
          Trainer convention: edge buffer piece <strong>UF (C/I)</strong>
          <span className="bldBufferSep">·</span>
          corner buffer piece <strong>URF (B/H/P)</strong>
        </p>
        <p className="bldConventionNote">
          If your tutorial uses a different corner buffer or lettering, that is normal.
          The core method is the same; only the letter map and setup list change.
          For example, the Ruwix OP tutorial uses a ULB corner buffer in its own convention.
        </p>

        <div className="workspaceSectionGrid">

          {/* M2 Edges drill tile */}
          <article
            className={`workspaceTile todayQueueTile ${edgeDue > 0 ? "todayQueueTile--due" : ""}`}
          >
            <h3 className="todayQueueTitle">M2 Edges</h3>
            <p>
              22 non-buffer targets. Read the letter, recall setup, execute
              <strong> setup · M2 · undo</strong>, then rate recall quality.
            </p>
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
            <p>
              21 non-buffer targets. Read the letter, recall setup, execute
              <strong> setup · Y-perm · undo</strong>, then rate recall quality.
            </p>
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

          {/* How it works */}
          <article className="workspaceTile bldGuideTile">
            <h3>How This M2/OP Setup Works</h3>
            <p className="bldGuideLead">
              Keep method and convention separate: method is the process, convention is the chosen
              buffer and letter map.
            </p>
            <img
              className="bldGuideImage"
              src="/bld-method-flow.svg"
              alt="Flow chart of memo and execution using setup plus M2 or Y-perm plus undo."
              loading="lazy"
            />
            <ol className="bldGuideSteps">
              <li>
                <strong>Memo:</strong> follow cycles from the buffer and convert targets into letters.
                Skip buffer stickers.
              </li>
              <li>
                <strong>Execute:</strong> for each edge letter do <strong>setup · M2 · undo</strong>;
                for each corner letter do <strong>setup · Y-perm · undo</strong>.
              </li>
              <li>
                <strong>Drill goal:</strong> instant letter-to-setup recall with clean execution and
                no hesitation.
              </li>
            </ol>
            <p className="bldGuideFootnote">
              Scope of this trainer: single-target recall. Full blind solves also involve memo order,
              cycle breaks, and parity handling.
            </p>
          </article>

          {/* Reference toggle */}
          <article className="workspaceTile">
            <h3>Algorithm Reference</h3>
            <p>
              Full Speffz net + face-grouped targets with letter, sticker position, setup, and SRS
              status.
            </p>
            <button
              type="button"
              className="timedStartTileBtn"
              onClick={() => setShowRef((v) => !v)}
            >
              {showRef ? "Hide Reference" : "Show Reference"}
            </button>
          </article>

        </div>
      </section>

      {showRef && <ReferenceSection srsData={bldSrsData} cubeScheme={cubeScheme} />}

      {openDrill === "edges" && (
        <BldDrillModal
          targets={SPEFFZ_EDGES}
          label="Edges (M2)"
          bldSrsData={bldSrsData}
          cubeScheme={cubeScheme}
          onRate={onRate}
          onClose={() => setOpenDrill(null)}
        />
      )}

      {openDrill === "corners" && (
        <BldDrillModal
          targets={SPEFFZ_CORNERS}
          label="Corners (OP)"
          bldSrsData={bldSrsData}
          cubeScheme={cubeScheme}
          onRate={onRate}
          onClose={() => setOpenDrill(null)}
        />
      )}
    </div>
  );
}
