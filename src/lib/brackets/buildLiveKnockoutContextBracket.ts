import { resolveKnockoutResults } from "../tournament";
import { isKnockoutMatch } from "../resolveMatchWinner";
import type { BracketMatch, GroupStanding, MergedMatch, Team } from "../../types";

type ConfirmedBracketBase = {
  bracket: BracketMatch[];
  standings: GroupStanding[];
};

/**
 * Live knockout context: schedule-first locked bracket + in-progress live overlay only.
 */
export function buildLiveKnockoutContextBracket(
  base: ConfirmedBracketBase,
  liveMatches: Record<string, MergedMatch>,
  teamsById: Record<string, Team>
): ConfirmedBracketBase {
  const liveKnockout = Object.values(liveMatches).filter(
    (match) =>
      isKnockoutMatch(match) &&
      match.status === "live" &&
      typeof match.homeScore === "number" &&
      typeof match.awayScore === "number"
  );

  if (liveKnockout.length === 0) {
    return base;
  }

  return {
    ...base,
    bracket: resolveKnockoutResults(
      base.bracket,
      liveKnockout,
      teamsById,
      [],
      base.standings
    ),
  };
}
