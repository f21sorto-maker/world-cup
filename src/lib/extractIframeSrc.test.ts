import { describe, expect, it } from "vitest";
import { extractIframeSrc } from "./extractIframeSrc";

describe("extractIframeSrc", () => {
  it("extracts src from iframe markup", () => {
    expect(
      extractIframeSrc(
        '<iframe src="https://player.example.com/embed/123" width="640" height="360"></iframe>'
      )
    ).toBe("https://player.example.com/embed/123");
  });

  it("extracts single-quoted src", () => {
    expect(extractIframeSrc("<iframe src='https://stream.test/v/1'></iframe>")).toBe(
      "https://stream.test/v/1"
    );
  });

  it("returns bare URL when html is just a link", () => {
    expect(extractIframeSrc("https://stream.test/live/abc")).toBe("https://stream.test/live/abc");
  });

  it("returns undefined for empty or non-iframe html", () => {
    expect(extractIframeSrc("")).toBeUndefined();
    expect(extractIframeSrc("<div>no iframe</div>")).toBeUndefined();
  });
});
