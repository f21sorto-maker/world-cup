import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BOOT_CACHE_SCHEMA_VERSION } from "./bootCacheVersion";
import type { MatchEvent, MergedMatch } from "../types";
import {
  buildTournamentStatsFingerprint,
  filterGoldenBootRace,
  rebuildTournamentPlayerStatsIndex,
  readTournamentPlayerStatsCache,
  TOURNAMENT_PLAYER_STATS_CACHE_KEY,
  writeTournamentPlayerStatsCache,
} from "./tournamentPlayerStatsIndex";

const match: MergedMatch = {
  id: "M1",
  matchId: "M1",
  homeTeamId: "bra",
  awayTeamId: "arg",
  date: "2026-06-15",
  status: "completed",
  locked: true,
  source: "espn",
  homeScore: 2,
  awayScore: 0,
};

const events: MatchEvent[] = [
  { providerId: "g1", minute: 10, type: "goal", teamId: "bra", playerName: "Neymar" },
  { providerId: "g2", minute: 44, type: "goal", teamId: "bra", playerName: "Neymar" },
  { providerId: "g3", minute: 70, type: "goal", teamId: "bra", playerName: "Vinicius Jr" },
];

describe("tournamentPlayerStatsIndex", () => {
  beforeEach(() => {
    const storage = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => {
        storage.set(key, value);
      },
      removeItem: (key: string) => {
        storage.delete(key);
      },
      clear: () => {
        storage.clear();
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("rebuild matches aggregateTournamentStats output", () => {
    const snapshot = rebuildTournamentPlayerStatsIndex([match], { M1: events });
    expect(snapshot.topScorers[0]?.player.displayName).toBe("Neymar");
    expect(snapshot.topScorers[0]?.value).toBe(2);
    expect(snapshot.topAssists).toHaveLength(0);
  });

  it("changes fingerprint when a new goal event is recorded", () => {
    const before = buildTournamentStatsFingerprint({ M1: match }, { M1: events.slice(0, 1) });
    const after = buildTournamentStatsFingerprint({ M1: match }, { M1: events });
    expect(before).not.toBe(after);
  });

  it("filters golden boot race by minimum goals", () => {
    const snapshot = rebuildTournamentPlayerStatsIndex([match], { M1: events });
    expect(filterGoldenBootRace(snapshot.topScorers, 3)).toHaveLength(0);
    expect(filterGoldenBootRace(snapshot.topScorers, 2)).toHaveLength(1);
  });

  it("round-trips snapshot cache", () => {
    const snapshot = rebuildTournamentPlayerStatsIndex([match], { M1: events });
    writeTournamentPlayerStatsCache(snapshot);
    expect(readTournamentPlayerStatsCache()?.topScorers[0]?.value).toBe(2);
  });

  it("rejects stale cache schema versions", () => {
    localStorage.setItem(
      TOURNAMENT_PLAYER_STATS_CACHE_KEY,
      JSON.stringify({
        version: BOOT_CACHE_SCHEMA_VERSION - 1,
        _schemaVersion: BOOT_CACHE_SCHEMA_VERSION - 1,
        savedAt: new Date().toISOString(),
        snapshot: {
          topScorers: [],
          topAssists: [],
          rebuiltAt: new Date().toISOString(),
        },
      })
    );
    expect(readTournamentPlayerStatsCache()).toBeNull();
  });
});
