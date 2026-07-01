import { describe, expect, it } from "vitest";
import { buildKnockoutRoundSummaries } from "./KnockoutRoundStatusBento";
import type { MergedMatch, Team } from "../../types";

const teams: Record<string, Team> = {
  arg: { id: "arg", name: "Argentina", abbr: "ARG", group: "J" },
  fra: { id: "fra", name: "France", abbr: "FRA", group: "D" },
};

const completedR32: MergedMatch = {
  id: "M74",
  matchId: "M74",
  stage: "R32",
  homeTeamId: "arg",
  awayTeamId: "fra",
  homeScore: 2,
  awayScore: 1,
  status: "completed",
  locked: true,
  source: "espn",
  date: "2026-07-05",
};

describe("buildKnockoutRoundSummaries", () => {
  it("groups confirmed knockout results by stage with advancing and eliminated teams", () => {
    const summaries = buildKnockoutRoundSummaries([completedR32], teams);

    expect(summaries).toHaveLength(1);
    expect(summaries[0]).toMatchObject({
      stage: "R32",
      label: "Round of 32",
      advancing: ["arg"],
      eliminated: ["fra"],
    });
  });

  it("ignores incomplete or unlocked knockout matches", () => {
    const liveMatch: MergedMatch = { ...completedR32, status: "live", locked: false };
    const unlocked: MergedMatch = { ...completedR32, locked: false };

    expect(buildKnockoutRoundSummaries([liveMatch, unlocked], teams)).toEqual([]);
  });
});
