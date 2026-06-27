import { describe, expect, it } from "vitest";
import { normalizePlayerName, playerNamesMatch } from "./normalizePlayerName";

describe("normalizePlayerName", () => {
  it("strips accents and punctuation", () => {
    expect(normalizePlayerName("Aïssa Mandi")).toBe("aissa mandi");
    expect(normalizePlayerName("Mbappé, K.")).toBe("mbappe k");
  });
});

describe("playerNamesMatch", () => {
  it("matches exact normalized names", () => {
    expect(playerNamesMatch("Lionel Messi", "lionel messi")).toBe(true);
  });

  it("matches last name with initial", () => {
    expect(playerNamesMatch("K. Mbappé", "Kylian Mbappe")).toBe(true);
  });
});
