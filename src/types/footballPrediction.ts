import type {
  FootballPredictionLeague,
  FootballPredictionMatch,
  FootballPredictionPerformance,
} from "../services/FootballPredictionClient";

export type FootballPredictionBundle = {
  fetchedAt: string;
  federations: string[];
  markets: string[];
  leagues: FootballPredictionLeague[];
  performance: FootballPredictionPerformance | null;
  dailyPredictions: FootballPredictionMatch[];
  /** v1-only — always empty on Boggio v2 API. */
  vipFeatured: FootballPredictionMatch[];
  /** v1-only — always empty on Boggio v2 API. */
  vipScores: FootballPredictionMatch[];
  unavailable: string[];
};

export type FootballPredictionCacheStore = {
  version: 1;
  lastSyncAt: string | null;
  bundle: FootballPredictionBundle | null;
};
