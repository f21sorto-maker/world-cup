import type { BracketLayoutMode } from "../types";

export const BRACKET_LAYOUT_STORAGE_KEY = "wc-bracket-layout";

const DESKTOP_TREE_MIN_WIDTH = 1024;

const VALID_LAYOUT_MODES: BracketLayoutMode[] = ["tree", "schedule", "flow"];

function isValidLayoutMode(value: string | null): value is BracketLayoutMode {
  return value !== null && (VALID_LAYOUT_MODES as string[]).includes(value);
}

/** Default layout when the user has not saved a preference. */
export function resolveDefaultBracketLayoutMode(): BracketLayoutMode {
  if (typeof window === "undefined") return "tree";
  return window.matchMedia(`(min-width: ${DESKTOP_TREE_MIN_WIDTH}px)`).matches ? "tree" : "schedule";
}

export function readStoredBracketLayoutMode(): BracketLayoutMode {
  try {
    const value = localStorage.getItem(BRACKET_LAYOUT_STORAGE_KEY);
    if (isValidLayoutMode(value)) return value;
  } catch {
    /* ignore */
  }
  return resolveDefaultBracketLayoutMode();
}

/** True when the user explicitly saved a layout in localStorage. */
export function hasStoredBracketLayoutPreference(): boolean {
  try {
    const value = localStorage.getItem(BRACKET_LAYOUT_STORAGE_KEY);
    return isValidLayoutMode(value);
  } catch {
    return false;
  }
}

/**
 * During knockout when layout was never saved: tree on desktop, flow on mobile.
 * Returns null when no override is needed.
 */
export function preferLayoutForKnockoutIfUnset(isKnockoutActive: boolean): BracketLayoutMode | null {
  if (!isKnockoutActive || hasStoredBracketLayoutPreference()) return null;
  if (isDesktopBracketViewport()) return "tree";
  return "flow";
}

/** @deprecated Use preferLayoutForKnockoutIfUnset */
export function preferTreeLayoutForKnockoutIfUnset(isKnockoutActive: boolean): BracketLayoutMode | null {
  return preferLayoutForKnockoutIfUnset(isKnockoutActive);
}

export function writeStoredBracketLayoutMode(mode: BracketLayoutMode): void {
  try {
    localStorage.setItem(BRACKET_LAYOUT_STORAGE_KEY, mode);
  } catch {
    /* ignore */
  }
}

export function isDesktopBracketViewport(): boolean {
  if (typeof window === "undefined") return true;
  return window.matchMedia(`(min-width: ${DESKTOP_TREE_MIN_WIDTH}px)`).matches;
}
