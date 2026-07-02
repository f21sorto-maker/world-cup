import { useEffect, useRef, useState } from "react";
import type { MergedMatch, Team } from "../types";
import type { YouTubeMatchVideo } from "../types/youtubeHighlights";
import { logMatchDetailFetch } from "../lib/matchDetailDebug";
import {
  resolveYouTubeMatchVideos,
  type YouTubeMatchVideosResolveResult,
} from "../services/YouTubeMatchHighlightsClient";

type Input = {
  match: MergedMatch | null;
  homeTeam?: Team;
  awayTeam?: Team;
  homeTeamName: string;
  awayTeamName: string;
  /** When false, skips fetch (e.g. until Highlights tab is open). Default true. */
  enabled?: boolean;
};

const EMPTY_RESOLVE: YouTubeMatchVideosResolveResult = {
  videos: [],
  source: "none",
  apiBlocked: false,
};

/** Cold tier — resolve YouTube clips once when match is completed and enabled. */
export function useYouTubeMatchVideos(input: Input): {
  videos: YouTubeMatchVideo[];
  loading: boolean;
  resolveResult: YouTubeMatchVideosResolveResult;
} {
  const matchRef = useRef(input.match);
  const homeTeamRef = useRef(input.homeTeam);
  const awayTeamRef = useRef(input.awayTeam);
  matchRef.current = input.match;
  homeTeamRef.current = input.homeTeam;
  awayTeamRef.current = input.awayTeam;

  const [videos, setVideos] = useState<YouTubeMatchVideo[]>([]);
  const [resolveResult, setResolveResult] = useState<YouTubeMatchVideosResolveResult>(EMPTY_RESOLVE);
  const [loading, setLoading] = useState(false);

  const enabled = input.enabled !== false;
  const matchId = input.match?.id;
  const matchStatus = input.match?.status;
  const homeTeamId = input.homeTeam?.id;
  const awayTeamId = input.awayTeam?.id;
  const isCompleted = matchStatus === "completed";
  const shouldFetch = enabled && Boolean(matchId) && isCompleted;

  useEffect(() => {
    if (!shouldFetch) {
      setVideos([]);
      setResolveResult(EMPTY_RESOLVE);
      setLoading(false);
      return;
    }

    const currentMatch = matchRef.current;
    if (!currentMatch) return;

    const ac = new AbortController();
    setLoading(true);
    logMatchDetailFetch("youtubeHighlights", currentMatch.id);

    void resolveYouTubeMatchVideos({
      match: currentMatch,
      homeTeam: homeTeamRef.current,
      awayTeam: awayTeamRef.current,
      homeTeamName: input.homeTeamName,
      awayTeamName: input.awayTeamName,
    })
      .then((result) => {
        if (!ac.signal.aborted) {
          setVideos(result.videos);
          setResolveResult(result);
        }
      })
      .finally(() => {
        if (!ac.signal.aborted) setLoading(false);
      });

    return () => ac.abort();
  }, [
    shouldFetch,
    matchId,
    input.match?.matchId,
    matchStatus,
    homeTeamId,
    awayTeamId,
    input.homeTeamName,
    input.awayTeamName,
  ]);

  return { videos, loading, resolveResult };
}
