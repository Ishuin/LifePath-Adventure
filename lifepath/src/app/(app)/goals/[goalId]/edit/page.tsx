import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { GoalEditForm } from "./GoalEditForm";

export default async function EditGoalPage({
  params,
}: {
  params: Promise<{ goalId: string }>;
}) {
  await requireUser();
  const { goalId } = await params;
  const supabase = await createClient();

  const { data: goal } = await supabase
    .from("goals")
    .select("id, title, description, target_date")
    .eq("id", goalId)
    .maybeSingle();
  if (!goal) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/goals/${goalId}`}
          className="text-sm text-[var(--color-muted)] hover:text-[var(--color-fg)]"
        >
          ← Back to goal
        </Link>
        <h1 className="mt-3 text-3xl font-bold">Edit goal</h1>
      </div>
      <GoalEditForm
        goalId={goalId}
        initial={{
          title: (goal.title as string) ?? "",
          description: (goal.description as string | null) ?? "",
          targetDate: (goal.target_date as string | null) ?? "",
        }}
      />
    </div>
  );
}
