import "server-only";
import OpenAI from "openai";
import { z } from "zod";
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
 * Alternate provider proving the abstraction: same Zod contract, driven through
 * OpenAI's JSON-schema response format. Swapping providers is env-only
 * (LLM_PROVIDER=openai) — no call-site changes. We parse the returned JSON with
 * zGeneratedPlan ourselves so the trust boundary is identical to Anthropic's.
 */
export class OpenAIProvider implements LLMProvider {
  readonly name = "openai";
  readonly model: string;
  private client: OpenAI;

  constructor() {
    const env = serverEnv();
    if (!env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is required for the OpenAI provider.");
    }
    this.model = env.OPENAI_MODEL ?? "gpt-4o";
    this.client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  }

  async generatePlan(
    intake: IntakeInput,
    opts: GenerateOptions = {},
  ): Promise<GenerateResult> {
    const userText = buildUserPrompt(intake);
    const content = opts.repairFeedback
      ? `${userText}\n\nYour previous attempt was invalid. Fix these problems and return a corrected plan:\n${opts.repairFeedback}`
      : userText;

    // Zod v4's native JSON Schema. Not strict-mode: OpenAI strict rejects the
    // numeric min/max keywords our schema relies on, and Zod re-validation below
    // is the real trust boundary anyway.
    const jsonSchema = z.toJSONSchema(zGeneratedPlan, {
      target: "draft-2020-12",
    });

    const response = await this.client.chat.completions.create(
      {
        model: this.model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "lifepath_plan",
            strict: false,
            schema: jsonSchema as Record<string, unknown>,
          },
        },
      },
      { signal: opts.signal },
    );

    const raw = response.choices[0]?.message?.content;
    if (response.choices[0]?.message?.refusal) {
      throw new Error("The model declined to generate a plan for this input.");
    }
    if (!raw) {
      throw new Error("The model did not return a plan.");
    }

    // Trust boundary: re-parse with Zod (authoritative over the JSON schema).
    const plan = zGeneratedPlan.parse(JSON.parse(raw));

    return {
      plan,
      usage: {
        inputTokens: response.usage?.prompt_tokens,
        outputTokens: response.usage?.completion_tokens,
      },
    };
  }
}
