-- PEMUDA DUSUN 3 SIDODADI
-- Supabase Phase 01B: audit corrections against the actual PRE_SUPABASE source.
-- Apply AFTER 202608240001_initial_schema_auth_rls.sql.
--
-- Goals:
-- 1) Match the current product role split: Superadmin = website/CMS oversight, Admin = operations, Humas = scoped field work.
-- 2) Ensure deactivated/non-Humas accounts cannot retain assignment-based access.
-- 3) Match current LPJ lifecycle: Admin approves/reopens LPJ; approved LPJ completes + locks the activity.
-- 4) Close data-integrity gaps found in cash reconciliation, RAB deletion, assignment scope, and media cover.
-- 5) Prevent accidental active Humas accounts from ordinary public sign-up.
-- 6) Preserve auditability for structural writes without changing existing UI.

begin;

-- ============================================================
-- AUTH PROVISIONING HARDENING
-- Public/self sign-up does not become an active Humas account.
-- Server/Admin provisioning supplies a valid app_metadata role and becomes active.
-- Username collisions fall back to a stable suffix instead of aborting auth creation.
-- ============================================================

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_role public.app_user_role := 'humas';
  v_username text;
  v_full_name text;
  v_is_provisioned boolean := false;
begin
  if coalesce(new.raw_app_meta_data->>'role', '') in ('superadmin', 'admin', 'humas') then
    v_role := (new.raw_app_meta_data->>'role')::public.app_user_role;
    v_is_provisioned := true;
  end if;

  v_username := lower(trim(coalesce(
    nullif(new.raw_app_meta_data->>'username', ''),
    nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
    'user-' || left(new.id::text, 8)
  )));

  if exists (select 1 from public.profiles p where lower(p.username) = v_username) then
    v_username := v_username || '-' || left(new.id::text, 8);
  end if;

  v_full_name := trim(coalesce(
    nullif(new.raw_app_meta_data->>'full_name', ''),
    nullif(new.raw_user_meta_data->>'full_name', ''),
    v_username
  ));

  insert into public.profiles (id, username, full_name, role, phone, is_active)
  values (new.id, v_username, v_full_name, v_role, nullif(new.phone, ''), v_is_provisioned)
  on conflict (id) do nothing;

  return new;
end;
$$;

revoke all on function public.handle_new_auth_user() from public, anon, authenticated;

-- ============================================================
-- ROLE / SESSION HELPERS
-- Current source explicitly separates Website Management (Superadmin)
-- from Operasional Organisasi (Admin).
-- ============================================================

create or replace function public.is_admin_operator()
returns boolean
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  select coalesce(public.current_profile_role() = 'admin', false);
$$;

create or replace function public.is_active_humas()
returns boolean
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  select coalesce(public.current_profile_role() = 'humas', false);
$$;

create or replace function public.is_assigned_humas(p_activity_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  select public.is_active_humas() and exists (
    select 1
    from public.humas_assignments ha
    where ha.activity_id = p_activity_id
      and ha.humas_user_id = auth.uid()
      and ha.is_active = true
  );
$$;

create or replace function public.humas_has_permission(p_activity_id uuid, p_permission public.assignment_permission)
returns boolean
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  select public.is_active_humas() and exists (
    select 1
    from public.humas_assignments ha
    join public.humas_assignment_permissions hp on hp.assignment_id = ha.id
    where ha.activity_id = p_activity_id
      and ha.humas_user_id = auth.uid()
      and ha.is_active = true
      and hp.permission = p_permission
  );
$$;

revoke all on function public.is_admin_operator() from public;
revoke all on function public.is_active_humas() from public;
grant execute on function public.is_admin_operator() to authenticated;
grant execute on function public.is_active_humas() to authenticated;

-- ============================================================
-- CASE-INSENSITIVE ASSIGNMENT UNIQUENESS
-- Prototype duplicate guard treats area/task labels case-insensitively.
-- ============================================================

alter table public.humas_assignments
  drop constraint if exists humas_assignments_activity_id_humas_user_id_area_label_key;

create unique index if not exists humas_assignments_scope_ci_uidx
  on public.humas_assignments(activity_id, humas_user_id, lower(area_label));

-- ============================================================
-- STRONGER TRANSACTION / RECONCILIATION / MEDIA INVARIANTS
-- ============================================================

alter table public.financial_transactions
  drop constraint if exists financial_transactions_received_by_humas_kind_chk,
  drop constraint if exists financial_transactions_income_pending_chk,
  drop constraint if exists financial_transactions_verified_actor_chk,
  drop constraint if exists financial_transactions_verified_handover_recipient_chk;

alter table public.financial_transactions
  add constraint financial_transactions_received_by_humas_kind_chk
    check (status <> 'received_by_humas' or kind = 'income'),
  add constraint financial_transactions_income_pending_chk
    check (kind <> 'income' or status <> 'pending_verification'),
  add constraint financial_transactions_verified_actor_chk
    check (status <> 'verified' or (verified_by_user_id is not null and verified_at is not null)),
  add constraint financial_transactions_verified_handover_recipient_chk
    check (not (kind = 'handover' and status = 'verified') or handover_recipient_user_id is not null);

alter table public.cash_reconciliations
  drop constraint if exists cash_reconciliations_expected_nonnegative_chk,
  drop constraint if exists cash_reconciliations_physical_nonnegative_chk,
  drop constraint if exists cash_reconciliations_difference_chk;

alter table public.cash_reconciliations
  add constraint cash_reconciliations_expected_nonnegative_chk check (expected_amount >= 0),
  add constraint cash_reconciliations_physical_nonnegative_chk check (physical_amount >= 0),
  add constraint cash_reconciliations_difference_chk check (difference = physical_amount - expected_amount);

alter table public.activity_media
  drop constraint if exists activity_media_cover_photo_only_chk;
alter table public.activity_media
  add constraint activity_media_cover_photo_only_chk check (not is_cover or type = 'photo');

-- Cash reconciliation must point to the same activity + Humas assignment.
create or replace function public.enforce_cash_reconciliation_integrity()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if not exists (
    select 1
    from public.humas_assignments ha
    where ha.id = new.assignment_id
      and ha.activity_id = new.activity_id
      and ha.humas_user_id = new.humas_user_id
      and ha.is_active = true
  ) then
    raise exception 'CASH_RECONCILIATION_ASSIGNMENT_MISMATCH';
  end if;
  return new;
end;
$$;

revoke all on function public.enforce_cash_reconciliation_integrity() from public;
drop trigger if exists cash_reconciliation_integrity_guard on public.cash_reconciliations;
create trigger cash_reconciliation_integrity_guard
before insert or update on public.cash_reconciliations
for each row execute function public.enforce_cash_reconciliation_integrity();

-- Assignment permissions are structural data and cannot change after financial lock.
create or replace function public.block_locked_assignment_permission_mutation()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_assignment_id uuid;
  v_activity_id uuid;
begin
  v_assignment_id := case when tg_op = 'DELETE' then old.assignment_id else new.assignment_id end;
  select ha.activity_id into v_activity_id from public.humas_assignments ha where ha.id = v_assignment_id;
  if exists (select 1 from public.activities a where a.id = v_activity_id and a.financial_locked = true) then
    raise exception 'ACTIVITY_LOCKED_MUTATION_BLOCKED';
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

revoke all on function public.block_locked_assignment_permission_mutation() from public;
drop trigger if exists assignment_permissions_locked_guard on public.humas_assignment_permissions;
create trigger assignment_permissions_locked_guard
before insert or update or delete on public.humas_assignment_permissions
for each row execute function public.block_locked_assignment_permission_mutation();

-- RAB category with transaction history cannot be deleted, matching prototype behavior.
create or replace function public.block_budget_delete_with_history()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if exists (
    select 1
    from public.financial_transactions ft
    where ft.activity_id = old.activity_id
      and ft.kind = 'expense'
      and lower(ft.category) = lower(old.category)
      and ft.status not in ('rejected', 'cancelled')
  ) then
    raise exception 'BUDGET_ITEM_HAS_TRANSACTION_HISTORY';
  end if;
  return old;
end;
$$;

revoke all on function public.block_budget_delete_with_history() from public;
drop trigger if exists budget_items_history_delete_guard on public.budget_items;
create trigger budget_items_history_delete_guard
before delete on public.budget_items
for each row execute function public.block_budget_delete_with_history();

-- ============================================================
-- LPJ + ACTIVITY LOCK LIFECYCLE
-- Current source: Admin operates reports, approval completes + locks activity,
-- and Admin can reopen for correction with an audited reason via safe RPC later.
-- ============================================================

create or replace function public.guard_activity_financial_lock()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'INSERT' then
    if new.financial_locked then
      raise exception 'NEW_ACTIVITY_MUST_START_UNLOCKED';
    end if;
    return new;
  end if;

  if new.financial_locked is distinct from old.financial_locked
     or new.locked_at is distinct from old.locked_at
     or new.locked_by_user_id is distinct from old.locked_by_user_id then
    if not public.is_admin_operator() then
      raise exception 'ACTIVITY_LOCK_ADMIN_ONLY';
    end if;

    if new.financial_locked then
      new.locked_at := coalesce(new.locked_at, now());
      new.locked_by_user_id := auth.uid();
    else
      new.locked_at := null;
      new.locked_by_user_id := null;
    end if;
  end if;
  return new;
end;
$$;

revoke all on function public.guard_activity_financial_lock() from public;
drop trigger if exists activities_financial_lock_guard on public.activities;
create trigger activities_financial_lock_guard
before insert or update on public.activities
for each row execute function public.guard_activity_financial_lock();

create or replace function public.guard_activity_completed_phase()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'UPDATE' and new.phase = 'completed' and old.phase is distinct from 'completed' then
    if not exists (
      select 1 from public.activity_reports ar
      where ar.activity_id = new.id
        and lower(ar.report_type) like '%lpj%'
        and ar.status = 'approved'
    ) then
      raise exception 'ACTIVITY_COMPLETED_REQUIRES_APPROVED_LPJ';
    end if;
  end if;
  return new;
end;
$$;

revoke all on function public.guard_activity_completed_phase() from public;
drop trigger if exists activities_completed_phase_guard on public.activities;
create trigger activities_completed_phase_guard
before update of phase on public.activities
for each row execute function public.guard_activity_completed_phase();

create or replace function public.guard_report_approval()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if new.status = 'approved' and (tg_op = 'INSERT' or old.status is distinct from 'approved') then
    if not public.is_admin_operator() then
      raise exception 'LPJ_APPROVAL_ADMIN_ONLY';
    end if;
    new.approved_by_user_id := auth.uid();
    new.approved_at := now();
  elsif tg_op = 'UPDATE' and old.status = 'approved' and new.status is distinct from 'approved' then
    if not public.is_admin_operator() then
      raise exception 'LPJ_REOPEN_ADMIN_ONLY';
    end if;
    new.approved_by_user_id := null;
    new.approved_at := null;
  end if;
  return new;
end;
$$;

revoke all on function public.guard_report_approval() from public;

create or replace function public.sync_activity_lock_from_lpj()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if lower(new.report_type) like '%lpj%' and new.status = 'approved'
     and (tg_op = 'INSERT' or old.status is distinct from 'approved') then
    update public.activities
       set phase = 'completed',
           financial_locked = true,
           locked_at = now(),
           locked_by_user_id = auth.uid()
     where id = new.activity_id;
  elsif tg_op = 'UPDATE'
        and lower(new.report_type) like '%lpj%'
        and old.status = 'approved'
        and new.status is distinct from 'approved' then
    update public.activities
       set phase = 'lpj',
           financial_locked = false,
           locked_at = null,
           locked_by_user_id = null
     where id = new.activity_id;
  end if;
  return new;
end;
$$;

revoke all on function public.sync_activity_lock_from_lpj() from public;
drop trigger if exists activity_reports_lock_sync on public.activity_reports;
create trigger activity_reports_lock_sync
after insert or update of status on public.activity_reports
for each row execute function public.sync_activity_lock_from_lpj();

-- Report status/approval is intentionally NOT a direct browser update.
-- Phase 02 will expose an Admin-only safe RPC so reopen can require a reason and audit atomically.
revoke insert, update on public.activity_reports from authenticated;

-- Activity lock metadata is not directly updateable from PostgREST.
-- Admin may edit normal activity fields; lock/unlock is reserved for RPC lifecycle.
revoke update, delete on public.activities from authenticated;
grant update (period_id, slug, name, category, phase, event_date, location, summary, public_visible)
  on public.activities to authenticated;
drop policy if exists activities_superadmin_delete on public.activities;

-- RAB category itself is stable once created; Admin can change only planned amount directly.
revoke update on public.budget_items from authenticated;
grant update (planned_amount) on public.budget_items to authenticated;

-- ============================================================
-- RLS POLICY CORRECTIONS
-- Reads may remain visible to Superadmin for oversight.
-- Operational writes are Admin-only, matching the actual App routes and notes.
-- ============================================================

-- Activities
drop policy if exists activities_management_insert on public.activities;
drop policy if exists activities_management_update on public.activities;
create policy activities_admin_insert on public.activities
for insert to authenticated with check (public.is_admin_operator());
create policy activities_admin_update on public.activities
for update to authenticated using (public.is_admin_operator()) with check (public.is_admin_operator());

-- Committee
drop policy if exists committee_management_insert on public.activity_committee_members;
drop policy if exists committee_management_update on public.activity_committee_members;
drop policy if exists committee_management_delete on public.activity_committee_members;
create policy committee_admin_insert on public.activity_committee_members
for insert to authenticated with check (public.is_admin_operator());
create policy committee_admin_update on public.activity_committee_members
for update to authenticated using (public.is_admin_operator()) with check (public.is_admin_operator());
create policy committee_admin_delete on public.activity_committee_members
for delete to authenticated using (public.is_admin_operator());

-- Humas assignments
drop policy if exists humas_assignments_management_insert on public.humas_assignments;
drop policy if exists humas_assignments_management_update on public.humas_assignments;
drop policy if exists humas_assignments_management_delete on public.humas_assignments;
drop policy if exists humas_assignments_read on public.humas_assignments;
create policy humas_assignments_read on public.humas_assignments
for select to authenticated using (
  public.is_admin_or_superadmin()
  or (public.is_active_humas() and humas_user_id = auth.uid())
);
create policy humas_assignments_admin_insert on public.humas_assignments
for insert to authenticated with check (public.is_admin_operator());
create policy humas_assignments_admin_update on public.humas_assignments
for update to authenticated using (public.is_admin_operator()) with check (public.is_admin_operator());
create policy humas_assignments_admin_delete on public.humas_assignments
for delete to authenticated using (public.is_admin_operator());

-- Assignment permissions
drop policy if exists assignment_permissions_management_insert on public.humas_assignment_permissions;
drop policy if exists assignment_permissions_management_delete on public.humas_assignment_permissions;
drop policy if exists assignment_permissions_read on public.humas_assignment_permissions;
create policy assignment_permissions_read on public.humas_assignment_permissions
for select to authenticated using (
  public.is_admin_or_superadmin()
  or (
    public.is_active_humas()
    and exists (
      select 1 from public.humas_assignments ha
      where ha.id = assignment_id
        and ha.humas_user_id = auth.uid()
        and ha.is_active = true
    )
  )
);
create policy assignment_permissions_admin_insert on public.humas_assignment_permissions
for insert to authenticated with check (public.is_admin_operator());
create policy assignment_permissions_admin_delete on public.humas_assignment_permissions
for delete to authenticated using (public.is_admin_operator());

-- Community members
drop policy if exists community_members_management_insert on public.community_members;
drop policy if exists community_members_management_update on public.community_members;
drop policy if exists community_members_management_delete on public.community_members;
drop policy if exists community_members_scoped_read on public.community_members;
create policy community_members_scoped_read on public.community_members
for select to authenticated using (
  public.is_admin_or_superadmin()
  or (
    public.is_active_humas()
    and exists (
      select 1
      from public.activity_collection_targets ct
      join public.humas_assignments ha on ha.id = ct.assignment_id
      where ct.member_id = community_members.id
        and ha.humas_user_id = auth.uid()
        and ha.is_active = true
    )
  )
);
create policy community_members_admin_insert on public.community_members
for insert to authenticated with check (public.is_admin_operator());
create policy community_members_admin_update on public.community_members
for update to authenticated using (public.is_admin_operator()) with check (public.is_admin_operator());
create policy community_members_admin_delete on public.community_members
for delete to authenticated using (public.is_admin_operator());

-- Collection targets
drop policy if exists collection_targets_management_insert on public.activity_collection_targets;
drop policy if exists collection_targets_management_update on public.activity_collection_targets;
drop policy if exists collection_targets_management_delete on public.activity_collection_targets;
drop policy if exists collection_targets_scoped_read on public.activity_collection_targets;
create policy collection_targets_scoped_read on public.activity_collection_targets
for select to authenticated using (
  public.is_admin_or_superadmin()
  or (
    public.is_active_humas()
    and exists (
      select 1 from public.humas_assignments ha
      where ha.id = assignment_id
        and ha.humas_user_id = auth.uid()
        and ha.is_active = true
    )
  )
);
create policy collection_targets_admin_insert on public.activity_collection_targets
for insert to authenticated with check (public.is_admin_operator());
create policy collection_targets_admin_update on public.activity_collection_targets
for update to authenticated using (public.is_admin_operator()) with check (public.is_admin_operator());
create policy collection_targets_admin_delete on public.activity_collection_targets
for delete to authenticated using (public.is_admin_operator());

-- RAB
drop policy if exists budget_items_management_insert on public.budget_items;
drop policy if exists budget_items_management_update on public.budget_items;
drop policy if exists budget_items_management_delete on public.budget_items;
create policy budget_items_admin_insert on public.budget_items
for insert to authenticated with check (public.is_admin_operator());
create policy budget_items_admin_update on public.budget_items
for update to authenticated using (public.is_admin_operator()) with check (public.is_admin_operator());
create policy budget_items_admin_delete on public.budget_items
for delete to authenticated using (public.is_admin_operator());

-- Reports are read-only to browser in Phase 01B; Admin lifecycle writes come via RPC in Phase 02.
drop policy if exists reports_management_insert on public.activity_reports;
drop policy if exists reports_management_update on public.activity_reports;

-- Media
drop policy if exists media_management_insert on public.activity_media;
drop policy if exists media_management_update on public.activity_media;
drop policy if exists media_management_delete on public.activity_media;
create policy media_admin_insert on public.activity_media
for insert to authenticated with check (public.is_admin_operator());
create policy media_admin_update on public.activity_media
for update to authenticated using (public.is_admin_operator()) with check (public.is_admin_operator());
create policy media_admin_delete on public.activity_media
for delete to authenticated using (public.is_admin_operator());

-- ============================================================
-- HUMAS READ ACCESS MUST DIE WHEN ACCOUNT IS DEACTIVATED
-- ============================================================

drop policy if exists transactions_scoped_read on public.financial_transactions;
create policy transactions_scoped_read on public.financial_transactions
for select to authenticated using (
  public.is_admin_or_superadmin()
  or (
    public.is_active_humas()
    and (
      (created_by_user_id = auth.uid() and public.is_assigned_humas(activity_id))
      or (
        assignment_id is not null
        and exists (
          select 1 from public.humas_assignments ha
          where ha.id = assignment_id
            and ha.humas_user_id = auth.uid()
            and ha.is_active = true
        )
      )
    )
  )
);

drop policy if exists evidence_scoped_read on public.transaction_evidence;
create policy evidence_scoped_read on public.transaction_evidence
for select to authenticated using (
  exists (
    select 1
    from public.financial_transactions ft
    where ft.id = transaction_id
      and (
        public.is_admin_or_superadmin()
        or (
          public.is_active_humas()
          and (
            (ft.created_by_user_id = auth.uid() and public.is_assigned_humas(ft.activity_id))
            or (
              ft.assignment_id is not null
              and exists (
                select 1 from public.humas_assignments ha
                where ha.id = ft.assignment_id
                  and ha.humas_user_id = auth.uid()
                  and ha.is_active = true
              )
            )
          )
        )
      )
  )
);

drop policy if exists cash_reconciliations_scoped_read on public.cash_reconciliations;
create policy cash_reconciliations_scoped_read on public.cash_reconciliations
for select to authenticated using (
  public.is_admin_or_superadmin()
  or (public.is_active_humas() and humas_user_id = auth.uid())
);

-- ============================================================
-- APPEND-ORIENTED STRUCTURAL AUDIT
-- Financial RPCs will add richer semantic audit entries in Phase 02.
-- This trigger guarantees direct structural writes are still traceable.
-- ============================================================

create or replace function public.audit_structural_change()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_before jsonb;
  v_after jsonb;
  v_row jsonb;
  v_id_text text;
  v_entity_id uuid;
begin
  v_before := case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) else null end;
  v_after := case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) else null end;
  v_row := coalesce(v_after, v_before, '{}'::jsonb);
  v_id_text := coalesce(v_row->>'id', v_row->>'assignment_id');

  begin
    v_entity_id := nullif(v_id_text, '')::uuid;
  exception when invalid_text_representation then
    v_entity_id := null;
  end;

  insert into public.audit_logs (
    actor_user_id, action, entity_type, entity_id, detail, before_data, after_data
  ) values (
    auth.uid(),
    lower(tg_op),
    tg_table_name,
    v_entity_id,
    tg_op || ' ' || tg_table_name,
    v_before,
    v_after
  );

  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

revoke all on function public.audit_structural_change() from public, anon, authenticated;

-- Idempotent recreation of structural audit triggers.
do $$
declare
  t text;
begin
  foreach t in array array[
    'organization_periods',
    'profiles',
    'activities',
    'activity_committee_members',
    'humas_assignments',
    'humas_assignment_permissions',
    'community_members',
    'activity_collection_targets',
    'budget_items',
    'activity_reports',
    'activity_media'
  ] loop
    execute format('drop trigger if exists %I on public.%I', t || '_audit_guard', t);
    execute format(
      'create trigger %I after insert or update or delete on public.%I for each row execute function public.audit_structural_change()',
      t || '_audit_guard', t
    );
  end loop;
end;
$$;

commit;
