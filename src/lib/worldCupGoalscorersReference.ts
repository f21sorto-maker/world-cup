import referenceBundle from "../data/worldCupGoalscorersReference.json";
import { playerNamesMatch } from "../services/playerProfile/normalizePlayerName";
import type { TournamentPlayerStat } from "../types";

export type WcGoalscorerReferenceRow = {
  number_of_goals: number;
  player_name: string;
  scored_by: string;
  country: string;
  currently_playing_in_this_wc: boolean;
  aliases?: string[];
};

export type WcGoalscorersReferenceBundle = {
  description: string;
  scorers: WcGoalscorerReferenceRow[];
};

const bundle = referenceBundle as WcGoalscorersReferenceBundle;

export function getWorldCupGoalscorersReference(): WcGoalscorersReferenceBundle {
  return bundle;
}

export function getWorldCupGoalscorerRows(): WcGoalscorerReferenceRow[] {
  return bundle.scorers;
}

export function findReferenceScorer(playerName: string): WcGoalscorerReferenceRow | undefined {
  const trimmed = playerName.trim();
  if (!trimmed) return undefined;

  return bundle.scorers.find((row) => {
    if (playerNamesMatch(row.player_name, trimmed)) return true;
    if (playerNamesMatch(row.scored_by, trimmed)) return true;
    return row.aliases?.some((alias) => playerNamesMatch(alias, trimmed)) ?? false;
  });
}

export type WcCareerLeaderRow = {
  reference: WcGoalscorerReferenceRow;
  goalsBefore2026: number;
  goals2026: number;
  careerTotal: number;
  rank: number;
};

function goals2026ForName(
  playerName: string,
  topScorers2026: TournamentPlayerStat[]
): number {
  const stat = topScorers2026.find((row) => playerNamesMatch(row.player.displayName, playerName));
  return stat?.value ?? 0;
}

function toLeaderRow(
  reference: WcGoalscorerReferenceRow,
  topScorers2026: TournamentPlayerStat[]
): Omit<WcCareerLeaderRow, "rank"> {
  const goalsBefore2026 = reference.number_of_goals;
  const goals2026 = reference.currently_playing_in_this_wc
    ? goals2026ForName(reference.player_name, topScorers2026)
    : 0;
  return {
    reference,
    goalsBefore2026,
    goals2026,
    careerTotal: goalsBefore2026 + goals2026,
  };
}

function sortLeaders(
  rows: Omit<WcCareerLeaderRow, "rank">[]
): WcCareerLeaderRow[] {
  return rows
    .sort(
      (a, b) =>
        b.careerTotal - a.careerTotal ||
        b.goals2026 - a.goals2026 ||
        a.reference.player_name.localeCompare(b.reference.player_name)
    )
    .map((row, index) => ({ ...row, rank: index + 1 }));
}

/** Active in 2026 squads — career WC goals through 2022 plus live 2026 goals. */
export function getActiveCareerLeaders(
  topScorers2026: TournamentPlayerStat[],
  limit = 10
): WcCareerLeaderRow[] {
  const active = bundle.scorers.filter((row) => row.currently_playing_in_this_wc);
  return sortLeaders(active.map((row) => toLeaderRow(row, topScorers2026))).slice(0, limit);
}

/** All-time WC top scorers; active players include live 2026 goals in career total. */
export function getAllTimeCareerLeaders(
  topScorers2026: TournamentPlayerStat[],
  limit = 5
): WcCareerLeaderRow[] {
  return sortLeaders(bundle.scorers.map((row) => toLeaderRow(row, topScorers2026))).slice(
    0,
    limit
  );
}
