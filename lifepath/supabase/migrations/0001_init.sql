-- LifePath initial schema.
-- Every user-owned table denormalizes user_id so RLS policies stay a flat
-- `auth.uid() = user_id` check (no recursive joins). See 0002_rls.sql.

-- Enums -----------------------------------------------------------------------
create type life_state_kind as enum ('current', 'past');
create type plan_status     as enum ('draft', 'generating', 'active', 'archived', 'failed');
create type step_status     as enum ('locked', 'available', 'in_progress', 'done', 'skipped');
create type skill_category  as enum ('technical', 'soft', 'domain', 'tool', 'other');
create type budget_category as enum ('course', 'certification', 'tool', 'membership', 'event', 'coaching', 'other');
create type connection_kind as enum ('person', 'community', 'role', 'mentor', 'organization');

-- profiles (1:1 with auth.users) ---------------------------------------------
create table profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url   text,
  total_xp     int not null default 0,
  level        int not null default 1,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- goals -----------------------------------------------------------------------
create table goals (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text not null,
  description text,
  target_date date,
  status      text not null default 'active',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index goals_user_idx on goals(user_id);

-- life_states (current + past snapshots) --------------------------------------
create table life_states (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  goal_id    uuid references goals(id) on delete cascade,
  kind       life_state_kind not null,
  as_of      date,
  summary    text not null,
  details    jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index life_states_goal_idx on life_states(goal_id);
create index life_states_user_idx on life_states(user_id);

-- plans (versioned; one active plan per goal) ---------------------------------
create table plans (
  id            uuid primary key default gen_random_uuid(),
  goal_id       uuid not null references goals(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  version       int not null default 1,
  status        plan_status not null default 'generating',
  rationale     text,
  provider      text,
  model         text,
  raw_output    jsonb,
  superseded_by uuid references plans(id) on delete set null,
  generated_at  timestamptz,
  created_at    timestamptz not null default now()
);
create unique index plans_one_active_per_goal on plans(goal_id) where status = 'active';
create index plans_goal_idx on plans(goal_id);

-- plan_steps ------------------------------------------------------------------
create table plan_steps (
  id             uuid primary key default gen_random_uuid(),
  plan_id        uuid not null references plans(id) on delete cascade,
  user_id        uuid not null references auth.users(id) on delete cascade,
  order_index    int not null,
  title          text not null,
  description    text,
  rationale      text,
  status         step_status not null default 'locked',
  xp_reward      int not null default 100,
  estimated_weeks int,
  completed_at   timestamptz
);
create index plan_steps_plan_idx on plan_steps(plan_id, order_index);
create index plan_steps_user_idx on plan_steps(user_id);

-- step_dependencies (edge list for the path DAG) ------------------------------
create table step_dependencies (
  id           uuid primary key default gen_random_uuid(),
  plan_id      uuid not null references plans(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  from_step_id uuid not null references plan_steps(id) on delete cascade,
  to_step_id   uuid not null references plan_steps(id) on delete cascade,
  constraint step_dep_no_self check (from_step_id <> to_step_id),
  unique (from_step_id, to_step_id)
);
create index step_dependencies_plan_idx on step_dependencies(plan_id);

-- skills ----------------------------------------------------------------------
create table skills (
  id            uuid primary key default gen_random_uuid(),
  plan_id       uuid not null references plans(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  name          text not null,
  category      skill_category not null default 'other',
  current_level int not null default 0,
  target_level  int not null default 100,
  priority      int not null default 0
);
create index skills_plan_idx on skills(plan_id);

create table skill_step_links (
  id       uuid primary key default gen_random_uuid(),
  user_id  uuid not null references auth.users(id) on delete cascade,
  skill_id uuid not null references skills(id) on delete cascade,
  step_id  uuid not null references plan_steps(id) on delete cascade,
  unique (skill_id, step_id)
);

-- certifications --------------------------------------------------------------
create table certifications (
  id            uuid primary key default gen_random_uuid(),
  plan_id       uuid not null references plans(id) on delete cascade,
  step_id       uuid references plan_steps(id) on delete set null,
  user_id       uuid not null references auth.users(id) on delete cascade,
  name          text not null,
  provider      text,
  url           text,
  est_cost_cents int not null default 0,
  priority      int not null default 0,
  status        text not null default 'recommended'
);
create index certifications_plan_idx on certifications(plan_id);

-- courses ---------------------------------------------------------------------
create table courses (
  id            uuid primary key default gen_random_uuid(),
  plan_id       uuid not null references plans(id) on delete cascade,
  step_id       uuid references plan_steps(id) on delete set null,
  user_id       uuid not null references auth.users(id) on delete cascade,
  title         text not null,
  provider      text,
  url           text,
  est_cost_cents int not null default 0,
  est_hours     int,
  priority      int not null default 0,
  status        text not null default 'recommended'
);
create index courses_plan_idx on courses(plan_id);

-- budget_items ----------------------------------------------------------------
create table budget_items (
  id           uuid primary key default gen_random_uuid(),
  plan_id      uuid not null references plans(id) on delete cascade,
  step_id      uuid references plan_steps(id) on delete set null,
  user_id      uuid not null references auth.users(id) on delete cascade,
  label        text not null,
  category     budget_category not null default 'other',
  amount_cents int not null default 0,
  currency     char(3) not null default 'USD',
  notes        text
);
create index budget_items_plan_idx on budget_items(plan_id);

-- connections -----------------------------------------------------------------
create table connections (
  id       uuid primary key default gen_random_uuid(),
  plan_id  uuid not null references plans(id) on delete cascade,
  step_id  uuid references plan_steps(id) on delete set null,
  user_id  uuid not null references auth.users(id) on delete cascade,
  name     text not null,
  kind     connection_kind not null default 'person',
  why      text,
  how      text,
  priority int not null default 0
);
create index connections_plan_idx on connections(plan_id);

-- level_milestones (per-plan progression tiers -> level chart) ----------------
create table level_milestones (
  id          uuid primary key default gen_random_uuid(),
  plan_id     uuid not null references plans(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  level       int not null,
  title       text not null,
  xp_required int not null default 0,
  unlocks     text
);
create index level_milestones_plan_idx on level_milestones(plan_id);

-- xp_events (append-only ledger; profiles.total_xp/level derived from it) ------
create table xp_events (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  goal_id    uuid references goals(id) on delete set null,
  step_id    uuid references plan_steps(id) on delete set null,
  delta      int not null,
  reason     text,
  created_at timestamptz not null default now()
);
create index xp_events_user_idx on xp_events(user_id, created_at);
