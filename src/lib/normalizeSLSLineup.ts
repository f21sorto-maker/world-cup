import type { Lineup, LineupPlayer, PlayerRef } from "../types";
import type { SportsLiveScoresMatchBundleResponse } from "../types/sportsLiveScores";

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function mapPlayer(raw: unknown): LineupPlayer | null {
  if (!isRecord(raw)) return null;

  // SLS may nest under `player` or flatten id/name on the row.
  const playerRaw = isRecord(raw.player) ? raw.player : raw;

  const id = playerRaw.id ?? playerRaw.playerId ?? playerRaw.player_id;
  const name =
    playerRaw.name ??
    playerRaw.displayName ??
    playerRaw.display_name ??
    playerRaw.shortName;

  if (name == null && id == null) return null;

  const displayName =
    typeof name === "string" && name.trim().length > 0
      ? name.trim()
      : String(id ?? "Unknown");

  const player: PlayerRef = {
    id: String(id ?? displayName),
    displayName,
  };

  if (typeof playerRaw.number === "number") {
    player.jerseyNumber = playerRaw.number;
  } else if (typeof playerRaw.jerseyNumber === "number") {
    player.jerseyNumber = playerRaw.jerseyNumber;
  }

  if (typeof playerRaw.position === "string") {
    player.position = playerRaw.position;
  }

  const isCaptain = raw.isCaptain === true || raw.is_captain === true;

  return {
    player,
    gridPosition: undefined,
    rating: undefined,
    isCaptain,
  };
}

function mapPlayerList(raw: unknown): LineupPlayer[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((entry) => mapPlayer(entry))
    .filter((player): player is LineupPlayer => player !== null);
}

function mapSideLineup(team: "home" | "away", raw: unknown): Lineup | null {
  if (!isRecord(raw)) return null;

  const formation =
    typeof raw.formation === "string" && raw.formation.trim().length > 0
      ? raw.formation
      : "4-3-3";

  // Cast through unknown — SLS field names vary across API versions.
  const startingRaw = raw.startingXI ?? raw.starting_xi ?? raw.starting;
  const subsRaw = raw.subs ?? raw.substitutes ?? raw.sub;

  return {
    team,
    formation,
    manager: undefined,
    startingXI: mapPlayerList(startingRaw),
    substitutes: mapPlayerList(subsRaw),
  };
}

/** Maps SLS `/football/match_lineups/{id}` to app lineups when shape is known. */
export function normalizeSLSLineup(
  _homeTeamId: string,
  _awayTeamId: string,
  raw: SportsLiveScoresMatchBundleResponse
): Lineup[] | null {
  // TODO: verify SLS lineup shape against a live response before enabling sls_lineups_enabled.
  const lineupsRaw = raw.lineups;
  if (lineupsRaw == null || typeof lineupsRaw !== "object") return null;

  const lineupsObj = lineupsRaw as Record<string, unknown>;
  const homeLineup = mapSideLineup("home", lineupsObj.home);
  const awayLineup = mapSideLineup("away", lineupsObj.away);

  if (!homeLineup || !awayLineup) return null;
  if (homeLineup.startingXI.length === 0 || awayLineup.startingXI.length === 0) return null;

  return [homeLineup, awayLineup];
}
