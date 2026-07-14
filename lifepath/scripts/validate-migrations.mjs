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
`);

// --- Apply migrations in order. ----------------------------------------------
for (const f of ["0001_init.sql", "0002_rls.sql", "0003_triggers.sql"]) {
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

// --- Set up a non-superuser role so RLS is actually enforced. ----------------
await db.exec(`
  do $$ begin
    if not exists (select 1 from pg_roles where rolname='authenticated')
    then create role authenticated nobypassrls; end if;
  end $$;
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
}
console.log(`RLS: B inserting A's row blocked — ${blocked ? "OK" : "FAIL"}`);
if (!blocked) throw new Error("RLS WITH CHECK did not block cross-user insert");

console.log("\nALL MIGRATION CHECKS PASSED");
await db.close();
