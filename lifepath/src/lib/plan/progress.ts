import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { StepStatus } from "./types";

/** The subset of profile fields the UI needs for the XP/level badge. */
export interface ProfileXp {
  totalXp: number;
  level: number;
}

export interface StepStatusResult {
  changed: boolean;
  stepId: string;
  status: StepStatus;
  totalXp: number;
  level: number;
}

/**
 * Transitions a step through the `set_step_status` RPC, which atomically updates
 * the step, appends to the XP ledger, unlocks/relocks dependents, and recomputes
 * the caller's profile level — all under RLS. Returns the resulting profile
 * totals so callers can detect a level-up.
 */
export async function setStepStatus(
  supabase: SupabaseClient,
  stepId: string,
  status: StepStatus,
): Promise<StepStatusResult> {
  const { data, error } = await supabase.rpc("set_step_status", {
    p_step_id: stepId,
    p_status: status,
  });
  if (error) throw error;
  const r = (data ?? {}) as Record<string, unknown>;
  return {
    changed: Boolean(r.changed),
    stepId: (r.stepId as string) ?? stepId,
    status: (r.status as StepStatus) ?? status,
    totalXp: (r.totalXp as number) ?? 0,
    level: (r.level as number) ?? 1,
  };
}

/** Loads the caller's XP/level (RLS scopes profiles to `id = auth.uid()`). */
export async function loadProfileXp(
  supabase: SupabaseClient,
): Promise<ProfileXp | null> {
  const { data } = await supabase
    .from("profiles")
    .select("totalXp:total_xp, level")
    .maybeSingle();
  if (!data) return null;
  return {
    totalXp: (data.totalXp as number) ?? 0,
    level: (data.level as number) ?? 1,
  };
}
