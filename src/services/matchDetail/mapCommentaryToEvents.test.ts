import { describe, expect, it } from "vitest";
import { mapCommentaryToEvents } from "./mapCommentaryToEvents";

describe("mapCommentaryToEvents", () => {
  it("parses goal commentary entries", () => {
    const events = mapCommentaryToEvents(
      [{ minute: 34, text: "GOAL! Christian Pulisic scores for USA!", type: "goal" }],
      "USA",
      "MEX",
      "USA",
      "Mexico"
    );
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe("goal");
    expect(events[0].minute).toBe(34);
  });

  it("parses substitution commentary", () => {
    const events = mapCommentaryToEvents(
      [{ minute: 67, text: "Substitution: Gio Reyna replaces Tyler Adams", type: "sub" }],
      "USA",
      "MEX",
      "USA",
      "Mexico"
    );
    expect(events[0].type).toBe("substitution");
  });

  it("parses yellow card text", () => {
    const events = mapCommentaryToEvents(
      [{ minute: 41, text: "Yellow card for Hirving Lozano" }],
      "USA",
      "MEX",
      "USA",
      "Mexico"
    );
    expect(events[0].type).toBe("yellow_card");
  });
});
