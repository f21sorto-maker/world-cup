import type { Team } from "../types";

/** FIFA World Cup titles by ESPN / FIFA abbreviation (through 2022). */
export const WORLD_CUP_TITLES: Record<string, number> = {
  ARG: 3,
  BRA: 5,
  ENG: 1,
  ESP: 1,
  FRA: 2,
  GER: 4,
  ITA: 4,
  URU: 2,
};

/** Returns how many World Cups a nation has won (0 if none). */
export function getWorldCupTitles(abbreviation: string | undefined): number {
  if (!abbreviation) return 0;
  return WORLD_CUP_TITLES[abbreviation.toUpperCase()] ?? 0;
}

export function getTeamWorldCupTitles(team?: Pick<Team, "abbreviation" | "shortName"> | null): number {
  if (!team) return 0;
  return getWorldCupTitles(team.abbreviation ?? team.shortName);
}
