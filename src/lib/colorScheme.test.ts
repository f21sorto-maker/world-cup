import { describe, expect, it } from "vitest";
import { resolveColorScheme } from "./colorScheme";

describe("resolveColorScheme", () => {
  it("returns explicit light and dark", () => {
    expect(resolveColorScheme("light")).toBe("light");
    expect(resolveColorScheme("dark")).toBe("dark");
  });

  it("falls back to dark when system and window is unavailable", () => {
    expect(resolveColorScheme("system")).toBe("dark");
  });
});
