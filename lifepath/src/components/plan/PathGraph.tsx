"use client";

import { useMemo } from "react";
import type { PlanStep, StepEdge } from "@/lib/plan/types";
import { STEP_STATUS_STYLE } from "@/lib/plan/format";
import { layoutGraph } from "@/lib/plan/layout";

/**
 * Visual layered rendering of the step DAG. This is a redundant, mouse-driven
 * presentation of the same data the StepTimeline exposes to assistive tech and
 * the keyboard, so the whole figure is aria-hidden to avoid double-announcing.
 */
export function PathGraph({
  steps,
  edges,
  selectedId,
  onSelect,
}: {
  steps: PlanStep[];
  edges: StepEdge[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const layout = useMemo(
    () =>
      layoutGraph(
        steps.map((s) => ({ id: s.id, orderIndex: s.orderIndex })),
        edges,
      ),
    [steps, edges],
  );
  const stepById = useMemo(
    () => new Map(steps.map((s) => [s.id, s] as const)),
    [steps],
  );

  if (layout.nodes.length === 0) return null;

  return (
    <div className="overflow-auto" aria-hidden="true">
      <svg
        width={layout.width}
        height={layout.height}
        viewBox={`0 0 ${layout.width} ${layout.height}`}
        role="presentation"
        className="max-w-none"
      >
        <defs>
          <marker
            id="arrow"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M0,0 L10,5 L0,10 z" fill="rgba(255,255,255,0.35)" />
          </marker>
          <marker
            id="arrow-accent"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M0,0 L10,5 L0,10 z" fill="var(--color-accent)" />
          </marker>
        </defs>

        {layout.edges.map((e) => {
          const active = e.fromId === selectedId || e.toId === selectedId;
          const midY = (e.y1 + e.y2) / 2;
          const d = `M ${e.x1} ${e.y1} C ${e.x1} ${midY}, ${e.x2} ${midY}, ${e.x2} ${e.y2}`;
          return (
            <path
              key={`${e.fromId}-${e.toId}`}
              d={d}
              fill="none"
              stroke={active ? "var(--color-accent)" : "rgba(255,255,255,0.22)"}
              strokeWidth={active ? 2 : 1.25}
              markerEnd={active ? "url(#arrow-accent)" : "url(#arrow)"}
            />
          );
        })}

        {layout.nodes.map((n) => {
          const step = stepById.get(n.id);
          if (!step) return null;
          const style =
            STEP_STATUS_STYLE[step.status] ?? STEP_STATUS_STYLE.locked;
          const selected = step.id === selectedId;
          return (
            <foreignObject
              key={n.id}
              x={n.x}
              y={n.y}
              width={n.width}
              height={n.height}
            >
              <button
                type="button"
                tabIndex={-1}
                onClick={() => onSelect(step.id)}
                className={`glass flex h-full w-full flex-col justify-center rounded-lg border px-3 py-2 text-left transition hover:bg-white/10 ${
                  selected
                    ? "border-[var(--color-accent)] bg-white/10 ring-1 ring-[var(--color-accent)]"
                    : style.ring
                }`}
              >
                <span className="flex items-center gap-2">
                  <span
                    className={`h-2 w-2 shrink-0 rounded-full ${style.dot}`}
                  />
                  <span className="text-[10px] uppercase tracking-wide text-[var(--color-muted)]">
                    Step {step.orderIndex + 1}
                  </span>
                </span>
                <span className="mt-1 line-clamp-2 text-sm font-medium leading-tight">
                  {step.title}
                </span>
              </button>
            </foreignObject>
          );
        })}
      </svg>
    </div>
  );
}
