import type { Skill } from "@/lib/plan/types";
import { SKILL_CATEGORY_LABEL } from "@/lib/plan/format";

/**
 * Current-vs-target proficiency, one row per skill. Built from semantic HTML
 * (not a canvas/SVG) so each row's aria-label is the accessible equivalent —
 * screen readers hear "React: 40 of 100 now, target 90" while sighted users see
 * the bar. Levels are 0–100.
 */
export function SkillChart({ skills }: { skills: Skill[] }) {
  if (skills.length === 0) return null;

  return (
    <ul className="space-y-4">
      {skills.map((s) => {
        const current = clamp(s.currentLevel);
        const target = clamp(s.targetLevel);
        return (
          <li
            key={s.id}
            aria-label={`${s.name}: ${current} of 100 now, target ${target} of 100`}
          >
            <div className="mb-1 flex items-baseline justify-between gap-3">
              <span className="text-sm font-medium">{s.name}</span>
              <span className="text-xs text-[var(--color-muted)]">
                {SKILL_CATEGORY_LABEL[s.category] ?? s.category}
              </span>
            </div>
            <div
              className="relative h-3 overflow-hidden rounded-full bg-white/10"
              aria-hidden="true"
            >
              {/* Target marker: a faint fill up to the goal level. */}
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-[var(--color-accent)]/25"
                style={{ width: `${target}%` }}
              />
              {/* Current level: solid accent. */}
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-[var(--color-accent)]"
                style={{ width: `${current}%` }}
              />
            </div>
            <div
              className="mt-1 flex justify-between text-xs text-[var(--color-muted)]"
              aria-hidden="true"
            >
              <span>Now {current}</span>
              <span>Target {target}</span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function clamp(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}
