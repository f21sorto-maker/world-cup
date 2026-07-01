import { describe, expect, it } from "vitest";
import {
  buildFlowBracketConnectors,
  buildFlowBracketLayout,
  FLOW_BRACKET_METRICS,
} from "./buildFlowBracketLayout";
import { BRACKET_STAGE_SHORT_LABELS } from "./bracketStageLabels";
import { R32_VISUAL_ORDER } from "./bracketProgression";

const ALL_KNOCKOUT = [
  ...R32_VISUAL_ORDER,
  "M89",
  "M90",
  "M91",
  "M92",
  "M93",
  "M94",
  "M95",
  "M96",
  "M97",
  "M98",
  "M99",
  "M100",
  "M101",
  "M102",
  "M103",
  "M104",
];

describe("buildFlowBracketLayout", () => {
  it("places left-half R32 in column 0 for left scope", () => {
    const layout = buildFlowBracketLayout(ALL_KNOCKOUT, BRACKET_STAGE_SHORT_LABELS, "left")!;
    const m73 = layout.nodes.get("M73")!;
    const m89 = layout.nodes.get("M89")!;

    expect(m73.x).toBeLessThan(m89.x);
    expect(m89.x).toBeGreaterThan(m73.x + m73.width);
  });

  it("places Final between left and right SF columns in full scope", () => {
    const layout = buildFlowBracketLayout(ALL_KNOCKOUT, BRACKET_STAGE_SHORT_LABELS, "full")!;
    const final = layout.nodes.get("M104")!;
    const leftSf = layout.nodes.get("M101")!;
    const rightSf = layout.nodes.get("M102")!;

    expect(leftSf.x).toBeLessThan(final.x);
    expect(final.x).toBeLessThan(rightSf.x);
  });

  it("centers R16 between feeder R32 pairs in left scope", () => {
    const layout = buildFlowBracketLayout(ALL_KNOCKOUT, BRACKET_STAGE_SHORT_LABELS, "left")!;
    const m73 = layout.nodes.get("M73")!;
    const m74 = layout.nodes.get("M74")!;
    const m89 = layout.nodes.get("M89")!;

    expect(m89.y + m89.height / 2).toBeCloseTo((m73.y + m73.height / 2 + m74.y + m74.height / 2) / 2, 0);
  });

  it("spaces adjacent R32 nodes without vertical overlap", () => {
    const layout = buildFlowBracketLayout(ALL_KNOCKOUT, BRACKET_STAGE_SHORT_LABELS, "left")!;
    const minGap = 8;
    const { cardHeight } = FLOW_BRACKET_METRICS;

    const leftR32 = R32_VISUAL_ORDER.slice(0, 8)
      .map((id) => layout.nodes.get(id))
      .filter((node): node is NonNullable<typeof node> => Boolean(node))
      .sort((a, b) => a.y - b.y);

    for (let i = 1; i < leftR32.length; i += 1) {
      const prev = leftR32[i - 1]!;
      const next = leftR32[i]!;
      expect(next.y).toBeGreaterThanOrEqual(prev.y + cardHeight + minGap);
    }
  });

  it("builds connector paths for visible matches", () => {
    const visible = new Set(ALL_KNOCKOUT);
    const layout = buildFlowBracketLayout(visible, BRACKET_STAGE_SHORT_LABELS, "full")!;
    const connectors = buildFlowBracketConnectors(layout, visible);

    expect(connectors.length).toBeGreaterThan(20);
    expect(connectors.some((segment) => segment.childId === "M104")).toBe(true);
  });

  it("excludes center matches from half scopes", () => {
    const left = buildFlowBracketLayout(ALL_KNOCKOUT, BRACKET_STAGE_SHORT_LABELS, "left")!;
    expect(left.nodes.has("M104")).toBe(false);

    const full = buildFlowBracketLayout(ALL_KNOCKOUT, BRACKET_STAGE_SHORT_LABELS, "full")!;
    expect(full.nodes.has("M104")).toBe(true);
  });
});
