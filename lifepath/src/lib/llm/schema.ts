import { z } from "zod";

/**
 * zGeneratedPlan is the single source of truth for what an LLM must return when
 * it designs a LifePath plan. Everything downstream (persistence RPC, UI) keys
 * off this shape.
 *
 * Steps declare their dependencies by stable string `key`s (not UUIDs) — the
 * model has no way to know the row ids we'll assign, so it names steps and
 * references those names. `persist_generated_plan` remaps key -> uuid in-DB.
 *
 * NOTE: structured-output APIs derive a JSON Schema from this and silently drop
 * numeric `min`/`max`/`length` constraints. Zod is therefore the authoritative
 * validator — we re-parse every model response against it (see generatePlan.ts).
 */

// Enum values MUST match the Postgres enums in 0001_init.sql.
export const skillCategory = z.enum([
  "technical",
  "soft",
  "domain",
  "tool",
  "other",
]);
export const budgetCategory = z.enum([
  "course",
  "certification",
  "tool",
  "membership",
  "event",
  "coaching",
  "other",
]);
export const connectionKind = z.enum([
  "person",
  "community",
  "role",
  "mentor",
  "organization",
]);

// A stable, model-authored identifier used only to wire steps together.
const stepKey = z
  .string()
  .trim()
  .min(1)
  .max(64)
  .regex(/^[a-z0-9][a-z0-9_-]*$/i, "step keys must be slug-like");

export const zStep = z.object({
  key: stepKey,
  title: z.string().trim().min(1).max(160),
  description: z.string().trim().max(2000).default(""),
  // Why this step exists and how it connects to the ones around it.
  rationale: z.string().trim().max(2000).default(""),
  orderIndex: z.number().int().min(0).max(999),
  xpReward: z.number().int().min(0).max(100000).default(100),
  estimatedWeeks: z.number().int().min(0).max(520).nullable().default(null),
  // Keys of steps that must be completed before this one unlocks.
  dependsOn: z.array(stepKey).max(50).default([]),
});

export const zSkill = z.object({
  name: z.string().trim().min(1).max(120),
  category: skillCategory.default("other"),
  currentLevel: z.number().int().min(0).max(100).default(0),
  targetLevel: z.number().int().min(0).max(100).default(100),
  priority: z.number().int().min(0).max(1000).default(0),
  // Steps that build this skill.
  stepKeys: z.array(stepKey).max(50).default([]),
});

export const zCertification = z.object({
  name: z.string().trim().min(1).max(200),
  provider: z.string().trim().max(160).nullable().default(null),
  url: z.string().trim().max(500).nullable().default(null),
  estCostCents: z.number().int().min(0).max(100_000_000).default(0),
  priority: z.number().int().min(0).max(1000).default(0),
  stepKey: stepKey.nullable().default(null),
});

export const zCourse = z.object({
  title: z.string().trim().min(1).max(200),
  provider: z.string().trim().max(160).nullable().default(null),
  url: z.string().trim().max(500).nullable().default(null),
  estCostCents: z.number().int().min(0).max(100_000_000).default(0),
  estHours: z.number().int().min(0).max(100000).nullable().default(null),
  priority: z.number().int().min(0).max(1000).default(0),
  stepKey: stepKey.nullable().default(null),
});

export const zBudgetItem = z.object({
  label: z.string().trim().min(1).max(200),
  category: budgetCategory.default("other"),
  amountCents: z.number().int().min(0).max(100_000_000).default(0),
  currency: z
    .string()
    .trim()
    .length(3)
    .regex(/^[A-Z]{3}$/, "ISO 4217 currency code")
    .default("USD"),
  notes: z.string().trim().max(1000).nullable().default(null),
  stepKey: stepKey.nullable().default(null),
});

export const zConnection = z.object({
  name: z.string().trim().min(1).max(200),
  kind: connectionKind.default("person"),
  why: z.string().trim().max(1000).nullable().default(null),
  how: z.string().trim().max(1000).nullable().default(null),
  priority: z.number().int().min(0).max(1000).default(0),
  stepKey: stepKey.nullable().default(null),
});

export const zLevelMilestone = z.object({
  level: z.number().int().min(1).max(999),
  title: z.string().trim().min(1).max(160),
  xpRequired: z.number().int().min(0).max(10_000_000).default(0),
  unlocks: z.string().trim().max(500).nullable().default(null),
});

export const zGeneratedPlan = z.object({
  // The narrative that ties the whole path together.
  rationale: z.string().trim().min(1).max(4000),
  steps: z.array(zStep).min(1).max(60),
  skills: z.array(zSkill).max(60).default([]),
  certifications: z.array(zCertification).max(60).default([]),
  courses: z.array(zCourse).max(60).default([]),
  budget: z.array(zBudgetItem).max(60).default([]),
  connections: z.array(zConnection).max(60).default([]),
  levels: z.array(zLevelMilestone).max(60).default([]),
});

export type GeneratedPlan = z.infer<typeof zGeneratedPlan>;
export type GeneratedStep = z.infer<typeof zStep>;
