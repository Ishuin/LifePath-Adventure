"use client";

import { useMemo, useState } from "react";
import type { PlanView } from "@/lib/plan/types";
import { PathGraph } from "./PathGraph";
import { StepTimeline } from "./StepTimeline";
import { StepDetailPanel, type StepRelated } from "./StepDetailPanel";

/**
 * Ties the path visualization together: the graph and the timeline are two views
 * of the same steps, and selecting a step in either drives the shared detail
 * panel. Selection state lives here so both stay in sync.
 */
export function PlanExplorer({ plan }: { plan: PlanView }) {
  const initial = useMemo(() => {
    const available = plan.steps.find((s) => s.status === "available");
    return available?.id ?? plan.steps[0]?.id ?? null;
  }, [plan.steps]);
  const [selectedId, setSelectedId] = useState<string | null>(initial);

  const stepById = useMemo(
    () => new Map(plan.steps.map((s) => [s.id, s] as const)),
    [plan.steps],
  );

  // Prerequisite and unlock adjacency, plus a count for the timeline.
  const { prereqCount, prereqsOf, unlocksOf } = useMemo(() => {
    const prereqsOf = new Map<string, string[]>();
    const unlocksOf = new Map<string, string[]>();
    const push = (map: Map<string, string[]>, key: string, value: string) => {
      const arr = map.get(key) ?? [];
      arr.push(value);
      map.set(key, arr);
    };
    for (const e of plan.edges) {
      push(prereqsOf, e.toStepId, e.fromStepId);
      push(unlocksOf, e.fromStepId, e.toStepId);
    }
    const prereqCount = new Map<string, number>();
    for (const [id, arr] of prereqsOf) prereqCount.set(id, arr.length);
    return { prereqCount, prereqsOf, unlocksOf };
  }, [plan.edges]);

  const related: StepRelated | null = useMemo(() => {
    if (!selectedId) return null;
    const titlesOf = (ids: string[] | undefined) =>
      (ids ?? [])
        .map((id) => stepById.get(id)?.title)
        .filter((t): t is string => Boolean(t));
    return {
      prereqTitles: titlesOf(prereqsOf.get(selectedId)),
      unlockTitles: titlesOf(unlocksOf.get(selectedId)),
      skills: plan.skills.filter((s) => s.stepIds.includes(selectedId)),
      certifications: plan.certifications.filter((c) => c.stepId === selectedId),
      courses: plan.courses.filter((c) => c.stepId === selectedId),
      connections: plan.connections.filter((c) => c.stepId === selectedId),
    };
  }, [selectedId, stepById, prereqsOf, unlocksOf, plan]);

  const selectedStep = selectedId ? (stepById.get(selectedId) ?? null) : null;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="min-w-0 space-y-6">
        <div className="glass rounded-xl p-4">
          <PathGraph
            steps={plan.steps}
            edges={plan.edges}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        </div>
        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--color-muted)]">
            Steps in order
          </h3>
          <StepTimeline
            steps={plan.steps}
            prereqCount={prereqCount}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        </div>
      </div>
      <div className="lg:sticky lg:top-6 lg:self-start">
        <StepDetailPanel step={selectedStep} related={related} />
      </div>
    </div>
  );
}
