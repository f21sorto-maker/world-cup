import type { GroupStanding, MergedMatch, Team } from "../../types";
import { isApiEnabled } from "../../config/apiFlags";
import { deriveStandingsIfScored } from "../../lib/qualification";
import { readStandingsCache } from "../../lib/standingsCache";
import { acquireApiQuota, logApiQuotaBlock } from "../ApiQuotaGovernor";
import {
  buildStandingsFromTeamGroups,
  mergeStandingsPartials,
  normalizeStandingsTeamIds,
  normalizeWCLiveStandings,
  normalizeWC2026Groups,
  normalizeZafronixBracket,
  normalizeZafronixStandings,
} from "../adapters/normalizeStandings";
import {
  fetchBracket as fetchZafronixBracket,
  fetchStandings as fetchZafronixStandings,
  isZafronixDisabled,
} from "../ZafronixClient";
import {
  fetchStandings as fetchWcLiveStandings,
  isWc2026LiveDisabled,
} from "../WorldCup2026LiveClient";
import { fetchGroups, isWorldCup2026Disabled } from "../WorldCup2026Client";
import { logger } from "../Logger";

export type ResolveGroupStandingsOptions = {
  matches: MergedMatch[];
  teamsList: Team[];
  currentStandings?: GroupStanding[];
  /** When false, only merge cache + local derivation (no network). */
  includeRemote?: boolean;
};

function buildLocalStandingsBaseline(
  matches: MergedMatch[],
  teamsList: Team[],
  currentStandings: GroupStanding[]
): GroupStanding[] {
  const cached = readStandingsCache() ?? [];
  const derived = deriveStandingsIfScored(matches, teamsList);
  const seeded = buildStandingsFromTeamGroups(teamsList);
  return mergeStandingsPartials(cached, currentStandings, derived ?? [], seeded);
}

function rowSignature(row: GroupStanding["rows"][number]): string {
  return `${row.played}|${row.points}|${row.goalDifference}|${row.goalsFor}|${row.goalsAgainst}`;
}

function verifyRemoteStandings(
  sources: Array<{ source: string; standings: GroupStanding[] }>
): GroupStanding[] {
  if (sources.length < 2) return [];
  const byGroup = new Map<string, Map<string, Map<string, { row: GroupStanding["rows"][number]; votes: number }>>>();

  for (const source of sources) {
    for (const group of source.standings) {
      let teamMap = byGroup.get(group.group);
      if (!teamMap) {
        teamMap = new Map();
        byGroup.set(group.group, teamMap);
      }
      for (const row of group.rows) {
        let sigMap = teamMap.get(row.teamId);
        if (!sigMap) {
          sigMap = new Map();
          teamMap.set(row.teamId, sigMap);
        }
        const signature = rowSignature(row);
        const existing = sigMap.get(signature);
        if (existing) {
          existing.votes += 1;
        } else {
          sigMap.set(signature, { row, votes: 1 });
        }
      }
    }
  }

  const verified: GroupStanding[] = [];
  let unanimousRows = 0;
  let totalVerifiedRows = 0;

  for (const [group, teamMap] of byGroup.entries()) {
    const rows: GroupStanding["rows"] = [];
    for (const sigMap of teamMap.values()) {
      const best = [...sigMap.values()].sort((a, b) => {
        if (b.votes !== a.votes) return b.votes - a.votes;
        if (b.row.played !== a.row.played) return b.row.played - a.row.played;
        if (b.row.points !== a.row.points) return b.row.points - a.row.points;
        return b.row.goalDifference - a.row.goalDifference;
      })[0];
      if (best && best.votes >= 2) {
        rows.push(best.row);
        totalVerifiedRows += 1;
        if (best.votes === sources.length) unanimousRows += 1;
      }
    }
    if (rows.length > 0) {
      rows.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
        if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
        return a.teamId.localeCompare(b.teamId);
      });
      verified.push({ group: group as GroupStanding["group"], rows });
    }
  }

  if (verified.length > 0) {
    logger.info("Remote standings verification completed", "resolveGroupStandings", {
      sources: sources.map((s) => s.source),
      verifiedGroups: verified.length,
      totalVerifiedRows,
      unanimousRows,
      allSourcesAgreement: totalVerifiedRows > 0 && unanimousRows === totalVerifiedRows,
    });
  }

  return verified;
}

async function fetchRemoteStandings(teamsById: Record<string, Team>): Promise<GroupStanding[]> {
  const sourceResults: Array<{ source: string; standings: GroupStanding[] }> = [];
  const maybePush = (source: string, standings: GroupStanding[] | null): void => {
    if (!standings || standings.length === 0) return;
    sourceResults.push({
      source,
      standings: normalizeStandingsTeamIds(standings, teamsById),
    });
  };

  if (isApiEnabled("wc2026Live") && !isWc2026LiveDisabled()) {
    const normalized = normalizeWCLiveStandings(await fetchWcLiveStandings());
    maybePush("wclive", normalized.length > 0 ? normalized : null);
  }

  if (isApiEnabled("zafronix") && !isZafronixDisabled()) {
    const quota = acquireApiQuota("zafronix", "background");
    if (!quota.allowed) {
      logApiQuotaBlock("zafronix", "background", quota);
    } else {
      const fromStandings = normalizeZafronixStandings(await fetchZafronixStandings(2026));
      if (fromStandings.length > 0) {
        maybePush("zafronix-standings", fromStandings);
      } else {
        const fromBracket = normalizeZafronixBracket(await fetchZafronixBracket(2026));
        maybePush("zafronix-bracket", fromBracket.length > 0 ? fromBracket : null);
      }
    }
  }

  if (isApiEnabled("wc2026Teams") && !isWorldCup2026Disabled()) {
    const quota = acquireApiQuota("wc2026Teams", "background");
    if (!quota.allowed) {
      logApiQuotaBlock("wc2026Teams", "background", quota);
    } else {
      const normalized = normalizeWC2026Groups(await fetchGroups());
      maybePush("wc2026teams", normalized.length > 0 ? normalized : null);
    }
  }

  return verifyRemoteStandings(sourceResults);
}

/** Merge cache, local scores, and redundant API sources — never downgrade to empty tables. */
export async function resolveGroupStandings(
  options: ResolveGroupStandingsOptions
): Promise<GroupStanding[]> {
  const {
    matches,
    teamsList,
    currentStandings = [],
    includeRemote = true,
  } = options;

  const teamsById = Object.fromEntries(teamsList.map((t) => [t.id, t]));
  const localBaseline = buildLocalStandingsBaseline(matches, teamsList, currentStandings);
  const derived = deriveStandingsIfScored(matches, teamsList);

  let merged = localBaseline;
  if (includeRemote) {
    const remote = await fetchRemoteStandings(teamsById);
    merged = mergeStandingsPartials(localBaseline, derived ?? [], remote);
  }

  if (merged.length === 0) {
    return [];
  }

  return normalizeStandingsTeamIds(merged, teamsById);
}
