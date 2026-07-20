import type {
  BudgetItem,
  Certification,
  Connection,
  Course,
} from "@/lib/plan/types";
import {
  BUDGET_CATEGORY_LABEL,
  CONNECTION_KIND_LABEL,
  formatCents,
  formatTotals,
  totalByCurrency,
} from "@/lib/plan/format";

function ExternalLink({ text, url }: { text: string; url: string | null }) {
  if (!url) return <>{text}</>;
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

export function CoursesPanel({ courses }: { courses: Course[] }) {
  if (courses.length === 0) return null;
  return (
    <PanelCard title="Courses" count={courses.length}>
      <ul className="divide-y divide-white/10">
        {courses.map((c) => (
          <li key={c.id} className="flex items-start justify-between gap-4 py-3">
            <div className="min-w-0">
              <p className="font-medium">
                <ExternalLink text={c.title} url={c.url} />
              </p>
              <p className="text-xs text-[var(--color-muted)]">
                {[c.provider, c.estHours != null ? `~${c.estHours}h` : null]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>
            <span className="shrink-0 text-sm text-[var(--color-muted)]">
              {formatCents(c.estCostCents)}
            </span>
          </li>
        ))}
      </ul>
    </PanelCard>
  );
}

export function CertsPanel({ certs }: { certs: Certification[] }) {
  if (certs.length === 0) return null;
  return (
    <PanelCard title="Certifications" count={certs.length}>
      <ul className="divide-y divide-white/10">
        {certs.map((c) => (
          <li key={c.id} className="flex items-start justify-between gap-4 py-3">
            <div className="min-w-0">
              <p className="font-medium">
                <ExternalLink text={c.name} url={c.url} />
              </p>
              {c.provider && (
                <p className="text-xs text-[var(--color-muted)]">{c.provider}</p>
              )}
            </div>
            <span className="shrink-0 text-sm text-[var(--color-muted)]">
              {formatCents(c.estCostCents)}
            </span>
          </li>
        ))}
      </ul>
    </PanelCard>
  );
}

export function BudgetPanel({ items }: { items: BudgetItem[] }) {
  if (items.length === 0) return null;
  const totals = totalByCurrency(items);
  return (
    <PanelCard title="Budget" trailing={<span>{formatTotals(totals)}</span>}>
      <ul className="divide-y divide-white/10">
        {items.map((b) => (
          <li key={b.id} className="flex items-start justify-between gap-4 py-3">
            <div className="min-w-0">
              <p className="font-medium">{b.label}</p>
              <p className="text-xs text-[var(--color-muted)]">
                {BUDGET_CATEGORY_LABEL[b.category] ?? b.category}
                {b.notes ? ` · ${b.notes}` : ""}
              </p>
            </div>
            <span className="shrink-0 text-sm text-[var(--color-muted)]">
              {formatCents(b.amountCents, b.currency)}
            </span>
          </li>
        ))}
      </ul>
    </PanelCard>
  );
}

export function ConnectionsPanel({
  connections,
}: {
  connections: Connection[];
}) {
  if (connections.length === 0) return null;
  return (
    <PanelCard title="Connections to make" count={connections.length}>
      <ul className="divide-y divide-white/10">
        {connections.map((c) => (
          <li key={c.id} className="py-3">
            <div className="flex items-center gap-2">
              <span className="font-medium">{c.name}</span>
              <span className="rounded-full border border-white/15 px-2 py-0.5 text-[10px] uppercase tracking-wide text-[var(--color-muted)]">
                {CONNECTION_KIND_LABEL[c.kind] ?? c.kind}
              </span>
            </div>
            {c.why && <p className="mt-1 text-sm">{c.why}</p>}
            {c.how && (
              <p className="mt-1 text-xs text-[var(--color-muted)]">
                How: {c.how}
              </p>
            )}
          </li>
        ))}
      </ul>
    </PanelCard>
  );
}

function PanelCard({
  title,
  count,
  trailing,
  children,
}: {
  title: string;
  count?: number;
  trailing?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="glass rounded-xl p-6">
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <h2 className="text-lg font-semibold">
          {title}
          {count != null && (
            <span className="ml-2 text-sm font-normal text-[var(--color-muted)]">
              {count}
            </span>
          )}
        </h2>
        {trailing && (
          <span className="text-sm text-[var(--color-muted)]">{trailing}</span>
        )}
      </div>
      {children}
    </section>
  );
}
