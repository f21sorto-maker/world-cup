import { isApiEnabled } from "../config/apiFlags";
import { logger } from "./Logger";

let zafronixSessionDisabled = false;

export function isZafronixDisabled(): boolean {
  return zafronixSessionDisabled;
}

export type ZafronixMatch = {
  id: string | number;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  date: string;
  competition?: string;
  isWorldCup?: boolean;
};

export type ZafronixTournament = {
  id: string | number;
  name: string;
  year: number;
  teams?: string[];
};

function baseUrl(): string {
  if (typeof window === "undefined") {
    return "https://api.zafronix.com";
  }
  if (import.meta.env.DEV) {
    return "/api/zafronix";
  }
  return "/api/zafronix";
}

function zafronixHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    Accept: "application/json",
  };
  const devKey = import.meta.env.VITE_ZAFRONIX_API_KEY;
  if (devKey) {
    headers["X-API-Key"] = devKey;
  }
  return headers;
}

async function fetchJson<T>(path: string): Promise<T | null> {
  if (!isApiEnabled("zafronix") || zafronixSessionDisabled) return null;

  try {
    const res = await fetch(`${baseUrl()}${path}`, { headers: zafronixHeaders() });

    if (res.status === 401 || res.status === 403 || res.status === 429) {
      zafronixSessionDisabled = true;
      const bodySnippet = await res.text().then((t) => t.slice(0, 300)).catch(() => "");
      logger.warn(`Zafronix blocked for session (${path})`, "ZafronixClient", {
        status: res.status,
        bodySnippet,
      });
      return null;
    }

    if (!res.ok) {
      logger.warn(`Zafronix non-OK response (${path})`, "ZafronixClient", { status: res.status });
      return null;
    }

    return (await res.json()) as T;
  } catch (error) {
    logger.warn(`Zafronix fetch failed (${path})`, "ZafronixClient", {
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

export async function getTournament(year: number): Promise<ZafronixTournament | null> {
  return fetchJson<ZafronixTournament>(`/tournaments/${year}`);
}

export async function getHistoricalMatchesForTeam(
  teamName: string,
  limit = 7
): Promise<ZafronixMatch[]> {
  const encoded = encodeURIComponent(teamName);
  const data = await fetchJson<ZafronixMatch[] | { matches?: ZafronixMatch[] }>(
    `/teams/${encoded}/matches?limit=${limit}`
  );
  if (!data) return [];
  return Array.isArray(data) ? data : (data.matches ?? []);
}

export async function getTrivia(): Promise<unknown> {
  return fetchJson("/trivia/");
}

/** Test-only reset */
export function resetZafronixSessionForTests(): void {
  zafronixSessionDisabled = false;
}
