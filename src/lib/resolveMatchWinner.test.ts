import { describe, expect, it } from "vitest";
import { buildWc2026TeamCatalog } from "../data/wc2026TeamCatalog";
import { isAdvancingTeam, resolveMatchWinner } from "./resolveMatchWinner";
import type { MergedMatch } from "../types";
import { penaltyShootoutFromAggregate } from "./derivePenaltyShootout";

describe("resolveMatchWinner", () => {
  const teams = buildWc2026TeamCatalog();

  it("returns regulation winner for knockout matches", () => {
    const match: MergedMatch = {
      id: "M73",
      matchId: "M73",
      date: "2026-06-28T19:00:00Z",
      homeTeamId: "bra",
      awayTeamId: "par",
      status: "completed",
      homeScore: 2,
      awayScore: 1,
      homeConduct: 0,
      awayConduct: 0,
      locked: true,
      source: "espn",
    };

    expect(resolveMatchWinner(match, teams)).toBe("bra");
    expect(isAdvancingTeam(match, "bra", teams)).toBe(true);
    expect(isAdvancingTeam(match, "par", teams)).toBe(false);
  });

  it("uses penalty shootout when regulation ends level", () => {
    const shootout = penaltyShootoutFromAggregate({ home: 4, away: 3 });
    const match: MergedMatch = {
      id: "M74",
      matchId: "M74",
      date: "2026-06-28T22:00:00Z",
      homeTeamId: "mar",
      awayTeamId: "ned",
      status: "completed",
      homeScore: 1,
      awayScore: 1,
      homeConduct: 0,
      awayConduct: 0,
      locked: true,
      source: "espn",
      penaltyShootout: shootout,
    };

    expect(resolveMatchWinner(match, teams)).toBe("mar");
    expect(isAdvancingTeam(match, "mar", teams, shootout)).toBe(true);
  });

  it("returns undefined for group-stage matches", () => {
    const match: MergedMatch = {
      id: "M1",
      matchId: "M1",
      group: "A",
      date: "2026-06-11T19:00:00Z",
      homeTeamId: "mex",
      awayTeamId: "rsa",
      status: "completed",
      homeScore: 2,
      awayScore: 0,
      homeConduct: 0,
      awayConduct: 0,
      locked: true,
      source: "espn",
    };

    expect(resolveMatchWinner(match, teams)).toBeUndefined();
  });
});
