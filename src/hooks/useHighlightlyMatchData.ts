import { useEffect, useRef, useState } from "react";
import type { MergedMatch, Team } from "../types";
import type { HighlightlyMatchBundle } from "../types/sportHighlights";
import { logMatchDetailFetch } from "../lib/matchDetailDebug";
import { fetchHighlightlyMatchBundle } from "../services/matchDetail/fetchHighlightlyMatchBundle";

const EMPTY: HighlightlyMatchBundle = {
  highlightlyMatchId: null,
  matchDetail: null,
  statistics: [],
  highlights: [],
  liveEvents: [],
  lineups: null,
  lastFiveHome: [],
  lastFiveAway: [],
  head2Head: [],
  fetchedAt: 0,
};

type Options = {
  /** When false, skips fetch until a tab that needs Highlightly data is active. */
  enabled?: boolean;
};

/** Cold tier — Highlightly bundle once per match open (no interval polling). */
export function useHighlightlyMatchData(
  match: MergedMatch | null,
  homeTeam?: Team,
  awayTeam?: Team,
  options?: Options
): HighlightlyMatchBundle & { loading: boolean } {
  const enabled = options?.enabled !== false;
  const matchRef = useRef(match);
  const homeTeamRef = useRef(homeTeam);
  const awayTeamRef = useRef(awayTeam);
  matchRef.current = match;
  homeTeamRef.current = homeTeam;
  awayTeamRef.current = awayTeam;

  const matchId = match?.id;
  const matchDate = match?.date;
  const matchStatus = match?.status;
  const homeTeamId = homeTeam?.id;
  const awayTeamId = awayTeam?.id;

  const [bundle, setBundle] = useState<HighlightlyMatchBundle>(EMPTY);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled || !matchId) {
      if (!matchId) setBundle(EMPTY);
      if (!enabled) setLoading(false);
      return;
    }

    const currentMatch = matchRef.current;
    if (!currentMatch) return;

    const ac = new AbortController();
    setLoading(true);
    logMatchDetailFetch("highlightly", currentMatch.id);

    void fetchHighlightlyMatchBundle({
      match: currentMatch,
      homeTeam: homeTeamRef.current,
      awayTeam: awayTeamRef.current,
      detailView: true,
    }).then((result) => {
      if (ac.signal.aborted) return;
      setBundle(result);
      setLoading(false);
    });

    return () => ac.abort();
  }, [enabled, matchId, matchDate, matchStatus, homeTeamId, awayTeamId]);

  return { ...bundle, loading };
}
