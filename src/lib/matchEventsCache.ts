import type { MatchEvent } from "../types";
import { bootCacheSchemaFields, matchesBootCacheSchema } from "./bootCacheSchema";
import { BOOT_CACHE_SCHEMA_VERSION } from "./bootCacheVersion";

export const MATCH_EVENTS_CACHE_KEY = `wc-match-events-v${BOOT_CACHE_SCHEMA_VERSION}`;

type MatchEventsCacheStore = {
  version: typeof BOOT_CACHE_SCHEMA_VERSION;
  _schemaVersion: typeof BOOT_CACHE_SCHEMA_VERSION;
  savedAt: string;
  events: Record<string, MatchEvent[]>;
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

export function readMatchEventsCache(): Record<string, MatchEvent[]> | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(MATCH_EVENTS_CACHE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed) || !matchesBootCacheSchema(parsed)) {
      localStorage.removeItem(MATCH_EVENTS_CACHE_KEY);
      return null;
    }
    if (!isRecord(parsed.events)) return null;
    return parsed.events as Record<string, MatchEvent[]>;
  } catch {
    return null;
  }
}

export function writeMatchEventsCache(events: Record<string, MatchEvent[]>): void {
  if (typeof localStorage === "undefined") return;
  if (Object.keys(events).length === 0) return;
  try {
    const store: MatchEventsCacheStore = {
      ...bootCacheSchemaFields(),
      savedAt: new Date().toISOString(),
      events,
    };
    localStorage.setItem(MATCH_EVENTS_CACHE_KEY, JSON.stringify(store));
  } catch {
    /* ignore quota */
  }
}

let persistTimer: ReturnType<typeof setTimeout> | null = null;

/** Debounced persist — call after mergeMatchEvents to avoid write storms during polls. */
export function scheduleMatchEventsCachePersist(
  events: Record<string, MatchEvent[]>,
  delayMs = 300
): void {
  if (typeof localStorage === "undefined") return;
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    persistTimer = null;
    writeMatchEventsCache(events);
  }, delayMs);
}

export function flushMatchEventsCachePersist(events: Record<string, MatchEvent[]>): void {
  if (persistTimer) {
    clearTimeout(persistTimer);
    persistTimer = null;
  }
  writeMatchEventsCache(events);
}

export function resetMatchEventsCachePersistForTests(): void {
  if (persistTimer) {
    clearTimeout(persistTimer);
    persistTimer = null;
  }
}
