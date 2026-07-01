import type { BracketViewMode } from "../types";

export const BRACKET_VIEW_MODE_STORAGE_KEY = "wc-bracket-view-mode";

export function readStoredBracketViewMode(): BracketViewMode | null {
  try {
    const value = localStorage.getItem(BRACKET_VIEW_MODE_STORAGE_KEY);
    if (value === "confirmed" || value === "projected") return value;
  } catch {
    /* ignore */
  }
  return null;
}

export function hasStoredBracketViewModePreference(): boolean {
  return readStoredBracketViewMode() !== null;
}

export function writeStoredBracketViewMode(mode: BracketViewMode): void {
  try {
    localStorage.setItem(BRACKET_VIEW_MODE_STORAGE_KEY, mode);
  } catch {
    /* ignore */
  }
}

/**
 * During knockout, prefer Locked in when the user has not saved a mode yet.
 */
export function preferConfirmedViewForKnockoutIfUnset(
  isKnockoutActive: boolean
): BracketViewMode | null {
  if (!isKnockoutActive || hasStoredBracketViewModePreference()) return null;
  return "confirmed";
}
