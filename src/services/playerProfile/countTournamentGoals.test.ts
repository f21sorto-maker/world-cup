import { describe, expect, it } from "vitest";
import type { MatchEvent } from "../../types";
import { countTournamentGoals } from "./countTournamentGoals";

const goal = (overrides: Partial<MatchEvent>): MatchEvent => ({
  providerId: "1",
  minute: 10,
  type: "goal",
  teamId: "bra",
  playerName: "Neymar",
  ...overrides,
});

describe("countTournamentGoals", () => {
  it("counts goals by name within a team", () => {
    const allEvents = {
      m1: [goal({ providerId: "a" }), goal({ providerId: "b", minute: 55 })],
      m2: [goal({ providerId: "c", playerName: "NEYMAR Jr" })],
    };

    expect(
      countTournamentGoals(allEvents, { playerName: "Neymar", teamId: "bra" })
    ).toBe(3);
  });

  it("ignores goals for other teams", () => {
    const allEvents = {
      m1: [goal({ teamId: "arg", playerName: "Messi" })],
    };

    expect(
      countTournamentGoals(allEvents, { playerName: "Messi", teamId: "bra" })
    ).toBe(0);
  });

  it("prefers player id when available", () => {
    const allEvents = {
      m1: [goal({ playerId: "99", playerName: "Alias Name" })],
    };

    expect(
      countTournamentGoals(allEvents, {
        playerId: "99",
        playerName: "Real Name",
        teamId: "bra",
      })
    ).toBe(1);
  });
});
