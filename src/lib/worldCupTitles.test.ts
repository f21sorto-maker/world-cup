import { describe, expect, it } from "vitest";
import { getTeamWorldCupTitles, getWorldCupTitles } from "./worldCupTitles";

describe("worldCupTitles", () => {
  it("returns title count by abbreviation", () => {
    expect(getWorldCupTitles("ARG")).toBe(3);
    expect(getWorldCupTitles("BRA")).toBe(5);
    expect(getWorldCupTitles("USA")).toBe(0);
  });

  it("is case-insensitive", () => {
    expect(getWorldCupTitles("arg")).toBe(3);
  });

  it("reads from team object", () => {
    expect(
      getTeamWorldCupTitles({ abbreviation: "FRA", name: "France", shortName: "FRA" } as never)
    ).toBe(2);
    expect(getTeamWorldCupTitles(undefined)).toBe(0);
  });
});
