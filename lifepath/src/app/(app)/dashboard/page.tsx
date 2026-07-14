import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { GoalRow } from "@/lib/db/types";
import { GeneratePlanButton } from "./GeneratePlanButton";

export default async function DashboardPage() {
  await requireUser();
  const supabase = await createClient();
  const { data: goals } = await supabase
    .from("goals")
    .select("id, title, description, status, created_at")
    .order("created_at", { ascending: false })
    .returns<GoalRow[]>();

  const list = goals ?? [];

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Your goals</h1>
        <Link
          href="/onboarding"
          className="rounded-md bg-[var(--color-accent)] px-4 py-2 font-medium text-white hover:bg-[var(--color-accent-strong)]"
        >
          New goal
        </Link>
      </div>

      {list.length === 0 ? (
        <div className="glass mt-8 rounded-xl p-10 text-center">
          <p className="text-lg">No goals yet.</p>
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            Start your first path — describe where you are, where you&apos;ve
            been, and where you want to go.
          </p>
          <Link
            href="/onboarding"
            className="mt-6 inline-block rounded-md bg-[var(--color-accent)] px-6 py-3 font-medium text-white hover:bg-[var(--color-accent-strong)]"
          >
            Start a path
          </Link>
        </div>
      ) : (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {list.map((g) => (
            <li key={g.id} className="glass rounded-xl p-6">
              <Link href={`/goals/${g.id}`} className="block">
                <h2 className="text-lg font-semibold text-[var(--color-accent)] hover:underline">
                  {g.title}
                </h2>
                {g.description && (
                  <p className="mt-2 line-clamp-2 text-sm text-[var(--color-muted)]">
                    {g.description}
                  </p>
                )}
                <p className="mt-3 text-xs text-[var(--color-muted)]">
                  {g.status}
                </p>
              </Link>
              <GeneratePlanButton goalId={g.id} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
