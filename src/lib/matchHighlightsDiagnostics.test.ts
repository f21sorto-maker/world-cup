import { describe, expect, it, vi } from "vitest";
import {
  buildHighlightsExternalLinks,
  buildYouTubeHighlightsSearchUrl,
  isRapidApiKeyConfiguredForDev,
  resolveHighlightsEmptyNotices,
} from "./matchHighlightsDiagnostics";

describe("matchHighlightsDiagnostics", () => {
  it("buildYouTubeHighlightsSearchUrl encodes team names", () => {
    const url = buildYouTubeHighlightsSearchUrl("Germany", "Paraguay");
    expect(url).toContain("youtube.com/results");
    expect(url).toContain(encodeURIComponent("Germany vs Paraguay"));
  });

  it("resolveHighlightsEmptyNotices flags missing dev RapidAPI key", () => {
    vi.stubEnv("DEV", true);
    vi.stubEnv("VITE_RAPIDAPI_KEY", "");

    const notices = resolveHighlightsEmptyNotices({
      isCompleted: true,
      youtube: { source: "none", apiBlocked: false, videos: [] },
      hasHighlightly: false,
      hasKampFallback: false,
    });

    expect(notices.some((n) => n.reason === "no_rapidapi_key")).toBe(true);
    vi.unstubAllEnvs();
  });

  it("resolveHighlightsEmptyNotices skips RapidAPI key notice for canonical source", () => {
    vi.stubEnv("DEV", true);
    vi.stubEnv("VITE_RAPIDAPI_KEY", "");

    const notices = resolveHighlightsEmptyNotices({
      isCompleted: true,
      youtube: { source: "canonical", apiBlocked: false, videos: [] },
      hasHighlightly: false,
      hasKampFallback: false,
    });

    expect(notices.some((n) => n.reason === "no_rapidapi_key")).toBe(false);
    vi.unstubAllEnvs();
  });

  it("resolveHighlightsEmptyNotices surfaces quota and blocked API states", () => {
    const quota = resolveHighlightsEmptyNotices({
      isCompleted: true,
      introStatus: "quota_exceeded",
      youtube: { source: "none", apiBlocked: false, videos: [] },
      hasHighlightly: false,
      hasKampFallback: false,
    });
    expect(quota.some((n) => n.reason === "highlightly_quota")).toBe(true);

    const blocked = resolveHighlightsEmptyNotices({
      isCompleted: true,
      youtube: { source: "none", apiBlocked: true, videos: [] },
      hasHighlightly: false,
      hasKampFallback: false,
    });
    expect(blocked.some((n) => n.reason === "youtube_api_blocked")).toBe(true);
  });

  it("buildHighlightsExternalLinks includes YouTube and Kamp", () => {
    const links = buildHighlightsExternalLinks({
      homeTeamName: "Germany",
      awayTeamName: "Paraguay",
      kampHighlightsUrl: "https://example.com/highlight",
    });
    expect(links).toHaveLength(2);
    expect(links[0]?.label).toBe("Search on YouTube");
    expect(links[1]?.label).toBe("Watch on Kamp");
  });

  it("isRapidApiKeyConfiguredForDev returns true outside dev", () => {
    vi.stubEnv("DEV", false);
    vi.stubEnv("VITE_RAPIDAPI_KEY", "");
    expect(isRapidApiKeyConfiguredForDev()).toBe(true);
    vi.unstubAllEnvs();
  });
});
