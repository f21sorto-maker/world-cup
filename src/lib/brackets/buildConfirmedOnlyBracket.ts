import { buildConfirmedBracketFromSchedule } from "./buildConfirmedBracketFromSchedule";
import type { GroupStanding, Match, MergedMatch, Team } from "../../types";
import type { QualificationMatchContext } from "../qualification";

/**
 * @deprecated Prefer buildConfirmedBracketFromSchedule — kept for existing test imports.
 */
export function buildConfirmedOnlyBracket(
  teams: Team[],
  _matches: Match[],
  liveMatches: Record<string, MergedMatch>,
  qualContext: QualificationMatchContext,
  groupStandings: GroupStanding[] = []
): ReturnType<typeof buildConfirmedBracketFromSchedule> {
  const teamsById = Object.fromEntries(teams.map((team) => [team.id, team]));
  return buildConfirmedBracketFromSchedule({
    teams: teamsById,
    liveMatches,
    groupStandings,
    qualContext,
  });
}
