import { useEffect, useState } from "react";
import type { Lineup, MatchStatisticsBundle, MergedMatch, CommentaryEntry } from "../types";
import { useMatchEnrichment } from "./useMatchEnrichment";
import { DataOrchestrator } from "../services/orchestrator/DataOrchestrator";
import { fetchMatchBundle } from "../services/matchDetail/fetchMatchBundle";
import { isApiEnabled } from "../config/apiFlags";
import { isWc2026LiveDisabled } from "../services/WorldCup2026LiveClient";

type BundleState = {
  statistics: MatchStatisticsBundle | null;
  lineups: Lineup[];
  commentary: CommentaryEntry[];
  loading: boolean;
  error: string | null;
  fetchedAt: number | null;
};

const INITIAL_STATE: BundleState = {
  statistics: null,
  lineups: [],
  commentary: [],
  loading: false,
  error: null,
  fetchedAt: null,
};

/** Match detail bundle — orchestrator enrichment + direct WC Live fetch. */
export function useMatchDetailBundle(
  match: MergedMatch | null,
  wcMatchId: string | null
): BundleState & { refetch: () => void } {
  const matchId = match?.id ?? null;
  const enrichment = useMatchEnrichment(matchId);
  const [direct, setDirect] = useState<Pick<BundleState, "statistics" | "lineups" | "commentary">>({
    statistics: null,
    lineups: [],
    commentary: [],
  });
  const [directLoading, setDirectLoading] = useState(false);
  const [fetchedAt, setFetchedAt] = useState<number | null>(null);
  const [forceKey, setForceKey] = useState(0);

  useEffect(() => {
    if (enrichment.enrichment) {
      setFetchedAt(Date.now());
    }
  }, [enrichment.enrichment]);

  useEffect(() => {
    if (!match || !wcMatchId) return;
    if (!isApiEnabled("wc2026Live") || isWc2026LiveDisabled()) return;

    let cancelled = false;
    setDirectLoading(true);

    void fetchMatchBundle(match, wcMatchId, forceKey > 0).then((bundle) => {
      if (cancelled) return;
      setDirect({
        statistics: bundle.statistics,
        lineups: bundle.lineups,
        commentary: bundle.commentary.map((e) => ({
          minute: typeof e.minute === "number" ? e.minute : Number(e.minute) || 0,
          text: e.text,
          type: e.type as CommentaryEntry["type"],
        })),
      });
      setFetchedAt(bundle.fetchedAt);
      setDirectLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [match, wcMatchId, forceKey]);

  const refetch = () => {
    if (match) {
      DataOrchestrator.getInstance().clearEnrichmentCache(match.id);
      void DataOrchestrator.getInstance().enrichMatch(match.id);
    }
    setForceKey((k) => k + 1);
  };

  const statistics = enrichment.statistics ?? direct.statistics;
  const lineups = enrichment.lineups.length > 0 ? enrichment.lineups : direct.lineups;
  const commentary = enrichment.commentary.length > 0 ? enrichment.commentary : direct.commentary;

  return {
    statistics,
    lineups,
    commentary,
    loading: enrichment.loading || directLoading,
    error: enrichment.error,
    fetchedAt,
    refetch,
  };
}
