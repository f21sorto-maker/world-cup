import { getAllScheduleEntries } from "../BroadcastLookup";
import type { MergedMatch } from "../../types";

export type ResolvedMatchIds = {
  officialMatchId: string;
  espnEventId: string | null;
  wcMatchId: string | null;
  sofaEventId: string | null;
};

/**
 * Resolve a match by its official schedule ID (e.g. "M89") into all known
 * provider IDs by looking up the live store, then the static schedule.
 *
 * WC Live API uses the same M{number} ids as our schedule (e.g. M65).
 */
export function resolveMatchIds(
  officialMatchId: string,
  liveMatches: Record<string, MergedMatch>
): ResolvedMatchIds {
  const liveEntry = findLiveByOfficialId(officialMatchId, liveMatches);
  if (liveEntry) {
    return {
      officialMatchId,
      espnEventId: liveEntry.espnEventId ?? null,
      wcMatchId: liveEntry.matchId ?? liveEntry.id ?? null,
      sofaEventId: liveEntry.sofaEventId ?? null,
    };
  }

  const matchNumber = parseInt(officialMatchId.replace(/^M/i, ""), 10);
  if (!isNaN(matchNumber)) {
    const entries = getAllScheduleEntries();
    const entry = entries.find((e) => e.matchNumber === matchNumber);
    if (entry) {
      return {
        officialMatchId,
        espnEventId: null,
        wcMatchId: officialMatchId,
        sofaEventId: null,
      };
    }
  }

  return {
    officialMatchId,
    espnEventId: null,
    wcMatchId: null,
    sofaEventId: null,
  };
}

function findLiveByOfficialId(
  officialMatchId: string,
  liveMatches: Record<string, MergedMatch>
): MergedMatch | undefined {
  return Object.values(liveMatches).find(
    (m) => m.matchId === officialMatchId || m.id === officialMatchId
  );
}

export function resolveOfficialIdFromEspn(
  espnEventId: string,
  liveMatches: Record<string, MergedMatch>
): string | null {
  const entry = Object.values(liveMatches).find((m) => m.espnEventId === espnEventId);
  return entry?.matchId ?? null;
}
