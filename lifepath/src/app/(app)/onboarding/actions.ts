"use server";

import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { intakeSchema } from "@/lib/validation/intake";

export type CreateGoalResult = { error?: string; goalId?: string };

/**
 * Creates a goal plus its current + past life-state snapshots from the intake
 * wizard. Writes as the authenticated user; RLS enforces ownership.
 */
export async function createGoal(input: unknown): Promise<CreateGoalResult> {
  const parsed = intakeSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const d = parsed.data;
  const user = await requireUser();
  const supabase = await createClient();

  const { data: goal, error: goalErr } = await supabase
    .from("goals")
    .insert({
      user_id: user.id,
      title: d.goalTitle,
      description: d.goalDescription ?? null,
      target_date: d.targetDate || null,
    })
    .select("id")
    .single();

  if (goalErr || !goal) {
    return { error: goalErr?.message ?? "Failed to create goal." };
  }

  const lifeStates = [
    {
      user_id: user.id,
      goal_id: goal.id,
      kind: "current" as const,
      summary: d.currentSummary,
      details: {
        budgetCents: d.budgetCents ?? null,
        hoursPerWeek: d.hoursPerWeek ?? null,
      },
    },
    ...d.pastStates.map((p) => ({
      user_id: user.id,
      goal_id: goal.id,
      kind: "past" as const,
      summary: p.summary,
      as_of: p.asOf || null,
    })),
  ];

  const { error: lsErr } = await supabase.from("life_states").insert(lifeStates);
  if (lsErr) return { error: lsErr.message };

  return { goalId: goal.id as string };
}
