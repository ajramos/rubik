const STREAKS_KEY = "rubik-streaks-v1";

export type StreakData = {
  lastPracticeDate: string; // YYYY-MM-DD or ""
  currentStreak: number;
  longestStreak: number;
  totalDays: number;
  recentDays: string[]; // YYYY-MM-DD, last 60 practice days
};

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function yesterdayStr(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

export function loadStreaks(): StreakData {
  try {
    const raw = localStorage.getItem(STREAKS_KEY);
    if (raw) return JSON.parse(raw) as StreakData;
  } catch {}
  return { lastPracticeDate: "", currentStreak: 0, longestStreak: 0, totalDays: 0, recentDays: [] };
}

export function saveStreaks(data: StreakData): void {
  localStorage.setItem(STREAKS_KEY, JSON.stringify(data));
}

export function recordPractice(data: StreakData): StreakData {
  const t = todayStr();
  if (data.lastPracticeDate === t) return data; // Already recorded today

  const newStreak =
    data.lastPracticeDate === yesterdayStr() ? data.currentStreak + 1 : 1;

  const recentDays = [t, ...data.recentDays.filter((d) => d !== t)].slice(0, 60);

  const updated: StreakData = {
    lastPracticeDate: t,
    currentStreak: newStreak,
    longestStreak: Math.max(data.longestStreak, newStreak),
    totalDays: data.totalDays + 1,
    recentDays,
  };
  saveStreaks(updated);
  return updated;
}
