"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { generatePlanForGoal } from "@/lib/llm/service";
import { PlanGenerationError } from "@/lib/llm/generatePlan";

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
