import type { OutcomeProbabilities, OddsSnapshot } from "../types";

/** Convert implied probability (0–1) to American moneyline odds. */
export function probabilityToAmerican(p: number): number {
  if (!Number.isFinite(p) || p <= 0 || p >= 1) return 0;
  if (p >= 0.5) return Math.round((-100 * p) / (1 - p));
  return Math.round((100 * (1 - p)) / p);
}

export function probabilitiesToAmericanOdds(probabilities: OutcomeProbabilities): {
  homeWin: number;
  draw: number;
  awayWin: number;
} {
  return {
    homeWin: probabilityToAmerican(probabilities.homeWin),
    draw: probabilityToAmerican(probabilities.draw),
    awayWin: probabilityToAmerican(probabilities.awayWin),
  };
}

export function snapshotFromProbabilities(
  matchId: string,
  probabilities: OutcomeProbabilities,
  source: OddsSnapshot["source"],
  marketSlug?: string
): OddsSnapshot {
  const american = probabilitiesToAmericanOdds(probabilities);
  return {
    matchId,
    ...american,
    fetchedAt: Date.now(),
    source,
    marketSlug,
  };
}
