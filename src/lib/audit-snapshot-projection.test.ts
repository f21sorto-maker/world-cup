import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  auditProjectionViolations,
  buildQualificationContext,
  computeQualificationStatus,
  deriveStandingsIfScored
} from "./qualification";
import { rankAliveBestThirds } from "./thirdPlaceQualification";
import type { Match, Team } from "../types";

function groupFromNote(note?: string): string | undefined {
  const match = note?.match(/Group ([A-L])/);
  return match?.[1];
}

function parseSnapshot(raw: unknown): { teams: Team[]; matches: Match[] } {
  const teams = new Map<string, Team>();
  const matches: Match[] = [];

  for (const event of (raw as { events?: unknown[] }).events ?? []) {
    const e = event as {
      id?: string;
      date?: string;
      competitions?: Array<{
        date?: string;
        altGameNote?: string;
        status?: { type?: { completed?: boolean } };
        competitors?: Array<{
          id?: string;
          homeAway?: string;
          team?: { id?: string; displayName?: string; abbreviation?: string };
          score?: string;
        }>;
      }>;
    };

    const comp = e.competitions?.[0];
    if (!comp) continue;
    const group = groupFromNote(comp.altGameNote);
    if (!group) continue;

    const home = comp.competitors?.find((c) => c.homeAway === "home");
    const away = comp.competitors?.find((c) => c.homeAway === "away");
    if (!home?.team?.id || !away?.team?.id) continue;

    const homeId = home.team.id;
    const awayId = away.team.id;

    if (!teams.has(homeId)) {
      teams.set(homeId, {
        id: homeId,
        name: home.team.displayName ?? homeId,
        shortName: home.team.abbreviation ?? homeId,
        abbreviation: home.team.abbreviation ?? homeId.slice(0, 3).toUpperCase(),
        group: group as Team["group"],
        rating: 1500
      });
    }
    if (!teams.has(awayId)) {
      teams.set(awayId, {
        id: awayId,
        name: away.team.displayName ?? awayId,
        shortName: away.team.abbreviation ?? awayId,
        abbreviation: away.team.abbreviation ?? awayId.slice(0, 3).toUpperCase(),
        group: group as Team["group"],
        rating: 1500
      });
    }

    const completed = Boolean(comp.status?.type?.completed);
    const homeScore = completed ? Number(home.score ?? 0) : undefined;
    const awayScore = completed ? Number(away.score ?? 0) : undefined;

    matches.push({
      id: e.id ?? `${homeId}-${awayId}`,
      date: comp.date ?? e.date ?? "",
      homeTeamId: homeId,
      awayTeamId: awayId,
      group: group as Match["group"],
      status: completed ? "completed" : "scheduled",
      locked: completed,
      homeScore,
      awayScore,
      homeConduct: 0,
      awayConduct: 0,
      source: "espn"
    });
  }

  return { teams: [...teams.values()], matches };
}

describe("frozen ESPN snapshot — projection audit", () => {
  const raw = JSON.parse(readFileSync(new URL("../../.cursor/audit-espn-snapshot.json", import.meta.url), "utf8"));
  const { teams, matches } = parseSnapshot(raw);
  const standings = deriveStandingsIfScored(matches, teams)!;
  const context = buildQualificationContext(matches, teams);
  const teamIds = teams.map((t) => t.id);

  it("has no projection violations", () => {
    const violations = auditProjectionViolations(teamIds, standings, context);
    expect(violations).toEqual([]);
  });

  it("does not mark best-eight thirds as projected_out", () => {
    const aliveBest = rankAliveBestThirds(standings, context);
    const topEight = aliveBest.slice(0, 8);

    for (const row of topEight) {
      const qual = computeQualificationStatus(row.teamId, standings, context);
      expect(qual.status, `${row.teamId} rank ${aliveBest.indexOf(row) + 1}`).not.toBe("projected_out");
      expect(qual.canQualify).toBe(true);
      expect(qual.projectionScore).toBeGreaterThan(0);
    }
  });

  it("eliminated teams have projectionScore 0", () => {
    for (const teamId of teamIds) {
      const qual = computeQualificationStatus(teamId, standings, context);
      if (!qual.canQualify) {
        expect(qual.projectionScore, teamId).toBe(0);
        expect(qual.lifeState, teamId).toBe("eliminated");
      }
    }
  });
});
