import type { MatchEvent, MatchEventType } from "../../types";

type EspnParticipant = {
  athlete?: { displayName?: string; shortName?: string };
  type?: string;
};

type EspnDetail = {
  type?: { text?: string; id?: string };
  clock?: { displayValue?: string; value?: number };
  team?: { id?: string };
  participants?: EspnParticipant[];
  athlete?: { displayName?: string };
  text?: string;
};

function parseClock(displayValue?: string, value?: number): { minute: number; minuteExtra?: number } {
  if (displayValue) {
    const match = displayValue.match(/(\d+)(?:[''])?(?:\+(\d+))?/);
    if (match) {
      return {
        minute: Number(match[1]),
        minuteExtra: match[2] ? Number(match[2]) : undefined,
      };
    }
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return { minute: Math.max(0, Math.floor(value / 60)) };
  }
  return { minute: 0 };
}

function eventTypeFromText(text: string): MatchEventType | null {
  const t = text.toLowerCase();
  if (t.includes("own goal")) return "own_goal";
  if (t.includes("goal") || t.includes("scores")) return "goal";
  if (t.includes("yellow") && t.includes("red")) return "yellow_red_card";
  if (t.includes("red card") || (t.includes("red") && t.includes("card"))) return "red_card";
  if (t.includes("yellow")) return "yellow_card";
  if (t.includes("substitution") || t.includes("subbed") || t.includes(" replaces ")) return "substitution";
  if (t.includes("var")) return "var_review";
  if (t.includes("penalty missed")) return "penalty_missed";
  if (t.includes("penalty saved")) return "penalty_saved";
  if (t.includes("disallowed")) return "goal_disallowed";
  return null;
}

function participantName(parts: EspnParticipant[] | undefined, role: string): string | undefined {
  const hit = parts?.find((p) => p.type?.toLowerCase() === role.toLowerCase());
  return hit?.athlete?.displayName ?? hit?.athlete?.shortName;
}

function detailToEvent(
  detail: EspnDetail,
  espnEventId: string,
  homeTeamId: string,
  awayTeamId: string,
  index: number
): MatchEvent | null {
  const text = String(detail.type?.text ?? detail.text ?? "");
  const type = eventTypeFromText(text);
  if (!type) return null;

  const { minute, minuteExtra } = parseClock(detail.clock?.displayValue, detail.clock?.value);
  const teamId =
    detail.team?.id === homeTeamId
      ? homeTeamId
      : detail.team?.id === awayTeamId
        ? awayTeamId
        : homeTeamId;

  const playerName =
    participantName(detail.participants, "scorer") ??
    participantName(detail.participants, "player") ??
    detail.athlete?.displayName ??
    detail.participants?.[0]?.athlete?.displayName ??
    "Unknown";

  const assistName =
    type === "substitution"
      ? participantName(detail.participants, "playerOut") ??
        participantName(detail.participants, "replaced")
      : participantName(detail.participants, "assist");

  return {
    providerId: `espn-${espnEventId}-${index}-${type}-${minute}`,
    espnEventId,
    minute,
    minuteExtra,
    type,
    teamId,
    playerName,
    assistName,
  };
}

/** Parses ESPN scoreboard `competition.details` into match events. */
export function mapEspnDetailsToEvents(
  details: unknown[],
  espnEventId: string,
  homeTeamId: string,
  awayTeamId: string
): MatchEvent[] {
  const events: MatchEvent[] = [];
  details.forEach((detail, index) => {
    const event = detailToEvent(detail as EspnDetail, espnEventId, homeTeamId, awayTeamId, index);
    if (event) events.push(event);
  });
  return events.sort((a, b) => a.minute - b.minute || (a.minuteExtra ?? 0) - (b.minuteExtra ?? 0));
}

/** Parses ESPN play-by-play payload into match events. */
export function mapEspnPlayByPlayToEvents(
  payload: unknown,
  espnEventId: string,
  homeTeamId: string,
  awayTeamId: string
): MatchEvent[] {
  const root = payload as { plays?: unknown[]; drives?: { plays?: unknown[] }[] };
  const plays = root.plays ?? root.drives?.flatMap((d) => d.plays ?? []) ?? [];
  const events: MatchEvent[] = [];

  plays.forEach((play, index) => {
    const event = detailToEvent(play as EspnDetail, espnEventId, homeTeamId, awayTeamId, index);
    if (event) events.push(event);
  });

  return events.sort((a, b) => a.minute - b.minute || (a.minuteExtra ?? 0) - (b.minuteExtra ?? 0));
}
