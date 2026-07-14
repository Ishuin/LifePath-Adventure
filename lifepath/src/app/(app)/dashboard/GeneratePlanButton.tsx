"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { generatePlanForGoalAction } from "../actions";

/**
 * Triggers plan generation for a goal. Kept small and self-contained: the full
 * plan visualization lands in M3; for now this proves the generate pipeline is
 * wired end-to-end and surfaces success/failure inline.
 */
export function GeneratePlanButton({ goalId }: { goalId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function run() {
    setError(null);
    setDone(false);
    startTransition(async () => {
      const res = await generatePlanForGoalAction(goalId);
      if (res.error) setError(res.error);
      else {
        setDone(true);
        router.refresh();
      }
    });
  }

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={run}
        disabled={pending}
        className="rounded-md border border-[var(--color-accent)] px-3 py-1.5 text-sm font-medium text-[var(--color-accent)] transition hover:bg-[var(--color-accent)] hover:text-white disabled:opacity-60"
      >
        {pending ? "Generating…" : done ? "Regenerate plan" : "Generate plan"}
      </button>
      {done && !error && (
        <p className="mt-2 text-xs text-[var(--color-accent)]">
          Plan generated.
        </p>
      )}
      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
    </div>
  );
}
