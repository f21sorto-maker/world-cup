import { describe, expect, it } from "vitest";
import { matchHasStoredEvents } from "./matchHasStoredEvents";
import type { MatchEvent, MergedMatch } from "../types";

const match: MergedMatch = {
  id: "espn-999",
  matchId: "M76",
  espnEventId: "espn-999",
  homeTeamId: "ned",
  awayTeamId: "mar",
  date: "2026-06-30",
  status: "completed",
  locked: true,
  source: "espn",
  homeScore: 1,
  awayScore: 1,
};

const event: MatchEvent = {
  providerId: "g1",
  minute: 44,
  type: "goal",
  teamId: "mar",
  playerName: "Hakimi",
};

describe("matchHasStoredEvents", () => {
  it("detects events stored under any match alias key", () => {
    expect(matchHasStoredEvents(match, {})).toBe(false);
    expect(matchHasStoredEvents(match, { M76: [event] })).toBe(true);
    expect(matchHasStoredEvents(match, { "espn-999": [event] })).toBe(true);
  });
});
