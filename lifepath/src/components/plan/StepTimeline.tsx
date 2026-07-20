"use client";

import type { PlanStep } from "@/lib/plan/types";
import { STEP_STATUS_LABEL, STEP_STATUS_STYLE } from "@/lib/plan/format";

/**
 * Ordered, keyboard-navigable list of steps — the accessible text-equivalent of
 * the visual PathGraph. Selecting a row drives the shared detail panel.
 */
export function StepTimeline({
  steps,
  prereqCount,
  selectedId,
  onSelect,
}: {
  steps: PlanStep[];
  prereqCount: Map<string, number>;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <ol className="flex flex-col gap-2" aria-label="Steps in order">
      {steps.map((step) => {
        const style = STEP_STATUS_STYLE[step.status] ?? STEP_STATUS_STYLE.locked;
        const selected = step.id === selectedId;
        const deps = prereqCount.get(step.id) ?? 0;
        return (
          <li key={step.id}>
            <button
              type="button"
              onClick={() => onSelect(step.id)}
              aria-pressed={selected}
              className={`glass w-full rounded-lg border px-4 py-3 text-left transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] ${
                selected ? "border-[var(--color-accent)] bg-white/10" : style.ring
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`h-2.5 w-2.5 shrink-0 rounded-full ${style.dot}`}
                  aria-hidden="true"
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">
                    <span className="text-[var(--color-muted)]">
                      {step.orderIndex + 1}.
                    </span>{" "}
                    {step.title}
                  </span>
                  <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--color-muted)]">
                    <span className={style.text}>
                      {STEP_STATUS_LABEL[step.status] ?? step.status}
                    </span>
                    <span>{step.xpReward} XP</span>
                    {step.estimatedWeeks != null && (
                      <span>
                        ~{step.estimatedWeeks} wk
                        {step.estimatedWeeks === 1 ? "" : "s"}
                      </span>
                    )}
                    {deps > 0 && (
                      <span>
                        {deps} prerequisite{deps === 1 ? "" : "s"}
                      </span>
                    )}
                  </span>
                </span>
              </div>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
