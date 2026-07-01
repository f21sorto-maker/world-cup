import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  readStoredBracketLayoutMode,
  writeStoredBracketLayoutMode,
  hasStoredBracketLayoutPreference,
  preferLayoutForKnockoutIfUnset,
  BRACKET_LAYOUT_STORAGE_KEY,
} from "./bracketLayoutPreference";

describe("bracketLayoutPreference", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it("persists user layout choice", () => {
    const storage = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => {
        storage.set(key, value);
      },
    });

    writeStoredBracketLayoutMode("flow");
    expect(storage.get(BRACKET_LAYOUT_STORAGE_KEY)).toBe("flow");
    expect(readStoredBracketLayoutMode()).toBe("flow");
    expect(hasStoredBracketLayoutPreference()).toBe(true);
  });

  it("persists user layout choice (tree)", () => {
    const storage = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => {
        storage.set(key, value);
      },
    });

    writeStoredBracketLayoutMode("tree");
    expect(storage.get(BRACKET_LAYOUT_STORAGE_KEY)).toBe("tree");
    expect(readStoredBracketLayoutMode()).toBe("tree");
    expect(hasStoredBracketLayoutPreference()).toBe(true);
  });

  it("prefers tree during knockout on desktop when unset", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => null,
      setItem: () => {},
    });
    vi.stubGlobal("window", {
      matchMedia: (query: string) => ({
        matches: query.includes("1024"),
        addEventListener: () => {},
        removeEventListener: () => {},
      }),
    });

    expect(hasStoredBracketLayoutPreference()).toBe(false);
    expect(preferLayoutForKnockoutIfUnset(true)).toBe("tree");
    expect(preferLayoutForKnockoutIfUnset(false)).toBeNull();
  });

  it("prefers flow during knockout on mobile when unset", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => null,
      setItem: () => {},
    });
    vi.stubGlobal("window", {
      matchMedia: (query: string) => ({
        matches: !query.includes("1024"),
        addEventListener: () => {},
        removeEventListener: () => {},
      }),
    });

    expect(preferLayoutForKnockoutIfUnset(true)).toBe("flow");
  });

  it("does not override when user saved schedule layout", () => {
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => (key === BRACKET_LAYOUT_STORAGE_KEY ? "schedule" : null),
      setItem: () => {},
    });
    vi.stubGlobal("window", {
      matchMedia: () => ({ matches: true, addEventListener: () => {}, removeEventListener: () => {} }),
    });

    expect(preferLayoutForKnockoutIfUnset(true)).toBeNull();
  });
});
