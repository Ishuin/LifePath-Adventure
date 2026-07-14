-- Persist a generated plan graph atomically.
--
-- The model authors steps with stable string `key`s and references them from
-- dependencies + every other entity's `stepKey`. This function inserts the plan
-- and all children in one transaction, remapping key -> uuid in-DB, so the whole
-- graph commits together or not at all.
--
-- SECURITY DEFINER so it can insert across the plan's child tables in one shot,
-- but it is strictly scoped to auth.uid(): it refuses if the goal isn't owned by
-- the caller and stamps user_id = auth.uid() on every row. Callers cannot write
-- another user's data through it.

create or replace function persist_generated_plan(
  p_goal_id  uuid,
  p_plan     jsonb,
  p_provider text,
  p_model    text
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user     uuid := auth.uid();
  v_plan_id  uuid;
  v_version  int;
  v_step     jsonb;
  v_step_id  uuid;
  v_map      jsonb := '{}'::jsonb;   -- key (text) -> step uuid (text)
  v_dep      text;
  v_rec      jsonb;
  v_skill_id uuid;
  v_key      text;
  v_step_key text;
begin
  if v_user is null then
    raise exception 'not authenticated';
  end if;

  if not exists (select 1 from goals where id = p_goal_id and user_id = v_user) then
    raise exception 'goal % not found or not owned by caller', p_goal_id;
  end if;

  select coalesce(max(version), 0) + 1 into v_version
    from plans where goal_id = p_goal_id;

  -- Insert as 'generating' first so we never have two 'active' plans at once
  -- (the partial unique index plans_one_active_per_goal forbids it). We flip to
  -- 'active' after archiving the previous active plan below.
  insert into plans (goal_id, user_id, version, status, rationale,
                     provider, model, raw_output, generated_at)
  values (p_goal_id, v_user, v_version, 'generating', p_plan->>'rationale',
          p_provider, p_model, p_plan, now())
  returning id into v_plan_id;

  update plans
     set status = 'archived', superseded_by = v_plan_id
   where goal_id = p_goal_id
     and id <> v_plan_id
     and status = 'active';

  -- Steps -------------------------------------------------------------------
  for v_step in select * from jsonb_array_elements(p_plan->'steps')
  loop
    insert into plan_steps (plan_id, user_id, order_index, title, description,
                            rationale, status, xp_reward, estimated_weeks)
    values (
      v_plan_id, v_user,
      (v_step->>'orderIndex')::int,
      v_step->>'title',
      nullif(v_step->>'description', ''),
      nullif(v_step->>'rationale', ''),
      'locked',
      coalesce((v_step->>'xpReward')::int, 100),
      nullif(v_step->>'estimatedWeeks', '')::int
    )
    returning id into v_step_id;
    v_map := v_map || jsonb_build_object(v_step->>'key', v_step_id::text);
  end loop;

  -- Dependencies (prerequisite -> dependent edges) --------------------------
  for v_step in select * from jsonb_array_elements(p_plan->'steps')
  loop
    for v_dep in
      select jsonb_array_elements_text(coalesce(v_step->'dependsOn', '[]'::jsonb))
    loop
      if (v_map ? v_dep) and (v_map ? (v_step->>'key')) then
        insert into step_dependencies (plan_id, user_id, from_step_id, to_step_id)
        values (v_plan_id, v_user,
                (v_map->>v_dep)::uuid,
                (v_map->>(v_step->>'key'))::uuid)
        on conflict do nothing;
      end if;
    end loop;
  end loop;

  -- Steps with no prerequisites start available; the rest stay locked.
  update plan_steps ps
     set status = 'available'
   where ps.plan_id = v_plan_id
     and not exists (
       select 1 from step_dependencies d where d.to_step_id = ps.id
     );

  -- Skills + skill<->step links ---------------------------------------------
  for v_rec in select * from jsonb_array_elements(coalesce(p_plan->'skills', '[]'::jsonb))
  loop
    insert into skills (plan_id, user_id, name, category,
                        current_level, target_level, priority)
    values (v_plan_id, v_user, v_rec->>'name',
            coalesce(v_rec->>'category', 'other')::skill_category,
            coalesce((v_rec->>'currentLevel')::int, 0),
            coalesce((v_rec->>'targetLevel')::int, 100),
            coalesce((v_rec->>'priority')::int, 0))
    returning id into v_skill_id;

    for v_key in
      select jsonb_array_elements_text(coalesce(v_rec->'stepKeys', '[]'::jsonb))
    loop
      if v_map ? v_key then
        insert into skill_step_links (user_id, skill_id, step_id)
        values (v_user, v_skill_id, (v_map->>v_key)::uuid)
        on conflict do nothing;
      end if;
    end loop;
  end loop;

  -- Certifications ----------------------------------------------------------
  for v_rec in select * from jsonb_array_elements(coalesce(p_plan->'certifications', '[]'::jsonb))
  loop
    v_step_key := v_rec->>'stepKey';
    insert into certifications (plan_id, step_id, user_id, name, provider, url,
                               est_cost_cents, priority)
    values (v_plan_id,
            case when v_step_key is not null and v_map ? v_step_key
                 then (v_map->>v_step_key)::uuid else null end,
            v_user, v_rec->>'name', v_rec->>'provider', v_rec->>'url',
            coalesce((v_rec->>'estCostCents')::int, 0),
            coalesce((v_rec->>'priority')::int, 0));
  end loop;

  -- Courses -----------------------------------------------------------------
  for v_rec in select * from jsonb_array_elements(coalesce(p_plan->'courses', '[]'::jsonb))
  loop
    v_step_key := v_rec->>'stepKey';
    insert into courses (plan_id, step_id, user_id, title, provider, url,
                        est_cost_cents, est_hours, priority)
    values (v_plan_id,
            case when v_step_key is not null and v_map ? v_step_key
                 then (v_map->>v_step_key)::uuid else null end,
            v_user, v_rec->>'title', v_rec->>'provider', v_rec->>'url',
            coalesce((v_rec->>'estCostCents')::int, 0),
            nullif(v_rec->>'estHours', '')::int,
            coalesce((v_rec->>'priority')::int, 0));
  end loop;

  -- Budget items ------------------------------------------------------------
  for v_rec in select * from jsonb_array_elements(coalesce(p_plan->'budget', '[]'::jsonb))
  loop
    v_step_key := v_rec->>'stepKey';
    insert into budget_items (plan_id, step_id, user_id, label, category,
                             amount_cents, currency, notes)
    values (v_plan_id,
            case when v_step_key is not null and v_map ? v_step_key
                 then (v_map->>v_step_key)::uuid else null end,
            v_user, v_rec->>'label',
            coalesce(v_rec->>'category', 'other')::budget_category,
            coalesce((v_rec->>'amountCents')::int, 0),
            coalesce(v_rec->>'currency', 'USD'),
            v_rec->>'notes');
  end loop;

  -- Connections -------------------------------------------------------------
  for v_rec in select * from jsonb_array_elements(coalesce(p_plan->'connections', '[]'::jsonb))
  loop
    v_step_key := v_rec->>'stepKey';
    insert into connections (plan_id, step_id, user_id, name, kind, why, how, priority)
    values (v_plan_id,
            case when v_step_key is not null and v_map ? v_step_key
                 then (v_map->>v_step_key)::uuid else null end,
            v_user, v_rec->>'name',
            coalesce(v_rec->>'kind', 'person')::connection_kind,
            v_rec->>'why', v_rec->>'how',
            coalesce((v_rec->>'priority')::int, 0));
  end loop;

  -- Level milestones --------------------------------------------------------
  for v_rec in select * from jsonb_array_elements(coalesce(p_plan->'levels', '[]'::jsonb))
  loop
    insert into level_milestones (plan_id, user_id, level, title, xp_required, unlocks)
    values (v_plan_id, v_user, (v_rec->>'level')::int, v_rec->>'title',
            coalesce((v_rec->>'xpRequired')::int, 0), v_rec->>'unlocks');
  end loop;

  -- Finally, promote the new plan to active (old active is now archived).
  update plans set status = 'active' where id = v_plan_id;

  return v_plan_id;
end;
$$;

revoke all on function persist_generated_plan(uuid, jsonb, text, text) from public;
grant execute on function persist_generated_plan(uuid, jsonb, text, text) to authenticated;
