import { describe, expect, it } from "vitest";
import { mapEspnDetailsToEvents } from "./mapEspnToEvents";

describe("mapEspnDetailsToEvents", () => {
  it("maps ESPN scoreboard details to events", () => {
    const events = mapEspnDetailsToEvents(
      [
        {
          type: { text: "Goal" },
          clock: { displayValue: "12'" },
          team: { id: "home-id" },
          participants: [{ type: "scorer", athlete: { displayName: "Player One" } }],
        },
        {
          type: { text: "Yellow Card" },
          clock: { displayValue: "44'" },
          team: { id: "away-id" },
          participants: [{ type: "player", athlete: { displayName: "Player Two" } }],
        },
      ],
      "espn-1",
      "home-id",
      "away-id"
    );

    expect(events).toHaveLength(2);
    expect(events[0].type).toBe("goal");
    expect(events[1].type).toBe("yellow_card");
  });
});
