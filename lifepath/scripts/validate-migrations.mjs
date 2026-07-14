// Applies the SQL migrations to an in-process Postgres (PGlite) to validate
// they parse and run, then exercises the RLS policies with two simulated users.
// This is a schema/RLS smoke test — not a substitute for a real Supabase env,
// but it catches DDL/policy errors without Docker or network.
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const mig = (f) =>
  readFileSync(join(here, "..", "supabase", "migrations", f), "utf8");

const db = new PGlite();

// --- Minimal Supabase `auth` stub so migrations referencing auth.* apply. ----
await db.exec(`
  create schema if not exists auth;
  create table auth.users (
    id uuid primary key default gen_random_uuid(),
    email text,
    raw_user_meta_data jsonb not null default '{}'::jsonb
  );
  -- RLS uses auth.uid(); back it with a request-scoped GUC.
  create or replace function auth.uid() returns uuid language sql stable as $$
    select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
  $$;
  -- Supabase always ships an authenticated role; migrations grant to it, so
  -- it must exist before they apply. nobypassrls so RLS is actually enforced.
  do $$ begin
    if not exists (select 1 from pg_roles where rolname='authenticated')
    then create role authenticated nobypassrls; end if;
  end $$;
`);

// --- Apply migrations in order. ----------------------------------------------
for (const f of [
  "0001_init.sql",
  "0002_rls.sql",
  "0003_triggers.sql",
  "0004_persist_plan.sql",
]) {
  await db.exec(mig(f));
  console.log(`applied ${f}`);
}

// --- Verify the signup trigger creates a profile. ----------------------------
const uA = "11111111-1111-1111-1111-111111111111";
const uB = "22222222-2222-2222-2222-222222222222";
await db.exec(`insert into auth.users (id, email, raw_user_meta_data)
  values ('${uA}','a@test.dev','{"name":"A"}'),
         ('${uB}','b@test.dev','{"name":"B"}');`);
const profiles = await db.query(`select id from profiles`);
if (profiles.rows.length !== 2) {
  throw new Error(`expected 2 profiles, got ${profiles.rows.length}`);
}
console.log("signup trigger created profiles: OK");

// --- Grant table access to the (already-created) authenticated role. ---------
await db.exec(`
  grant usage on schema public to authenticated;
  grant all on all tables in schema public to authenticated;
`);

// Run a block as a given user inside ONE transaction (so `set local` sticks),
// returning the rows of the final SELECT.
async function asUser(sub, finalSelect) {
  const results = await db.exec(`
    begin;
    set local role authenticated;
    select set_config('request.jwt.claim.sub', '${sub}', true);
    ${finalSelect};
    commit;
  `);
  // results is an array; the SELECT we care about is the 4th statement (idx 3).
  return results[3].rows;
}

// user A inserts a goal (committed).
await asUser(
  uA,
  `insert into goals (user_id, title) values ('${uA}', 'A goal') returning id`,
);

const aSees = (await asUser(uA, `select count(*)::int as n from goals`))[0].n;
const bSees = (await asUser(uB, `select count(*)::int as n from goals`))[0].n;
console.log(`RLS: A sees ${aSees} goal(s), B sees ${bSees}`);

if (aSees !== 1 || bSees !== 0) {
  throw new Error(`RLS isolation FAILED (A=${aSees}, B=${bSees})`);
}
console.log("RLS isolation: OK");

// user B cannot insert a row owned by A (WITH CHECK).
let blocked = false;
try {
  await asUser(uB, `insert into goals (user_id, title) values ('${uA}', 'evil')`);
} catch {
  blocked = true;
  // The failing insert aborts the transaction before asUser reaches `commit`,
  // leaving the single PGlite connection mid-transaction. Roll back so later
  // checks don't inherit an "aborted transaction" state.
  await db.exec("rollback").catch(() => {});
}
console.log(`RLS: B inserting A's row blocked — ${blocked ? "OK" : "FAIL"}`);
if (!blocked) throw new Error("RLS WITH CHECK did not block cross-user insert");

// --- Exercise the transactional plan-persistence RPC. ------------------------
// user A creates a goal, then persists a full plan graph through the RPC. This
// proves key->uuid remapping, dependency wiring, the one-active-plan constraint,
// and that persisted children stay owner-isolated under RLS.
const goalId = (
  await asUser(
    uA,
    `insert into goals (user_id, title) values ('${uA}', 'Backend goal') returning id`,
  )
)[0].id;

const plan = {
  rationale: "Learn SQL, build an API, then study system design.",
  steps: [
    { key: "a", title: "Learn SQL", orderIndex: 0, xpReward: 100, estimatedWeeks: 4, dependsOn: [] },
    { key: "b", title: "Build API", orderIndex: 1, xpReward: 200, estimatedWeeks: 6, dependsOn: ["a"] },
    { key: "c", title: "System design", orderIndex: 2, xpReward: 300, dependsOn: ["b"] },
  ],
  skills: [
    { name: "SQL", category: "technical", currentLevel: 10, targetLevel: 80, priority: 1, stepKeys: ["a"] },
  ],
  certifications: [
    { name: "AWS SA", provider: "AWS", url: null, estCostCents: 15000, priority: 1, stepKey: "c" },
  ],
  courses: [
    { title: "DDIA", provider: "O'Reilly", estCostCents: 5000, estHours: 40, priority: 1, stepKey: "c" },
  ],
  budget: [
    { label: "Exam fee", category: "certification", amountCents: 15000, currency: "USD", stepKey: "c" },
  ],
  connections: [{ name: "Meetup", kind: "community", why: "learn", how: "attend", priority: 1 }],
  levels: [
    { level: 1, title: "Apprentice", xpRequired: 0 },
    { level: 2, title: "Journeyman", xpRequired: 300 },
  ],
};
const planJson = JSON.stringify(plan);

const planId = (
  await asUser(
    uA,
    `select persist_generated_plan('${goalId}', $json$${planJson}$json$::jsonb, 'mock', 'mock-model') as id`,
  )
)[0].id;
if (!planId) throw new Error("persist_generated_plan returned null");
console.log("persist_generated_plan returned a plan id: OK");

const scalar = async (sub, q) => (await asUser(sub, q))[0];

const stepCount = (await scalar(uA, `select count(*)::int n from plan_steps where plan_id='${planId}'`)).n;
const depCount = (await scalar(uA, `select count(*)::int n from step_dependencies where plan_id='${planId}'`)).n;
if (stepCount !== 3 || depCount !== 2) {
  throw new Error(`expected 3 steps / 2 deps, got ${stepCount}/${depCount}`);
}

// Root step (no prereqs) is available; a dependent step is locked.
const rootStatus = (await scalar(uA, `select status from plan_steps where plan_id='${planId}' and title='Learn SQL'`)).status;
const depStatus = (await scalar(uA, `select status from plan_steps where plan_id='${planId}' and title='Build API'`)).status;
if (rootStatus !== "available" || depStatus !== "locked") {
  throw new Error(`expected available/locked, got ${rootStatus}/${depStatus}`);
}
console.log("steps + deps remapped, root available / dependent locked: OK");

// Cross-entity stepKey references were remapped to real step uuids.
const certStep = (await scalar(uA, `select step_id from certifications where plan_id='${planId}'`)).step_id;
if (!certStep) throw new Error("certification stepKey was not remapped to a step_id");
const counts = await scalar(
  uA,
  `select
     (select count(*) from skills where plan_id='${planId}')::int skills,
     (select count(*) from skill_step_links l join skills s on s.id=l.skill_id where s.plan_id='${planId}')::int links,
     (select count(*) from courses where plan_id='${planId}')::int courses,
     (select count(*) from budget_items where plan_id='${planId}')::int budget,
     (select count(*) from connections where plan_id='${planId}')::int conns,
     (select count(*) from level_milestones where plan_id='${planId}')::int levels`,
);
if (counts.skills !== 1 || counts.links !== 1 || counts.courses !== 1 || counts.budget !== 1 || counts.conns !== 1 || counts.levels !== 2) {
  throw new Error(`child counts wrong: ${JSON.stringify(counts)}`);
}
console.log("skills/links/courses/budget/connections/levels persisted: OK");

// The persisted plan is the single active plan for the goal.
const activeCount = (await scalar(uA, `select count(*)::int n from plans where goal_id='${goalId}' and status='active'`)).n;
if (activeCount !== 1) throw new Error(`expected 1 active plan, got ${activeCount}`);

// RLS: user B cannot see A's persisted steps.
const bSteps = (await scalar(uB, `select count(*)::int n from plan_steps where plan_id='${planId}'`)).n;
if (bSteps !== 0) throw new Error(`RLS leak: B saw ${bSteps} of A's plan steps`);
console.log("persisted plan graph isolated from user B: OK");

// Regenerate: persisting again supersedes the old active plan (one active only).
const planId2 = (
  await asUser(
    uA,
    `select persist_generated_plan('${goalId}', $json$${planJson}$json$::jsonb, 'mock', 'mock-model') as id`,
  )
)[0].id;
const planStates = await scalar(
  uA,
  `select
     (select count(*) from plans where goal_id='${goalId}')::int total,
     (select count(*) from plans where goal_id='${goalId}' and status='active')::int active,
     (select status from plans where id='${planId}')::text old_status,
     (select superseded_by from plans where id='${planId}')::text old_superseded`,
);
if (planStates.total !== 2 || planStates.active !== 1 || planStates.old_status !== "archived" || planStates.old_superseded !== planId2) {
  throw new Error(`regenerate/supersede wrong: ${JSON.stringify(planStates)}`);
}
console.log("regenerate supersedes prior active plan (one active per goal): OK");

console.log("\nALL MIGRATION CHECKS PASSED");
await db.close();
