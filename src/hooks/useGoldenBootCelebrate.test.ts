import { describe, expect, it } from "vitest";
import { nextGoldenBootCelebrateState } from "./goldenBootCelebrate";

const initial = {
  mounted: false,
  prevLeaderId: "",
  prevLeaderGoals: 0,
};

describe("nextGoldenBootCelebrateState", () => {
  it("celebrates on first leader paint", () => {
    const result = nextGoldenBootCelebrateState(initial, "messi", 2);
    expect(result.celebrate).toBe(true);
    expect(result.state).toMatchObject({ mounted: true, prevLeaderId: "messi", prevLeaderGoals: 2 });
  });

  it("celebrates when leader identity changes", () => {
    const first = nextGoldenBootCelebrateState(initial, "messi", 2);
    const second = nextGoldenBootCelebrateState(first.state, "mbappe", 3);
    expect(second.celebrate).toBe(true);
  });

  it("celebrates when the same leader adds a goal", () => {
    const first = nextGoldenBootCelebrateState(initial, "messi", 2);
    const second = nextGoldenBootCelebrateState(first.state, "messi", 3);
    expect(second.celebrate).toBe(true);
  });

  it("does not celebrate when goals stay flat", () => {
    const first = nextGoldenBootCelebrateState(initial, "messi", 2);
    const second = nextGoldenBootCelebrateState(first.state, "messi", 2);
    expect(second.celebrate).toBe(false);
  });
});
