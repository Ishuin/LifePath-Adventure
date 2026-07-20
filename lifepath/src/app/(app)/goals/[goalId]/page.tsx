import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { loadActivePlan } from "@/lib/plan/query";
import { PlanExplorer } from "@/components/plan/PlanExplorer";
import { SkillChart } from "@/components/plan/SkillChart";
import { LevelChart } from "@/components/plan/LevelChart";
import {
  BudgetPanel,
  CertsPanel,
  ConnectionsPanel,
  CoursesPanel,
} from "@/components/plan/PlanPanels";
import { GeneratePlanButton } from "../../dashboard/GeneratePlanButton";

export default async function GoalPage({
  params,
}: {
  params: Promise<{ goalId: string }>;
}) {
  await requireUser();
  const { goalId } = await params;
  const supabase = await createClient();

  const { data: goal } = await supabase
    .from("goals")
    .select("id, title, description, target_date, status")
    .eq("id", goalId)
    .maybeSingle();
  if (!goal) notFound();

  const plan = await loadActivePlan(supabase, goalId);
  // Latest plan status lets us tell "still generating" and "failed" apart from
  // "never generated" when there's no active plan to show.
  const { data: latest } = await supabase
    .from("plans")
    .select("status")
    .eq("goal_id", goalId)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  const latestStatus = latest?.status as string | undefined;

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/dashboard"
          className="text-sm text-[var(--color-muted)] hover:text-[var(--color-fg)]"
        >
          ← All goals
        </Link>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-3xl font-bold">{goal.title}</h1>
            {goal.description && (
              <p className="mt-2 max-w-2xl text-[var(--color-muted)]">
                {goal.description}
              </p>
            )}
            {goal.target_date && (
              <p className="mt-2 text-sm text-[var(--color-muted)]">
                Target: {goal.target_date}
              </p>
            )}
          </div>
        </div>
      </div>

      {plan ? (
        <>
          {plan.rationale && (
            <section className="glass rounded-xl p-6">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-muted)]">
                The plan
              </h2>
              <p className="mt-2 leading-relaxed">{plan.rationale}</p>
              <p className="mt-3 text-xs text-[var(--color-muted)]">
                Version {plan.version}
                {plan.model ? ` · ${plan.model}` : ""}
              </p>
            </section>
          )}

          <section aria-labelledby="path-heading">
            <h2 id="path-heading" className="mb-4 text-xl font-semibold">
              Your path
            </h2>
            <PlanExplorer plan={plan} />
          </section>

          {(plan.skills.length > 0 || plan.levels.length > 0) && (
            <section className="grid gap-6 lg:grid-cols-2">
              {plan.skills.length > 0 && (
                <div className="glass rounded-xl p-6">
                  <h2 className="mb-4 text-lg font-semibold">Skills</h2>
                  <SkillChart skills={plan.skills} />
                </div>
              )}
              {plan.levels.length > 0 && (
                <div className="glass rounded-xl p-6">
                  <h2 className="mb-4 text-lg font-semibold">Levels</h2>
                  <LevelChart levels={plan.levels} />
                </div>
              )}
            </section>
          )}

          <section className="grid gap-6 lg:grid-cols-2">
            <CoursesPanel courses={plan.courses} />
            <CertsPanel certs={plan.certifications} />
            <BudgetPanel items={plan.budget} />
            <ConnectionsPanel connections={plan.connections} />
          </section>

          <section className="glass rounded-xl p-6">
            <h2 className="text-lg font-semibold">Regenerate</h2>
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              Not quite right? Generate a fresh version — your current plan is
              kept in history.
            </p>
            <GeneratePlanButton goalId={goalId} />
          </section>
        </>
      ) : (
        <NoPlan goalId={goalId} latestStatus={latestStatus} />
      )}
    </div>
  );
}

function NoPlan({
  goalId,
  latestStatus,
}: {
  goalId: string;
  latestStatus: string | undefined;
}) {
  if (latestStatus === "generating") {
    return (
      <div className="glass rounded-xl p-10 text-center">
        <p className="text-lg">Your plan is being generated…</p>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          This can take a moment. Refresh the page to check on it.
        </p>
      </div>
    );
  }

  const failed = latestStatus === "failed";
  return (
    <div className="glass rounded-xl p-10 text-center">
      <p className="text-lg">
        {failed ? "Plan generation didn’t finish." : "No plan yet."}
      </p>
      <p className="mt-2 text-sm text-[var(--color-muted)]">
        {failed
          ? "Something went wrong last time. Try generating again."
          : "Generate your personalized path — an ordered set of steps, skills, and resources toward this goal."}
      </p>
      <div className="mt-6 inline-block">
        <GeneratePlanButton goalId={goalId} />
      </div>
    </div>
  );
}
