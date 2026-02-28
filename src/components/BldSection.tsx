import React, { useMemo, useState } from "react";
import type { SRSCard, SRSRating } from "../utils/srs";
import { isDue, getSRSCard } from "../utils/srs";
import { SPEFFZ_EDGES, SPEFFZ_CORNERS, Y_PERM, type BldTarget } from "../data/bld-data";

const SESSION_MAX = 20;

const RATING_CONFIG: { rating: SRSRating; label: string; mod: string }[] = [
  { rating: 1, label: "Again", mod: "again" },
  { rating: 2, label: "Hard", mod: "hard" },
  { rating: 3, label: "Good", mod: "good" },
  { rating: 4, label: "Easy", mod: "easy" },
];

type Props = {
  bldSrsData: Record<string, SRSCard>;
  onRate: (id: string, rating: SRSRating) => void;
};

function buildQueue(targets: BldTarget[], srsData: Record<string, SRSCard>): BldTarget[] {
  const active = targets.filter((t) => !t.isBuffer);
  const due: BldTarget[] = [];
  const newCards: BldTarget[] = [];

  for (const t of active) {
    const card = srsData[t.id];
    if (!card) {
      newCards.push(t);
    } else if (isDue(card)) {
      due.push(t);
    }
  }

  due.sort((a, b) => {
    const da = srsData[a.id]!.dueDate;
    const db = srsData[b.id]!.dueDate;
    return da < db ? -1 : da > db ? 1 : 0;
  });

  return [...due, ...newCards].slice(0, SESSION_MAX);
}

function dueCount(targets: BldTarget[], srsData: Record<string, SRSCard>): number {
  return targets.filter(
    (t) => !t.isBuffer && (!srsData[t.id] || isDue(getSRSCard(t.id, srsData)))
  ).length;
}

// ── Inline drill panel (no modal overlay) ────────────────────────────────────

function BldDrillPanel({
  targets,
  drillTitle,
  methodLabel,
  onBack,
  bldSrsData,
  onRate,
}: {
  targets: BldTarget[];
  drillTitle: string;
  methodLabel: string;
  onBack: () => void;
  bldSrsData: Record<string, SRSCard>;
  onRate: (id: string, rating: SRSRating) => void;
}) {
  const queue = useMemo(() => buildQueue(targets, bldSrsData), [targets, bldSrsData]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState<"question" | "answer">("question");
  const [results, setResults] = useState<{ id: string; rating: SRSRating }[]>([]);

  const current = queue[currentIndex];
  const isComplete = currentIndex >= queue.length;
  const countByRating = (r: SRSRating) => results.filter((x) => x.rating === r).length;

  function handleRate(rating: SRSRating) {
    if (!current) return;
    onRate(current.id, rating);
    setResults((prev) => [...prev, { id: current.id, rating }]);
    setCurrentIndex((i) => i + 1);
    setPhase("question");
  }

  return (
    <div className="workspaceSectionShell">
      <section className="workspaceSectionCard workspaceSectionCard--bld">
        <div className="bldDrillHeader">
          <button className="bldDrillBack" type="button" onClick={onBack}>
            ← Volver
          </button>
          <div className="bldDrillHeaderTitle">
            {drillTitle}
            <span className="bldMethodBadge">{methodLabel}</span>
          </div>
        </div>

        {queue.length === 0 ? (
          <div className="drillComplete">
            <div className="drillCompleteIcon">✓</div>
            <h2 className="drillCompleteTitle">Todo al día</h2>
            <p className="drillCompleteLead">No hay posiciones pendientes. ¡Vuelve mañana!</p>
            <button className="drillDoneBtn" type="button" onClick={onBack}>Cerrar</button>
          </div>
        ) : isComplete ? (
          <div className="drillComplete">
            <div className="drillCompleteIcon">🎯</div>
            <h2 className="drillCompleteTitle">Sesión completada</h2>
            <p className="drillCompleteLead">{results.length} posiciones revisadas</p>
            <div className="drillSummaryRow">
              {RATING_CONFIG.map(({ rating, label, mod }) => (
                <div key={rating} className={`drillSummaryChip drillSummaryChip--${mod}`}>
                  <span className="drillSummaryCount">{countByRating(rating)}</span>
                  <span className="drillSummaryLabel">{label}</span>
                </div>
              ))}
            </div>
            <button className="drillDoneBtn" type="button" onClick={onBack}>Hecho</button>
          </div>
        ) : (
          <>
            <div className="drillProgress">
              <div className="drillProgressBar">
                <div
                  className="drillProgressFill"
                  style={{ width: `${(currentIndex / queue.length) * 100}%` }}
                />
              </div>
              <span className="drillProgressLabel">{currentIndex + 1} / {queue.length}</span>
            </div>

            <div className="bldDrillCard">
              {phase === "question" ? (
                <>
                  <div className="bldDrillLetter">{current.letter}</div>
                  <div className="bldDrillPos">{current.position}</div>
                  <div className="bldDrillFaceName">{current.faceName}</div>
                  {current.note && <p className="bldDrillNote">{current.note}</p>}
                  <p className="bldDrillHint">
                    Recuerda el setup y el algoritmo para esta posición.
                  </p>
                  <button
                    className="drillRevealBtn"
                    type="button"
                    onClick={() => setPhase("answer")}
                  >
                    Revelar
                  </button>
                </>
              ) : (
                <>
                  <div className="bldDrillLetterSmall">{current.letter} · {current.position}</div>
                  {current.setupAlg ? (
                    <div className="bldDrillAlgBlock">
                      <div className="bldDrillAlgLabel">Setup</div>
                      <code className="bldDrillAlg">{current.setupAlg}</code>
                    </div>
                  ) : null}
                  <div className="bldDrillAlgBlock">
                    <div className="bldDrillAlgLabel">Algoritmo completo</div>
                    <code className="bldDrillAlg">{current.fullAlg}</code>
                  </div>
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
                </>
              )}
            </div>
          </>
        )}
      </section>
    </div>
  );
}

// ── Reference tables ─────────────────────────────────────────────────────────

function ReferenceSection({ srsData }: { srsData: Record<string, SRSCard> }) {
  function statusOf(t: BldTarget): "new" | "due" | "learned" {
    if (!srsData[t.id]) return "new";
    return isDue(getSRSCard(t.id, srsData)) ? "due" : "learned";
  }

  return (
    <div className="workspaceSectionCard workspaceSectionCard--bld bldRefSection">
      <div className="workspaceSectionKicker">Referencia Speffz</div>

      <h3 className="bldRefTitle">Aristas — Método M2</h3>
      <p className="workspaceSectionLead" style={{ marginTop: 4 }}>
        Buffer: <strong>UF (letra C)</strong>. Cada alg = setup · M2 · undo setup.
        Las letras C e I son la misma pieza (el buffer); se saltan en el drill.
      </p>
      <div className="bldTableScroll">
        <table className="bldTable">
          <thead>
            <tr>
              <th>Letra</th>
              <th>Posición</th>
              <th>Setup</th>
              <th>Alg completo</th>
              <th>SRS</th>
            </tr>
          </thead>
          <tbody>
            {SPEFFZ_EDGES.map((t) => (
              <tr key={t.id} className={t.isBuffer ? "bldTableRowBuffer" : ""}>
                <td className="bldTableLetter">{t.letter}</td>
                <td className="bldTablePos">{t.position}</td>
                <td>
                  {t.isBuffer
                    ? <em className="bldTableMuted">buffer</em>
                    : t.setupAlg
                      ? <code className="bldTableAlg">{t.setupAlg}</code>
                      : <em className="bldTableMuted">—</em>}
                </td>
                <td>
                  {t.isBuffer
                    ? <em className="bldTableMuted">skip</em>
                    : <code className="bldTableAlg">{t.fullAlg}</code>}
                </td>
                <td>
                  {!t.isBuffer && (
                    <span className={`bldSrsStatus bldSrsStatus--${statusOf(t)}`}>
                      {statusOf(t)}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 className="bldRefTitle" style={{ marginTop: 20 }}>Esquinas — Old Pochmann</h3>
      <p className="workspaceSectionLead" style={{ marginTop: 4 }}>
        Buffer: <strong>URF sticker U (letra B)</strong>. Cada alg = setup · Y-perm · undo setup.
        Las letras B, H y P corresponden a los tres stickers de la pieza buffer; se saltan.
      </p>
      <p className="workspaceSectionLead" style={{ marginTop: 4 }}>
        Y-perm: <code className="bldTableAlgInline">{Y_PERM}</code>
      </p>
      <div className="bldTableScroll">
        <table className="bldTable">
          <thead>
            <tr>
              <th>Letra</th>
              <th>Posición</th>
              <th>Setup</th>
              <th>Alg completo</th>
              <th>SRS</th>
            </tr>
          </thead>
          <tbody>
            {SPEFFZ_CORNERS.map((t) => (
              <tr key={t.id} className={t.isBuffer ? "bldTableRowBuffer" : ""}>
                <td className="bldTableLetter">{t.letter}</td>
                <td className="bldTablePos">{t.position}</td>
                <td>
                  {t.isBuffer
                    ? <em className="bldTableMuted">buffer</em>
                    : t.setupAlg
                      ? <code className="bldTableAlg">{t.setupAlg}</code>
                      : <em className="bldTableMuted">—</em>}
                </td>
                <td>
                  {t.isBuffer
                    ? <em className="bldTableMuted">skip</em>
                    : <code className="bldTableAlg">{t.fullAlg}</code>}
                </td>
                <td>
                  {!t.isBuffer && (
                    <span className={`bldSrsStatus bldSrsStatus--${statusOf(t)}`}>
                      {statusOf(t)}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="bldTableFootnote">
        Los setups de esquinas OP usan la Y-perm como commutador base.
        Verifica los algs contra tu referencia mientras los vas aprendiendo.
      </p>
    </div>
  );
}

// ── Landing view ─────────────────────────────────────────────────────────────

export function BldSection({ bldSrsData, onRate }: Props) {
  const [drill, setDrill] = useState<null | "edges" | "corners">(null);
  const [showRef, setShowRef] = useState(false);

  const edgeDue = dueCount(SPEFFZ_EDGES, bldSrsData);
  const cornerDue = dueCount(SPEFFZ_CORNERS, bldSrsData);

  if (drill === "edges") {
    return (
      <BldDrillPanel
        targets={SPEFFZ_EDGES}
        drillTitle="Drill de Aristas"
        methodLabel="M2"
        onBack={() => setDrill(null)}
        bldSrsData={bldSrsData}
        onRate={onRate}
      />
    );
  }

  if (drill === "corners") {
    return (
      <BldDrillPanel
        targets={SPEFFZ_CORNERS}
        drillTitle="Drill de Esquinas"
        methodLabel="Old Pochmann"
        onBack={() => setDrill(null)}
        bldSrsData={bldSrsData}
        onRate={onRate}
      />
    );
  }

  return (
    <div className="workspaceSectionShell">
      <section className="workspaceSectionCard workspaceSectionCard--bld">
        <div className="workspaceSectionKicker">BLD · M2 / OP · Speffz</div>
        <h2 className="workspaceSectionTitle">Blindfolded Training</h2>
        <p className="workspaceSectionLead">
          Método M2 para aristas y Old Pochmann para esquinas, con el esquema de letras Speffz.
          A cada sticker del cubo se le asigna una letra (A–X). En el drill ves la letra
          y debes recordar el algoritmo que la resuelve.
        </p>
        <p className="bldBufferNote">
          Buffer aristas: <strong>UF → letra C</strong>
          <span className="bldBufferSep">·</span>
          Buffer esquinas: <strong>URF → letra B</strong>
        </p>

        <div className="workspaceSectionGrid">

          {/* Edge drill tile */}
          <article
            className={`workspaceTile todayQueueTile ${edgeDue > 0 ? "todayQueueTile--due" : ""}`}
          >
            <h3 className="todayQueueTitle">Aristas — M2</h3>
            <p>
              Mueve la arista objetivo a la posición DF, aplica M2, y deshaz el setup.
              22 posiciones a aprender (las 24 menos el buffer UF y su par FU).
            </p>
            {edgeDue === 0 ? (
              <div className="todayQueueDone">
                <span className="todayQueueDoneIcon">✓</span>
                <span className="todayQueueDoneText">Al día</span>
                <span className="todayQueueDoneSub">Sin aristas pendientes hoy</span>
              </div>
            ) : (
              <div className="todayQueueHero">
                <span className="todayQueueCount">{edgeDue}</span>
                <span className="todayQueueCountLabel">pendientes</span>
              </div>
            )}
            <button
              type="button"
              className="todayQueueCTA"
              onClick={() => setDrill("edges")}
            >
              Empezar drill →
            </button>
          </article>

          {/* Corner drill tile */}
          <article
            className={`workspaceTile todayQueueTile ${cornerDue > 0 ? "todayQueueTile--due" : ""}`}
          >
            <h3 className="todayQueueTitle">Esquinas — Old Pochmann</h3>
            <p>
              Setup para colocar la esquina objetivo donde va la pieza buffer (URF),
              aplica la Y-perm, y deshaz el setup.
              21 posiciones a aprender.
            </p>
            {cornerDue === 0 ? (
              <div className="todayQueueDone">
                <span className="todayQueueDoneIcon">✓</span>
                <span className="todayQueueDoneText">Al día</span>
                <span className="todayQueueDoneSub">Sin esquinas pendientes hoy</span>
              </div>
            ) : (
              <div className="todayQueueHero">
                <span className="todayQueueCount">{cornerDue}</span>
                <span className="todayQueueCountLabel">pendientes</span>
              </div>
            )}
            <button
              type="button"
              className="todayQueueCTA"
              onClick={() => setDrill("corners")}
            >
              Empezar drill →
            </button>
          </article>

          {/* How it works tile */}
          <article className="workspaceTile">
            <h3>¿Cómo funciona BLD?</h3>
            <p>Proceso básico de un solve blindfolded:</p>
            <ol className="bldStepList">
              <li>Memorizar: recorre el cubo trazando letras a pares (memo string).</li>
              <li>Vendarte los ojos.</li>
              <li>Ejecutar los algoritmos en el mismo orden del memo.</li>
              <li>La pieza buffer actúa como ancla: M2 o Y-perm la cicla con cada objetivo.</li>
            </ol>
          </article>

          {/* Reference tile */}
          <article className="workspaceTile">
            <h3>Tabla de referencia</h3>
            <p>
              Listado completo de las 24 posiciones de aristas y esquinas con su letra Speffz,
              setup y algoritmo completo. Útil hasta que los tengas memorizados.
            </p>
            <button
              type="button"
              className="timedStartTileBtn"
              onClick={() => setShowRef((v) => !v)}
            >
              {showRef ? "Ocultar tabla" : "Ver tabla M2 / OP"}
            </button>
          </article>

        </div>
      </section>

      {showRef && <ReferenceSection srsData={bldSrsData} />}
    </div>
  );
}
