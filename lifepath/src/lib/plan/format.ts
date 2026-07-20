import type { BudgetItem } from "./types";

/**
 * Formats an integer cent amount as a currency string. Falls back to a plain
 * "<code> <amount>" render if the runtime's Intl doesn't know the code.
 */
export function formatCents(cents: number, currency = "USD"): string {
  const amount = cents / 100;
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

export interface CurrencyTotal {
  currency: string;
  cents: number;
}

/**
 * Sums budget amounts per currency (we never mix currencies into one figure).
 * Sorted by descending total so the dominant currency leads.
 */
export function totalByCurrency(items: BudgetItem[]): CurrencyTotal[] {
  const totals = new Map<string, number>();
  for (const item of items) {
    totals.set(item.currency, (totals.get(item.currency) ?? 0) + item.amountCents);
  }
  return [...totals.entries()]
    .map(([currency, cents]) => ({ currency, cents }))
    .sort((a, b) => b.cents - a.cents);
}

/** Renders a list of per-currency totals as "$1,200.00 + €300.00". */
export function formatTotals(totals: CurrencyTotal[]): string {
  if (totals.length === 0) return formatCents(0);
  return totals.map((t) => formatCents(t.cents, t.currency)).join(" + ");
}

export const SKILL_CATEGORY_LABEL: Record<string, string> = {
  technical: "Technical",
  soft: "Soft",
  domain: "Domain",
  tool: "Tooling",
  other: "Other",
};

export const BUDGET_CATEGORY_LABEL: Record<string, string> = {
  course: "Course",
  certification: "Certification",
  tool: "Tooling",
  membership: "Membership",
  event: "Event",
  coaching: "Coaching",
  other: "Other",
};

export const CONNECTION_KIND_LABEL: Record<string, string> = {
  person: "Person",
  community: "Community",
  role: "Role",
  mentor: "Mentor",
  organization: "Organization",
};

export const STEP_STATUS_LABEL: Record<string, string> = {
  locked: "Locked",
  available: "Available",
  in_progress: "In progress",
  done: "Done",
  skipped: "Skipped",
};

/** Tailwind class fragments for a step's status chip. Central so the timeline
 * and graph stay visually in sync. */
export const STEP_STATUS_STYLE: Record<
  string,
  { dot: string; text: string; ring: string }
> = {
  locked: {
    dot: "bg-white/25",
    text: "text-[var(--color-muted)]",
    ring: "border-white/15",
  },
  available: {
    dot: "bg-[var(--color-accent)]",
    text: "text-[var(--color-accent)]",
    ring: "border-[var(--color-accent)]",
  },
  in_progress: {
    dot: "bg-amber-400",
    text: "text-amber-300",
    ring: "border-amber-400/70",
  },
  done: {
    dot: "bg-emerald-400",
    text: "text-emerald-300",
    ring: "border-emerald-400/70",
  },
  skipped: {
    dot: "bg-white/25",
    text: "text-[var(--color-muted)]",
    ring: "border-white/10",
  },
};
