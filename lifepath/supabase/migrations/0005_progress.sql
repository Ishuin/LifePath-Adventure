-- Progress tracking (M4): step transitions, the XP ledger, dependent-step
-- unlocking, and profile level recompute — all owner-scoped to auth.uid().
--
-- XP integrity relies on the append-only xp_events ledger: total_xp is always
-- sum(delta), so toggling a step done/undone any number of times converges to
-- the correct total (see recompute_profile_xp). The profile level is derived
-- from that total via a triangular XP curve mirrored in src/lib/domain/xp.ts:
-- reaching level L costs 100*(L-1)*L cumulative XP, so
--   level = floor((1 + sqrt(1 + total_xp / 25)) / 2), clamped to >= 1.

-- Recompute a user's total_xp and level from the ledger. Internal helper: not
-- granted to `authenticated`, only reachable from the security-definer RPC
-- below (which runs as the function owner).
create or replace function recompute_profile_xp(p_user uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total int;
  v_level int;
begin
  select coalesce(sum(delta), 0) into v_total from xp_events where user_id = p_user;
  if v_total < 0 then v_total := 0; end if;
  v_level := floor((1 + sqrt(1 + v_total / 25.0)) / 2)::int;
  if v_level < 1 then v_level := 1; end if;
  update profiles set total_xp = v_total, level = v_level where id = p_user;
end;
$$;

revoke all on function recompute_profile_xp(uuid) from public;

-- Transition a step to a new status, keeping the XP ledger, dependent-step
-- availability, and the caller's profile level in sync. Returns the resulting
-- profile totals so the UI can react (e.g. level-up).
--
-- SECURITY DEFINER but strictly scoped to auth.uid(): it refuses steps the
-- caller doesn't own and only ever touches that user's rows.
create or replace function set_step_status(p_step_id uuid, p_status step_status)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user     uuid := auth.uid();
  v_plan     uuid;
  v_goal     uuid;
  v_cur      step_status;
  v_xp       int;
  v_was_done boolean;
  v_now_done boolean;
begin
  if v_user is null then
    raise exception 'not authenticated';
  end if;

  select ps.plan_id, p.goal_id, ps.status, ps.xp_reward
    into v_plan, v_goal, v_cur, v_xp
    from plan_steps ps
    join plans p on p.id = ps.plan_id
   where ps.id = p_step_id and ps.user_id = v_user;
  if v_plan is null then
    raise exception 'step % not found or not owned by caller', p_step_id;
  end if;

  if v_cur = p_status then
    return jsonb_build_object(
      'changed', false,
      'stepId', p_step_id,
      'status', p_status,
      'totalXp', (select total_xp from profiles where id = v_user),
      'level', (select level from profiles where id = v_user)
    );
  end if;

  v_was_done := (v_cur = 'done');
  v_now_done := (p_status = 'done');

  update plan_steps
     set status = p_status,
         completed_at = case when v_now_done then now() else null end
   where id = p_step_id;

  -- Ledger: award on entering done, reverse on leaving it. The running sum
  -- stays correct however many times the step is toggled.
  if v_now_done and not v_was_done then
    insert into xp_events (user_id, goal_id, step_id, delta, reason)
    values (v_user, v_goal, p_step_id, v_xp, 'step_done');
  elsif v_was_done and not v_now_done then
    insert into xp_events (user_id, goal_id, step_id, delta, reason)
    values (v_user, v_goal, p_step_id, -v_xp, 'step_undone');
  end if;

  -- Recompute availability for not-yet-started steps in this plan: a step is
  -- available once every prerequisite is done, otherwise it stays locked. Steps
  -- already in_progress/done/skipped are never downgraded here.
  update plan_steps ps
     set status = case
       when not exists (
         select 1
           from step_dependencies d
           join plan_steps pre on pre.id = d.from_step_id
          where d.to_step_id = ps.id and pre.status <> 'done'
       ) then 'available'::step_status
       else 'locked'::step_status
     end
   where ps.plan_id = v_plan
     and ps.status in ('locked', 'available');

  perform recompute_profile_xp(v_user);

  return jsonb_build_object(
    'changed', true,
    'stepId', p_step_id,
    'status', p_status,
    'totalXp', (select total_xp from profiles where id = v_user),
    'level', (select level from profiles where id = v_user)
  );
end;
$$;

revoke all on function set_step_status(uuid, step_status) from public;
grant execute on function set_step_status(uuid, step_status) to authenticated;
