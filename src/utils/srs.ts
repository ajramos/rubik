export type SRSCard = {
  interval: number;
  easeFactor: number;
  reps: number;
  dueDate: string; // ISO "YYYY-MM-DD"
};

export type SRSRating = 1 | 2 | 3 | 4; // Again / Hard / Good / Easy

const STORAGE_KEY = "rubik-srs-v1";

export const DEFAULT_CARD: SRSCard = {
  interval: 0,
  easeFactor: 2.5,
  reps: 0,
  dueDate: new Date().toISOString().slice(0, 10),
};

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function scheduleCard(card: SRSCard, rating: SRSRating): SRSCard {
  let { interval, easeFactor, reps } = card;

  if (rating === 1) {
    interval = 1;
    reps = 0;
  } else if (rating === 2) {
    interval = Math.max(1, Math.round(interval * 1.2));
    easeFactor = Math.max(1.3, easeFactor - 0.15);
    reps++;
  } else if (rating === 3) {
    if (reps === 0) interval = 1;
    else if (reps === 1) interval = 6;
    else interval = Math.round(interval * easeFactor);
    reps++;
  } else {
    if (reps === 0) interval = 4;
    else if (reps === 1) interval = 10;
    else interval = Math.round(interval * easeFactor * 1.3);
    easeFactor = Math.min(4.0, easeFactor + 0.1);
    reps++;
  }

  const due = new Date();
  due.setDate(due.getDate() + interval);

  return { interval, easeFactor, reps, dueDate: due.toISOString().slice(0, 10) };
}

export function isDue(card: SRSCard): boolean {
  return card.dueDate <= today();
}

export function loadSRS(): Record<string, SRSCard> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, SRSCard>) : {};
  } catch {
    return {};
  }
}

export function saveSRS(data: Record<string, SRSCard>): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getSRSCard(id: string, data: Record<string, SRSCard>): SRSCard {
  return data[id] ?? { ...DEFAULT_CARD };
}
