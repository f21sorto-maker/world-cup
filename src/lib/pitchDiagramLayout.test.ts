import { describe, expect, it } from "vitest";
import {
  PITCH_LAYOUT,
  pitchLeftPercent,
  pitchTopPercentAway,
  pitchTopPercentHome,
} from "./pitchDiagramLayout";

describe("pitchDiagramLayout", () => {
  it("maps horizontal grid to legacy SVG x coordinates", () => {
    const inner = PITCH_LAYOUT.width - PITCH_LAYOUT.padding * 2;
    const legacyX = (x: number) => PITCH_LAYOUT.padding + (x / 100) * inner;
    expect(pitchLeftPercent(0)).toBeCloseTo((legacyX(0) / PITCH_LAYOUT.width) * 100, 4);
    expect(pitchLeftPercent(50)).toBeCloseTo((legacyX(50) / PITCH_LAYOUT.width) * 100, 4);
    expect(pitchLeftPercent(100)).toBeCloseTo((legacyX(100) / PITCH_LAYOUT.width) * 100, 4);
  });

  it("maps away y to top half of pitch", () => {
    const halfInner = PITCH_LAYOUT.height / 2 - PITCH_LAYOUT.padding;
    const legacyY = (y: number) => PITCH_LAYOUT.padding + (y / 100) * halfInner;
    expect(pitchTopPercentAway(0)).toBeCloseTo((legacyY(0) / PITCH_LAYOUT.height) * 100, 4);
    expect(pitchTopPercentAway(100)).toBeCloseTo((legacyY(100) / PITCH_LAYOUT.height) * 100, 4);
  });

  it("maps home y to bottom half of pitch", () => {
    const halfInner = PITCH_LAYOUT.height / 2 - PITCH_LAYOUT.padding;
    const legacyY = (y: number) =>
      PITCH_LAYOUT.height - PITCH_LAYOUT.padding - (y / 100) * halfInner;
    expect(pitchTopPercentHome(0)).toBeCloseTo((legacyY(0) / PITCH_LAYOUT.height) * 100, 4);
    expect(pitchTopPercentHome(100)).toBeCloseTo((legacyY(100) / PITCH_LAYOUT.height) * 100, 4);
  });
});
