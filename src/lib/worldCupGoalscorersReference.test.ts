import { describe, expect, it } from "vitest";
import { aggregateTournamentStats } from "./aggregateTournamentStats";
import {
  findReferenceScorer,
  getActiveCareerLeaders,
  getAllTimeCareerLeaders,
  getWorldCupGoalscorerRows,
} from "./worldCupGoalscorersReference";
import { displayWcCareerTotal, mergeWcCareerGoals } from "./mergeWcCareerGoals";
import type { MatchEvent, MergedMatch } from "../types";

describe("worldCupGoalscorersReference", () => {
  it("loads scorers from bundled reference JSON", () => {
    const rows = getWorldCupGoalscorerRows();
    expect(rows.length).toBeGreaterThan(50);
    expect(rows[0]?.player_name).toBe("Miroslav Klose");
  });

  it("finds players by fuzzy name", () => {
    expect(findReferenceScorer("K. Mbappé")?.player_name).toBe("Kylian Mbappé");
    expect(findReferenceScorer("Lionel Messi")?.number_of_goals).toBe(13);
  });

  it("excludes retired players from active career leaders", () => {
    const leaders = getActiveCareerLeaders([], 10);
    const names = leaders.map((row) => row.reference.player_name);
    expect(names).toContain("Lionel Messi");
    expect(names).not.toContain("Jürgen Klinsmann");
    expect(leaders.length).toBeLessThanOrEqual(10);
  });

  it("ranks all-time leaders with live 2026 goals for active players", () => {
    const match: MergedMatch = {
      id: "M1",
      matchId: "M1",
      homeTeamId: "arg",
      awayTeamId: "fra",
      date: "2026-06-15",
      status: "completed",
      locked: true,
      source: "espn",
      homeScore: 2,
      awayScore: 1,
    };
    const events: MatchEvent[] = [
      {
        providerId: "g1",
        minute: 10,
        type: "goal",
        teamId: "arg",
        playerName: "Lionel Messi",
      },
      {
        providerId: "g2",
        minute: 55,
        type: "goal",
        teamId: "arg",
        playerName: "Lionel Messi",
      },
    ];

    const { topScorers } = aggregateTournamentStats({
      matches: [match],
      matchEvents: { M1: events },
    });

    const leaders = getAllTimeCareerLeaders(topScorers, 5);
    const messi = leaders.find((row) => row.reference.player_name === "Lionel Messi");
    expect(messi?.goalsBefore2026).toBe(13);
    expect(messi?.goals2026).toBe(2);
    expect(messi?.careerTotal).toBe(15);
  });
});

describe("mergeWcCareerGoals", () => {
  it("merges reference baseline with 2026 goals for active players", () => {
    const reference = findReferenceScorer("Kylian Mbappé");
    expect(reference).toBeDefined();

    const merged = mergeWcCareerGoals(reference!, 3);
    expect(merged.goalsBefore2026).toBe(12);
    expect(merged.goals2026).toBe(3);
    expect(merged.careerTotal).toBe(15);
  });

  it("returns 2026-only totals for unknown players", () => {
    const display = displayWcCareerTotal("Unknown Striker", [
      {
        player: { id: "x", displayName: "Unknown Striker" },
        teamId: "usa",
        value: 2,
      },
    ]);

    expect(display.reference).toBeUndefined();
    expect(display.goals2026).toBe(2);
    expect(display.careerTotal).toBe(2);
  });
});
