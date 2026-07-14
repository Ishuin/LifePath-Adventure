import { NextResponse } from "next/server";
import { z } from "zod";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { generatePlanForGoal } from "@/lib/llm/service";
import { PlanGenerationError } from "@/lib/llm/generatePlan";

export const runtime = "nodejs";
// Plan generation calls an LLM; give it room beyond the default.
export const maxDuration = 300;

const bodySchema = z.object({ goalId: z.string().uuid() });

/**
 * POST /api/plans/generate — generate (or regenerate) the active plan for a
 * goal the caller owns. Synchronous for the MVP; the plan's `status` column
 * supports switching to async/poll later if latency demands.
 */
export async function POST(request: Request) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Expected { goalId: uuid }." },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  try {
    const result = await generatePlanForGoal(supabase, parsed.data.goalId, {
      signal: request.signal,
    });
    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    if (err instanceof PlanGenerationError) {
      return NextResponse.json(
        { error: "Could not build a valid plan.", detail: err.detail },
        { status: 422 },
      );
    }
    const message = err instanceof Error ? err.message : "Generation failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
