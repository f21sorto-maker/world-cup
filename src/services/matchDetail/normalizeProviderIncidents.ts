import type { RawIncident } from "./mapIncidentsToEvents";

/** SportAPI7 / SofaScore-style incident payload. */
type ProviderIncident = {
  id?: string | number;
  time?: number;
  addedTime?: number;
  incidentType?: string;
  incidentClass?: string;
  isHome?: boolean;
  homeTeam?: boolean;
  player?: { id?: string | number; name?: string };
  playerIn?: { id?: string | number; name?: string };
  playerOut?: { id?: string | number; name?: string };
  assist1?: { name?: string };
  assistPlayer?: { name?: string };
  text?: string;
  varOutcome?: string;
};

function resolveIncidentType(raw: ProviderIncident): string | undefined {
  const base = raw.incidentType ?? "";
  if (base === "card") {
    const cls = (raw.incidentClass ?? "").toLowerCase();
    if (cls.includes("yellowred") || cls === "yellow_red") return "yellow_red_card";
    if (cls.includes("red")) return "red_card";
    return "yellow_card";
  }
  if (base === "goal") {
    const cls = (raw.incidentClass ?? "").toLowerCase();
    if (cls.includes("own")) return "own_goal";
    return "goal";
  }
  if (base === "inGamePenalty") return "goal";
  if (base === "var") return "var_review";
  return base || undefined;
}

/** Converts SportAPI7 / SofaScore incidents into RawIncident rows. */
export function normalizeProviderIncidents(incidents: unknown[]): RawIncident[] {
  return incidents.flatMap((item) => {
    const raw = item as ProviderIncident;
    const type = resolveIncidentType(raw);
    if (!type || type === "period") return [];

    const isSub = type === "substitution";
    const playerName =
      raw.player?.name ??
      (isSub ? raw.playerIn?.name : undefined) ??
      raw.text ??
      undefined;

    return [
      {
        id: raw.id,
        minute: raw.time,
        minuteExtra: raw.addedTime,
        type,
        incidentType: type,
        homeTeam: raw.isHome ?? raw.homeTeam,
        team: raw.isHome === true ? "home" : raw.isHome === false ? "away" : undefined,
        playerName,
        player: raw.player,
        assistPlayerName: isSub ? raw.playerOut?.name : raw.assist1?.name ?? raw.assistPlayer?.name,
        assistPlayer: isSub ? raw.playerOut : raw.assist1,
        varOutcome: raw.varOutcome,
      } satisfies RawIncident,
    ];
  });
}
