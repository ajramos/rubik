import type { SRSCard } from "./srs";
import { DEFAULT_CARD } from "./srs";

const BLD_STORAGE_KEY = "rubik-bld-srs-v1";

export function loadBldSRS(): Record<string, SRSCard> {
  try {
    const raw = localStorage.getItem(BLD_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, SRSCard>) : {};
  } catch {
    return {};
  }
}

export function saveBldSRS(data: Record<string, SRSCard>): void {
  localStorage.setItem(BLD_STORAGE_KEY, JSON.stringify(data));
}

export function getBldCard(id: string, data: Record<string, SRSCard>): SRSCard {
  return data[id] ?? { ...DEFAULT_CARD };
}
