import { isApiEnabled } from "../config/apiFlags";
import { findOddsByTeams, getBestLines, isOddsDisabled, type EventOdds } from "./OddsIntelligenceClient";

const TTL_MS = 5 * 60 * 1000;

type CacheEntry = {
  data: EventOdds;
  fetchedAt: number;
};

const cache = new Map<string, CacheEntry>();
const inFlight = new Map<string, Promise<EventOdds | null>>();

export async function getOdds(
  eventId: string,
  teams?: { home: string; away: string }
): Promise<EventOdds | null> {
  if (!isApiEnabled("oddsIntelligence") || isOddsDisabled()) return null;

  const cached = cache.get(eventId);
  if (cached && Date.now() - cached.fetchedAt < TTL_MS) {
    return cached.data;
  }

  const existing = inFlight.get(eventId);
  if (existing) return existing;

  const promise = (async () => {
    let data = await getBestLines(eventId);
    if (!data && teams) {
      data = await findOddsByTeams(teams.home, teams.away);
    }
    inFlight.delete(eventId);
    if (data) {
      cache.set(eventId, { data, fetchedAt: Date.now() });
    }
    return data;
  })();

  inFlight.set(eventId, promise);
  return promise;
}

export function invalidateOddsCache(eventId?: string): void {
  if (eventId) {
    cache.delete(eventId);
  } else {
    cache.clear();
  }
}
