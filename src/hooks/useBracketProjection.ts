import { useDeferredValue, useMemo } from "react";
import { buildCanonicalTournamentDataset } from "../lib/canonicalTournamentDataset";
import { buildQualificationContext } from "../lib/qualification";
import { projectTournament } from "../lib/tournament";
import { useMaterializedSchedule } from "./useMaterializedSchedule";
import { useStore } from "../store";

export function useBracketProjection() {
  const teamsMap = useStore((s) => s.teams);
  const liveMatchesMap = useStore((s) => s.liveMatches);
  const markets = useStore((s) => s.knockoutMarkets);
  const overrides = useStore((s) => s.scoreOverrides);
  const mergedSchedule = useMaterializedSchedule();

  const canonical = useMemo(
    () =>
      buildCanonicalTournamentDataset({
        teams: teamsMap,
        liveMatches: liveMatchesMap,
        knockoutMarkets: markets,
      }),
    [teamsMap, liveMatchesMap, markets]
  );

  const qualContext = useMemo(
    () => buildQualificationContext(canonical.matches, canonical.teams),
    [canonical.matches, canonical.teams]
  );

  const projectionMatches = useMemo(
    () =>
      canonical.matches.filter((m) => {
        if (m.group) return true;
        return m.homeScore !== undefined && m.awayScore !== undefined;
      }) as Parameters<typeof projectTournament>[1],
    [canonical.matches]
  );

  const deferredProjectionMatches = useDeferredValue(projectionMatches);

  return useMemo(() => {
    if (!canonical.teams.length) return null;
    return projectTournament(
      canonical.teams,
      deferredProjectionMatches,
      markets,
      overrides,
      {},
      qualContext.lockedGroupMatchCount,
      qualContext.lockedStandingsByGroup,
      mergedSchedule
    );
  }, [
    canonical.teams,
    deferredProjectionMatches,
    markets,
    overrides,
    qualContext.lockedGroupMatchCount,
    qualContext.lockedStandingsByGroup,
    mergedSchedule,
  ]);
}
