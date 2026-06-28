import type { Team } from "./engineTypes.js";

/** Normalize team id for standings keys — alias expansion lives in BC1. */
export function resolveCanonicalTeamId(
  teamId: string,
  team?: Pick<Team, "abbreviation" | "name" | "shortName">
): string {
  const hints = [team?.abbreviation, team?.name, team?.shortName, teamId];
  for (const hint of hints) {
    if (!hint) continue;
    const normalized = hint.trim().toLowerCase();
    if (normalized.length >= 2 && normalized.length <= 4) {
      return normalized.slice(0, 3);
    }
  }
  return teamId;
}
