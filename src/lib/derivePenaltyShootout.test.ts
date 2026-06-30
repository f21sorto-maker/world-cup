import { describe, expect, it } from "vitest";
import {
  derivePenaltyShootout,
  penaltyShootoutFromAggregate,
  penaltyShootoutFromEvents,
} from "./derivePenaltyShootout";
import type { MatchEvent } from "../types";

describe("derivePenaltyShootout", () => {
  it("builds shootout from events during penalties period", () => {
    const events: MatchEvent[] = [
      {
        providerId: "1",
        minute: 121,
        type: "goal",
        teamId: "bra",
        playerName: "A",
      },
      {
        providerId: "2",
        minute: 122,
        type: "penalty_missed",
        teamId: "par",
        playerName: "B",
      },
      {
        providerId: "3",
        minute: 123,
        type: "goal",
        teamId: "par",
        playerName: "C",
      },
    ];

    const shootout = penaltyShootoutFromEvents(events, "bra", "par", true);
    expect(shootout?.homeScore).toBe(1);
    expect(shootout?.awayScore).toBe(1);
    expect(shootout?.home).toHaveLength(1);
    expect(shootout?.away).toHaveLength(2);
    expect(shootout?.away[0]?.scored).toBe(false);
  });

  it("uses Zafronix aggregate when events are unavailable", () => {
    const shootout = penaltyShootoutFromAggregate({ home: 4, away: 3 });
    expect(shootout.homeScore).toBe(4);
    expect(shootout.awayScore).toBe(3);
  });

  it("prefers existing shootout on match", () => {
    const existing = penaltyShootoutFromAggregate({ home: 5, away: 4 });
    const result = derivePenaltyShootout({
      events: [],
      homeTeamId: "bra",
      awayTeamId: "par",
      period: "full_time",
      existing,
    });
    expect(result).toBe(existing);
  });
});
