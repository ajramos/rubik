import type { CubeScheme } from "./faceColors";

const PREFS_KEY = "rubik-prefs-v1";

export type PrefsData = {
  preferredAlgs: Record<string, string>; // case ID → chosen alg string
  ohMode: boolean;                        // One-Handed mode
  cubeScheme: CubeScheme;                 // Cube face colour scheme
};

export function loadPrefs(): PrefsData {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<PrefsData>;
      return {
        preferredAlgs: parsed.preferredAlgs ?? {},
        ohMode: parsed.ohMode ?? false,
        cubeScheme: parsed.cubeScheme ?? "wca",
      };
    }
  } catch {}
  return { preferredAlgs: {}, ohMode: false, cubeScheme: "wca" };
}

export function savePrefs(data: PrefsData): void {
  localStorage.setItem(PREFS_KEY, JSON.stringify(data));
}

export function setPreferredAlg(data: PrefsData, id: string, alg: string): PrefsData {
  const updated = { ...data, preferredAlgs: { ...data.preferredAlgs, [id]: alg } };
  savePrefs(updated);
  return updated;
}

export function clearPreferredAlg(data: PrefsData, id: string): PrefsData {
  const { [id]: _, ...rest } = data.preferredAlgs;
  const updated = { ...data, preferredAlgs: rest };
  savePrefs(updated);
  return updated;
}

export function toggleOhMode(data: PrefsData): PrefsData {
  const updated = { ...data, ohMode: !data.ohMode };
  savePrefs(updated);
  return updated;
}

export function setCubeScheme(data: PrefsData, scheme: CubeScheme): PrefsData {
  const updated = { ...data, cubeScheme: scheme };
  savePrefs(updated);
  return updated;
}
