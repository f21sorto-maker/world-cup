import {
  delay,
  fetchDailyPredictionsPage,
  fetchFederations,
  fetchLeagues,
  fetchMarkets,
  fetchPerformanceStats,
  isFootballPredictionDisabled,
} from "../FootballPredictionClient";
import { FOOTBALL_PREDICTION_FEDERATIONS } from "../../config/footballPredictionEndpoints";
import {
  isFootballPredictionStale,
  readFootballPredictionStore,
  writeFootballPredictionStore,
} from "../../lib/footballPredictionCache";
import type { FootballPredictionBundle } from "../../types/footballPrediction";
import { logger } from "../Logger";

const PAGE_DELAY_MS = 650;
const MAX_PAGES = 20;

export function loadCachedFootballPredictionBundle(): FootballPredictionBundle | null {
  return readFootballPredictionStore().bundle;
}

async function fetchAllDailyPredictions(): Promise<{
  matches: import("../FootballPredictionClient").FootballPredictionMatch[];
}> {
  const seen = new Set<string>();
  const all: import("../FootballPredictionClient").FootballPredictionMatch[] = [];

  const ingest = (matches: import("../FootballPredictionClient").FootballPredictionMatch[]) => {
    for (const match of matches) {
      if (seen.has(match.id)) continue;
      seen.add(match.id);
      all.push(match);
    }
  };

  let page = 1;
  let totalPages = 1;
  while (page <= totalPages && page <= MAX_PAGES) {
    if (page > 1) await delay(PAGE_DELAY_MS);
    const result = await fetchDailyPredictionsPage(page);
    ingest(result.matches);
    totalPages = result.totalPages || 1;
    if (result.matches.length === 0) break;
    page += 1;
  }

  for (const federation of FOOTBALL_PREDICTION_FEDERATIONS) {
    await delay(PAGE_DELAY_MS);
    const fedResult = await fetchDailyPredictionsPage(1, { federation });
    ingest(fedResult.matches);
  }

  return { matches: all };
}

export async function fetchFootballPredictionBundle(): Promise<FootballPredictionBundle> {
  const unavailable: string[] = [];

  const [federations, markets, leagues, performance] = await Promise.all([
    fetchFederations(),
    fetchMarkets(),
    fetchLeagues(),
    fetchPerformanceStats({ market: "classic" }),
  ]);

  if (federations.length === 0) unavailable.push("list-federations");
  if (markets.length === 0) unavailable.push("list-markets");

  await delay(PAGE_DELAY_MS);
  const { matches: dailyPredictions } = await fetchAllDailyPredictions();

  return {
    fetchedAt: new Date().toISOString(),
    federations,
    markets,
    leagues,
    performance,
    dailyPredictions,
    vipFeatured: [],
    vipScores: [],
    unavailable,
  };
}

export async function syncFootballPredictionsIfNeeded(
  onBundle?: (bundle: FootballPredictionBundle) => void
): Promise<FootballPredictionBundle | null> {
  if (isFootballPredictionDisabled()) return loadCachedFootballPredictionBundle();

  const store = readFootballPredictionStore();
  if (!isFootballPredictionStale(store.lastSyncAt) && store.bundle) {
    return store.bundle;
  }

  logger.info("Football prediction daily sync started", "FootballPredictionSync");

  try {
    const bundle = await fetchFootballPredictionBundle();
    const next = { version: 1 as const, lastSyncAt: new Date().toISOString(), bundle };
    writeFootballPredictionStore(next);
    onBundle?.(bundle);
    logger.info("Football prediction daily sync finished", "FootballPredictionSync", {
      predictions: bundle.dailyPredictions.length,
      leagues: bundle.leagues.length,
      federations: bundle.federations.length,
    });
    return bundle;
  } catch (error) {
    logger.warn("Football prediction sync failed", "FootballPredictionSync", {
      error: error instanceof Error ? error.message : String(error),
    });
    return store.bundle;
  }
}
