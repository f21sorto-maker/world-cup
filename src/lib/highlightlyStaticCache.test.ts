import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { HighlightlyMatchIntro } from "../types/sportHighlights";
import {
  HIGHLIGHT_INTRO_MISS_TTL_MS,
  isHighlightIntroCacheFresh,
  purgeHighlightIntro,
  readHighlightIntro,
  readHighlightIntroRaw,
  resetHighlightlyStaticCacheForTests,
  writeHighlightIntro,
} from "./highlightlyStaticCache";

function sampleIntro(overrides: Partial<HighlightlyMatchIntro> = {}): HighlightlyMatchIntro {
  return {
    matchId: "M75",
    highlightlyMatchId: null,
    highlights: [],
    introHighlight: null,
    fetchedAt: new Date().toISOString(),
    source: "football-highlights-api",
    requestsUsed: 0,
    attribution: "test",
    status: "empty",
    ...overrides,
  };
}

describe("highlightlyStaticCache", () => {
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
    resetHighlightlyStaticCacheForTests();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-02T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
    resetHighlightlyStaticCacheForTests();
    vi.unstubAllGlobals();
  });

  it("persists available intros permanently", () => {
    writeHighlightIntro(
      sampleIntro({
        status: "available",
        highlights: [{ id: 1, title: "Recap" }],
      })
    );

    vi.advanceTimersByTime(HIGHLIGHT_INTRO_MISS_TTL_MS + 1);

    expect(readHighlightIntro("M75")?.status).toBe("available");
  });

  it("expires empty intros after 24h and allows retry", () => {
    writeHighlightIntro(sampleIntro({ status: "empty" }));
    expect(readHighlightIntro("M75")?.status).toBe("empty");

    vi.advanceTimersByTime(HIGHLIGHT_INTRO_MISS_TTL_MS + 1);

    expect(readHighlightIntro("M75")).toBeNull();
    expect(readHighlightIntroRaw("M75")).toBeNull();
  });

  it("never writes quota_exceeded intros to storage", () => {
    writeHighlightIntro(sampleIntro({ status: "quota_exceeded" }));
    expect(readHighlightIntroRaw("M75")).toBeNull();
  });

  it("purges stale intros on read", () => {
    writeHighlightIntro(
      sampleIntro({
        status: "error",
        fetchedAt: new Date(Date.now() - HIGHLIGHT_INTRO_MISS_TTL_MS - 1000).toISOString(),
      })
    );

    expect(readHighlightIntroRaw("M75")).not.toBeNull();
    expect(readHighlightIntro("M75")).toBeNull();
    expect(readHighlightIntroRaw("M75")).toBeNull();
  });

  it("isHighlightIntroCacheFresh treats quota_exceeded as never fresh", () => {
    expect(
      isHighlightIntroCacheFresh(
        sampleIntro({ status: "quota_exceeded", fetchedAt: new Date().toISOString() })
      )
    ).toBe(false);
  });

  it("purgeHighlightIntro removes a stored row", () => {
    writeHighlightIntro(sampleIntro({ status: "available", highlights: [{ id: 2 }] }));
    purgeHighlightIntro("M75");
    expect(readHighlightIntro("M75")).toBeNull();
  });
});
