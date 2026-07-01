import type { MatchEvent, MergedMatch } from "../types";

/** True when any known store key for the match has at least one event row. */
export function matchHasStoredEvents(
  match: MergedMatch,
  matchEvents: Record<string, MatchEvent[]>
): boolean {
  const keys = [match.id, match.matchId, match.espnEventId].filter(Boolean) as string[];
  return keys.some((key) => (matchEvents[key]?.length ?? 0) > 0);
}
