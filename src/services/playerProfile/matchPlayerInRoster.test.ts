import { describe, expect, it } from "vitest";
import { matchPlayerInRoster } from "./matchPlayerInRoster";
import type { Wc2026Player } from "../WorldCup2026Client";

const roster: Wc2026Player[] = [
  {
    id: "150451",
    fullName: "Aïssa Mandi",
    lastName: "Mandi",
    age: 34,
    citizenship: "Algeria",
  },
  {
    id: "225561",
    fullName: "Luca Zidane",
    lastName: "Zidane",
    image: "https://example.com/luca.jpg",
  },
];

describe("matchPlayerInRoster", () => {
  it("matches by provider id", () => {
    expect(
      matchPlayerInRoster(roster, { playerId: "150451", playerName: "Unknown" })?.fullName
    ).toBe("Aïssa Mandi");
  });

  it("matches by fuzzy name", () => {
    expect(
      matchPlayerInRoster(roster, { playerName: "Aissa Mandi" })?.id
    ).toBe("150451");
  });

  it("returns undefined when no match", () => {
    expect(matchPlayerInRoster(roster, { playerName: "Nobody" })).toBeUndefined();
  });
});
