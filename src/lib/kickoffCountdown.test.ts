import { describe, expect, it } from "vitest";
import { formatKickoffCountdown, getKickoffCountdownParts, getNextKickoffFixtures, getNextKickoffMs, isNextKickoffFixture } from "./kickoffCountdown";

describe("kickoffCountdown", () => {
  it("formats sub-day countdown as HH:MM:SS", () => {
    const now = Date.parse("2026-06-15T12:00:00Z");
    expect(formatKickoffCountdown("2026-06-15T14:32:18Z", now)).toBe("02:32:18");
  });

  it("formats multi-day countdown with day prefix", () => {
    const now = Date.parse("2026-06-15T12:00:00Z");
    expect(formatKickoffCountdown("2026-06-17T16:32:18Z", now)).toBe("2d 04:32:18");
  });

  it("marks expired kickoffs", () => {
    const now = Date.parse("2026-06-15T14:00:00Z");
    const parts = getKickoffCountdownParts("2026-06-15T12:00:00Z", now);
    expect(parts.expired).toBe(true);
    expect(formatKickoffCountdown("2026-06-15T12:00:00Z", now)).toBe("Starting soon");
  });

  it("returns all fixtures sharing the earliest kickoff", () => {
    const fixtures = [
      { id: "a", date: "2026-06-15T17:00:00Z" },
      { id: "b", date: "2026-06-15T17:00:00Z" },
      { id: "c", date: "2026-06-15T20:00:00Z" },
      { id: "d", date: "2026-06-15T17:00:00Z" },
    ];
    const nextMs = getNextKickoffMs(fixtures);
    expect(nextMs).toBe(Date.parse("2026-06-15T17:00:00Z"));
    expect(getNextKickoffFixtures(fixtures).map((f) => f.id)).toEqual(["a", "b", "d"]);
    expect(isNextKickoffFixture(fixtures[2]!, nextMs)).toBe(false);
    expect(isNextKickoffFixture(fixtures[0]!, nextMs)).toBe(true);
  });
});
