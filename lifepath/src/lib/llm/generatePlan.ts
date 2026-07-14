import type { IntakeInput } from "@/lib/validation/intake";
import { zGeneratedPlan, type GeneratedPlan } from "./schema";
import { validatePlan } from "./validate";
import type { LLMProvider } from "./provider";

export interface GeneratePlanOutcome {
  plan: GeneratedPlan;
  provider: string;
  model: string;
  attempts: number;
  usage?: { inputTokens?: number; outputTokens?: number };
}

export interface GeneratePlanConfig {
  /** Repair attempts AFTER the first try (so total tries = maxRetries + 1). */
  maxRetries?: number;
  signal?: AbortSignal;
  maxTokens?: number;
}

/**
 * Orchestrates one plan generation: call provider -> re-parse with Zod (trust
 * boundary, since structured-output JSON schema drops constraints) -> semantic
 * validation (DAG, references) -> on failure, feed the specific errors back and
 * retry up to `maxRetries` times. Throws if every attempt fails.
 *
 * Provider-agnostic: pass a mock in tests, real Claude/OpenAI in production.
 */
export async function generatePlan(
  provider: LLMProvider,
  intake: IntakeInput,
  config: GeneratePlanConfig = {},
): Promise<GeneratePlanOutcome> {
  const maxRetries = config.maxRetries ?? 2;
  let repairFeedback: string | undefined;
  let lastError = "";

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    const result = await provider.generatePlan(intake, {
      repairFeedback,
      signal: config.signal,
      maxTokens: config.maxTokens,
    });

    // Re-validate against Zod even though providers parse — a mock or a schema
    // drift could hand back something off-contract.
    const parsed = zGeneratedPlan.safeParse(result.plan);
    if (!parsed.success) {
      lastError = parsed.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; ");
      repairFeedback = `Schema violations: ${lastError}`;
      continue;
    }

    const semanticErrors = validatePlan(parsed.data);
    if (semanticErrors.length > 0) {
      lastError = semanticErrors.join("; ");
      repairFeedback = `Plan structure problems: ${lastError}`;
      continue;
    }

    return {
      plan: parsed.data,
      provider: provider.name,
      model: provider.model,
      attempts: attempt,
      usage: result.usage,
    };
  }

  throw new PlanGenerationError(
    `Plan generation failed after ${maxRetries + 1} attempts. Last error: ${lastError}`,
    lastError,
  );
}

export class PlanGenerationError extends Error {
  constructor(
    message: string,
    public readonly detail: string,
  ) {
    super(message);
    this.name = "PlanGenerationError";
  }
}
