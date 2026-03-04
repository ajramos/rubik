import React from "react";

type AppSection = "home" | "study" | "practice" | "progress" | "reference";
type Language = "es" | "en";

type Props = {
  language: Language;
  totalDueCount: number;
  currentStreak: number;
  ollLearned: number;
  ollTotal: number;
  pllLearned: number;
  pllTotal: number;
  onNavigate: (section: AppSection) => void;
  onStartTodayQueue?: () => void;
};

const NAV_CARDS: Record<Language, Array<{ key: AppSection; label: string; desc: string; mod: string }>> = {
  es: [
    { key: "study", label: "Estudio", desc: "Catálogo OLL, PLL y F2L con visor 3D interactivo.", mod: "study" },
    { key: "practice", label: "Práctica", desc: "Drills SRS de reconocimiento y ejecución, bloques cronometrados y timer.", mod: "practice" },
    { key: "progress", label: "Progreso", desc: "Estadísticas de cobertura, casos débiles, racha y previsión de repaso.", mod: "progress" },
    { key: "reference", label: "Referencia", desc: "Guía de notación, biblioteca de triggers, fingertricks y notas.", mod: "reference" },
  ],
  en: [
    { key: "study", label: "Study", desc: "OLL, PLL, F2L algorithm catalog with 3D interactive viewer.", mod: "study" },
    { key: "practice", label: "Practice", desc: "SRS recognition & execution drills, timed blocks, scramble timer.", mod: "practice" },
    { key: "progress", label: "Progress", desc: "Coverage stats, weak cases, streak tracking and review forecast.", mod: "progress" },
    { key: "reference", label: "Reference", desc: "Notation guide, trigger library, fingertricks and method notes.", mod: "reference" },
  ],
};

export function HomeSection({ language, totalDueCount, currentStreak, ollLearned, ollTotal, pllLearned, pllTotal, onNavigate, onStartTodayQueue }: Props) {
  const allCaughtUp = totalDueCount === 0;
  const t = language === "es"
    ? {
        allCaughtUp: "¡Todo al día!",
        noDue: "No hay tarjetas para hoy — vuelve mañana.",
        cardsDueToday: "tarjetas para hoy",
        startReview: "Empezar repaso →",
        streak: "días de racha",
      }
    : {
        allCaughtUp: "All caught up!",
        noDue: "No cards due today — come back tomorrow.",
        cardsDueToday: "cards due today",
        startReview: "Start Review →",
        streak: "d streak",
      };

  return (
    <div className="workspaceSectionShell">
      <section className="homeSection">
        <div className={`homeQueueCard ${allCaughtUp ? "homeQueueCard--done" : "homeQueueCard--due"}`}>
          {allCaughtUp ? (
            <div className="homeQueueDone">
              <span className="homeQueueDoneIcon">✓</span>
              <div>
                <div className="homeQueueDoneTitle">{t.allCaughtUp}</div>
                <div className="homeQueueDoneSub">{t.noDue}</div>
              </div>
            </div>
          ) : (
            <div className="homeQueueDue">
              <div className="homeQueueDueLeft">
                <span className="homeQueueCount">{totalDueCount}</span>
                <span className="homeQueueCountLabel">{t.cardsDueToday}</span>
              </div>
              <button type="button" className="homeQueueCTA" onClick={onStartTodayQueue} disabled={!onStartTodayQueue}>
                {t.startReview}
              </button>
            </div>
          )}
        </div>

        <div className="homeNavGrid">
          {NAV_CARDS[language].map(({ key, label, desc, mod }) => (
            <button key={key} type="button" className={`homeNavCard homeNavCard--${mod}`} onClick={() => onNavigate(key)}>
              <div className="homeNavCardLabel">{label}</div>
              <div className="homeNavCardDesc">{desc}</div>
              <span className="homeNavCardArrow">→</span>
            </button>
          ))}
        </div>

        <div className="homeStatsStrip">
          {currentStreak > 0 && (
            <>
              <span className="homeStatItem homeStatItem--streak">🔥 {currentStreak}{language === "es" ? ` ${t.streak}` : t.streak}</span>
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
