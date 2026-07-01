import { useEffect } from "react";
import { preferLayoutForKnockoutIfUnset } from "../lib/bracketLayoutPreference";
import { useStore } from "../store";
import { useTournamentPhase } from "./useTournamentPhase";

/** On Bracket tab: default to tree (desktop) or flow (mobile) during knockout when layout was never saved. */
export function usePreferBracketTreeDuringKnockout(): void {
  const { isKnockoutActive } = useTournamentPhase();
  const layoutMode = useStore((s) => s.bracketLayoutMode);
  const setBracketLayoutMode = useStore((s) => s.setBracketLayoutMode);

  useEffect(() => {
    const preferred = preferLayoutForKnockoutIfUnset(isKnockoutActive);
    if (preferred && layoutMode !== preferred) {
      setBracketLayoutMode(preferred);
    }
  }, [isKnockoutActive, layoutMode, setBracketLayoutMode]);
}
