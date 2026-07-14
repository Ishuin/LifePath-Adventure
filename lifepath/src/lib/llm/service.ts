import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { IntakeInput } from "@/lib/validation/intake";
import { serverEnv } from "@/lib/env.server";
import { getProvider } from "./provider";
import { generatePlan } from "./generatePlan";
import { persistPlan } from "./persist";

export interface GenerateForGoalResult {
  planId: string;
  provider: string;
  model: string;
  attempts: number;
}

/**
 * End-to-end plan generation for an existing goal: rebuild the intake from the
 * stored goal + life-state snapshots, run the LLM (with repair-retry), and
 * persist the graph transactionally. Runs under the caller's session so RLS and
 * the persist RPC's ownership check both apply.
 */
export async function generatePlanForGoal(
  supabase: SupabaseClient,
  goalId: string,
  opts: { signal?: AbortSignal } = {},
): Promise<GenerateForGoalResult> {
  const intake = await loadIntake(supabase, goalId);

  const env = serverEnv();
  const provider = await getProvider();
  const outcome = await generatePlan(provider, intake, {
    maxRetries: env.LLM_MAX_RETRIES,
    signal: opts.signal,
    maxTokens: env.LLM_MAX_TOKENS,
  });

  const planId = await persistPlan(supabase, {
    goalId,
    plan: outcome.plan,
    provider: outcome.provider,
    model: outcome.model,
  });

  return {
    planId,
    provider: outcome.provider,
    model: outcome.model,
    attempts: outcome.attempts,
  };
}

/** Reconstructs the intake shape from the persisted goal + life_states. */
async function loadIntake(
  supabase: SupabaseClient,
  goalId: string,
): Promise<IntakeInput> {
  const { data: goal, error: goalErr } = await supabase
    .from("goals")
    .select("id, title, description, target_date")
    .eq("id", goalId)
    .single();
  if (goalErr || !goal) {
    throw new Error("Goal not found.");
  }

  const { data: states, error: statesErr } = await supabase
    .from("life_states")
    .select("kind, summary, as_of, details")
    .eq("goal_id", goalId);
  if (statesErr) throw new Error(statesErr.message);

  const current = (states ?? []).find((s) => s.kind === "current");
  if (!current) {
    throw new Error("This goal has no current-state snapshot to plan from.");
  }
  const details = (current.details ?? {}) as {
    budgetCents?: number | null;
    hoursPerWeek?: number | null;
  };
  const pastStates = (states ?? [])
    .filter((s) => s.kind === "past")
    .map((s) => ({
      summary: s.summary as string,
      asOf: (s.as_of as string | null) ?? undefined,
    }));

  return {
    goalTitle: goal.title as string,
    goalDescription: (goal.description as string | null) ?? undefined,
    targetDate: (goal.target_date as string | null) ?? undefined,
    currentSummary: current.summary as string,
    pastStates,
    budgetCents: details.budgetCents ?? undefined,
    hoursPerWeek: details.hoursPerWeek ?? undefined,
  };
}
