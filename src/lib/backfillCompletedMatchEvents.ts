import type { MatchEvent, MergedMatch, Team } from "../types";
import { flushMatchEventsCachePersist } from "./matchEventsCache";
import { matchHasStoredEvents } from "./matchHasStoredEvents";
import { fetchMatchEvents, publishMatchEvents } from "../services/matchDetail/fetchMatchEvents";
import { useStore } from "../store";
import { logger } from "../services/Logger";

const DEFAULT_CONCURRENCY = 3;

async function mapWithConcurrency<T>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<void>
): Promise<void> {
  let index = 0;
  const runners = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (index < items.length) {
      const current = items[index];
      index += 1;
      await worker(current);
    }
  });
  await Promise.all(runners);
}

function completedMatchesMissingEvents(
  matches: Record<string, MergedMatch>,
  matchEvents: Record<string, MatchEvent[]>
): MergedMatch[] {
  const seen = new Set<string>();
  const out: MergedMatch[] = [];

  for (const match of Object.values(matches)) {
    if (match.status !== "completed") continue;
    const stableId = match.matchId ?? match.id;
    if (seen.has(stableId)) continue;
    seen.add(stableId);
    if (matchHasStoredEvents(match, matchEvents)) continue;
    out.push(match);
  }

  return out.sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
}

/**
 * Background boot pass: fetch play-by-play / incidents for completed matches with no cached events.
 */
export async function backfillCompletedMatchEvents(options?: {
  matches?: Record<string, MergedMatch>;
  teams?: Record<string, Team>;
  concurrency?: number;
}): Promise<number> {
  const store = useStore.getState();
  const matches = options?.matches ?? store.liveMatches;
  const teams = options?.teams ?? store.teams;
  const matchEvents = store.matchEvents;

  const targets = completedMatchesMissingEvents(matches, matchEvents);
  if (targets.length === 0) return 0;

  let filled = 0;

  await mapWithConcurrency(targets, options?.concurrency ?? DEFAULT_CONCURRENCY, async (match) => {
    try {
      const events = await fetchMatchEvents(match, match.matchId ?? match.id);
      if (events.length === 0) return;
      publishMatchEvents(match, events);
      filled += 1;
    } catch (error) {
      logger.debug("Match events backfill skipped", "backfillCompletedMatchEvents", {
        matchId: match.matchId ?? match.id,
        reason: error instanceof Error ? error.message : String(error),
      });
    }
  });

  if (filled > 0) {
    flushMatchEventsCachePersist(useStore.getState().matchEvents);
    logger.info("Backfilled match goal events", "backfillCompletedMatchEvents", {
      filled,
      attempted: targets.length,
    });
  }

  return filled;
}

export function scheduleBackfillCompletedMatchEvents(): void {
  void backfillCompletedMatchEvents().catch((error) => {
    logger.warn("Match events backfill failed", "backfillCompletedMatchEvents", {
      reason: error instanceof Error ? error.message : String(error),
    });
  });
}
