import { localDateKey, yesterdayDateKey } from "./localDate";
import { teamDisplayNameFromId } from "./matchTeamDisplay";
import { prepareLiveMatchStore } from "./liveMatchStorePipeline";
import { resolveTeamRef } from "./registry";
import {
  getResultsStageSectionKey,
  getResultsStageSectionLabel,
  RESULTS_STAGE_SORT_ORDER,
  type ResultsStageSectionKey,
  type ResultsStageSectionLabels,
} from "./resultsGrouping";
import {
  resolveDisplayMatch,
  type MaterializedMatchIndex,
} from "./resolveDisplayMatch";
import type { ResultsFilters, ResultsSort } from "./resultsView";
import type { MergedMatch, Team } from "../types";

export type BuildCompletedResultsOptions = {
  filters?: ResultsFilters;
  sort?: ResultsSort;
  materializedIndex?: MaterializedMatchIndex;
};

export type RecentResultsTimeLabels = {
  today: string;
  yesterday: string;
};

export type RecentResultsSectionKey = "today" | "yesterday" | ResultsStageSectionKey;

export type RecentResultsSection = {
  key: RecentResultsSectionKey;
  kind: "time" | "stage";
  label: string;
  matches: MergedMatch[];
  total: number;
};

export { type ResultsStageSectionLabels } from "./resultsGrouping";

function totalGoals(match: MergedMatch): number {
  return (match.homeScore ?? 0) + (match.awayScore ?? 0);
}

function goalMargin(match: MergedMatch): number {
  return Math.abs((match.homeScore ?? 0) - (match.awayScore ?? 0));
}

export function compareCompletedResults(
  a: MergedMatch,
  b: MergedMatch,
  sort: ResultsSort
): number {
  switch (sort) {
    case "oldest":
      return Date.parse(a.date) - Date.parse(b.date);
    case "highest_scoring":
      return totalGoals(b) - totalGoals(a) || Date.parse(b.date) - Date.parse(a.date);
    case "biggest_win":
      return goalMargin(b) - goalMargin(a) || Date.parse(b.date) - Date.parse(a.date);
    case "recent":
    default:
      return Date.parse(b.date) - Date.parse(a.date);
  }
}

export function applyResultsFilters(
  matches: MergedMatch[],
  filters: ResultsFilters,
  teams: Record<string, Team> = {}
): MergedMatch[] {
  const q = filters.search.trim().toLowerCase();
  return matches
    .filter((match) => {
      if (filters.stage === "all") return true;
      if (filters.stage === "group") return Boolean(match.group);
      return match.stage === filters.stage;
    })
    .filter((match) => {
      if (filters.group === "all") return true;
      return match.group === filters.group;
    })
    .filter((match) => {
      if (!q) return true;
      const homeName = teamDisplayNameFromId(resolveTeamRef(match.homeTeamId, teams), teams);
      const awayName = teamDisplayNameFromId(resolveTeamRef(match.awayTeamId, teams), teams);
      return (
        homeName.toLowerCase().includes(q) ||
        awayName.toLowerCase().includes(q) ||
        match.homeTeamId.toLowerCase().includes(q) ||
        match.awayTeamId.toLowerCase().includes(q)
      );
    });
}

/** Stable id for list keys and cross-view comparison. */
export function matchResultStableId(match: MergedMatch): string {
  return match.matchId ?? match.id;
}

/**
 * Single canonical completed-results list — dedupe once, then filter to scored finals.
 */
export function listCanonicalCompletedMatches(
  liveMatches: Record<string, MergedMatch>,
  teams: Record<string, Team>
): MergedMatch[] {
  return Object.values(prepareLiveMatchStore(liveMatches, teams)).filter(
    (match) => match.status === "completed" && match.homeScore !== undefined
  );
}

/**
 * Unified results entry point for Live recent + Results tab.
 */
export function buildCompletedResultsViewModel(
  liveMatches: Record<string, MergedMatch>,
  teams: Record<string, Team>,
  options: BuildCompletedResultsOptions = {}
): MergedMatch[] {
  let matches = listCanonicalCompletedMatches(liveMatches, teams);

  if (options.filters) {
    matches = applyResultsFilters(matches, options.filters, teams);
  }

  const sort = options.sort ?? "recent";
  matches = [...matches].sort((a, b) => compareCompletedResults(a, b, sort));

  if (options.materializedIndex) {
    matches = matches.map((match) => resolveDisplayMatch(match, options.materializedIndex!));
  }

  return matches;
}

export function buildRecentResultsSections(
  completed: MergedMatch[],
  options: {
    isKnockoutActive?: boolean;
    now?: Date;
    timeLabels: RecentResultsTimeLabels;
    stageLabels: ResultsStageSectionLabels;
  }
): { sections: RecentResultsSection[]; total: number } {
  const now = options.now ?? new Date();
  const todayKey = localDateKey(now);
  const yKey = yesterdayDateKey(now);
  const { timeLabels, stageLabels, isKnockoutActive = false } = options;

  const todayMatches = completed.filter((m) => localDateKey(new Date(m.date)) === todayKey);
  const yesterdayMatches = completed.filter((m) => localDateKey(new Date(m.date)) === yKey);

  const sections: RecentResultsSection[] = [];

  if (todayMatches.length > 0) {
    sections.push({
      key: "today",
      kind: "time",
      label: `${timeLabels.today} (${todayMatches.length})`,
      matches: todayMatches,
      total: todayMatches.length,
    });
  }

  if (!isKnockoutActive && yesterdayMatches.length > 0) {
    sections.push({
      key: "yesterday",
      kind: "time",
      label: `${timeLabels.yesterday} (${yesterdayMatches.length})`,
      matches: yesterdayMatches,
      total: yesterdayMatches.length,
    });
  }

  if (isKnockoutActive) {
    const stagePool = completed.filter((m) => {
      const key = localDateKey(new Date(m.date));
      return key !== todayKey;
    });

    const byStage = new Map<ResultsStageSectionKey, MergedMatch[]>();
    for (const match of stagePool) {
      const stageKey = getResultsStageSectionKey(match);
      const bucket = byStage.get(stageKey) ?? [];
      bucket.push(match);
      byStage.set(stageKey, bucket);
    }

    const stageKeys = [...byStage.keys()].sort(
      (a, b) => RESULTS_STAGE_SORT_ORDER[b] - RESULTS_STAGE_SORT_ORDER[a]
    );

    for (const stageKey of stageKeys) {
      const matches = [...(byStage.get(stageKey) ?? [])].sort((a, b) =>
        compareCompletedResults(a, b, "recent")
      );
      if (matches.length === 0) continue;

      const stageLabel = getResultsStageSectionLabel(stageKey, stageLabels);
      sections.push({
        key: stageKey,
        kind: "stage",
        label: `${stageLabel} (${matches.length})`,
        matches,
        total: matches.length,
      });
    }
  }

  return { sections, total: completed.length };
}

export function filterCompletedResults(
  liveMatches: Record<string, MergedMatch>,
  filters: ResultsFilters,
  teams: Record<string, Team> = {}
): MergedMatch[] {
  return applyResultsFilters(listCanonicalCompletedMatches(liveMatches, teams), filters, teams);
}
