import type { MatchEvent, PenaltyKick, PenaltyShootout } from "../types";

type PenaltyAggregate = {
  home: number;
  away: number;
};

/** Build shootout from Zafronix aggregate penalty totals when kick-by-kick data is unavailable. */
export function penaltyShootoutFromAggregate(aggregate: PenaltyAggregate): PenaltyShootout {
  const home: PenaltyKick[] = Array.from({ length: aggregate.home }, () => ({ scored: true }));
  const away: PenaltyKick[] = Array.from({ length: aggregate.away }, () => ({ scored: true }));
  return {
    home,
    away,
    homeScore: aggregate.home,
    awayScore: aggregate.away,
  };
}

function isShootoutEvent(event: MatchEvent, duringPenalties: boolean): boolean {
  if (!duringPenalties) return false;
  return event.type === "goal" || event.type === "penalty_missed" || event.type === "penalty_saved";
}

/** Derive ordered penalty kicks from match events during the penalties period. */
export function penaltyShootoutFromEvents(
  events: MatchEvent[],
  homeTeamId: string,
  awayTeamId: string,
  duringPenalties: boolean
): PenaltyShootout | undefined {
  const shootoutEvents = events.filter((e) => isShootoutEvent(e, duringPenalties));
  if (shootoutEvents.length === 0) return undefined;

  const home: PenaltyKick[] = [];
  const away: PenaltyKick[] = [];

  for (const event of shootoutEvents) {
    const scored = event.type === "goal";
    const kick: PenaltyKick = { scored, playerName: event.playerName };
    if (event.teamId === homeTeamId) {
      home.push(kick);
    } else if (event.teamId === awayTeamId) {
      away.push(kick);
    }
  }

  if (home.length === 0 && away.length === 0) return undefined;

  return {
    home,
    away,
    homeScore: home.filter((k) => k.scored).length,
    awayScore: away.filter((k) => k.scored).length,
  };
}

export function derivePenaltyShootout(input: {
  events: MatchEvent[];
  homeTeamId: string;
  awayTeamId: string;
  period?: string;
  existing?: PenaltyShootout;
  aggregate?: PenaltyAggregate;
}): PenaltyShootout | undefined {
  if (input.existing) return input.existing;

  const duringPenalties = input.period === "penalties";
  const fromEvents = penaltyShootoutFromEvents(
    input.events,
    input.homeTeamId,
    input.awayTeamId,
    duringPenalties
  );
  if (fromEvents) return fromEvents;

  if (input.aggregate && (input.aggregate.home > 0 || input.aggregate.away > 0)) {
    return penaltyShootoutFromAggregate(input.aggregate);
  }

  return undefined;
}

export function matchHadPenaltyShootout(
  match: { homeScore?: number; awayScore?: number; penaltyShootout?: PenaltyShootout; period?: string }
): boolean {
  if (match.penaltyShootout) return true;
  if (match.period === "penalties") return true;
  const home = match.homeScore ?? 0;
  const away = match.awayScore ?? 0;
  return home === away && match.period === "full_time";
}
