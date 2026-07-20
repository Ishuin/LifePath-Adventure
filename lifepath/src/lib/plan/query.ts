import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  BudgetItem,
  Certification,
  Connection,
  Course,
  LevelMilestone,
  PlanStep,
  PlanView,
  Skill,
  StepEdge,
} from "./types";

/**
 * Loads the active plan for a goal along with its full graph (steps, deps,
 * skills, certs, courses, budget, connections, levels). Every query runs under
 * the caller's session, so RLS confines results to the owner's rows.
 *
 * Returns null when the goal has no active plan yet (never generated, or the
 * current version is still `generating`/`failed`).
 */
export async function loadActivePlan(
  supabase: SupabaseClient,
  goalId: string,
): Promise<PlanView | null> {
  const { data: plan } = await supabase
    .from("plans")
    .select(
      "id, version, status, rationale, provider, model, generatedAt:generated_at",
    )
    .eq("goal_id", goalId)
    .eq("status", "active")
    .maybeSingle();

  if (!plan) return null;
  const planId = plan.id as string;

  const [
    steps,
    deps,
    skills,
    links,
    certifications,
    courses,
    budget,
    connections,
    levels,
  ] = await Promise.all([
    supabase
      .from("plan_steps")
      .select(
        "id, orderIndex:order_index, title, description, rationale, status, xpReward:xp_reward, estimatedWeeks:estimated_weeks",
      )
      .eq("plan_id", planId)
      .order("order_index", { ascending: true })
      .returns<PlanStep[]>(),
    supabase
      .from("step_dependencies")
      .select("fromStepId:from_step_id, toStepId:to_step_id")
      .eq("plan_id", planId)
      .returns<StepEdge[]>(),
    supabase
      .from("skills")
      .select(
        "id, name, category, currentLevel:current_level, targetLevel:target_level, priority",
      )
      .eq("plan_id", planId)
      .order("priority", { ascending: false }),
    // No plan_id column here; RLS scopes to the caller and we filter to this
    // plan's skills in JS below.
    supabase.from("skill_step_links").select("skill_id, step_id"),
    supabase
      .from("certifications")
      .select(
        "id, name, provider, url, estCostCents:est_cost_cents, priority, stepId:step_id",
      )
      .eq("plan_id", planId)
      .order("priority", { ascending: false })
      .returns<Certification[]>(),
    supabase
      .from("courses")
      .select(
        "id, title, provider, url, estCostCents:est_cost_cents, estHours:est_hours, priority, stepId:step_id",
      )
      .eq("plan_id", planId)
      .order("priority", { ascending: false })
      .returns<Course[]>(),
    supabase
      .from("budget_items")
      .select(
        "id, label, category, amountCents:amount_cents, currency, notes, stepId:step_id",
      )
      .eq("plan_id", planId)
      .returns<BudgetItem[]>(),
    supabase
      .from("connections")
      .select("id, name, kind, why, how, priority, stepId:step_id")
      .eq("plan_id", planId)
      .order("priority", { ascending: false })
      .returns<Connection[]>(),
    supabase
      .from("level_milestones")
      .select("id, level, title, xpRequired:xp_required, unlocks")
      .eq("plan_id", planId)
      .order("level", { ascending: true })
      .returns<LevelMilestone[]>(),
  ]);

  // Attach the step ids each skill is linked to (skill_step_links is scoped to
  // the caller's rows; filter to this plan's skills so links from sibling plans
  // don't leak in).
  const skillIds = new Set((skills.data ?? []).map((s) => s.id as string));
  const linksBySkill = new Map<string, string[]>();
  for (const l of links.data ?? []) {
    const skillId = l.skill_id as string;
    if (!skillIds.has(skillId)) continue;
    const arr = linksBySkill.get(skillId) ?? [];
    arr.push(l.step_id as string);
    linksBySkill.set(skillId, arr);
  }
  const skillsView: Skill[] = (skills.data ?? []).map((s) => ({
    id: s.id as string,
    name: s.name as string,
    category: s.category as Skill["category"],
    currentLevel: s.currentLevel as number,
    targetLevel: s.targetLevel as number,
    priority: s.priority as number,
    stepIds: linksBySkill.get(s.id as string) ?? [],
  }));

  return {
    id: planId,
    version: plan.version as number,
    status: plan.status as string,
    rationale: (plan.rationale as string | null) ?? null,
    provider: (plan.provider as string | null) ?? null,
    model: (plan.model as string | null) ?? null,
    generatedAt: (plan.generatedAt as string | null) ?? null,
    steps: steps.data ?? [],
    edges: deps.data ?? [],
    skills: skillsView,
    certifications: certifications.data ?? [],
    courses: courses.data ?? [],
    budget: budget.data ?? [],
    connections: connections.data ?? [],
    levels: levels.data ?? [],
  };
}
