import type { Match, Team } from "../types";
import type { OutcomeProbabilities } from "../types";
import { clamp, normalizeName } from "./normalize";

export type FifaRanking = {
  rank: number;
  points: number;
};

export type MatchMarket = {
  expectedHome: number;
  probabilities?: OutcomeProbabilities;
  marketSlug?: string;
};

export type RatingMarket = {
  homeTeamId: string;
  awayTeamId: string;
  expectedHome: number;
};

type TitleCalibrationInput = Array<{ teamId: string; probability: number }>;

const HOST_BONUS: Record<string, number> = {
  unitedstates: 55,
  mexico: 45,
  canada: 35
};
const MARKET_RATING_WEIGHT = 0.5;
const TITLE_FORCE_CALIBRATION_SCALE = 60;
const TITLE_FORCE_CALIBRATION_CAP = 50;
const TITLE_FORCE_CALIBRATION_EPSILON = 0.0005;
const MARKET_LOGIT_SCALE = 180;
const MARKET_LEARNING_RATE = 0.18;
const MARKET_EPOCHS = 14;
const MARKET_MAX_STEP = 16;
const MARKET_MAX_ADJUSTMENT = 135;
const RESULT_K = 14;
const RESULT_MAX_ADJUSTMENT = 42;

function logit(probability: number): number {
  const value = clamp(probability, 0.04, 0.96);
  return Math.log(value / (1 - value));
}

function titleLogit(probability: number): number {
  const value = clamp(probability, TITLE_FORCE_CALIBRATION_EPSILON, 1 - TITLE_FORCE_CALIBRATION_EPSILON);
  return Math.log(value / (1 - value));
}

function expectedFromRatingDiff(diff: number): number {
  return 1 / (1 + Math.exp(-diff / MARKET_LOGIT_SCALE));
}

function baseRatingFor(team: Team, ranking: FifaRanking | undefined): number {
  const fifaPoints = ranking?.points;
  const fifaRating = typeof fifaPoints === "number" && Number.isFinite(fifaPoints) ? fifaPoints : team.rating;
  return fifaRating + (HOST_BONUS[normalizeName(team.name)] ?? 0);
}

function goalResult(homeGoals: number, awayGoals: number): number {
  if (homeGoals > awayGoals) return 1;
  if (homeGoals === awayGoals) return 0.5;
  return 0;
}

function marginMultiplier(homeGoals: number, awayGoals: number): number {
  return 1 + Math.min(0.8, Math.log1p(Math.abs(homeGoals - awayGoals)) * 0.45);
}

export function addModelRatings(
  teams: Team[],
  matches: Match[],
  matchMarkets: Record<string, MatchMarket>,
  ratingMarkets: RatingMarket[],
  titleProbabilities: Record<string, number>,
  fifaRankings: Record<string, FifaRanking>
): Team[] {
  const teamsById = Object.fromEntries(teams.map((team) => [team.id, team]));
  const baseRatings: Record<string, number> = {};
  const titleById: Record<string, number | undefined> = {};
  const rankingById: Record<string, FifaRanking | undefined> = {};

  for (const team of teams) {
    const normalized = normalizeName(team.name);
    const titleProbability = titleProbabilities[normalized];
    const ranking = fifaRankings[normalized];
    titleById[team.id] = titleProbability;
    rankingById[team.id] = ranking;
    baseRatings[team.id] = baseRatingFor(team, ranking);
  }

  const marketAdjustments = Object.fromEntries(teams.map((team) => [team.id, 0])) as Record<string, number>;
  const pricedMatches = matches
    .filter((match) => !match.locked && matchMarkets[match.id])
    .map((match) => {
      const expected = matchMarkets[match.id].expectedHome;
      return {
        homeTeamId: match.homeTeamId,
        awayTeamId: match.awayTeamId,
        targetDiff: MARKET_LOGIT_SCALE * logit(expected)
      };
    })
    .concat(
      ratingMarkets.map((market) => ({
        homeTeamId: market.homeTeamId,
        awayTeamId: market.awayTeamId,
        targetDiff: MARKET_LOGIT_SCALE * logit(market.expectedHome)
      }))
    );

  for (let epoch = 0; epoch < MARKET_EPOCHS; epoch += 1) {
    for (const { homeTeamId, awayTeamId, targetDiff } of pricedMatches) {
      const currentDiff =
        baseRatings[homeTeamId] +
        marketAdjustments[homeTeamId] -
        baseRatings[awayTeamId] -
        marketAdjustments[awayTeamId];
      const step = clamp((targetDiff - currentDiff) * MARKET_LEARNING_RATE, -MARKET_MAX_STEP, MARKET_MAX_STEP);

      marketAdjustments[homeTeamId] = clamp(
        marketAdjustments[homeTeamId] + step / 2,
        -MARKET_MAX_ADJUSTMENT,
        MARKET_MAX_ADJUSTMENT
      );
      marketAdjustments[awayTeamId] = clamp(
        marketAdjustments[awayTeamId] - step / 2,
        -MARKET_MAX_ADJUSTMENT,
        MARKET_MAX_ADJUSTMENT
      );
    }

    for (const team of teams) {
      marketAdjustments[team.id] *= 0.985;
    }
  }

  const resultAdjustments = Object.fromEntries(teams.map((team) => [team.id, 0])) as Record<string, number>;
  const completedMatches = matches
    .filter(
      (match) =>
        match.status === "completed" &&
        typeof match.homeScore === "number" &&
        typeof match.awayScore === "number" &&
        teamsById[match.homeTeamId] &&
        teamsById[match.awayTeamId]
    )
    .sort((a, b) => Date.parse(a.date) - Date.parse(b.date));

  for (const match of completedMatches) {
    const homeRating =
      baseRatings[match.homeTeamId] + MARKET_RATING_WEIGHT * marketAdjustments[match.homeTeamId] + resultAdjustments[match.homeTeamId];
    const awayRating =
      baseRatings[match.awayTeamId] + MARKET_RATING_WEIGHT * marketAdjustments[match.awayTeamId] + resultAdjustments[match.awayTeamId];
    const expected = expectedFromRatingDiff(homeRating - awayRating);
    const actual = goalResult(match.homeScore as number, match.awayScore as number);
    const step = clamp(
      RESULT_K * marginMultiplier(match.homeScore as number, match.awayScore as number) * (actual - expected),
      -10,
      10
    );

    resultAdjustments[match.homeTeamId] = clamp(
      resultAdjustments[match.homeTeamId] + step,
      -RESULT_MAX_ADJUSTMENT,
      RESULT_MAX_ADJUSTMENT
    );
    resultAdjustments[match.awayTeamId] = clamp(
      resultAdjustments[match.awayTeamId] - step,
      -RESULT_MAX_ADJUSTMENT,
      RESULT_MAX_ADJUSTMENT
    );
  }

  return teams.map((team) => {
    const baseRating = baseRatings[team.id];
    const marketAdjustment = MARKET_RATING_WEIGHT * marketAdjustments[team.id];
    const resultAdjustment = resultAdjustments[team.id];
    const ranking = rankingById[team.id];
    return {
      ...team,
      titleProbability: titleById[team.id],
      baseRating: Math.round(baseRating),
      fifaPoints: ranking?.points,
      fifaRank: ranking?.rank,
      marketAdjustment: Math.round(marketAdjustment),
      resultAdjustment: Math.round(resultAdjustment),
      rating: Math.round(baseRating + marketAdjustment + resultAdjustment)
    };
  });
}

export function calibrateRatingsToTitleMarket(teams: Team[], rawChampionOdds: TitleCalibrationInput): Team[] {
  const rawByTeam = Object.fromEntries(rawChampionOdds.map((row) => [row.teamId, row.probability])) as Record<string, number>;

  return teams.map((team) => {
    const market = team.titleProbability;
    const raw = rawByTeam[team.id];
    const titleCalibrationAdjustment =
      typeof market === "number" && market > 0 && typeof raw === "number"
        ? clamp(
            TITLE_FORCE_CALIBRATION_SCALE * (titleLogit(market) - titleLogit(raw)),
            -TITLE_FORCE_CALIBRATION_CAP,
            TITLE_FORCE_CALIBRATION_CAP
          )
        : 0;

    return {
      ...team,
      titleCalibrationAdjustment: Math.round(titleCalibrationAdjustment),
      rating: Math.round(team.rating + titleCalibrationAdjustment)
    };
  });
}
