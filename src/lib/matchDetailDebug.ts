import type { MatchDetailTab } from "../types";

/** Dev / opt-in logging for match-detail tab switches (Phase 0 baseline). */
export function isMatchDetailDebugEnabled(): boolean {
  if (import.meta.env.DEV) return true;
  if (typeof window === "undefined") return false;
  try {
    if (localStorage.getItem("wc-match-detail-debug") === "1") return true;
    return new URLSearchParams(window.location.search).has("matchdebug");
  } catch {
    return false;
  }
}

export function logMatchDetailTabSwitch(tab: MatchDetailTab, matchId: string | null): void {
  if (!isMatchDetailDebugEnabled()) return;
  console.debug("[MatchDetail:tab]", { tab, matchId, ts: Date.now() });
}

export function logMatchDetailFetch(label: string, matchId: string | null): void {
  if (!isMatchDetailDebugEnabled()) return;
  console.debug("[MatchDetail:fetch]", { label, matchId, ts: Date.now() });
}
