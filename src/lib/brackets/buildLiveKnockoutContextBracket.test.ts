import { describe, expect, it } from "vitest";
import { buildConfirmedBracketFromSchedule } from "./buildConfirmedBracketFromSchedule";
import { buildLiveKnockoutContextBracket } from "./buildLiveKnockoutContextBracket";
import type { MergedMatch, Team, TeamRecord } from "../../types";

function team(id: string, group: Team["group"] = "E"): Team {
  return {
    id,
    name: id,
    shortName: id,
    abbreviation: id.toUpperCase().slice(0, 3),
    group,
    logo: "",
    rating: 1500,
  };
}

function row(teamId: string, group: Team["group"], points: number): TeamRecord {
  return {
    teamId,
    played: 3,
    wins: 1,
    draws: 0,
    losses: 2,
    goalsFor: points,
    goalsAgainst: 0,
    goalDifference: points,
    points,
    conduct: 0,
    group,
  };
}

function lockedKnockout(
  overrides: Partial<MergedMatch> & Pick<MergedMatch, "id">
): MergedMatch {
  return {
    matchId: overrides.matchId ?? overrides.id,
    date: "2026-06-29T17:00:00Z",
    homeTeamId: "ned",
    awayTeamId: "mar",
    status: "completed",
    locked: true,
    source: "espn",
    homeScore: 1,
    awayScore: 1,
    penaltyShootout: { homeScore: 2, awayScore: 3, home: [], away: [] },
    homeConduct: 0,
    awayConduct: 0,
    stage: "R32",
    ...overrides,
  };
}

describe("buildLiveKnockoutContextBracket", () => {
  const qualContext = {
    lockedGroupMatchCount: {},
    lockedStandingsByGroup: {
      E: [
        row("ger", "E", 9),
        row("crc", "E", 6),
        row("cuw", "E", 3),
        row("civ", "E", 0),
      ],
      F: [
        row("ned", "F", 9),
        row("par", "F", 6),
        row("hai", "F", 3),
        row("swe", "F", 0),
      ],
      C: [
        row("mar", "C", 9),
        row("bra", "C", 6),
        row("crc", "C", 3),
        row("cuw", "C", 0),
      ],
      I: [
        row("fra", "I", 9),
        row("nor", "I", 6),
        row("civ", "I", 3),
        row("swe", "I", 0),
      ],
    },
  };

  const teamsList = [team("ned", "F"), team("mar", "C"), team("fra", "I"), team("ger", "E")];
  const teamsById = Object.fromEntries(teamsList.map((t) => [t.id, t]));

  function buildWithLive(liveMatches: Record<string, MergedMatch>) {
    const base = buildConfirmedBracketFromSchedule({
      teams: teamsById,
      liveMatches,
      groupStandings: [],
      qualContext,
    });
    return buildLiveKnockoutContextBracket(base, liveMatches, teamsById);
  }

  it("does not advance NED from unlocked stale M76 into R16", () => {
    const liveMatches: Record<string, MergedMatch> = {
      M76: {
        ...lockedKnockout({
          id: "M76",
          matchId: "M76",
          homeTeamId: "ned",
          awayTeamId: "mar",
          homeScore: 2,
          awayScore: 1,
        }),
        locked: false,
      },
    };

    const { bracket } = buildWithLive(liveMatches);
    const m90 = bracket.find((slot) => slot.id === "M90");
    expect(m90?.homeTeamId).toBe("par");
    expect(m90?.awayTeamId).toBe("mar");
    expect(m90?.awayTeamId).not.toBe("ned");
  });

  it("places locked MAR winner on M90 when M76 is official", () => {
    const liveMatches: Record<string, MergedMatch> = {
      M76: lockedKnockout({
        id: "M76",
        matchId: "M76",
        espnEventId: "760488",
        homeTeamId: "ned",
        awayTeamId: "mar",
      }),
    };

    const { bracket } = buildWithLive(liveMatches);

    const m76 = bracket.find((slot) => slot.id === "M76");
    const m90 = bracket.find((slot) => slot.id === "M90");

    expect(m76?.winnerTeamId).toBe("mar");
    expect(m90?.awayTeamId).toBe("mar");
    expect(m90?.awayTeamId).not.toBe("ned");
  });
});
