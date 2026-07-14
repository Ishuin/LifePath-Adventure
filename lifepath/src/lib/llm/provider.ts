import type { IntakeInput } from "@/lib/validation/intake";
import type { GeneratedPlan } from "./schema";

export interface GenerateOptions {
  /** Feedback from a previous failed attempt, appended to steer a repair. */
  repairFeedback?: string;
  /** Abort the underlying request (timeouts, client disconnects). */
  signal?: AbortSignal;
  /** Max output tokens; provider clamps to its own ceiling. */
  maxTokens?: number;
}

export interface GenerateResult {
  plan: GeneratedPlan;
  /** Token usage for logging/observability, when the provider reports it. */
  usage?: { inputTokens?: number; outputTokens?: number };
}

/**
 * Provider-agnostic contract. Every backend (Anthropic, OpenAI, a test mock)
 * takes the same validated intake and returns a plan already parsed against
 * `zGeneratedPlan`. Semantic validation + repair-retry live one layer up in
 * generatePlan.ts, so providers only worry about "call the model, parse once".
 */
export interface LLMProvider {
  readonly name: string;
  readonly model: string;
  generatePlan(
    intake: IntakeInput,
    opts?: GenerateOptions,
  ): Promise<GenerateResult>;
}

/**
 * Factory. Reads LLM_PROVIDER (default 'anthropic') and constructs the matching
 * provider. Dynamic import keeps provider SDKs out of bundles that don't use
 * them and avoids pulling secrets/`server-only` modules into the client graph.
 */
export async function getProvider(): Promise<LLMProvider> {
  const { serverEnv } = await import("@/lib/env.server");
  const env = serverEnv();
  switch (env.LLM_PROVIDER) {
    case "openai": {
      const { OpenAIProvider } = await import("./openai");
      return new OpenAIProvider();
    }
    case "anthropic":
    default: {
      const { AnthropicProvider } = await import("./anthropic");
      return new AnthropicProvider();
    }
  }
}
