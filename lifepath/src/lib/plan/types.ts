// View types for a persisted plan graph, as read back for the goal detail page.
// These mirror the columns selected in `loadActivePlan` (query.ts) — camelCased
// via Supabase aliases so the UI never touches snake_case column names.

export type StepStatus =
  | "locked"
  | "available"
  | "in_progress"
  | "done"
  | "skipped";

export type SkillCategory = "technical" | "soft" | "domain" | "tool" | "other";

export type BudgetCategory =
  | "course"
  | "certification"
  | "tool"
  | "membership"
  | "event"
  | "coaching"
  | "other";

export type ConnectionKind =
  | "person"
  | "community"
  | "role"
  | "mentor"
  | "organization";

export interface PlanStep {
  id: string;
  orderIndex: number;
  title: string;
  description: string | null;
  rationale: string | null;
  status: StepStatus;
  xpReward: number;
  estimatedWeeks: number | null;
}

/** A prerequisite edge: `fromStepId` must be done before `toStepId` unlocks. */
export interface StepEdge {
  fromStepId: string;
  toStepId: string;
}

export interface Skill {
  id: string;
  name: string;
  category: SkillCategory;
  currentLevel: number;
  targetLevel: number;
  priority: number;
  /** Step ids this skill is built by (from skill_step_links). */
  stepIds: string[];
}

export interface Certification {
  id: string;
  name: string;
  provider: string | null;
  url: string | null;
  estCostCents: number;
  priority: number;
  stepId: string | null;
}

export interface Course {
  id: string;
  title: string;
  provider: string | null;
  url: string | null;
  estCostCents: number;
  estHours: number | null;
  priority: number;
  stepId: string | null;
}

export interface BudgetItem {
  id: string;
  label: string;
  category: BudgetCategory;
  amountCents: number;
  currency: string;
  notes: string | null;
  stepId: string | null;
}

export interface Connection {
  id: string;
  name: string;
  kind: ConnectionKind;
  why: string | null;
  how: string | null;
  priority: number;
  stepId: string | null;
}

export interface LevelMilestone {
  id: string;
  level: number;
  title: string;
  xpRequired: number;
  unlocks: string | null;
}

export interface PlanView {
  id: string;
  version: number;
  status: string;
  rationale: string | null;
  provider: string | null;
  model: string | null;
  generatedAt: string | null;
  steps: PlanStep[];
  edges: StepEdge[];
  skills: Skill[];
  certifications: Certification[];
  courses: Course[];
  budget: BudgetItem[];
  connections: Connection[];
  levels: LevelMilestone[];
}
