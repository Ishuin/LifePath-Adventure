import { describe, it, expect } from "vitest";
import { validatePlan } from "../validate";
import { validPlan } from "./fixtures";

describe("validatePlan", () => {
  it("passes a valid plan with no errors", () => {
    expect(validatePlan(validPlan())).toEqual([]);
  });

  it("flags duplicate step keys", () => {
    const p = validPlan();
    p.steps[1].key = p.steps[0].key;
    const errs = validatePlan(p);
    expect(errs.some((e) => e.includes("Duplicate step key"))).toBe(true);
  });

  it("flags a dependency on an unknown step", () => {
    const p = validPlan();
    p.steps[1].dependsOn = ["does_not_exist"];
    const errs = validatePlan(p);
    expect(errs.some((e) => e.includes("unknown step"))).toBe(true);
  });

  it("flags a self-dependency", () => {
    const p = validPlan();
    p.steps[0].dependsOn = [p.steps[0].key];
    const errs = validatePlan(p);
    expect(errs.some((e) => e.includes("depends on itself"))).toBe(true);
  });

  it("detects a dependency cycle", () => {
    const p = validPlan();
    // learn_sql -> build_api -> system_design, then close the loop.
    p.steps[0].dependsOn = ["system_design"];
    const errs = validatePlan(p);
    expect(errs.some((e) => e.includes("cycle"))).toBe(true);
  });

  it("flags a cross-entity stepKey that doesn't resolve", () => {
    const p = validPlan();
    p.courses[0].stepKey = "ghost_step";
    const errs = validatePlan(p);
    expect(errs.some((e) => e.includes("courses[0]"))).toBe(true);
  });

  it("flags a skill referencing an unknown step", () => {
    const p = validPlan();
    p.skills[0].stepKeys = ["nope"];
    const errs = validatePlan(p);
    expect(errs.some((e) => e.includes("skills[0]"))).toBe(true);
  });

  it("flags a skill whose target is below current", () => {
    const p = validPlan();
    p.skills[0].currentLevel = 90;
    p.skills[0].targetLevel = 20;
    const errs = validatePlan(p);
    expect(errs.some((e) => e.includes("below current"))).toBe(true);
  });
});
