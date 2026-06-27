import type { MergedMatch, OutcomeProbabilities, PolymarketMatchMarket, Team } from "../types";
import { normalizeName, pairKey } from "./normalize";

const MATCH_WINDOW_MS = 36 * 60 * 60 * 1000;

function buildMarketIndex(markets: PolymarketMatchMarket[]): Map<string, PolymarketMatchMarket[]> {
  const index = new Map<string, PolymarketMatchMarket[]>();
  for (const market of markets) {
    const key = pairKey(market.teamAKey, market.teamBKey);
    if (!key) continue;
    const bucket = index.get(key) ?? [];
    bucket.push(market);
    index.set(key, bucket);
  }
  return index;
}

function orientedProbabilities(
  market: PolymarketMatchMarket,
  home: Team,
  away: Team
): OutcomeProbabilities | undefined {
  if (!market.probabilities) return undefined;

  const homeKey = normalizeName(home.name);
  const awayKey = normalizeName(away.name);
  if (market.teamAKey === homeKey && market.teamBKey === awayKey) {
    return market.probabilities;
  }
  if (market.teamAKey === awayKey && market.teamBKey === homeKey) {
    return {
      homeWin: market.probabilities.awayWin,
      draw: market.probabilities.draw,
      awayWin: market.probabilities.homeWin,
    };
  }
  return undefined;
}

function orientedAdvanceProbabilities(
  market: PolymarketMatchMarket,
  home: Team,
  away: Team
): OutcomeProbabilities | undefined {
  if (typeof market.teamAAdvanceProbability !== "number") return undefined;

  const homeKey = normalizeName(home.name);
  const homeAdvance =
    market.teamAKey === homeKey
      ? market.teamAAdvanceProbability
      : market.teamBKey === homeKey
        ? 1 - market.teamAAdvanceProbability
        : undefined;

  if (homeAdvance == null) return undefined;

  return {
    homeWin: homeAdvance,
    draw: 0,
    awayWin: 1 - homeAdvance,
  };
}

function findMarketForMatch(
  match: MergedMatch,
  teamsById: Record<string, Team>,
  marketIndex: Map<string, PolymarketMatchMarket[]>
): PolymarketMatchMarket | undefined {
  const home = teamsById[match.homeTeamId];
  const away = teamsById[match.awayTeamId];
  if (!home || !away) return undefined;

  const candidates = marketIndex.get(pairKey(home.name, away.name)) ?? [];
  const matchTime = Date.parse(match.date);

  return candidates
    .map((market) => ({
      market,
      diff: Math.abs(Date.parse(market.date) - matchTime),
    }))
    .filter(({ diff }) => Number.isFinite(diff) && diff < MATCH_WINDOW_MS)
    .sort((a, b) => a.diff - b.diff)[0]?.market;
}

export type PolymarketOddsLookup = {
  probabilities: OutcomeProbabilities;
  marketSlug?: string;
  twoWay?: boolean;
};

/** Resolve Polymarket 1X2 or knockout advance prices for a fixture. */
export function resolvePolymarketOdds(
  match: MergedMatch,
  teamsById: Record<string, Team>,
  markets: PolymarketMatchMarket[]
): PolymarketOddsLookup | null {
  if (markets.length === 0) return null;

  const home = teamsById[match.homeTeamId];
  const away = teamsById[match.awayTeamId];
  if (!home || !away) return null;

  if (match.prediction?.method === "polymarket") {
    return {
      probabilities: {
        homeWin: match.prediction.homeWin,
        draw: match.prediction.draw,
        awayWin: match.prediction.awayWin,
      },
      marketSlug: match.prediction.marketSlug,
    };
  }

  const market = findMarketForMatch(match, teamsById, buildMarketIndex(markets));
  if (!market) return null;

  const moneyline = orientedProbabilities(market, home, away);
  if (moneyline) {
    return { probabilities: moneyline, marketSlug: market.marketSlug };
  }

  const advance = orientedAdvanceProbabilities(market, home, away);
  if (advance) {
    return { probabilities: advance, marketSlug: market.marketSlug, twoWay: true };
  }

  return null;
}
