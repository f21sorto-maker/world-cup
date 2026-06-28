import type { GroupStanding, MergedMatch, Team } from "../../types";
import { buildQualificationContext, type QualificationMatchContext } from "../qualification";
import { getR32Slots } from "./getR32Slots";
import { KNOCKOUT_ROUND_FIXTURES } from "./knockoutRoundFixtures";

export type KnockoutSide = {
  teamId?: string;
  source: string;
};

export type KnockoutParticipant = {
  home: KnockoutSide;
  away: KnockoutSide;
};

export type KnockoutParticipantMap = Record<string, KnockoutParticipant>;

function knockoutWinner(match: MergedMatch | undefined): string | undefined {
  if (!match || match.status !== "completed" || match.homeScore === undefined || match.awayScore === undefined) {
    return undefined;
  }
  if (match.homeScore > match.awayScore) return match.homeTeamId || undefined;
  if (match.awayScore > match.homeScore) return match.awayTeamId || undefined;
  return undefined;
}

function isKnockoutMatchId(matchId: string): boolean {
  const num = Number(matchId.replace(/^M/, ""));
  return Number.isFinite(num) && num >= 73;
}

/**
 * Single source of truth: derive knockout entrants from finalized group standings,
 * then overlay winners from locked knockout results for later rounds.
 */
export function resolveKnockoutParticipants(
  standings: GroupStanding[],
  teams: Record<string, Team>,
  liveMatches: Record<string, MergedMatch>,
  qualContext?: QualificationMatchContext
): KnockoutParticipantMap {
  if (standings.length === 0) return {};

  const context =
    qualContext ?? buildQualificationContext(Object.values(liveMatches), Object.values(teams));

  const slots: KnockoutParticipantMap = {};

  for (const r32 of getR32Slots(standings, teams, context)) {
    slots[r32.matchId] = {
      home: { teamId: r32.homeTeamId, source: r32.homeSource },
      away: { teamId: r32.awayTeamId, source: r32.awaySource },
    };
  }

  const winners: Record<string, string | undefined> = {};
  for (const m of Object.values(liveMatches)) {
    const matchId = m.matchId ?? m.id;
    if (!isKnockoutMatchId(matchId)) continue;
    const winner = knockoutWinner(m);
    if (winner) winners[`W${matchId.slice(1)}`] = winner;
  }

  for (const stage of ["R16", "QF", "SF", "Final"] as const) {
    for (const [matchId, homeSource, awaySource] of KNOCKOUT_ROUND_FIXTURES[stage]) {
      slots[matchId] = {
        home: { teamId: winners[homeSource], source: homeSource },
        away: { teamId: winners[awaySource], source: awaySource },
      };
    }
  }

  return slots;
}
