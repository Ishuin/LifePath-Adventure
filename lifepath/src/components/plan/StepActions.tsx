"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { PlanStep, StepStatus } from "@/lib/plan/types";
import { setStepStatusAction } from "@/app/(app)/actions";

/**
 * Progress controls for the selected step. Which transitions are offered depends
 * on the step's current status; the DB does the ledger/unlocking bookkeeping.
 * On a level-up we surface a brief celebratory note before refreshing the view.
 */
export function StepActions({
  goalId,
  step,
}: {
  goalId: string;
  step: PlanStep;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [levelUp, setLevelUp] = useState<number | null>(null);

  function run(status: StepStatus) {
    setError(null);
    setLevelUp(null);
    startTransition(async () => {
      const res = await setStepStatusAction(goalId, step.id, status);
      if (res.error) {
        setError(res.error);
        return;
      }
      if (res.leveledUp && res.level != null) setLevelUp(res.level);
      router.refresh();
    });
  }

  const actions = transitionsFor(step.status);

  return (
    <div className="glass mt-4 rounded-xl p-4">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
        Progress
      </h4>

      {step.status === "locked" ? (
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          Locked — finish this step&apos;s prerequisites to unlock it.
        </p>
      ) : actions.length === 0 ? (
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          No actions available.
        </p>
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">
          {actions.map((a) => (
            <button
              key={a.status}
              type="button"
              onClick={() => run(a.status)}
              disabled={pending}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] disabled:opacity-60 ${
                a.primary
                  ? "bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-strong)]"
                  : "border border-white/15 hover:bg-white/5"
              }`}
            >
              {pending ? "…" : a.label}
            </button>
          ))}
        </div>
      )}

      {levelUp != null && (
        <p
          role="status"
          className="mt-3 rounded-md border border-emerald-400/40 bg-emerald-400/10 px-3 py-2 text-sm text-emerald-200"
        >
          🎉 Level up! You reached level {levelUp}.
        </p>
      )}
      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
    </div>
  );
}

interface Transition {
  status: StepStatus;
  label: string;
  primary?: boolean;
}

/** The transitions we offer from each status (locked handled separately). */
function transitionsFor(status: StepStatus): Transition[] {
  switch (status) {
    case "available":
      return [
        { status: "done", label: "Mark done", primary: true },
        { status: "in_progress", label: "Start" },
        { status: "skipped", label: "Skip" },
      ];
    case "in_progress":
      return [
        { status: "done", label: "Mark done", primary: true },
        { status: "available", label: "Pause" },
        { status: "skipped", label: "Skip" },
      ];
    case "done":
      return [{ status: "available", label: "Mark not done" }];
    case "skipped":
      return [{ status: "available", label: "Restore" }];
    default:
      return [];
  }
}
