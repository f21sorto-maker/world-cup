import { describe, expect, it } from "vitest";
import type { MergedMatch, Team } from "../types";
import {
  buildCompletedResultsViewModel,
  buildRecentResultsSections,
  listCanonicalCompletedMatches,
  matchResultStableId,
  type ResultsStageSectionLabels,
} from "./buildCompletedResultsViewModel";
import { getResultsStageSectionKey } from "./resultsGrouping";

function makeTeam(id: string, abbrev: string): Team {
  return {
    id,
    name: id,
    shortName: abbrev,
    abbreviation: abbrev,
    group: "F",
    rating: 80,
  };
}

const teams: Record<string, Team> = {
  ned: makeTeam("ned", "NED"),
  mar: makeTeam("mar", "MAR"),
  arg: makeTeam("arg", "ARG"),
  jor: makeTeam("jor", "JOR"),
  mex: makeTeam("mex", "MEX"),
  can: makeTeam("can", "CAN"),
};

const stageLabels: ResultsStageSectionLabels = {
  group: "Group stage",
  round_of_32: "Round of 32",
  round_of_16: "Round of 16",
  quarterfinal: "Quarterfinals",
  semifinal: "Semifinals",
  third_place: "Third Place",
  final: "Final",
  knockout: "Knockout",
};

function lockedMoroccoWin(overrides: Partial<MergedMatch> = {}): MergedMatch {
  return {
    id: "M86",
    matchId: "M86",
    espnEventId: "760488",
    homeTeamId: "ned",
    awayTeamId: "mar",
    date: "2026-06-30T19:00:00Z",
    status: "completed",
    locked: true,
    source: "espn",
    homeScore: 1,
    awayScore: 1,
    penaltyShootout: { homeScore: 2, awayScore: 3 },
    homeConduct: 0,
    awayConduct: 0,
    stage: "R32",
    ...overrides,
  };
}

function completedMatch(overrides: Partial<MergedMatch> & Pick<MergedMatch, "id">): MergedMatch {
  return {
    matchId: overrides.id,
    homeTeamId: "mex",
    awayTeamId: "can",
    date: "2026-06-10T18:00:00Z",
    status: "completed",
    locked: true,
    source: "espn",
    homeScore: 2,
    awayScore: 1,
    homeConduct: 0,
    awayConduct: 0,
    ...overrides,
  };
}

const KNOCKOUT_NOW = new Date("2026-07-03T20:00:00Z");

describe("buildCompletedResultsViewModel", () => {
  it("dedupes ESPN and official rows to one locked knockout result", () => {
    const liveMatches: Record<string, MergedMatch> = {
      M86: lockedMoroccoWin(),
      espn760488: {
        id: "760488",
        espnEventId: "760488",
        homeTeamId: "ned",
        awayTeamId: "mar",
        date: "2026-06-30T19:00:00Z",
        status: "completed",
        locked: false,
        source: "espn",
        homeScore: 2,
        awayScore: 1,
        homeConduct: 0,
        awayConduct: 0,
      },
    };

    const canonical = listCanonicalCompletedMatches(liveMatches, teams);
    const m76Rows = canonical.filter((match) => matchResultStableId(match) === "M76");
    expect(m76Rows).toHaveLength(1);
    expect(m76Rows[0]?.penaltyShootout).toMatchObject({ homeScore: 2, awayScore: 3 });
    expect(m76Rows[0]?.locked).toBe(true);
  });

  it("returns the same ordered ids for Live recent and Results tab defaults", () => {
    const liveMatches: Record<string, MergedMatch> = {
      M86: lockedMoroccoWin(),
      M76: lockedMoroccoWin({
        id: "M76",
        matchId: "M76",
        homeTeamId: "ger",
        awayTeamId: "par",
        date: "2026-06-30T01:00:00Z",
      }),
    };

    const recentList = buildCompletedResultsViewModel(liveMatches, teams, { sort: "recent" });
    const resultsList = buildCompletedResultsViewModel(liveMatches, teams, {
      sort: "recent",
      filters: { sort: "recent", stage: "all", group: "all", search: "" },
    });

    expect(recentList.map(matchResultStableId)).toEqual(resultsList.map(matchResultStableId));
    expect(recentList.map((m) => m.homeScore)).toEqual(resultsList.map((m) => m.homeScore));
  });

  describe("buildRecentResultsSections", () => {
    it("groups older knockout matches by stage instead of a single earlier bucket", () => {
      const completed = [
        completedMatch({
          id: "M104",
          matchId: "M104",
          homeTeamId: "jor",
          awayTeamId: "arg",
          stage: "Final",
          date: "2026-06-29T22:00:00Z",
        }),
        lockedMoroccoWin({
          id: "M76",
          matchId: "M76",
          date: "2026-06-28T19:00:00Z",
        }),
        completedMatch({
          id: "M1",
          matchId: "M1",
          group: "A",
          stage: undefined,
          date: "2026-06-05T18:00:00Z",
        }),
      ];

      const { sections } = buildRecentResultsSections(completed, {
        isKnockoutActive: true,
        now: KNOCKOUT_NOW,
        timeLabels: { today: "Today", yesterday: "Yesterday" },
        stageLabels,
      });

      const stageSections = sections.filter((s) => s.kind === "stage");
      expect(stageSections.map((s) => s.key)).toEqual(["final", "round_of_32", "group"]);
      expect(stageSections.find((s) => s.key === "final")?.matches[0]?.matchId).toBe("M104");
      expect(stageSections.find((s) => s.key === "round_of_32")?.matches[0]?.matchId).toBe("M76");
      expect(sections.every((s) => !s.label.toLowerCase().includes("earlier"))).toBe(true);
    });

    it("orders stage sections most advanced first (Final before R32 before Group)", () => {
      const completed = [
        completedMatch({
          id: "M1",
          matchId: "M1",
          group: "B",
          date: "2026-06-01T18:00:00Z",
        }),
        lockedMoroccoWin({ id: "M76", matchId: "M76", date: "2026-06-28T19:00:00Z" }),
        completedMatch({
          id: "M104",
          matchId: "M104",
          homeTeamId: "jor",
          awayTeamId: "arg",
          stage: "Final",
          date: "2026-06-29T22:00:00Z",
        }),
      ];

      const { sections } = buildRecentResultsSections(completed, {
        isKnockoutActive: true,
        now: KNOCKOUT_NOW,
        timeLabels: { today: "Today", yesterday: "Yesterday" },
        stageLabels,
      });

      const stageKeys = sections.filter((s) => s.kind === "stage").map((s) => s.key);
      expect(stageKeys.indexOf("final")).toBeLessThan(stageKeys.indexOf("round_of_32"));
      expect(stageKeys.indexOf("round_of_32")).toBeLessThan(stageKeys.indexOf("group"));
    });

    it("reports full section totals for see-more UI", () => {
      const r32Matches = Array.from({ length: 5 }, (_, i) =>
        lockedMoroccoWin({
          id: `M${73 + i}`,
          matchId: `M${73 + i}`,
          date: `2026-06-2${i}T19:00:00Z`,
        })
      );

      const { sections, total } = buildRecentResultsSections(r32Matches, {
        isKnockoutActive: true,
        now: KNOCKOUT_NOW,
        timeLabels: { today: "Today", yesterday: "Yesterday" },
        stageLabels,
      });

      expect(total).toBe(5);
      const r32 = sections.find((s) => s.key === "round_of_32");
      expect(r32?.total).toBe(5);
      expect(r32?.matches).toHaveLength(5);
    });

    it("during knockout, buckets yesterday into stage sections (Final separate from R32)", () => {
      const completed = [
        completedMatch({
          id: "M104",
          matchId: "M104",
          homeTeamId: "jor",
          awayTeamId: "arg",
          stage: "Final",
          date: "2026-07-02T22:00:00Z",
        }),
        lockedMoroccoWin({
          id: "M76",
          matchId: "M76",
          date: "2026-07-02T19:00:00Z",
        }),
      ];

      const { sections } = buildRecentResultsSections(completed, {
        isKnockoutActive: true,
        now: KNOCKOUT_NOW,
        timeLabels: { today: "Today", yesterday: "Yesterday" },
        stageLabels,
      });

      expect(sections.some((s) => s.key === "yesterday")).toBe(false);
      expect(sections.find((s) => s.key === "final")?.matches[0]?.matchId).toBe("M104");
      expect(sections.find((s) => s.key === "round_of_32")?.matches[0]?.matchId).toBe("M76");
    });

    it("keeps today as a time section; during knockout yesterday uses stage buckets", () => {
      const completed = [
        lockedMoroccoWin({
          id: "M76",
          matchId: "M76",
          date: "2026-07-03T15:00:00Z",
        }),
        lockedMoroccoWin({
          id: "M77",
          matchId: "M77",
          date: "2026-07-02T15:00:00Z",
        }),
      ];

      const { sections } = buildRecentResultsSections(completed, {
        isKnockoutActive: true,
        now: KNOCKOUT_NOW,
        timeLabels: { today: "Today", yesterday: "Yesterday" },
        stageLabels,
      });

      expect(sections[0]?.key).toBe("today");
      expect(sections.some((s) => s.key === "yesterday")).toBe(false);
      expect(sections.find((s) => s.key === "round_of_32")?.matches.some((m) => m.matchId === "M77")).toBe(
        true
      );
    });

    it("keeps yesterday as a time section when knockout is not active", () => {
      const completed = [
        lockedMoroccoWin({
          id: "M76",
          matchId: "M76",
          date: "2026-07-02T15:00:00Z",
        }),
      ];

      const { sections } = buildRecentResultsSections(completed, {
        isKnockoutActive: false,
        now: KNOCKOUT_NOW,
        timeLabels: { today: "Today", yesterday: "Yesterday" },
        stageLabels,
      });

      expect(sections[0]?.key).toBe("yesterday");
      expect(sections.every((s) => s.kind !== "stage")).toBe(true);
    });

    it("places third-place matches in their own section", () => {
      const completed = [
        completedMatch({
          id: "M103",
          matchId: "M103",
          stage: "ThirdPlace",
          date: "2026-06-29T18:00:00Z",
        }),
      ];

      expect(getResultsStageSectionKey(completed[0]!)).toBe("third_place");

      const { sections } = buildRecentResultsSections(completed, {
        isKnockoutActive: true,
        now: KNOCKOUT_NOW,
        timeLabels: { today: "Today", yesterday: "Yesterday" },
        stageLabels,
      });

      expect(sections.some((s) => s.key === "third_place")).toBe(true);
    });
  });
});
