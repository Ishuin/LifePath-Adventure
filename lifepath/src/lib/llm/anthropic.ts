import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type { IntakeInput } from "@/lib/validation/intake";
import { serverEnv } from "@/lib/env.server";
import { zGeneratedPlan } from "./schema";
import { SYSTEM_PROMPT, buildUserPrompt } from "./prompt";
import type {
  GenerateOptions,
  GenerateResult,
  LLMProvider,
} from "./provider";

/**
 * Default provider: Claude via the official SDK, using structured outputs so
 * the response is parsed against zGeneratedPlan at the API boundary. We still
 * re-validate + repair one layer up (generatePlan.ts) because JSON-schema drops
 * the numeric/semantic constraints Zod enforces.
 */
export class AnthropicProvider implements LLMProvider {
  readonly name = "anthropic";
  readonly model: string;
  private client: Anthropic;

  constructor() {
    const env = serverEnv();
    if (!env.ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY is required for the Anthropic provider.");
    }
    this.model = env.ANTHROPIC_MODEL;
    this.client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  }

  async generatePlan(
    intake: IntakeInput,
    opts: GenerateOptions = {},
  ): Promise<GenerateResult> {
    const env = serverEnv();
    const userText = buildUserPrompt(intake);
    const content = opts.repairFeedback
      ? `${userText}\n\nYour previous attempt was invalid. Fix these problems and return a corrected plan:\n${opts.repairFeedback}`
      : userText;

    const response = await this.client.messages.parse(
      {
        model: this.model,
        max_tokens: opts.maxTokens ?? env.LLM_MAX_TOKENS,
        thinking: { type: "adaptive" },
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content }],
        output_config: {
          format: zodOutputFormat(zGeneratedPlan),
          effort: "high",
        },
      },
      { signal: opts.signal },
    );

    if (response.stop_reason === "refusal") {
      throw new Error("The model declined to generate a plan for this input.");
    }
    if (!response.parsed_output) {
      throw new Error(
        response.stop_reason === "max_tokens"
          ? "The plan exceeded the output limit; try a narrower goal or raise LLM_MAX_TOKENS."
          : "The model did not return a parseable plan.",
      );
    }

    return {
      plan: response.parsed_output,
      usage: {
        inputTokens: response.usage?.input_tokens,
        outputTokens: response.usage?.output_tokens,
      },
    };
  }
}
