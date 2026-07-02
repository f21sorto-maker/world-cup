import highlightsJson from "../data/canonicalMatchHighlights.json";
import type { MergedMatch, Team } from "../types";
import type { YouTubeMatchVideo, YouTubeRawCandidate } from "../types/youtubeHighlights";
import { verifyYouTubeMatchVideo } from "../services/youtubeHighlights/verifyYouTubeMatchVideo";

type CanonicalHighlightRow = {
  candidates: YouTubeRawCandidate[];
};

const byMatchId = highlightsJson.matches as Record<string, CanonicalHighlightRow>;

function resolveMatchKeys(match: MergedMatch): string[] {
  const keys = new Set<string>();
  if (match.matchId) keys.add(match.matchId);
  if (match.id) keys.add(match.id);
  return [...keys];
}

/** Verified bundled highlight clips for locked canonical fixtures (e.g. M75). */
export function resolveCanonicalMatchHighlightVideos(input: {
  match: MergedMatch;
  homeTeam?: Team;
  awayTeam?: Team;
  homeTeamName: string;
  awayTeamName: string;
}): YouTubeMatchVideo[] {
  if (input.match.status !== "completed") return [];

  const row = resolveMatchKeys(input.match)
    .map((key) => byMatchId[key])
    .find(Boolean);
  if (!row) return [];

  return row.candidates
    .map((candidate) =>
      verifyYouTubeMatchVideo(candidate, {
        match: input.match,
        homeTeam: input.homeTeam,
        awayTeam: input.awayTeam,
        homeTeamName: input.homeTeamName,
        awayTeamName: input.awayTeamName,
      })
    )
    .filter((video): video is YouTubeMatchVideo => video != null);
}
