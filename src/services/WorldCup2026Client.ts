import type { Team } from "../types";
import { rapidApiHeaders, providerByHost } from "../config/rapidApiCatalog";
import { logger } from "./Logger";

const RAPIDAPI_HOST =
  providerByHost("world-cup-2026.p.rapidapi.com")?.host ?? "world-cup-2026.p.rapidapi.com";

let worldCup2026SessionDisabled = false;

export function isWorldCup2026Disabled(): boolean {
  return worldCup2026SessionDisabled;
}

export type Wc2026Team = {
  id: string;
  name: string;
  shortName: string;
  abbreviation: string;
  logo?: string;
  color?: string;
  slug?: string;
};

export type Wc2026Player = {
  id: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  position?: string;
  positionAbbr?: string;
  image?: string | null;
  age?: number;
  citizenship?: string;
  jerseyNumber?: string;
  marketValue?: { valueM?: number; display?: string };
  club?: string;
  birthplace?: string;
  hometown?: string;
};

export type Wc2026TeamDetail = {
  team?: Wc2026Team;
  players?: Wc2026Player[];
  playersCount?: number;
};

const ROSTER_CACHE_TTL_MS = 30 * 60 * 1000;
const rosterCache = new Map<string, Wc2026Player[]>();
const abbrevToWcId = new Map<string, string>();

function baseUrl(): string {
  if (typeof window === "undefined") {
    return `https://${RAPIDAPI_HOST}`;
  }
  return "/api/wc2026";
}

function rapidHeaders(): HeadersInit {
  return rapidApiHeaders(RAPIDAPI_HOST);
}

async function handleBlocked(res: Response): Promise<boolean> {
  if (res.status !== 401 && res.status !== 403 && res.status !== 429) {
    return false;
  }
  worldCup2026SessionDisabled = true;
  const bodySnippet = await res.text().then((t) => t.slice(0, 300)).catch(() => "");
  logger.warn("WorldCup2026 blocked for session", "WorldCup2026Client", {
    status: res.status,
    bodySnippet,
  });
  return true;
}

export async function fetchTeams(): Promise<Wc2026Team[]> {
  if (worldCup2026SessionDisabled) return [];

  try {
    const res = await fetch(`${baseUrl()}/world-cup-2026/teams`, { headers: rapidHeaders() });
    if (await handleBlocked(res)) return [];
    if (!res.ok) throw new Error(`${res.status}`);

    const data = (await res.json()) as { teams?: Wc2026Team[] };
    const teams = data.teams ?? [];
    for (const team of teams) {
      if (team.abbreviation && team.id) {
        abbrevToWcId.set(team.abbreviation.toUpperCase(), team.id);
      }
    }
    return teams;
  } catch (error) {
    logger.warn("WorldCup2026 teams fetch failed", "WorldCup2026Client", {
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
}

/** Alias for fetchTeams — returns all WC 2026 teams. */
export async function fetchAllTeams(): Promise<Wc2026Team[]> {
  return fetchTeams();
}

/** Fetches a single team by id. */
export async function fetchTeam(teamId: string): Promise<Wc2026Team | null> {
  if (worldCup2026SessionDisabled) return null;

  try {
    const res = await fetch(`${baseUrl()}/world-cup-2026/teams/${encodeURIComponent(teamId)}`, {
      headers: rapidHeaders(),
    });
    if (await handleBlocked(res)) return null;
    if (!res.ok) return null;
    const data = (await res.json()) as Wc2026TeamDetail & Wc2026Team;
    return data.team ?? data;
  } catch (error) {
    logger.warn("WorldCup2026 team fetch failed", "WorldCup2026Client", {
      error: error instanceof Error ? error.message : String(error),
      teamId,
    });
    return null;
  }
}

function normalizeWcPlayer(raw: Record<string, unknown>): Wc2026Player | null {
  const id = raw.id;
  const fullName = raw.fullName ?? raw.name;
  if (id == null || fullName == null) return null;
  return {
    id: String(id),
    fullName: String(fullName),
    firstName: raw.firstName != null ? String(raw.firstName) : undefined,
    lastName: raw.lastName != null ? String(raw.lastName) : undefined,
    position: raw.position != null ? String(raw.position) : undefined,
    positionAbbr: raw.positionAbbr != null ? String(raw.positionAbbr) : undefined,
    image: typeof raw.image === "string" ? raw.image : raw.image === null ? null : undefined,
    age: typeof raw.age === "number" ? raw.age : raw.age != null ? Number(raw.age) : undefined,
    citizenship: raw.citizenship != null ? String(raw.citizenship) : undefined,
    jerseyNumber: raw.jerseyNumber != null ? String(raw.jerseyNumber) : undefined,
    marketValue: raw.marketValue as Wc2026Player["marketValue"],
    club:
      raw.club != null
        ? String(raw.club)
        : raw.currentClub != null
          ? String(raw.currentClub)
          : undefined,
    birthplace: raw.birthplace != null ? String(raw.birthplace) : undefined,
    hometown:
      raw.hometown != null
        ? String(raw.hometown)
        : raw.birthPlace != null
          ? String(raw.birthPlace)
          : undefined,
  };
}

/** Fetches squad roster with player photos and bio fields. */
export async function fetchTeamPlayers(wcTeamId: string): Promise<Wc2026Player[]> {
  const cached = rosterCache.get(wcTeamId);
  if (cached) return cached;

  if (worldCup2026SessionDisabled) return [];

  try {
    const res = await fetch(`${baseUrl()}/world-cup-2026/teams/${encodeURIComponent(wcTeamId)}`, {
      headers: rapidHeaders(),
    });
    if (await handleBlocked(res)) return [];
    if (!res.ok) return [];

    const data = (await res.json()) as Wc2026TeamDetail & { players?: unknown[] };
    const players = (data.players ?? [])
      .map((p) => normalizeWcPlayer(p as Record<string, unknown>))
      .filter((p): p is Wc2026Player => p != null);

    rosterCache.set(wcTeamId, players);
    setTimeout(() => rosterCache.delete(wcTeamId), ROSTER_CACHE_TTL_MS);
    return players;
  } catch (error) {
    logger.warn("WorldCup2026 roster fetch failed", "WorldCup2026Client", {
      error: error instanceof Error ? error.message : String(error),
      wcTeamId,
    });
    return [];
  }
}

/** Resolves WC 2026 team id from abbreviation (loads team list if needed). */
export async function resolveWc2026TeamId(abbreviation: string): Promise<string | undefined> {
  const key = abbreviation.toUpperCase();
  const hit = abbrevToWcId.get(key);
  if (hit) return hit;
  await fetchTeams();
  return abbrevToWcId.get(key);
}

export function getWc2026TeamIdFromCache(abbreviation: string): string | undefined {
  return abbrevToWcId.get(abbreviation.toUpperCase());
}

/** Fetches group assignments (raw). */
export async function fetchGroups(): Promise<unknown> {
  if (worldCup2026SessionDisabled) return null;

  try {
    const res = await fetch(`${baseUrl()}/world-cup-2026/groups`, { headers: rapidHeaders() });
    if (await handleBlocked(res)) return null;
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    logger.warn("WorldCup2026 groups fetch failed", "WorldCup2026Client", {
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

export function mergeTeamMetadata(
  teams: Record<string, Team>,
  wcTeams: Wc2026Team[]
): { teams: Record<string, Team>; patched: number } {
  const byAbbrev = new Map(wcTeams.map((t) => [t.abbreviation.toUpperCase(), t]));
  const result: Record<string, Team> = { ...teams };
  let patched = 0;

  for (const [id, team] of Object.entries(teams)) {
    const wc = byAbbrev.get(team.abbreviation.toUpperCase());
    if (!wc) continue;

    const updates: Partial<Team> = {};
    if (wc.logo) updates.logo = wc.logo;
    if (wc.color) updates.color = wc.color;
    if (wc.id) updates.wc2026TeamId = wc.id;

    if (Object.keys(updates).length === 0) continue;

    result[id] = { ...team, ...updates };
    patched += 1;
  }

  return { teams: result, patched };
}

/** Test-only reset */
export function resetWorldCup2026SessionForTests(): void {
  worldCup2026SessionDisabled = false;
  rosterCache.clear();
  abbrevToWcId.clear();
}
