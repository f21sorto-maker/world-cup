import { useEffect, useState } from "react";
import {
  isDesktopBracketViewport,
  preferLayoutForKnockoutIfUnset,
} from "../lib/bracketLayoutPreference";
import type { BracketLayoutMode } from "../types";

/** Live embed: flow on mobile, tree on desktop. */
export function resolveLiveEmbedBracketLayoutMode(): BracketLayoutMode {
  return isDesktopBracketViewport() ? "tree" : "flow";
}

/** Responsive layout for Live bracket embed (viewport-aware). */
export function useLiveEmbedBracketLayoutMode(): BracketLayoutMode {
  const [mode, setMode] = useState<BracketLayoutMode>(resolveLiveEmbedBracketLayoutMode);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const sync = () => setMode(mq.matches ? "tree" : "flow");
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return mode;
}

/** Open Bracket tab with the layout that matches viewport + knockout defaults. */
export function resolveFullBracketTabLayoutMode(isKnockoutActive: boolean): BracketLayoutMode {
  return preferLayoutForKnockoutIfUnset(isKnockoutActive) ?? resolveLiveEmbedBracketLayoutMode();
}
