import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { GeneratedPlan } from "./schema";

/**
 * Persist a validated plan graph via the transactional `persist_generated_plan`
 * RPC. The RPC remaps step keys to uuids and stamps user_id = auth.uid() on
 * every row; RLS + the function's ownership check keep it scoped to the caller.
 * Pass a request-scoped (session) Supabase client so auth.uid() resolves.
 */
export async function persistPlan(
  supabase: SupabaseClient,
  args: {
    goalId: string;
    plan: GeneratedPlan;
    provider: string;
    model: string;
  },
): Promise<string> {
  const { data, error } = await supabase.rpc("persist_generated_plan", {
    p_goal_id: args.goalId,
    p_plan: args.plan,
    p_provider: args.provider,
    p_model: args.model,
  });
  if (error) throw new Error(`Failed to persist plan: ${error.message}`);
  return data as string;
}
