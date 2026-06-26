import { useEffect, useRef } from "react";
import { computeQualificationStatus } from "../lib/qualification";
import { logger } from "../services/Logger";
import { useStore } from "../store";
import type { QualificationStatus } from "../types";

export function useQualificationChangeLogger(): void {
  const previousStatuses = useRef<Record<string, QualificationStatus>>({});
  const teams = useStore((s) => s.teams);
  const groupStandings = useStore((s) => s.groupStandings);

  useEffect(() => {
    for (const teamId of Object.keys(teams)) {
      const current = computeQualificationStatus(teamId, groupStandings);
      const previous = previousStatuses.current[teamId];

      if (previous && previous.status !== current.status) {
        const liveGroup = Object.values(useStore.getState().liveMatches).filter(
          (m) => m.status === "live" && m.group
        ).length;
        // #region agent log
        fetch('http://127.0.0.1:7681/ingest/f800a0a9-8d11-45c6-8805-1b187f693046',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'62d96e'},body:JSON.stringify({sessionId:'62d96e',location:'useQualificationChangeLogger.ts:21',message:'liveGroup read inside effect',data:{liveGroup,teamId,liveMatchesInStore:Object.values(useStore.getState().liveMatches).filter(m=>m.status==='live').length},hypothesisId:'B2',runId:'run1',timestamp:Date.now()})}).catch(()=>{});
        // #endregion
        logger.info("Qualification status changed", "QualificationChangeLogger", {
          teamId,
          teamName: teams[teamId]?.shortName ?? teamId,
          from: previous.status,
          to: current.status,
          liveMatchCount: liveGroup
        });

        window.__lastQualificationChange = {
          teamId,
          from: previous.status,
          to: current.status,
          at: Date.now()
        };
      }

      previousStatuses.current[teamId] = current;
    }
  }, [teams, groupStandings]);
}
