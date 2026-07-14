import { describe, it, expect } from "vitest";
import { zGeneratedPlan } from "../schema";
import { validPlan } from "./fixtures";

describe("zGeneratedPlan", () => {
  it("accepts a well-formed plan", () => {
    expect(zGeneratedPlan.safeParse(validPlan()).success).toBe(true);
  });

  it("applies defaults for omitted optional arrays and fields", () => {
    const minimal = {
      rationale: "Just get started.",
      steps: [{ key: "start", title: "Start", orderIndex: 0 }],
    };
    const parsed = zGeneratedPlan.parse(minimal);
    expect(parsed.skills).toEqual([]);
    expect(parsed.certifications).toEqual([]);
    expect(parsed.steps[0].dependsOn).toEqual([]);
    expect(parsed.steps[0].xpReward).toBe(100);
    expect(parsed.steps[0].estimatedWeeks).toBeNull();
    expect(parsed.steps[0].description).toBe("");
  });

  it("rejects a plan with no steps", () => {
    const bad = { rationale: "x", steps: [] };
    expect(zGeneratedPlan.safeParse(bad).success).toBe(false);
  });

  it("rejects out-of-range skill levels", () => {
    const p = validPlan();
    p.skills[0].targetLevel = 500;
    expect(zGeneratedPlan.safeParse(p).success).toBe(false);
  });

  it("rejects an invalid enum category", () => {
    const p = validPlan() as unknown as { skills: { category: string }[] };
    p.skills[0].category = "wizardry";
    expect(zGeneratedPlan.safeParse(p).success).toBe(false);
  });

  it("rejects a non-slug step key", () => {
    const p = validPlan();
    p.steps[0].key = "has spaces!";
    expect(zGeneratedPlan.safeParse(p).success).toBe(false);
  });

  it("rejects a non-ISO currency", () => {
    const p = validPlan();
    p.budget[0].currency = "dollars";
    expect(zGeneratedPlan.safeParse(p).success).toBe(false);
  });
});
