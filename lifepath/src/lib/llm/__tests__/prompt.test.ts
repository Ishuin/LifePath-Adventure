import { describe, it, expect } from "vitest";
import { serializeIntake, buildUserPrompt } from "../prompt";
import { sampleIntake } from "./fixtures";

describe("serializeIntake", () => {
  it("is deterministic for the same input", () => {
    expect(serializeIntake(sampleIntake)).toEqual(serializeIntake(sampleIntake));
  });

  it("orders past chapters deterministically regardless of input order", () => {
    const a = serializeIntake(sampleIntake);
    const reordered = {
      ...sampleIntake,
      pastStates: [...sampleIntake.pastStates].reverse(),
    };
    expect(serializeIntake(reordered)).toEqual(a);
  });

  it("includes goal, current state, and constraints", () => {
    const text = serializeIntake(sampleIntake);
    expect(text).toContain("Become a senior backend engineer");
    expect(text).toContain("CURRENT STATE:");
    expect(text).toContain("200000 cents");
    expect(text).toContain("10 hours/week");
  });

  it("marks unspecified constraints", () => {
    const text = serializeIntake({
      goalTitle: "Learn to paint",
      currentSummary: "Never held a brush.",
      pastStates: [],
    });
    expect(text).toContain("Budget available: not specified");
    expect(text).toContain("Time available: not specified");
  });

  it("buildUserPrompt wraps the serialized intake", () => {
    const p = buildUserPrompt(sampleIntake);
    expect(p).toContain("Design a LifePath plan");
    expect(p).toContain(serializeIntake(sampleIntake));
  });
});
