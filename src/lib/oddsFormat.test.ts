import { describe, expect, it } from "vitest";
import { probabilityToAmerican, probabilitiesToAmericanOdds } from "./oddsFormat";

describe("oddsFormat", () => {
  it("converts favorite probability to negative American odds", () => {
    expect(probabilityToAmerican(0.6)).toBe(-150);
  });

  it("converts underdog probability to positive American odds", () => {
    expect(probabilityToAmerican(0.4)).toBe(150);
  });

  it("maps full 1X2 probabilities", () => {
    const american = probabilitiesToAmericanOdds({
      homeWin: 0.45,
      draw: 0.25,
      awayWin: 0.3,
    });
    expect(american.homeWin).toBeGreaterThan(0);
    expect(american.draw).toBeGreaterThan(0);
    expect(american.awayWin).toBeGreaterThan(0);
  });
});
