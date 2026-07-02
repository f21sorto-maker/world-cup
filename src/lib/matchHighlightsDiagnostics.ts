import type { HighlightlyMatchIntro } from "../types/sportHighlights";
import type { YouTubeMatchVideosResolveResult } from "../services/YouTubeMatchHighlightsClient";

export type HighlightsEmptyReason =
  | "pending_match"
  | "no_rapidapi_key"
  | "youtube_api_blocked"
  | "highlightly_quota"
  | "highlightly_unavailable"
  | "highlightly_empty"
  | "no_verified_clips"
  | "generic";

export type HighlightsEmptyNotice = {
  reason: HighlightsEmptyReason;
  title: string;
  body: string;
};

/** Dev-only — production injects RAPIDAPI_KEY on the server proxy. */
export function isRapidApiKeyConfiguredForDev(): boolean {
  if (!import.meta.env.DEV) return true;
  return Boolean(String(import.meta.env.VITE_RAPIDAPI_KEY ?? "").trim());
}

export function buildYouTubeHighlightsSearchUrl(homeTeamName: string, awayTeamName: string): string {
  const query = `${homeTeamName} vs ${awayTeamName} World Cup 2026 highlights FOX FIFA Telemundo`;
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
}

export function resolveHighlightsEmptyNotices(input: {
  isCompleted: boolean;
  introStatus?: HighlightlyMatchIntro["status"];
  youtube: Pick<YouTubeMatchVideosResolveResult, "source" | "apiBlocked" | "videos">;
  hasHighlightly: boolean;
  hasKampFallback: boolean;
}): HighlightsEmptyNotice[] {
  const notices: HighlightsEmptyNotice[] = [];

  if (!input.isCompleted) {
    notices.push({
      reason: "pending_match",
      title: "Match still in progress",
      body: "Full highlight recaps usually land within 1–48 hours after the final whistle.",
    });
    return notices;
  }

  if (
    !isRapidApiKeyConfiguredForDev() &&
    input.youtube.source !== "canonical" &&
    input.youtube.videos.length === 0
  ) {
    notices.push({
      reason: "no_rapidapi_key",
      title: "RapidAPI key not configured (dev)",
      body: "Add VITE_RAPIDAPI_KEY to .env.local and restart npm run dev to enable live YouTube search. Bundled clips still work for selected knockout matches.",
    });
  }

  if (input.youtube.apiBlocked && input.youtube.videos.length === 0) {
    notices.push({
      reason: "youtube_api_blocked",
      title: "YouTube search unavailable",
      body: "RapidAPI returned 401/403 for YouTube or Highlightly hosts this session. Check your subscription and key, then reload.",
    });
  }

  if (input.introStatus === "quota_exceeded") {
    notices.push({
      reason: "highlightly_quota",
      title: "Highlightly monthly quota reached",
      body: "The Highlightly Football API budget is 100 requests per month. Cached clips and YouTube fallbacks still apply when available.",
    });
  } else if (input.introStatus === "error") {
    notices.push({
      reason: "highlightly_unavailable",
      title: "Highlightly API unavailable",
      body: "Highlightly could not be reached. YouTube highlights below may still work.",
    });
  } else if (input.introStatus === "empty" && !input.hasHighlightly) {
    notices.push({
      reason: "highlightly_empty",
      title: "No Highlightly clips yet",
      body: "This fixture is not in Highlightly or has no indexed clips. Retries automatically for 24 hours.",
    });
  }

  if (
    input.isCompleted &&
    input.youtube.videos.length === 0 &&
    input.youtube.source !== "canonical" &&
    !input.youtube.apiBlocked &&
    isRapidApiKeyConfiguredForDev()
  ) {
    notices.push({
      reason: "no_verified_clips",
      title: "No verified YouTube clip found",
      body: "Search did not return a FOX, FIFA, or Telemundo highlight that matched both teams. Try the links below or check again later.",
    });
  }

  if (notices.length === 0) {
    notices.push({
      reason: "generic",
      title: "Highlights not available yet",
      body: "Clips from FOX, FIFA, or Telemundo on YouTube usually appear within 1–2 hours after full time.",
    });
  }

  return notices;
}

export type HighlightsExternalLink = {
  label: string;
  href: string;
};

export function buildHighlightsExternalLinks(input: {
  homeTeamName: string;
  awayTeamName: string;
  kampHighlightsUrl?: string;
}): HighlightsExternalLink[] {
  const links: HighlightsExternalLink[] = [
    {
      label: "Search on YouTube",
      href: buildYouTubeHighlightsSearchUrl(input.homeTeamName, input.awayTeamName),
    },
  ];

  if (input.kampHighlightsUrl) {
    links.push({
      label: "Watch on Kamp",
      href: input.kampHighlightsUrl,
    });
  }

  return links;
}
