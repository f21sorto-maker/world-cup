import type { MatchEvent } from "../../types";
import { playerNamesMatch } from "./normalizePlayerName";

function isScoringEvent(event: MatchEvent): boolean {
  return event.type === "goal" || event.type === "own_goal";
}

/** Counts tournament goals for a player across all recorded match events. */
export function countTournamentGoals(
  allEvents: Record<string, MatchEvent[]>,
  opts: { playerId?: string; playerName: string; teamId: string }
): number {
  let total = 0;

  for (const events of Object.values(allEvents)) {
    for (const event of events) {
      if (!isScoringEvent(event) || event.teamId !== opts.teamId) continue;

      const idMatch = opts.playerId && event.playerId && event.playerId === opts.playerId;
      const nameMatch = playerNamesMatch(event.playerName, opts.playerName);
      if (idMatch || nameMatch) total += 1;
    }
  }

  return total;
}
