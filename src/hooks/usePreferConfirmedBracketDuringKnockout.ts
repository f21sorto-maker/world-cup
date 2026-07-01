import { useEffect } from "react";
import { preferConfirmedViewForKnockoutIfUnset } from "../lib/bracketViewModePreference";
import { useStore } from "../store";
import { useTournamentPhase } from "./useTournamentPhase";

/** On Bracket / Live embed: default to Locked in during knockout when mode was never saved. */
export function usePreferConfirmedBracketDuringKnockout(): void {
  const { isKnockoutActive } = useTournamentPhase();
  const mode = useStore((s) => s.bracketViewMode);
  const setBracketViewMode = useStore((s) => s.setBracketViewMode);

  useEffect(() => {
    const preferred = preferConfirmedViewForKnockoutIfUnset(isKnockoutActive);
    if (preferred && mode !== preferred) {
      setBracketViewMode(preferred, { persist: false });
    }
  }, [isKnockoutActive, mode, setBracketViewMode]);
}
