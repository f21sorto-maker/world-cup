import { useEffect, useState } from "react";
import type { MergedMatch, Team } from "../types";
import type { YouTubeMatchVideo } from "../types/youtubeHighlights";
import { resolveYouTubeMatchVideos } from "../services/YouTubeMatchHighlightsClient";

type Input = {
  match: MergedMatch | null;
  homeTeam?: Team;
  awayTeam?: Team;
  homeTeamName: string;
  awayTeamName: string;
  /** When false, skips fetch (e.g. until Highlights tab is open). Default true. */
  enabled?: boolean;
};

/** Cold tier — resolve YouTube clips once when match is completed and enabled. */
export function useYouTubeMatchVideos(input: Input): {
  videos: YouTubeMatchVideo[];
  loading: boolean;
} {
  const [videos, setVideos] = useState<YouTubeMatchVideo[]>([]);
  const [loading, setLoading] = useState(false);
  const enabled = input.enabled !== false;
  const isCompleted = input.match?.status === "completed";
  const shouldFetch = enabled && Boolean(input.match) && isCompleted;

  useEffect(() => {
    if (!shouldFetch) {
      setVideos([]);
      setLoading(false);
      return;
    }

    const ac = new AbortController();
    setLoading(true);

    void resolveYouTubeMatchVideos({
      match: input.match!,
      homeTeam: input.homeTeam,
      awayTeam: input.awayTeam,
      homeTeamName: input.homeTeamName,
      awayTeamName: input.awayTeamName,
    })
      .then((result) => {
        if (!ac.signal.aborted) setVideos(result);
      })
      .finally(() => {
        if (!ac.signal.aborted) setLoading(false);
      });

    return () => ac.abort();
  }, [
    shouldFetch,
    input.match?.id,
    input.match?.matchId,
    input.match?.status,
    input.homeTeam?.id,
    input.awayTeam?.id,
    input.homeTeamName,
    input.awayTeamName,
    input.homeTeam,
    input.awayTeam,
    input.match,
  ]);

  return { videos, loading };
}
