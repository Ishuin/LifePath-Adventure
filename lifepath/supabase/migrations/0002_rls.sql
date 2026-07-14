-- Row Level Security: every table is owner-scoped. RLS on a table with no
-- policy denies all access, so we must enable + policy every user-owned table.

-- profiles: keyed on id = auth.uid()
alter table profiles enable row level security;
create policy profiles_select on profiles for select using (auth.uid() = id);
create policy profiles_insert on profiles for insert with check (auth.uid() = id);
create policy profiles_update on profiles for update using (auth.uid() = id) with check (auth.uid() = id);
create policy profiles_delete on profiles for delete using (auth.uid() = id);

-- All other user-owned tables: flat `auth.uid() = user_id` (no joins).
do $$
declare
  t text;
begin
  foreach t in array array[
    'goals', 'life_states', 'plans', 'plan_steps', 'step_dependencies',
    'skills', 'skill_step_links', 'certifications', 'courses', 'budget_items',
    'connections', 'level_milestones', 'xp_events'
  ]
  loop
    execute format('alter table %I enable row level security;', t);
    execute format(
      'create policy %I on %I for select using (auth.uid() = user_id);',
      t || '_select', t);
    execute format(
      'create policy %I on %I for insert with check (auth.uid() = user_id);',
      t || '_insert', t);
    execute format(
      'create policy %I on %I for update using (auth.uid() = user_id) with check (auth.uid() = user_id);',
      t || '_update', t);
    execute format(
      'create policy %I on %I for delete using (auth.uid() = user_id);',
      t || '_delete', t);
  end loop;
end $$;
