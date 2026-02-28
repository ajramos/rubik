const PREFS_KEY = "rubik-prefs-v1";

export type PrefsData = {
  preferredAlgs: Record<string, string>; // case ID → chosen alg string
  ohMode: boolean;                        // One-Handed mode
};

export function loadPrefs(): PrefsData {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<PrefsData>;
      return { preferredAlgs: parsed.preferredAlgs ?? {}, ohMode: parsed.ohMode ?? false };
    }
  } catch {}
  return { preferredAlgs: {}, ohMode: false };
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
