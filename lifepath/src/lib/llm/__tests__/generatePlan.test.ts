import { describe, it, expect } from "vitest";
import { generatePlan, PlanGenerationError } from "../generatePlan";
import { MockProvider, sampleIntake, validPlan } from "./fixtures";

describe("generatePlan", () => {
  it("returns a valid plan on the first attempt", async () => {
    const provider = new MockProvider([validPlan()]);
    const out = await generatePlan(provider, sampleIntake, { maxRetries: 2 });
    expect(out.attempts).toBe(1);
    expect(out.provider).toBe("mock");
    expect(out.model).toBe("mock-model");
    expect(out.plan.steps).toHaveLength(3);
    expect(out.usage?.outputTokens).toBe(200);
    // No repair feedback on a first-try success.
    expect(provider.feedbacks[0]).toBeUndefined();
  });

  it("repairs after a semantically invalid attempt, then succeeds", async () => {
    const broken = validPlan();
    broken.steps[1].dependsOn = ["ghost"]; // dangling reference
    const provider = new MockProvider([broken, validPlan()]);

    const out = await generatePlan(provider, sampleIntake, { maxRetries: 2 });
    expect(out.attempts).toBe(2);
    // Second call received repair feedback naming the problem.
    expect(provider.feedbacks[1]).toContain("unknown step");
  });

  it("repairs after a schema-invalid attempt", async () => {
    const bad = validPlan();
    // Off-contract: target level out of range (Zod catches this).
    (bad.skills[0] as { targetLevel: number }).targetLevel = 9999;
    const provider = new MockProvider([bad, validPlan()]);

    const out = await generatePlan(provider, sampleIntake, { maxRetries: 2 });
    expect(out.attempts).toBe(2);
    expect(provider.feedbacks[1]).toContain("Schema violations");
  });

  it("throws PlanGenerationError after exhausting retries", async () => {
    const broken = validPlan();
    broken.steps[0].dependsOn = [broken.steps[2].key];
    broken.steps[2].dependsOn = [broken.steps[0].key]; // cycle, every attempt
    const provider = new MockProvider([broken]);

    await expect(
      generatePlan(provider, sampleIntake, { maxRetries: 2 }),
    ).rejects.toBeInstanceOf(PlanGenerationError);
    // 1 initial + 2 retries = 3 attempts.
    expect(provider.feedbacks).toHaveLength(3);
  });
});
