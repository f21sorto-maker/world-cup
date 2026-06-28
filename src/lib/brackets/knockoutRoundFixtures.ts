import type { Stage } from "../../types";

/** Official FIFA WC 2026 knockout progression — feeder winner keys (W73…) per stage. */
export const KNOCKOUT_ROUND_FIXTURES: Record<Exclude<Stage, "R32">, Array<[string, string, string]>> = {
  R16: [
    ["M89", "W74", "W77"],
    ["M90", "W73", "W75"],
    ["M91", "W76", "W78"],
    ["M92", "W79", "W80"],
    ["M93", "W83", "W84"],
    ["M94", "W81", "W82"],
    ["M95", "W86", "W88"],
    ["M96", "W85", "W87"],
  ],
  QF: [
    ["M97", "W89", "W90"],
    ["M98", "W93", "W94"],
    ["M99", "W91", "W92"],
    ["M100", "W95", "W96"],
  ],
  SF: [
    ["M101", "W97", "W98"],
    ["M102", "W99", "W100"],
  ],
  Final: [["M104", "W101", "W102"]],
};
