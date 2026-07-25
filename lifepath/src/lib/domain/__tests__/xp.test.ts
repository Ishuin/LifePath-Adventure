import { describe, it, expect } from "vitest";
import { levelForXp, levelProgress, xpForLevel } from "../xp";

describe("xpForLevel", () => {
  it("uses the triangular curve 0, 200, 600, 1200, 2000", () => {
    expect(xpForLevel(1)).toBe(0);
    expect(xpForLevel(2)).toBe(200);
    expect(xpForLevel(3)).toBe(600);
    expect(xpForLevel(4)).toBe(1200);
    expect(xpForLevel(5)).toBe(2000);
  });

  it("clamps sub-1 levels to level 1's requirement", () => {
    expect(xpForLevel(0)).toBe(0);
    expect(xpForLevel(-3)).toBe(0);
  });
});

describe("levelForXp", () => {
  it("is level 1 at zero and never below 1", () => {
    expect(levelForXp(0)).toBe(1);
    expect(levelForXp(-100)).toBe(1);
    expect(levelForXp(199)).toBe(1);
  });

  it("crosses to the next level exactly at each threshold", () => {
    expect(levelForXp(200)).toBe(2);
    expect(levelForXp(599)).toBe(2);
    expect(levelForXp(600)).toBe(3);
    expect(levelForXp(1200)).toBe(4);
    expect(levelForXp(2000)).toBe(5);
  });

  it("inverts xpForLevel for a range of levels", () => {
    for (let l = 1; l <= 20; l++) {
      expect(levelForXp(xpForLevel(l))).toBe(l);
      // One XP short of the threshold is still the previous level.
      if (l > 1) expect(levelForXp(xpForLevel(l) - 1)).toBe(l - 1);
    }
  });
});

describe("levelProgress", () => {
  it("reports mid-level progress", () => {
    // 300 XP: level 2 (floor 200, ceil 600), 100 into a 400-wide level.
    const p = levelProgress(300);
    expect(p.level).toBe(2);
    expect(p.xpIntoLevel).toBe(100);
    expect(p.xpForThisLevel).toBe(400);
    expect(p.xpToNext).toBe(300);
    expect(p.fraction).toBeCloseTo(0.25, 5);
  });

  it("sits at the start of a level exactly on a threshold", () => {
    const p = levelProgress(600);
    expect(p.level).toBe(3);
    expect(p.xpIntoLevel).toBe(0);
    expect(p.fraction).toBe(0);
    expect(p.xpToNext).toBe(600); // 1200 - 600
  });

  it("treats negative totals as zero", () => {
    const p = levelProgress(-50);
    expect(p.level).toBe(1);
    expect(p.xpIntoLevel).toBe(0);
  });
});
