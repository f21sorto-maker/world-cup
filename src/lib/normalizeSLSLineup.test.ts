import { describe, expect, it } from "vitest";
import { normalizeSLSLineup } from "./normalizeSLSLineup";
import type { SportsLiveScoresMatchBundleResponse } from "../types/sportsLiveScores";

describe("normalizeSLSLineup", () => {
  it("returns null when lineups are missing", () => {
    expect(normalizeSLSLineup("usa", "mex", {})).toBeNull();
    expect(normalizeSLSLineup("usa", "mex", { lineups: null } as SportsLiveScoresMatchBundleResponse)).toBeNull();
  });

  it("returns null when either side has no starting XI", () => {
    const raw: SportsLiveScoresMatchBundleResponse = {
      lineups: {
        home: { formation: "4-4-2", startingXI: [], subs: [] },
        away: {
          formation: "3-5-2",
          startingXI: [{ player: { id: 9, name: "Striker", number: 9, position: "FW" } }],
          subs: [],
        },
      },
    };

    expect(normalizeSLSLineup("usa", "mex", raw)).toBeNull();
  });

  it("maps SLS home/away lineups to app Lineup shape", () => {
    const raw: SportsLiveScoresMatchBundleResponse = {
      lineups: {
        home: {
          formation: "4-3-3",
          startingXI: [
            { player: { id: "1", name: "Keeper", number: 1, position: "GK" } },
            { player: { id: "10", name: "Captain", number: 10, position: "MF" }, isCaptain: true },
          ],
          subs: [{ player: { id: "12", name: "Sub", number: 12 } }],
        },
        away: {
          formation: "5-4-1",
          startingXI: [{ player: { id: "99", name: "Away Striker", number: 99, position: "FW" } }],
          subs: [],
        },
      },
    };

    const result = normalizeSLSLineup("usa", "mex", raw);

    expect(result).not.toBeNull();
    expect(result).toHaveLength(2);
    expect(result?.[0]).toMatchObject({
      team: "home",
      formation: "4-3-3",
      startingXI: [
        {
          player: { id: "1", displayName: "Keeper", jerseyNumber: 1, position: "GK" },
          isCaptain: false,
        },
        {
          player: { id: "10", displayName: "Captain", jerseyNumber: 10, position: "MF" },
          isCaptain: true,
        },
      ],
      substitutes: [
        { player: { id: "12", displayName: "Sub", jerseyNumber: 12 }, isCaptain: false },
      ],
    });
    expect(result?.[1]?.team).toBe("away");
    expect(result?.[1]?.formation).toBe("5-4-1");
    expect(result?.[1]?.startingXI[0]?.player.displayName).toBe("Away Striker");
  });

  it("defaults formation to 4-3-3 when missing", () => {
    const raw: SportsLiveScoresMatchBundleResponse = {
      lineups: {
        home: {
          startingXI: [{ player: { id: "7", name: "Home" } }],
          subs: [],
        },
        away: {
          startingXI: [{ player: { id: "8", name: "Away" } }],
          subs: [],
        },
      },
    };

    const result = normalizeSLSLineup("usa", "mex", raw);

    expect(result?.[0]?.formation).toBe("4-3-3");
    expect(result?.[1]?.formation).toBe("4-3-3");
  });
});
