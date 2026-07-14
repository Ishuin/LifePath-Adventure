import type { IntakeInput } from "@/lib/validation/intake";
import type { GeneratedPlan } from "../schema";
import type {
  GenerateOptions,
  GenerateResult,
  LLMProvider,
} from "../provider";

export const sampleIntake: IntakeInput = {
  goalTitle: "Become a senior backend engineer",
  goalDescription: "Move from frontend into backend/systems work.",
  targetDate: "2027-01-01",
  currentSummary: "Junior frontend dev, 1yr, strong React, no backend yet.",
  pastStates: [
    { summary: "Bootcamp grad", asOf: "2024" },
    { summary: "Retail job while studying", asOf: "2022" },
  ],
  budgetCents: 200000,
  hoursPerWeek: 10,
};

/** A structurally valid plan: unique keys, acyclic deps, resolvable refs. */
export function validPlan(): GeneratedPlan {
  return {
    rationale: "Build backend fundamentals, then depth, then systems design.",
    steps: [
      {
        key: "learn_sql",
        title: "Learn SQL & data modeling",
        description: "Relational basics.",
        rationale: "Every backend touches a database.",
        orderIndex: 0,
        xpReward: 100,
        estimatedWeeks: 4,
        dependsOn: [],
      },
      {
        key: "build_api",
        title: "Build a REST API",
        description: "Ship a small service.",
        rationale: "Apply SQL in a real service.",
        orderIndex: 1,
        xpReward: 200,
        estimatedWeeks: 6,
        dependsOn: ["learn_sql"],
      },
      {
        key: "system_design",
        title: "Study system design",
        description: "Scaling, caching, queues.",
        rationale: "Required for senior interviews.",
        orderIndex: 2,
        xpReward: 300,
        estimatedWeeks: 8,
        dependsOn: ["build_api"],
      },
    ],
    skills: [
      {
        name: "SQL",
        category: "technical",
        currentLevel: 10,
        targetLevel: 80,
        priority: 1,
        stepKeys: ["learn_sql"],
      },
    ],
    certifications: [
      {
        name: "AWS Solutions Architect",
        provider: "AWS",
        url: null,
        estCostCents: 15000,
        priority: 1,
        stepKey: "system_design",
      },
    ],
    courses: [
      {
        title: "Designing Data-Intensive Applications (book)",
        provider: "O'Reilly",
        url: null,
        estCostCents: 5000,
        estHours: 40,
        priority: 1,
        stepKey: "system_design",
      },
    ],
    budget: [
      {
        label: "AWS exam fee",
        category: "certification",
        amountCents: 15000,
        currency: "USD",
        notes: null,
        stepKey: "system_design",
      },
    ],
    connections: [
      {
        name: "Local backend meetup",
        kind: "community",
        why: "Learn from working engineers.",
        how: "Attend monthly; ask questions.",
        priority: 1,
        stepKey: null,
      },
    ],
    levels: [
      { level: 1, title: "Apprentice", xpRequired: 0, unlocks: null },
      { level: 2, title: "Journeyman", xpRequired: 300, unlocks: null },
    ],
  };
}

/**
 * Mock provider that returns a scripted sequence of plans (one per attempt),
 * recording the repair feedback it received. Deterministic — no network.
 */
export class MockProvider implements LLMProvider {
  readonly name = "mock";
  readonly model = "mock-model";
  readonly feedbacks: (string | undefined)[] = [];
  private i = 0;

  constructor(private readonly outputs: GeneratedPlan[]) {}

  async generatePlan(
    _intake: IntakeInput,
    opts: GenerateOptions = {},
  ): Promise<GenerateResult> {
    this.feedbacks.push(opts.repairFeedback);
    const plan = this.outputs[Math.min(this.i, this.outputs.length - 1)];
    this.i++;
    return { plan, usage: { inputTokens: 100, outputTokens: 200 } };
  }
}
