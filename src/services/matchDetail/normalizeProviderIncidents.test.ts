import { describe, expect, it } from "vitest";
import { normalizeProviderIncidents } from "./normalizeProviderIncidents";
import { mapIncidentsToEvents } from "./mapIncidentsToEvents";

describe("normalizeProviderIncidents", () => {
  it("maps SportAPI7 goal with assist", () => {
    const raw = normalizeProviderIncidents([
      {
        id: 1,
        time: 23,
        incidentType: "goal",
        isHome: true,
        player: { name: "Pulisic" },
        assist1: { name: "Musah" },
      },
    ]);
    const events = mapIncidentsToEvents(raw, "USA", "MEX");
    expect(events[0]).toMatchObject({
      type: "goal",
      playerName: "Pulisic",
      assistName: "Musah",
    });
  });

  it("maps card incidents by class", () => {
    const raw = normalizeProviderIncidents([
      { id: 2, time: 55, incidentType: "card", incidentClass: "yellow", isHome: false, player: { name: "Lozano" } },
    ]);
    const events = mapIncidentsToEvents(raw, "USA", "MEX");
    expect(events[0].type).toBe("yellow_card");
  });

  it("maps substitutions with in/out players", () => {
    const raw = normalizeProviderIncidents([
      {
        id: 3,
        time: 70,
        incidentType: "substitution",
        isHome: true,
        playerIn: { name: "Reyna" },
        playerOut: { name: "Adams" },
      },
    ]);
    const events = mapIncidentsToEvents(raw, "USA", "MEX");
    expect(events[0]).toMatchObject({
      type: "substitution",
      playerName: "Reyna",
      assistName: "Adams",
    });
  });
});
