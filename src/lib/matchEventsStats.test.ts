import { describe, expect, it } from "vitest";
import type { MatchEvent } from "../types";
import { countGoalEventsInStore } from "./matchEventsStats";

describe("countGoalEventsInStore", () => {
  it("counts goals and own goals across all match keys", () => {
    const goal: MatchEvent = {
      providerId: "g1",
      type: "goal",
      minute: 10,
      playerName: "A",
      teamId: "eng",
    };
    const og: MatchEvent = {
      providerId: "og1",
      type: "own_goal",
      minute: 20,
      playerName: "B",
      teamId: "fra",
    };
    const card: MatchEvent = {
      providerId: "y1",
      type: "yellow_card",
      minute: 30,
      playerName: "C",
      teamId: "eng",
    };

    expect(
      countGoalEventsInStore({
        m1: [goal, card],
        m2: [og],
      })
    ).toBe(2);
  });

  it("returns 0 for empty store", () => {
    expect(countGoalEventsInStore({})).toBe(0);
  });
});
