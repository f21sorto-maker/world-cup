import { useMemo } from "react";
import { materializeFullSchedule } from "../lib/materializeFullSchedule";
import { readStandingsCache } from "../lib/standingsCache";
import { useStore } from "../store";
import type { MergedMatch } from "../types";

/** Schedule rows with knockout slots resolved from authoritative group standings. */
export function useMaterializedSchedule(): MergedMatch[] {
  const teams = useStore((s) => s.teams);
  const liveMatches = useStore((s) => s.liveMatches);
  const groupStandings = useStore((s) => s.groupStandings);

  const effectiveStandings = useMemo(() => {
    if (groupStandings.length > 0) return groupStandings;
    return readStandingsCache() ?? [];
  }, [groupStandings]);

  return useMemo(
    () => materializeFullSchedule(teams, liveMatches, effectiveStandings),
    [teams, liveMatches, effectiveStandings]
  );
}
