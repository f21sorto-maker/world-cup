import { useMemo } from "react";
import { useMaterializedSchedule } from "./useMaterializedSchedule";
import {
  buildMaterializedMatchIndex,
  type MaterializedMatchIndex,
} from "../lib/resolveDisplayMatch";

/** Materialized schedule lookup keyed by id, matchId, and espnEventId. */
export function useMaterializedMatchIndex(): MaterializedMatchIndex {
  const schedule = useMaterializedSchedule();
  return useMemo(() => buildMaterializedMatchIndex(schedule), [schedule]);
}
