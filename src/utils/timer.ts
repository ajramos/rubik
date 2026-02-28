const TIMER_KEY = "rubik-timer-v1";

// Simple 20-move random scramble (no same face, no same-axis triples)
const FACES = ["U", "D", "R", "L", "F", "B"] as const;
const MODS = ["", "'", "2"] as const;
const AXIS: Record<string, string> = { U: "ud", D: "ud", R: "rl", L: "rl", F: "fb", B: "fb" };

export function generateScramble(length = 20): string {
  const moves: string[] = [];
  let lastFace = "";
  let secondLastFace = "";
  for (let i = 0; i < length; i++) {
    let face: string;
    do {
      face = FACES[Math.floor(Math.random() * FACES.length)];
    } while (
      face === lastFace ||
      // Avoid same-axis triple (e.g. U D U)
      (AXIS[face] === AXIS[lastFace] && AXIS[face] === AXIS[secondLastFace])
    );
    const mod = MODS[Math.floor(Math.random() * MODS.length)];
    moves.push(face + mod);
    secondLastFace = lastFace;
    lastFace = face;
  }
  return moves.join(" ");
}

export type Penalty = "+2" | "DNF" | null;

export type Solve = {
  time: number;
  scramble: string;
  date: string;
  penalty: Penalty;
};

export type TimerData = {
  solves: Solve[];
  inspectionEnabled: boolean;
};

const DEFAULT: TimerData = { solves: [], inspectionEnabled: true };

export function loadTimer(): TimerData {
  try {
    const raw = localStorage.getItem(TIMER_KEY);
    if (!raw) return { ...DEFAULT };
    const parsed = JSON.parse(raw) as Partial<TimerData>;
    return {
      solves: Array.isArray(parsed.solves) ? parsed.solves : [],
      inspectionEnabled: parsed.inspectionEnabled !== false,
    };
  } catch {
    return { ...DEFAULT };
  }
}

export function saveTimer(data: TimerData): void {
  localStorage.setItem(TIMER_KEY, JSON.stringify(data));
}

export function addSolve(data: TimerData, solve: Solve): TimerData {
  const solves = [solve, ...data.solves].slice(0, 100);
  return { ...data, solves };
}

export function effectiveTime(solve: Solve): number | null {
  if (solve.penalty === "DNF") return null;
  if (solve.penalty === "+2") return solve.time + 2000;
  return solve.time;
}

export function ao(solves: Solve[], n: number): number | null {
  if (solves.length < n) return null;
  const last = solves.slice(0, n);
  const times = last.map(effectiveTime);
  if (times.some((t) => t === null)) return null;
  const valid = times as number[];
  const sorted = [...valid].sort((a, b) => a - b);
  // Remove best and worst
  const trimmed = sorted.slice(1, sorted.length - 1);
  return trimmed.reduce((acc, t) => acc + t, 0) / trimmed.length;
}

export function fmtTime(ms: number): string {
  const s = ms / 1000;
  const min = Math.floor(s / 60);
  const sec = (s % 60).toFixed(2).padStart(5, "0");
  return min > 0 ? `${min}:${sec}` : sec;
}
