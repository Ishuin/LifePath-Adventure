"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { generatePlanForGoal } from "@/lib/llm/service";
import { PlanGenerationError } from "@/lib/llm/generatePlan";
import { setStepStatus } from "@/lib/plan/progress";
import type { StepStatus } from "@/lib/plan/types";

const STEP_STATUSES: StepStatus[] = [
  "locked",
  "available",
  "in_progress",
  "done",
  "skipped",
];

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export type GeneratePlanResult = { planId?: string; error?: string };

/**
 * Generates (or regenerates) the active plan for a goal the caller owns and
 * refreshes the goal view. Wraps the shared generation service so the intake
 * wizard and the goal page can both invoke it.
 */
export async function generatePlanForGoalAction(
  goalId: string,
): Promise<GeneratePlanResult> {
  await requireUser();
  const supabase = await createClient();
  try {
    const result = await generatePlanForGoal(supabase, goalId);
    revalidatePath(`/goals/${goalId}`);
    revalidatePath("/dashboard");
    return { planId: result.planId };
  } catch (err) {
    if (err instanceof PlanGenerationError) {
      return { error: "Could not build a valid plan. Please try again." };
    }
    return {
      error: err instanceof Error ? err.message : "Generation failed.",
    };
  }
}

export type StepProgressResult = {
  error?: string;
  changed?: boolean;
  totalXp?: number;
  level?: number;
  leveledUp?: boolean;
};

/**
 * Transitions a step's status for the goal detail page. Reads the caller's level
 * before and after so the UI can celebrate a level-up. Ownership is enforced by
 * the RPC (and RLS); we only revalidate the affected views.
 */
export async function setStepStatusAction(
  goalId: string,
  stepId: string,
  status: StepStatus,
): Promise<StepProgressResult> {
  await requireUser();
  if (!STEP_STATUSES.includes(status)) {
    return { error: "Invalid status." };
  }
  const supabase = await createClient();
  try {
    const { data: before } = await supabase
      .from("profiles")
      .select("level")
      .maybeSingle();
    const prevLevel = (before?.level as number | undefined) ?? 1;

    const result = await setStepStatus(supabase, stepId, status);
    revalidatePath(`/goals/${goalId}`);
    revalidatePath("/dashboard");
    return {
      changed: result.changed,
      totalXp: result.totalXp,
      level: result.level,
      leveledUp: result.level > prevLevel,
    };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Could not update the step.",
    };
  }
}

export type UpdateGoalResult = { error?: string; ok?: boolean };

/**
 * Updates a goal's editable fields (title, description, target date). RLS
 * confines the update to goals the caller owns.
 */
export async function updateGoalAction(
  goalId: string,
  input: { title: string; description: string; targetDate: string },
): Promise<UpdateGoalResult> {
  await requireUser();
  const title = input.title.trim();
  if (!title) return { error: "A title is required." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("goals")
    .update({
      title,
      description: input.description.trim() || null,
      target_date: input.targetDate || null,
    })
    .eq("id", goalId);
  if (error) return { error: error.message };

  revalidatePath(`/goals/${goalId}`);
  revalidatePath("/dashboard");
  return { ok: true };
}
