import { describe, expect, it } from "vitest";
import { displayWcCareerTotal, lookupGoals2026, mergeWcCareerGoals, wcCareerGoalsForDisplay } from "./mergeWcCareerGoals";
import type { TournamentPlayerStat } from "../types";

const topScorers: TournamentPlayerStat[] = [
  {
    player: { id: "messi", displayName: "Lionel Messi" },
    teamId: "arg",
    value: 2,
    rank: 1,
  },
];

describe("mergeWcCareerGoals", () => {
  it("lookupGoals2026 matches by normalized player name", () => {
    expect(lookupGoals2026("L. Messi", topScorers)).toBe(2);
    expect(lookupGoals2026("Unknown Striker", topScorers)).toBe(0);
  });

  it("mergeWcCareerGoals adds live goals only for active players", () => {
    const reference = {
      player_name: "Lionel Messi",
      country: "Argentina",
      number_of_goals: 13,
      currently_playing_in_this_wc: true,
    };

    expect(mergeWcCareerGoals(reference, 2)).toEqual({
      reference,
      goalsBefore2026: 13,
      goals2026: 2,
      careerTotal: 15,
    });

    expect(mergeWcCareerGoals({ ...reference, currently_playing_in_this_wc: false }, 2)).toEqual({
      reference: { ...reference, currently_playing_in_this_wc: false },
      goalsBefore2026: 13,
      goals2026: 0,
      careerTotal: 13,
    });
  });

  it("displayWcCareerTotal falls back to live goals when reference is missing", () => {
    expect(displayWcCareerTotal("Unknown Striker", topScorers)).toEqual({
      goalsBefore2026: 0,
      goals2026: 0,
      careerTotal: 0,
    });
  });

  it("wcCareerGoalsForDisplay returns undefined when no reference and no goals", () => {
    expect(wcCareerGoalsForDisplay("Unknown Striker", topScorers)).toBeUndefined();
    expect(wcCareerGoalsForDisplay("Lionel Messi", topScorers)).toBe(15);
  });
});
