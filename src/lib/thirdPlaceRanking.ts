import type { TeamRecord } from "../types";

function rankingValue(record: TeamRecord): number {
  return record.fifaRank ? 10000 - record.fifaRank : record.rating;
}

/** FIFA best-third tiebreakers: pts → GD → GF → fair play → ranking. */
export function compareThirdPlaceTeams(a: TeamRecord, b: TeamRecord): number {
  return (
    b.points - a.points ||
    b.goalDifference - a.goalDifference ||
    b.goalsFor - a.goalsFor ||
    b.conduct - a.conduct ||
    rankingValue(b) - rankingValue(a)
  );
}

export function rankThirdPlaceRecords(records: TeamRecord[]): TeamRecord[] {
  return [...records].sort(compareThirdPlaceTeams);
}
