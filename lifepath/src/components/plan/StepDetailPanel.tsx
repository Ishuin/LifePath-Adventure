import type {
  Certification,
  Connection,
  Course,
  PlanStep,
  Skill,
} from "@/lib/plan/types";
import { STEP_STATUS_LABEL, STEP_STATUS_STYLE, formatCents } from "@/lib/plan/format";

export interface StepRelated {
  prereqTitles: string[];
  unlockTitles: string[];
  skills: Skill[];
  certifications: Certification[];
  courses: Course[];
  connections: Connection[];
}

/**
 * Detail for the currently-selected step: its rationale plus everything wired to
 * it (prerequisites, what it unlocks, skills it builds, and the certs/courses/
 * connections attached to it). Purely presentational.
 */
export function StepDetailPanel({
  step,
  related,
}: {
  step: PlanStep | null;
  related: StepRelated | null;
}) {
  if (!step || !related) {
    return (
      <div className="glass flex h-full min-h-40 items-center justify-center rounded-xl p-6 text-center text-sm text-[var(--color-muted)]">
        Select a step to see why it matters and what it connects to.
      </div>
    );
  }

  const style = STEP_STATUS_STYLE[step.status] ?? STEP_STATUS_STYLE.locked;

  return (
    <div className="glass rounded-xl p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-[var(--color-muted)]">
            Step {step.orderIndex + 1}
          </p>
          <h3 className="mt-1 text-lg font-semibold">{step.title}</h3>
        </div>
        <span
          className={`shrink-0 rounded-full border px-2.5 py-1 text-xs ${style.ring} ${style.text}`}
        >
          {STEP_STATUS_LABEL[step.status] ?? step.status}
        </span>
      </div>

      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--color-muted)]">
        <span>{step.xpReward} XP</span>
        {step.estimatedWeeks != null && (
          <span>
            ~{step.estimatedWeeks} week{step.estimatedWeeks === 1 ? "" : "s"}
          </span>
        )}
      </div>

      {step.description && (
        <p className="mt-4 text-sm leading-relaxed">{step.description}</p>
      )}
      {step.rationale && (
        <p className="mt-3 border-l-2 border-[var(--color-accent)] pl-3 text-sm italic text-[var(--color-muted)]">
          {step.rationale}
        </p>
      )}

      <dl className="mt-5 grid gap-4 sm:grid-cols-2">
        <FactList label="Prerequisites" items={related.prereqTitles} empty="None — you can start this now." />
        <FactList label="Unlocks" items={related.unlockTitles} empty="Nothing depends on this step." />
      </dl>

      {related.skills.length > 0 && (
        <Section title="Skills this builds">
          <ul className="flex flex-wrap gap-2">
            {related.skills.map((s) => (
              <li
                key={s.id}
                className="rounded-full border border-white/15 px-2.5 py-1 text-xs"
              >
                {s.name}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {related.courses.length > 0 && (
        <Section title="Courses">
          <ul className="space-y-1 text-sm">
            {related.courses.map((c) => (
              <li key={c.id} className="flex justify-between gap-3">
                <span>{linkOrText(c.title, c.url)}</span>
                <span className="shrink-0 text-[var(--color-muted)]">
                  {formatCents(c.estCostCents)}
                </span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {related.certifications.length > 0 && (
        <Section title="Certifications">
          <ul className="space-y-1 text-sm">
            {related.certifications.map((c) => (
              <li key={c.id} className="flex justify-between gap-3">
                <span>{linkOrText(c.name, c.url)}</span>
                <span className="shrink-0 text-[var(--color-muted)]">
                  {formatCents(c.estCostCents)}
                </span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {related.connections.length > 0 && (
        <Section title="Connections to make">
          <ul className="space-y-1 text-sm">
            {related.connections.map((c) => (
              <li key={c.id}>
                <span className="font-medium">{c.name}</span>
                {c.why && (
                  <span className="text-[var(--color-muted)]"> — {c.why}</span>
                )}
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-5">
      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
        {title}
      </h4>
      {children}
    </div>
  );
}

function FactList({
  label,
  items,
  empty,
}: {
  label: string;
  items: string[];
  empty: string;
}) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
        {label}
      </dt>
      <dd className="mt-1 text-sm">
        {items.length === 0 ? (
          <span className="text-[var(--color-muted)]">{empty}</span>
        ) : (
          <ul className="list-inside list-disc space-y-0.5">
            {items.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
        )}
      </dd>
    </div>
  );
}

function linkOrText(text: string, url: string | null) {
  if (!url) return text;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="text-[var(--color-accent)] hover:underline"
    >
      {text}
    </a>
  );
}
