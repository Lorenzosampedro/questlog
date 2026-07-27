import { describe, expect, it } from "vitest";
import { getSpineDepth, TOME_MIN_DEPTH, TOME_MAX_DEPTH } from "./tome";

describe("getSpineDepth", () => {
  it("returns the minimum depth for a game with no entries", () => {
    expect(getSpineDepth(0)).toBe(TOME_MIN_DEPTH);
  });

  it("never goes below the minimum depth", () => {
    expect(getSpineDepth(1)).toBeGreaterThanOrEqual(TOME_MIN_DEPTH);
  });

  it("clamps negative entry counts to the minimum depth", () => {
    expect(getSpineDepth(-5)).toBe(TOME_MIN_DEPTH);
  });

  it("grows monotonically as entry count increases", () => {
    const counts = [0, 1, 2, 5, 10, 20, 50, 100];
    const depths = counts.map(getSpineDepth);

    for (let i = 1; i < depths.length; i++) {
      expect(depths[i]).toBeGreaterThan(depths[i - 1]);
    }
  });

  it("caps at the maximum depth for very large entry counts", () => {
    expect(getSpineDepth(1000)).toBe(TOME_MAX_DEPTH);
    expect(getSpineDepth(1_000_000)).toBe(TOME_MAX_DEPTH);
  });

  it("never exceeds the maximum depth at any entry count", () => {
    for (const count of [0, 1, 10, 100, 1000, 100_000]) {
      expect(getSpineDepth(count)).toBeLessThanOrEqual(TOME_MAX_DEPTH);
    }
  });

  it("grows noticeably for the first few entries", () => {
    // The early jump (1 -> 5 entries) should feel like real growth, not a
    // rounding error — this is the whole point of the log scale.
    const depthAtOne = getSpineDepth(1);
    const depthAtFive = getSpineDepth(5);
    expect(depthAtFive - depthAtOne).toBeGreaterThan(15);
  });
});
