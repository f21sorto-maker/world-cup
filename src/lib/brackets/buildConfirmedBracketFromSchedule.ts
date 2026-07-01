import { isKnockoutBracketMatchId } from "../bracketTree";
import { effectiveStandings } from "../materializedScheduleCache";
import { materializeFullSchedule } from "../materializeFullSchedule";
import { prepareLiveMatchStore } from "../liveMatchStorePipeline";
import { resolveMatchWinner } from "../resolveMatchWinner";
import type {
  BracketMatch,
  BracketSlotCertainty,
  GroupLetter,
  GroupStanding,
  MergedMatch,
  Stage,
  Team,
} from "../../types";
import type { QualificationMatchContext } from "../qualification";
import { getR32Slots } from "./getR32Slots";
import { KNOCKOUT_LATER_STAGES, KNOCKOUT_ROUND_FIXTURES } from "./knockoutRoundFixtures";

function resolveStandingsInput(
  groupStandings: GroupStanding[],
  qualContext: QualificationMatchContext
): GroupStanding[] {
  const effective = effectiveStandings(groupStandings);
  if (effective.length > 0) return effective;

  const locked = qualContext.lockedStandingsByGroup;
  if (!locked || Object.keys(locked).length === 0) return [];

  return Object.entries(locked).map(([group, rows]) => ({
    group: group as GroupLetter,
    rows,
  }));
}

function stageFromMatchId(matchId: string): Stage {
  const num = Number(matchId.replace(/^M/, ""));
  if (num >= 73 && num <= 88) return "R32";
  if (num >= 89 && num <= 96) return "R16";
  if (num >= 97 && num <= 100) return "QF";
  if (num === 101 || num === 102) return "SF";
  if (num === 103) return "ThirdPlace";
  return "Final";
}

function teamIdOrUndefined(teamId: string | undefined): string | undefined {
  return teamId?.trim() ? teamId : undefined;
}

function certaintyForTeam(teamId: string | undefined): BracketSlotCertainty {
  return teamIdOrUndefined(teamId) ? "confirmed" : "tbd";
}

function buildSeedLabelMap(
  standings: GroupStanding[],
  teams: Record<string, Team>,
  qualContext: QualificationMatchContext
): Map<string, { homeSeedLabel?: string; awaySeedLabel?: string }> {
  const map = new Map<string, { homeSeedLabel?: string; awaySeedLabel?: string }>();

  for (const slot of getR32Slots(standings, teams, qualContext)) {
    map.set(slot.matchId, { homeSeedLabel: slot.homeSource, awaySeedLabel: slot.awaySource });
  }

  for (const stage of KNOCKOUT_LATER_STAGES) {
    for (const [matchId, homeSeed, awaySeed] of KNOCKOUT_ROUND_FIXTURES[stage]) {
      map.set(matchId, { homeSeedLabel: homeSeed, awaySeedLabel: awaySeed });
    }
  }

  return map;
}

function scheduleRowToBracketMatch(
  row: MergedMatch,
  matchId: string,
  seedLabels: { homeSeedLabel?: string; awaySeedLabel?: string } | undefined,
  teamsById: Record<string, Team>
): BracketMatch {
  const homeTeamId = teamIdOrUndefined(row.homeTeamId);
  const awayTeamId = teamIdOrUndefined(row.awayTeamId);
  const isCompleted = row.status === "completed" && row.locked === true;
  const winnerTeamId =
    isCompleted ? resolveMatchWinner(row, teamsById) ?? undefined : undefined;

  return {
    id: matchId,
    stage: stageFromMatchId(matchId),
    label: matchId,
    homeTeamId,
    awayTeamId,
    homeSeedLabel: seedLabels?.homeSeedLabel,
    awaySeedLabel: seedLabels?.awaySeedLabel,
    homeScore: isCompleted ? row.homeScore : undefined,
    awayScore: isCompleted ? row.awayScore : undefined,
    winnerTeamId,
    source: "scheduled",
    homeCertainty: certaintyForTeam(homeTeamId),
    awayCertainty: certaintyForTeam(awayTeamId),
    homeGhosts: [],
    awayGhosts: [],
    penaltyShootout: isCompleted ? row.penaltyShootout : undefined,
  };
}

export type BuildConfirmedBracketFromScheduleInput = {
  teams: Record<string, Team>;
  liveMatches: Record<string, MergedMatch>;
  groupStandings: GroupStanding[];
  qualContext: QualificationMatchContext;
};

/**
 * Locked-in bracket derived directly from materialized schedule rows (M73–M104).
 * Same team assignment path as Schedule tab — no separate winner graph.
 */
export function buildConfirmedBracketFromSchedule(
  input: BuildConfirmedBracketFromScheduleInput
): { bracket: BracketMatch[]; standings: GroupStanding[] } {
  const { teams, liveMatches, groupStandings, qualContext } = input;
  const standings = resolveStandingsInput(groupStandings, qualContext);
  const prepared = prepareLiveMatchStore(liveMatches, teams);
  const schedule = materializeFullSchedule(teams, prepared, standings);
  const seedLabels = buildSeedLabelMap(standings, teams, qualContext);

  const bracket: BracketMatch[] = [];

  for (const row of schedule) {
    const matchId = row.matchId ?? row.id;
    if (!matchId || !isKnockoutBracketMatchId(matchId)) continue;
    bracket.push(scheduleRowToBracketMatch(row, matchId, seedLabels.get(matchId), teams));
  }

  bracket.sort((a, b) => {
    const numA = Number(a.id.replace(/^M/, ""));
    const numB = Number(b.id.replace(/^M/, ""));
    return numA - numB;
  });

  return { bracket, standings };
}
