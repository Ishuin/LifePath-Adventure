// Hand-maintained row types for the tables the app reads/writes. (Once a
// Supabase project exists, `supabase gen types typescript` can replace these.)

export type GoalStatus = "active" | "archived";

export interface GoalRow {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  target_date: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export type LifeStateKind = "current" | "past";

export interface LifeStateRow {
  id: string;
  user_id: string;
  goal_id: string | null;
  kind: LifeStateKind;
  as_of: string | null;
  summary: string;
  details: Record<string, unknown>;
  created_at: string;
}

export type PlanStatus =
  | "draft"
  | "generating"
  | "active"
  | "archived"
  | "failed";
