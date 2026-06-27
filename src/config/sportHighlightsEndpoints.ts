/** Highlightly Sport Highlights API — football routes on RapidAPI. */
export const SPORT_HIGHLIGHTS_HOST = "sport-highlights-api.p.rapidapi.com";

export const HIGHLIGHTLY_WC_LEAGUE_ID = 1635;
export const HIGHLIGHTLY_WC_SEASON = 2026;

function q(params: Record<string, string | number | undefined | null>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export const sportHighlightsEndpoints = {
  countries: () => "/football/countries",
  country: (countryCode: string) =>
    `/football/countries/${encodeURIComponent(countryCode)}`,

  leagues: (query?: Record<string, string | number>) =>
    `/football/leagues${q(query ?? {})}`,
  league: (id: number | string) => `/football/leagues/${encodeURIComponent(String(id))}`,

  teams: (query?: Record<string, string | number>) =>
    `/football/teams${q(query ?? {})}`,
  team: (id: number | string) => `/football/teams/${encodeURIComponent(String(id))}`,
  teamStatistics: (id: number | string, query: { fromDate: string; timezone?: string }) =>
    `/football/teams/statistics/${encodeURIComponent(String(id))}${q(query)}`,

  matches: (query?: Record<string, string | number>) =>
    `/football/matches${q(query ?? {})}`,
  match: (id: number | string) => `/football/matches/${encodeURIComponent(String(id))}`,

  highlights: (query?: Record<string, string | number>) =>
    `/football/highlights${q(query ?? {})}`,
  highlight: (id: number | string) =>
    `/football/highlights/${encodeURIComponent(String(id))}`,
  highlightGeoRestrictions: (id: number | string) =>
    `/football/highlights/geo-restrictions/${encodeURIComponent(String(id))}`,

  bookmakers: (query?: Record<string, string | number>) =>
    `/football/bookmakers${q(query ?? {})}`,
  bookmaker: (id: number | string) =>
    `/football/bookmakers/${encodeURIComponent(String(id))}`,

  odds: (query?: Record<string, string | number>) =>
    `/football/odds${q(query ?? {})}`,
  standings: (query?: Record<string, string | number>) =>
    `/football/standings${q(query ?? {})}`,

  lastFiveGames: (teamId: number | string) =>
    `/football/last-five-games${q({ teamId })}`,
  head2Head: (teamIdOne: number | string, teamIdTwo: number | string) =>
    `/football/head-2-head${q({ teamIdOne, teamIdTwo })}`,

  lineups: (matchId: number | string) =>
    `/football/lineups/${encodeURIComponent(String(matchId))}`,
  statistics: (matchId: number | string) =>
    `/football/statistics/${encodeURIComponent(String(matchId))}`,
  liveEvents: (matchId: number | string) =>
    `/football/events/${encodeURIComponent(String(matchId))}`,
  boxScore: (matchId: number | string) =>
    `/football/box-score/${encodeURIComponent(String(matchId))}`,

  players: (query?: Record<string, string | number>) =>
    `/football/players${q(query ?? {})}`,
  player: (id: number | string) => `/football/players/${encodeURIComponent(String(id))}`,
  playerStatistics: (id: number | string, query?: Record<string, string | number>) =>
    `/football/players/${encodeURIComponent(String(id))}/statistics${q(query ?? {})}`,
} as const;
