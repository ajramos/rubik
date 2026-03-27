import React, { useState } from "react";
import type { SRSCard, SRSRating } from "../utils/srs";
import { isDue, getSRSCard } from "../utils/srs";
import { SPEFFZ_EDGES, SPEFFZ_CORNERS, Y_PERM, type BldTarget } from "../data/bld-data";
import { BldDrillModal } from "./BldDrillModal";
import { SpeffzNet } from "./SpeffzNet";
import type { CubeScheme } from "../utils/faceColors";
import { getFaceScheme } from "../utils/faceColors";
import { KNOWN_TRIGGERS, detectTriggers, injectNamedTokens, splitNamedTokenSegments } from "../utils/triggers";

type Props = {
  bldSrsData: Record<string, SRSCard>;
  cubeScheme: CubeScheme;
  onRate: (id: string, rating: SRSRating) => void;
};

type BldMode = "beginner" | "advanced";
const M2_EDGE_PARITY = "(M' U' M' U' M' U2) (M U' M U' M U2)";

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

function DrillTile({
  title,
  description,
  due,
  doneSub,
  startLabel,
  onStart,
}: {
  title: string;
  description: React.ReactNode;
  due: number;
  doneSub: string;
  startLabel: string;
  onStart: () => void;
}) {
  return (
    <article className={`workspaceTile todayQueueTile ${due > 0 ? "todayQueueTile--due" : ""}`}>
      <h3 className="todayQueueTitle">{title}</h3>
      <p>{description}</p>
      {due === 0 ? (
        <div className="todayQueueDone">
          <span className="todayQueueDoneIcon">✓</span>
          <span className="todayQueueDoneText">All caught up!</span>
          <span className="todayQueueDoneSub">{doneSub}</span>
        </div>
      ) : (
        <div className="todayQueueHero">
          <span className="todayQueueCount">{due}</span>
          <span className="todayQueueCountLabel">positions due</span>
        </div>
      )}
      <button type="button" className="todayQueueCTA" onClick={onStart}>
        {startLabel}
      </button>
    </article>
  );
}

function ParityTile() {
  const parityTriggers = detectTriggers(M2_EDGE_PARITY);
  return (
    <article className="workspaceTile bldReferenceTile">
      <h3>Parity de aristas (M2)</h3>
      <p>
        Si el memo de aristas tiene longitud impar, añade esta corrección después de corners y
        antes de empezar edges.
      </p>
      <code className="bldYpermCode">{renderNamedTokens(injectNamedTokens(M2_EDGE_PARITY))}</code>
      {parityTriggers.length > 0 && (
        <div className="triggerChipRow bldYpermTriggers">
          {parityTriggers.map((t) => (
            <span key={t.name} className={`triggerChip triggerChip--${t.color}`} data-moves={t.moves}>
              {t.name}
            </span>
          ))}
        </div>
      )}
      <p className="bldGuideFootnote">
        Consejo: practícalo como bloque aislado para no perder ritmo durante la ejecución BLD.
      </p>
    </article>
  );
}

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
                  <code className="bldTableAlg">{renderNamedTokens(injectNamedTokens(t.setupAlg))}</code>
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
  const yPermTriggers = detectTriggers(Y_PERM);
  const triggerLegend = KNOWN_TRIGGERS.filter(
    (t) => t.name === "Sexy Move" || t.name === "Sledgehammer"
  );

  return (
    <section className="workspaceSectionCard workspaceSectionCard--bld bldRefSection">
      <div className="workspaceSectionKicker">Speffz Reference</div>

      {/* Cube net */}
      <h3 className="workspaceSectionTitle bldRefTitle">
        Letter Mapping — Cube Net
      </h3>
      <p className="workspaceSectionLead bldRefLead">
        Ruwix-style base idea: every non-center sticker has one letter (A-X). Read letters in
        sequence, then execute <strong>A-B-A&apos;</strong> for each target.
      </p>
      <p className="bldRefSubLead">
        Trainer convention here: edge buffer <strong>UF (C/I)</strong>, corner buffer <strong>URF (B/H/P)</strong>.
        Ruwix OP examples use a different buffer pair; method logic is still the same.
      </p>
      <SpeffzNet cubeScheme={cubeScheme} />

      {/* Y-perm reference */}
      <div className="bldYpermRef">
        <span className="bldYpermLabel">Y-perm (OP base commutator)</span>
        <code className="bldYpermCode">{renderNamedTokens(injectNamedTokens(Y_PERM))}</code>
      </div>
      {yPermTriggers.length > 0 && (
        <div className="triggerChipRow bldYpermTriggers">
          {yPermTriggers.map((t) => (
            <span key={t.name} className={`triggerChip triggerChip--${t.color}`} data-moves={t.moves}>
              {t.name}
            </span>
          ))}
        </div>
      )}
      <div className="bldTriggerLegend">
        <div className="bldTriggerLabel">Named Triggers Used In BLD</div>
        <div className="triggerChipRow">
          {triggerLegend.map((t) => (
            <span key={t.name} className={`triggerChip triggerChip--${t.color}`} data-moves={t.moves}>
              {t.name}
            </span>
          ))}
        </div>
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
  const [mode, setMode] = useState<BldMode>("beginner");
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
          {mode === "beginner"
            ? "Think of BLD as a simple game: read letters, do A-B-A', repeat."
            : "This module trains letter-to-algorithm recall for 3BLD using one fixed convention: M2 for edges + Old Pochmann for corners, with Speffz lettering (A-X)."}
        </p>
        <div className="bldModeSwitch" role="tablist" aria-label="BLD difficulty mode">
          <button
            type="button"
            role="tab"
            aria-selected={mode === "beginner"}
            className={`bldModeBtn ${mode === "beginner" ? "bldModeBtn--active" : ""}`}
            onClick={() => setMode("beginner")}
          >
            Simple (Ruwix)
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "advanced"}
            className={`bldModeBtn ${mode === "advanced" ? "bldModeBtn--active" : ""}`}
            onClick={() => setMode("advanced")}
          >
            Full View
          </button>
        </div>
        {mode === "beginner" ? (
          <p className="bldBufferNote">
            Keep one cube orientation and one buffer pair for the whole solve.
          </p>
        ) : (
          <p className="bldBufferNote">
            Trainer convention: edge buffer piece <strong>UF (C/I)</strong>
            <span className="bldBufferSep">·</span>
            corner buffer piece <strong>URF (B/H/P)</strong>
          </p>
        )}
        {mode === "advanced" && (
          <p className="bldConventionNote">
            If your tutorial uses a different corner buffer or lettering, that is normal.
            The core method is the same; only the letter map and setup list change.
            For example, the Ruwix OP tutorial uses a ULB corner buffer in its own convention.
          </p>
        )}

        {mode === "beginner" ? (
          <div className="workspaceSectionGrid bldBeginnerGrid">
            <article className="workspaceTile bldBeginnerSteps">
              <h3>1) One Formula Only: A-B-A&apos;</h3>
              <ol className="bldGuideSteps bldBeginnerStepsList">
                <li>A = setup moves (put target in the working slot).</li>
                <li>B = core swap move (M2 for edges, Y-perm for corners).</li>
                <li>A&apos; = undo setup exactly.</li>
              </ol>
              <p className="bldGuideFootnote">
                Say it aloud if needed: setup, core, undo.
              </p>
            </article>
            <DrillTile
              title="Start Here: M2 Edges"
              description={
                <>
                  First edge sticker letters, then execute <strong>setup → M2 → undo</strong> for each one.
                </>
              }
              due={edgeDue}
              doneSub="No edge positions due today"
              startLabel="Start Edge Drill →"
              onStart={() => setOpenDrill("edges")}
            />
            <DrillTile
              title="Then Add: OP Corners"
              description={
                <>
                  Same formula, different core: <strong>setup → Y-perm → undo</strong>.
                </>
              }
              due={cornerDue}
              doneSub="No corner positions due today"
              startLabel="Start Corner Drill →"
              onStart={() => setOpenDrill("corners")}
            />
            <article className="workspaceTile bldReferenceTile">
              <h3>2) Solve Order (Ruwix)</h3>
              <ol className="bldGuideSteps bldBeginnerStepsList">
                <li>Memo Edges</li>
                <li>Memo Corners</li>
                <li>Solve Corners</li>
                <li>Fix parity (if edge targets were odd)</li>
                <li>Solve Edges</li>
              </ol>
              <p className="bldGuideFootnote">
                This order keeps corner memo short and reduces overload.
              </p>
            </article>
            <ParityTile />
            <article className="workspaceTile bldReferenceTile">
              <h3>3) Letter Map (Only When Stuck)</h3>
              <p>
                Use the map to recover quickly, then go back to drilling. Speed comes from repetition.
              </p>
              <div className="bldBeginnerActions">
                <button
                  type="button"
                  className="timedStartTileBtn"
                  onClick={() => setShowRef((v) => !v)}
                >
                  {showRef ? "Hide Letter Map" : "Show Letter Map"}
                </button>
                <button
                  type="button"
                  className="timedStartTileBtn"
                  onClick={() => setMode("advanced")}
                >
                  Open Full View
                </button>
              </div>
            </article>
          </div>
        ) : (
          <div className="workspaceSectionGrid bldSectionGrid">
            <DrillTile
              title="M2 Edges"
              description={
                <>
                  22 non-buffer targets. Read the letter, recall setup, execute
                  <strong> setup · M2 · undo</strong>, then rate recall quality.
                </>
              }
              due={edgeDue}
              doneSub="No edge positions due today"
              startLabel="Start Edge Drill →"
              onStart={() => setOpenDrill("edges")}
            />
            <DrillTile
              title="OP Corners"
              description={
                <>
                  21 non-buffer targets. Read the letter, recall setup, execute
                  <strong> setup · Y-perm · undo</strong>, then rate recall quality.
                </>
              }
              due={cornerDue}
              doneSub="No corner positions due today"
              startLabel="Start Corner Drill →"
              onStart={() => setOpenDrill("corners")}
            />
            <article className="workspaceTile bldGuideTile">
              <h3>Ruwix-Style Flow, Applied To This Trainer</h3>
              <p className="bldGuideLead">
                Same process as classic OP tutorials: fixed orientation, fixed buffers, memo letters,
                then execute targets with <strong>A-B-A&apos;</strong>.
              </p>
              <ol className="bldGuideSteps">
                <li>
                  <strong>Orientation + letters:</strong> pick one view of the cube and never change it
                  mid-solve.
                </li>
                <li>
                  <strong>Memo in pairs:</strong> trace targets from the buffer and convert to letter pairs.
                </li>
                <li>
                  <strong>Execute corners first:</strong> run each corner target as
                  <strong> setup · Y-perm · undo</strong>.
                </li>
                <li>
                  <strong>Parity check:</strong> if edge memo length was odd, apply parity fix after corners.
                </li>
                <li>
                  <strong>Execute edges:</strong> run each edge target as <strong>setup · M2 · undo</strong>.
                </li>
              </ol>
              <p className="bldGuideFootnote">
                Convention note: Ruwix examples teach OP with different buffers. This app keeps one
                fixed map (UF/URF) so your drills are consistent day to day.
              </p>
            </article>
            <ParityTile />
            <article className="workspaceTile bldReferenceTile">
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
        )}
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
