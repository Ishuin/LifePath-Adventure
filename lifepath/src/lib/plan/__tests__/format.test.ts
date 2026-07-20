import { describe, it, expect } from "vitest";
import {
  formatCents,
  formatTotals,
  totalByCurrency,
} from "../format";
import type { BudgetItem } from "../types";

const item = (
  amountCents: number,
  currency = "USD",
): BudgetItem => ({
  id: `${amountCents}-${currency}`,
  label: "x",
  category: "other",
  amountCents,
  currency,
  notes: null,
  stepId: null,
});

describe("formatCents", () => {
  it("formats USD cents as dollars", () => {
    expect(formatCents(120000)).toBe("$1,200.00");
    expect(formatCents(0)).toBe("$0.00");
  });

  it("honors a non-USD currency", () => {
    // Exact glyph varies by ICU build; assert the amount is present.
    expect(formatCents(30000, "EUR")).toContain("300");
  });

  it("falls back gracefully for a malformed currency code", () => {
    // Intl throws on a code that isn't 3 letters; the fallback kicks in.
    expect(formatCents(500, "US")).toBe("US 5.00");
  });
});

describe("totalByCurrency", () => {
  it("sums per currency and sorts by descending total", () => {
    const totals = totalByCurrency([
      item(10000, "USD"),
      item(5000, "EUR"),
      item(20000, "USD"),
    ]);
    expect(totals).toEqual([
      { currency: "USD", cents: 30000 },
      { currency: "EUR", cents: 5000 },
    ]);
  });

  it("returns an empty array for no items", () => {
    expect(totalByCurrency([])).toEqual([]);
  });
});

describe("formatTotals", () => {
  it("joins multiple currency totals", () => {
    const s = formatTotals([
      { currency: "USD", cents: 120000 },
      { currency: "US", cents: 500 },
    ]);
    expect(s).toBe("$1,200.00 + US 5.00");
  });

  it("renders a zero total when empty", () => {
    expect(formatTotals([])).toBe("$0.00");
  });
});
