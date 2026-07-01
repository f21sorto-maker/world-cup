import { describe, expect, it } from "vitest";
import { buildWc2026TeamCatalog } from "../../data/wc2026TeamCatalog";
import { materializeFullSchedule } from "../materializeFullSchedule";
import { prepareLiveMatchStore } from "../liveMatchStorePipeline";
import { effectiveStandings } from "../materializedScheduleCache";
import { isKnockoutBracketMatchId } from "../bracketTree";
import { buildConfirmedBracketFromSchedule } from "./buildConfirmedBracketFromSchedule";
import type { GroupStanding, MergedMatch, Team, TeamRecord } from "../../types";
import type { QualificationMatchContext } from "../qualification";

function row(teamId: string, group: GroupStanding["group"], points: number): TeamRecord {
  return {
    teamId,
    group,
    played: 3,
    wins: 1,
    draws: 0,
    losses: 2,
    goalsFor: points,
    goalsAgainst: 0,
    goalDifference: points,
    points,
    conduct: 0,
  };
}

function assertParity(
  teamsById: Record<string, Team>,
  liveMatches: Record<string, MergedMatch>,
  standings: GroupStanding[]
) {
  const qualContext: QualificationMatchContext = {
    lockedGroupMatchCount: {},
    lockedStandingsByGroup: Object.fromEntries(standings.map((s) => [s.group, s.rows])),
  };

  const prepared = prepareLiveMatchStore(liveMatches, teamsById);
  const effective = effectiveStandings(standings);
  const schedule = materializeFullSchedule(teamsById, prepared, effective);
  const { bracket } = buildConfirmedBracketFromSchedule({
    teams: teamsById,
    liveMatches,
    groupStandings: standings,
    qualContext,
  });

  const scheduleById = new Map(
    schedule
      .filter((m) => {
        const id = m.matchId ?? m.id;
        return id && isKnockoutBracketMatchId(id);
      })
      .map((m) => [m.matchId ?? m.id!, m])
  );

  for (const slot of bracket) {
    const row = scheduleById.get(slot.id);
    expect(row, `schedule row missing for ${slot.id}`).toBeDefined();
    expect(slot.homeTeamId ?? "").toBe(row!.homeTeamId ?? "");
    expect(slot.awayTeamId ?? "").toBe(row!.awayTeamId ?? "");
  }
}

describe("confirmedBracketScheduleParity", () => {
  const teams = buildWc2026TeamCatalog();

  const fullStandings: GroupStanding[] = [
    { group: "A", rows: [row("mex", "A", 9), row("rsa", "A", 6), row("usa", "A", 3), row("per", "A", 0)] },
    { group: "B", rows: [row("bra", "B", 9), row("can", "B", 6), row("chi", "B", 3), row("bol", "B", 0)] },
    { group: "C", rows: [row("mar", "C", 9), row("bra", "C", 6), row("crc", "C", 3), row("cuw", "C", 0)] },
    { group: "D", rows: [row("usa", "D", 9), row("par", "D", 6), row("hai", "D", 3), row("swe", "D", 0)] },
    { group: "E", rows: [row("ger", "E", 9), row("crc", "E", 6), row("cuw", "E", 3), row("civ", "E", 0)] },
    { group: "F", rows: [row("ned", "F", 9), row("jpn", "F", 6), row("hai", "F", 3), row("swe", "F", 0)] },
    { group: "I", rows: [row("fra", "I", 9), row("nor", "I", 6), row("civ", "I", 3), row("swe", "I", 0)] },
  ];

  it("matches materialized schedule for canonical M75/M76 feeders → M90/M91", () => {
    assertParity(teams, {}, fullStandings);

    const { bracket } = buildConfirmedBracketFromSchedule({
      teams,
      liveMatches: {},
      groupStandings: fullStandings,
      qualContext: {
        lockedGroupMatchCount: {},
        lockedStandingsByGroup: Object.fromEntries(fullStandings.map((s) => [s.group, s.rows])),
      },
    });

    const m90 = bracket.find((s) => s.id === "M90");
    const m91 = bracket.find((s) => s.id === "M91");
    expect(m90?.homeTeamId).toBe("par");
    expect(m90?.awayTeamId).toBe("mar");
    expect(m91?.homeTeamId).toBe("nor");
    expect(m91?.awayTeamId).toBe("fra");
  });

  it("matches schedule with legacy M86 cache key migrated to M76", () => {
    const polluted: Record<string, MergedMatch> = {
      M86: {
        id: "M86",
        matchId: "M86",
        espnEventId: "760488",
        homeTeamId: "ned",
        awayTeamId: "mar",
        status: "completed",
        locked: true,
        homeScore: 1,
        awayScore: 1,
        penaltyShootout: { homeScore: 2, awayScore: 3, home: [], away: [] },
        source: "espn",
        homeConduct: 0,
        awayConduct: 0,
      },
    };

    assertParity(teams, polluted, fullStandings);
  });

  it("matches schedule when unlocked polluted rows coexist with canonical force", () => {
    const polluted: Record<string, MergedMatch> = {
      M76: {
        id: "M76",
        matchId: "M76",
        homeTeamId: "ned",
        awayTeamId: "mar",
        status: "completed",
        locked: false,
        homeScore: 2,
        awayScore: 1,
        source: "espn",
        homeConduct: 0,
        awayConduct: 0,
      },
    };

    assertParity(teams, polluted, fullStandings);
  });

  it("matches schedule with empty standings (canonical locked R32 only)", () => {
    assertParity(teams, {}, []);
  });
});
