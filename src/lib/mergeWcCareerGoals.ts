import { findReferenceScorer } from "./worldCupGoalscorersReference";
import type { WcGoalscorerReferenceRow } from "./worldCupGoalscorersReference";
import type { TournamentPlayerStat } from "../types";
import { playerNamesMatch } from "../services/playerProfile/normalizePlayerName";

export type WcCareerGoalsDisplay = {
  reference?: WcGoalscorerReferenceRow;
  goalsBefore2026: number;
  goals2026: number;
  careerTotal: number;
};

export function lookupGoals2026(
  playerName: string,
  topScorers2026: TournamentPlayerStat[]
): number {
  const stat = topScorers2026.find((row) => playerNamesMatch(row.player.displayName, playerName));
  return stat?.value ?? 0;
}

export function mergeWcCareerGoals(
  reference: WcGoalscorerReferenceRow,
  goals2026: number
): WcCareerGoalsDisplay {
  const goalsBefore2026 = reference.number_of_goals;
  const in2026 = reference.currently_playing_in_this_wc ? goals2026 : 0;
  return {
    reference,
    goalsBefore2026,
    goals2026: in2026,
    careerTotal: goalsBefore2026 + in2026,
  };
}

export function wcCareerGoalsForDisplay(
  playerName: string,
  topScorers2026: TournamentPlayerStat[]
): number | undefined {
  const display = displayWcCareerTotal(playerName, topScorers2026);
  if (display.careerTotal === 0 && !display.reference && display.goals2026 === 0) {
    return undefined;
  }
  return display.careerTotal;
}

export function displayWcCareerTotal(
  playerName: string,
  topScorers2026: TournamentPlayerStat[]
): WcCareerGoalsDisplay {
  const reference = findReferenceScorer(playerName);
  const goals2026 = lookupGoals2026(playerName, topScorers2026);

  if (!reference) {
    return {
      goalsBefore2026: 0,
      goals2026,
      careerTotal: goals2026,
    };
  }

  return mergeWcCareerGoals(reference, goals2026);
}
