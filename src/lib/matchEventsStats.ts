import type { MatchEvent } from "../types";

/** Counts all goal events across the store — cheap proxy for tournament-stats invalidation. */
export function countGoalEventsInStore(matchEvents: Record<string, MatchEvent[]>): number {
  let count = 0;
  for (const events of Object.values(matchEvents)) {
    for (const event of events) {
      if (event.type === "goal" || event.type === "own_goal") count += 1;
    }
  }
  return count;
}
