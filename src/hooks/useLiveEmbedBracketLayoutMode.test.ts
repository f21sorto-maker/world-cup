import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  resolveFullBracketTabLayoutMode,
  resolveLiveEmbedBracketLayoutMode,
} from "./useLiveEmbedBracketLayoutMode";

describe("useLiveEmbedBracketLayoutMode helpers", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it("uses flow on mobile and tree on desktop for live embed", () => {
    vi.stubGlobal("window", {
      matchMedia: (query: string) => ({
        matches: !query.includes("1024"),
        addEventListener: () => {},
        removeEventListener: () => {},
      }),
    });
    expect(resolveLiveEmbedBracketLayoutMode()).toBe("flow");

    vi.stubGlobal("window", {
      matchMedia: (query: string) => ({
        matches: query.includes("1024"),
        addEventListener: () => {},
        removeEventListener: () => {},
      }),
    });
    expect(resolveLiveEmbedBracketLayoutMode()).toBe("tree");
  });

  it("opens full bracket tab with knockout-aware layout", () => {
    vi.stubGlobal("localStorage", { getItem: () => null, setItem: () => {} });
    vi.stubGlobal("window", {
      matchMedia: (query: string) => ({
        matches: !query.includes("1024"),
        addEventListener: () => {},
        removeEventListener: () => {},
      }),
    });

    expect(resolveFullBracketTabLayoutMode(true)).toBe("flow");
    expect(resolveFullBracketTabLayoutMode(false)).toBe("flow");
  });
});
