import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BOOT_CACHE_SCHEMA_VERSION } from "./bootCacheVersion";
import {
  MATCH_EVENTS_CACHE_KEY,
  readMatchEventsCache,
  resetMatchEventsCachePersistForTests,
  scheduleMatchEventsCachePersist,
  writeMatchEventsCache,
} from "./matchEventsCache";
import type { MatchEvent } from "../types";

const goalEvent: MatchEvent = {
  providerId: "espn-1-0-goal-12",
  minute: 12,
  type: "goal",
  teamId: "fra",
  playerName: "Kylian Mbappé",
};

describe("matchEventsCache", () => {
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
    resetMatchEventsCachePersistForTests();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    resetMatchEventsCachePersistForTests();
    vi.unstubAllGlobals();
  });

  it("round-trips events through localStorage", () => {
    writeMatchEventsCache({ M1: [goalEvent] });
    const restored = readMatchEventsCache();
    expect(restored?.M1?.[0]?.playerName).toBe("Kylian Mbappé");
  });

  it("debounces scheduled persist writes", () => {
    scheduleMatchEventsCachePersist({ M2: [goalEvent] });
    expect(readMatchEventsCache()).toBeNull();

    vi.advanceTimersByTime(300);
    expect(readMatchEventsCache()?.M2).toHaveLength(1);
  });

  it("rejects payloads with mismatched schema version", () => {
    localStorage.setItem(
      MATCH_EVENTS_CACHE_KEY,
      JSON.stringify({
        version: BOOT_CACHE_SCHEMA_VERSION - 1,
        _schemaVersion: BOOT_CACHE_SCHEMA_VERSION - 1,
        savedAt: new Date().toISOString(),
        events: { M1: [goalEvent] },
      })
    );

    expect(readMatchEventsCache()).toBeNull();
    expect(localStorage.getItem(MATCH_EVENTS_CACHE_KEY)).toBeNull();
  });
});
