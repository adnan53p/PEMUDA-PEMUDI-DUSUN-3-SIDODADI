-- PEMUDA DUSUN 3 SIDODADI
-- Phase 03: operational + finance persistence, safe RPC writes, public sanitized snapshot.
-- Apply AFTER 202608240001 + 202608240002.

begin;

-- Evidence metadata can be persisted before binary/file storage is enabled.
alter table public.transaction_evidence alter column url drop not null;
alter table public.transaction_evidence drop constraint if exists transaction_evidence_provider_check;
alter table public.transaction_evidence add constraint transaction_evidence_provider_check
  check (provider in ('cloudflare_r2', 'external_url', 'metadata_only'));
alter table public.transaction_evidence drop constraint if exists transaction_evidence_url_required_chk;
alter table public.transaction_evidence add constraint transaction_evidence_url_required_chk
  check (provider = 'metadata_only' or nullif(trim(url), '') is not null);

-- Preserve the actor role at transaction creation time. Historical ledgers must not
-- change meaning if an account is later deactivated or its role is administratively changed.
alter table public.financial_transactions add column if not exists created_by_role public.app_user_role;
update public.financial_transactions ft
set created_by_role = p.role
from public.profiles p
where p.id = ft.created_by_user_id and ft.created_by_role is null;
alter table public.financial_transactions alter column created_by_role set not null;

-- ============================================================
-- PRIVATE BALANCE HELPERS
-- ============================================================
create or replace function public.phase03_humas_cash_available(
  p_assignment_id uuid,
  p_exclude_transaction_id uuid default null,
  p_include_pending_handover boolean default true
)
returns bigint
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  with sums as (
    select
      coalesce(sum(ft.amount) filter (
        where ft.kind = 'income'
          and ft.status in ('received_by_humas', 'verified')
          and (p_exclude_transaction_id is null or ft.id <> p_exclude_transaction_id)
      ), 0)::bigint as collected,
      coalesce(sum(ft.amount) filter (
        where ft.kind = 'handover'
          and (
            (p_include_pending_handover and ft.status not in ('rejected', 'cancelled'))
            or ((not p_include_pending_handover) and ft.status = 'verified')
          )
          and (p_exclude_transaction_id is null or ft.id <> p_exclude_transaction_id)
      ), 0)::bigint as handed,
      coalesce(sum(ft.amount) filter (
        where ft.kind = 'expense'
          and ft.status = 'verified'
          and ft.funding_source = 'humas_cash'
          and (p_exclude_transaction_id is null or ft.id <> p_exclude_transaction_id)
      ), 0)::bigint as spent
    from public.financial_transactions ft
    where ft.assignment_id = p_assignment_id
  )
  select greatest(0, collected - handed - spent) from sums;
$$;

create or replace function public.phase03_activity_cash_available(
  p_activity_id uuid,
  p_exclude_transaction_id uuid default null
)
returns bigint
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  with sums as (
    select
      coalesce(sum(ft.amount) filter (
        where ft.kind = 'income'
          and ft.status = 'verified'
          and ft.created_by_role = 'admin'
          and (p_exclude_transaction_id is null or ft.id <> p_exclude_transaction_id)
      ), 0)::bigint as direct_income,
      coalesce(sum(ft.amount) filter (
        where ft.kind = 'handover'
          and ft.status = 'verified'
          and (p_exclude_transaction_id is null or ft.id <> p_exclude_transaction_id)
      ), 0)::bigint as handed,
      coalesce(sum(ft.amount) filter (
        where ft.kind = 'expense'
          and ft.status = 'verified'
          and ft.funding_source not in ('humas_cash', 'personal_reimburse')
          and (p_exclude_transaction_id is null or ft.id <> p_exclude_transaction_id)
      ), 0)::bigint as spent
    from public.financial_transactions ft
    where ft.activity_id = p_activity_id
  )
  select greatest(0, direct_income + handed - spent) from sums;
$$;

revoke all on function public.phase03_humas_cash_available(uuid, uuid, boolean) from public, anon, authenticated;
revoke all on function public.phase03_activity_cash_available(uuid, uuid) from public, anon, authenticated;

-- ============================================================
-- ADMIN STRUCTURAL RPCs
-- ============================================================
create or replace function public.rpc_create_activity(
  p_name text,
  p_slug text,
  p_event_date date,
  p_location text,
  p_category text,
  p_summary text,
  p_public_visible boolean default false,
  p_initial_budget bigint default 0
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_id uuid;
  v_period_id uuid;
  v_period_label text;
begin
  if not public.is_admin_operator() then raise exception 'PERMISSION_DENIED'; end if;
  if nullif(trim(p_name), '') is null or p_event_date is null or nullif(trim(p_location), '') is null then
    raise exception 'INVALID_ACTIVITY_INPUT';
  end if;
  if coalesce(p_initial_budget, 0) < 0 then raise exception 'INVALID_BUDGET_AMOUNT'; end if;

  select id into v_period_id from public.organization_periods where is_active = true limit 1;
  v_period_label := to_char(p_event_date, 'MM/YYYY');

  insert into public.activities(period_id, slug, name, category, phase, event_date, location, summary, public_visible)
  values (v_period_id, trim(p_slug), trim(p_name), coalesce(nullif(trim(p_category), ''), 'Kegiatan'), 'planning', p_event_date, trim(p_location), coalesce(trim(p_summary), ''), coalesce(p_public_visible, false))
  returning id into v_id;

  insert into public.activity_reports(activity_id, title, report_type, period_label, status)
  values
    (v_id, 'LPJ ' || trim(p_name), 'LPJ Kegiatan', v_period_label, 'draft'),
    (v_id, 'Laporan Keuangan ' || trim(p_name), 'Laporan Keuangan', v_period_label, 'draft');

  if coalesce(p_initial_budget, 0) > 0 then
    insert into public.budget_items(activity_id, category, planned_amount)
    values (v_id, 'Belum Dirinci', p_initial_budget);
  end if;

  insert into public.audit_logs(actor_user_id, action, entity_type, entity_id, detail, after_data)
  values (auth.uid(), 'create_activity', 'activity', v_id, 'Membuat kegiatan ' || trim(p_name), jsonb_build_object('public_visible', p_public_visible, 'initial_budget', p_initial_budget));

  return v_id;
end;
$$;

create or replace function public.rpc_create_humas_assignment(
  p_activity_id uuid,
  p_humas_user_id uuid,
  p_area_label text,
  p_permissions public.assignment_permission[]
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_id uuid;
  v_permission public.assignment_permission;
begin
  if not public.is_admin_operator() then raise exception 'PERMISSION_DENIED'; end if;
  if exists (select 1 from public.activities where id = p_activity_id and financial_locked) then raise exception 'ACTIVITY_LOCKED'; end if;
  if not exists (select 1 from public.profiles where id = p_humas_user_id and role = 'humas' and is_active) then raise exception 'HUMAS_ACCOUNT_NOT_ACTIVE'; end if;
  if coalesce(array_length(p_permissions, 1), 0) = 0 then raise exception 'PERMISSION_REQUIRED'; end if;

  insert into public.humas_assignments(activity_id, humas_user_id, area_label, is_active)
  values (p_activity_id, p_humas_user_id, coalesce(nullif(trim(p_area_label), ''), 'Tanpa wilayah'), true)
  returning id into v_id;

  foreach v_permission in array p_permissions loop
    insert into public.humas_assignment_permissions(assignment_id, permission)
    values (v_id, v_permission)
    on conflict do nothing;
  end loop;

  insert into public.audit_logs(actor_user_id, action, entity_type, entity_id, detail, after_data)
  values (auth.uid(), 'create_humas_assignment', 'humas_assignment', v_id, 'Menambahkan penugasan Humas', jsonb_build_object('activity_id', p_activity_id, 'humas_user_id', p_humas_user_id, 'area_label', p_area_label, 'permissions', p_permissions));
  return v_id;
end;
$$;

create or replace function public.rpc_add_collection_target(
  p_activity_id uuid,
  p_assignment_id uuid,
  p_full_name text,
  p_area_label text
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_member_id uuid;
  v_target_id uuid;
  v_area text;
begin
  if not public.is_admin_operator() then raise exception 'PERMISSION_DENIED'; end if;
  if nullif(trim(p_full_name), '') is null then raise exception 'INVALID_MEMBER_NAME'; end if;
  if exists (select 1 from public.activities where id = p_activity_id and financial_locked) then raise exception 'ACTIVITY_LOCKED'; end if;
  if not exists (
    select 1 from public.humas_assignments ha
    join public.humas_assignment_permissions hp on hp.assignment_id = ha.id and hp.permission = 'collect_dues'
    where ha.id = p_assignment_id and ha.activity_id = p_activity_id and ha.is_active
  ) then raise exception 'ASSIGNMENT_NOT_FOUND'; end if;

  if exists (
    select 1 from public.activity_collection_targets ct
    join public.community_members cm on cm.id = ct.member_id
    where ct.activity_id = p_activity_id and lower(trim(cm.full_name)) = lower(trim(p_full_name))
  ) then raise exception 'DUPLICATE_COLLECTION_TARGET'; end if;

  select area_label into v_area from public.humas_assignments where id = p_assignment_id;
  v_area := coalesce(nullif(trim(p_area_label), ''), v_area, 'Tanpa wilayah');

  select id into v_member_id
  from public.community_members
  where lower(trim(full_name)) = lower(trim(p_full_name)) and lower(trim(area_label)) = lower(trim(v_area))
  order by created_at limit 1;

  if v_member_id is null then
    insert into public.community_members(full_name, area_label, is_active)
    values (trim(p_full_name), v_area, true)
    returning id into v_member_id;
  end if;

  insert into public.activity_collection_targets(activity_id, assignment_id, member_id)
  values (p_activity_id, p_assignment_id, v_member_id)
  returning id into v_target_id;

  insert into public.audit_logs(actor_user_id, action, entity_type, entity_id, detail, after_data)
  values (auth.uid(), 'add_collection_target', 'activity_collection_target', v_target_id, 'Menambahkan warga ke daftar iuran', jsonb_build_object('activity_id', p_activity_id, 'assignment_id', p_assignment_id, 'member_id', v_member_id));
  return v_target_id;
end;
$$;

create or replace function public.rpc_add_collection_targets_bulk(
  p_activity_id uuid,
  p_assignment_id uuid,
  p_rows jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_row jsonb;
  v_inserted integer := 0;
  v_skipped integer := 0;
begin
  if not public.is_admin_operator() then raise exception 'PERMISSION_DENIED'; end if;
  if jsonb_typeof(p_rows) <> 'array' then raise exception 'INVALID_IMPORT_ROWS'; end if;
  for v_row in select value from jsonb_array_elements(p_rows) loop
    begin
      perform public.rpc_add_collection_target(p_activity_id, p_assignment_id, v_row->>'name', v_row->>'area');
      v_inserted := v_inserted + 1;
    exception when others then
      if sqlerrm in ('DUPLICATE_COLLECTION_TARGET', 'INVALID_MEMBER_NAME') then
        v_skipped := v_skipped + 1;
      else
        raise;
      end if;
    end;
  end loop;
  return jsonb_build_object('inserted', v_inserted, 'skipped', v_skipped);
end;
$$;

create or replace function public.rpc_add_activity_media(
  p_activity_id uuid,
  p_type public.media_type,
  p_provider public.media_provider,
  p_title text,
  p_public_url text,
  p_is_cover boolean default false,
  p_public_visible boolean default true
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_id uuid;
  v_sort integer;
  v_cover boolean;
begin
  if not public.is_admin_operator() then raise exception 'PERMISSION_DENIED'; end if;
  if nullif(trim(p_title), '') is null or nullif(trim(p_public_url), '') is null then raise exception 'INVALID_MEDIA_INPUT'; end if;
  select coalesce(max(sort_order), 0) + 1 into v_sort from public.activity_media where activity_id = p_activity_id and type = p_type;
  v_cover := p_type = 'photo' and (coalesce(p_is_cover, false) or not exists(select 1 from public.activity_media where activity_id = p_activity_id and type = 'photo' and is_cover));
  if v_cover then update public.activity_media set is_cover = false where activity_id = p_activity_id and type = 'photo' and is_cover; end if;
  insert into public.activity_media(activity_id, type, provider, title, public_url, sort_order, is_cover, public_visible, created_by_user_id)
  values (p_activity_id, p_type, p_provider, trim(p_title), trim(p_public_url), v_sort, v_cover, coalesce(p_public_visible, true), auth.uid())
  returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.rpc_set_activity_cover(p_media_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare v_activity_id uuid;
begin
  if not public.is_admin_operator() then raise exception 'PERMISSION_DENIED'; end if;
  select activity_id into v_activity_id from public.activity_media where id = p_media_id and type = 'photo';
  if v_activity_id is null then raise exception 'MEDIA_NOT_FOUND'; end if;
  update public.activity_media set is_cover = (id = p_media_id) where activity_id = v_activity_id and type = 'photo';
end;
$$;

create or replace function public.rpc_move_activity_media(p_media_id uuid, p_direction text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_current public.activity_media%rowtype;
  v_other public.activity_media%rowtype;
begin
  if not public.is_admin_operator() then raise exception 'PERMISSION_DENIED'; end if;
  if p_direction not in ('up', 'down') then raise exception 'INVALID_DIRECTION'; end if;
  select * into v_current from public.activity_media where id = p_media_id;
  if v_current.id is null then raise exception 'MEDIA_NOT_FOUND'; end if;
  if p_direction = 'up' then
    select * into v_other from public.activity_media where activity_id = v_current.activity_id and type = v_current.type and sort_order < v_current.sort_order order by sort_order desc limit 1;
  else
    select * into v_other from public.activity_media where activity_id = v_current.activity_id and type = v_current.type and sort_order > v_current.sort_order order by sort_order asc limit 1;
  end if;
  if v_other.id is null then return; end if;
  update public.activity_media set sort_order = v_other.sort_order where id = v_current.id;
  update public.activity_media set sort_order = v_current.sort_order where id = v_other.id;
end;
$$;

-- ============================================================
-- FINANCIAL RPCs
-- ============================================================
create or replace function public.rpc_create_financial_transaction(
  p_activity_id uuid,
  p_kind public.transaction_kind,
  p_label text,
  p_category text,
  p_amount bigint,
  p_assignment_id uuid default null,
  p_collection_target_id uuid default null,
  p_area_label text default null,
  p_funding_source public.funding_source default null,
  p_vendor text default null,
  p_quantity numeric default null,
  p_unit_price bigint default null,
  p_payment_method text default null,
  p_note text default null,
  p_evidence_name text default null,
  p_evidence_type text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_role public.app_user_role;
  v_status public.transaction_status;
  v_id uuid;
  v_assignment public.humas_assignments%rowtype;
  v_permission public.assignment_permission;
  v_available bigint;
  v_activity_locked boolean;
begin
  if not public.current_profile_is_active() then raise exception 'PERMISSION_DENIED'; end if;
  v_role := public.current_profile_role();
  if v_role not in ('admin', 'humas') then raise exception 'PERMISSION_DENIED'; end if;
  if p_amount is null or p_amount <= 0 then raise exception 'INVALID_AMOUNT'; end if;
  if nullif(trim(p_label), '') is null or nullif(trim(p_category), '') is null then raise exception 'INVALID_TRANSACTION_INPUT'; end if;
  select financial_locked into v_activity_locked from public.activities where id = p_activity_id for update;
  if not found then raise exception 'ACTIVITY_NOT_FOUND'; end if;
  if v_activity_locked then raise exception 'ACTIVITY_LOCKED'; end if;

  if v_role = 'admin' then
    if p_kind <> 'income' or lower(trim(p_category)) = 'iuran' then raise exception 'PERMISSION_DENIED'; end if;
    v_status := 'verified';
  else
    if p_assignment_id is null then raise exception 'ASSIGNMENT_NOT_FOUND'; end if;
    select * into v_assignment from public.humas_assignments where id = p_assignment_id and activity_id = p_activity_id and humas_user_id = auth.uid() and is_active for update;
    if v_assignment.id is null then raise exception 'ASSIGNMENT_NOT_FOUND'; end if;

    v_permission := case p_kind when 'income' then 'collect_dues'::public.assignment_permission when 'expense' then 'record_purchases'::public.assignment_permission else 'handover_cash'::public.assignment_permission end;
    if not exists(select 1 from public.humas_assignment_permissions where assignment_id = p_assignment_id and permission = v_permission) then raise exception 'PERMISSION_DENIED'; end if;

    if p_kind = 'income' then
      if lower(trim(p_category)) <> 'iuran' or p_collection_target_id is null then raise exception 'INVALID_IURAN_INPUT'; end if;
      if not exists(select 1 from public.activity_collection_targets where id = p_collection_target_id and activity_id = p_activity_id and assignment_id = p_assignment_id) then raise exception 'COLLECTION_TARGET_MISMATCH'; end if;
      if exists(select 1 from public.financial_transactions where collection_target_id = p_collection_target_id and kind = 'income' and status in ('received_by_humas', 'verified')) then raise exception 'TRANSACTION_ALREADY_RECORDED'; end if;
      v_status := 'received_by_humas';
    elsif p_kind = 'expense' then
      if p_funding_source is null then raise exception 'FUNDING_SOURCE_REQUIRED'; end if;
      v_status := 'pending_verification';
    else
      v_available := public.phase03_humas_cash_available(p_assignment_id, null, true);
      if p_amount > v_available then raise exception 'INSUFFICIENT_HUMAS_CASH'; end if;
      v_status := 'pending_verification';
    end if;
  end if;

  insert into public.financial_transactions(
    activity_id, kind, status, label, category, amount, created_by_user_id, created_by_role,
    assignment_id, collection_target_id, area_label_snapshot, funding_source,
    vendor, quantity, unit_price, payment_method, note, transaction_date,
    verified_by_user_id, verified_at
  ) values (
    p_activity_id, p_kind, v_status, trim(p_label), trim(p_category), p_amount, auth.uid(), v_role,
    p_assignment_id, p_collection_target_id, coalesce(nullif(trim(p_area_label), ''), v_assignment.area_label), p_funding_source,
    nullif(trim(p_vendor), ''), p_quantity, p_unit_price, nullif(trim(p_payment_method), ''), nullif(trim(p_note), ''), current_date,
    case when v_status = 'verified' then auth.uid() else null end,
    case when v_status = 'verified' then now() else null end
  ) returning id into v_id;

  if nullif(trim(p_evidence_name), '') is not null then
    insert into public.transaction_evidence(transaction_id, title, provider, url, mime_type)
    values (v_id, trim(p_evidence_name), 'metadata_only', null, nullif(trim(p_evidence_type), ''));
  end if;

  insert into public.audit_logs(actor_user_id, action, entity_type, entity_id, detail, after_data)
  values (auth.uid(), 'create_financial_transaction', 'financial_transaction', v_id, trim(p_label) || ' · ' || p_amount::text, jsonb_build_object('kind', p_kind, 'status', v_status, 'activity_id', p_activity_id, 'assignment_id', p_assignment_id));
  return v_id;
end;
$$;

create or replace function public.rpc_set_financial_transaction_status(
  p_transaction_id uuid,
  p_status public.transaction_status,
  p_reason text default null
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_tx public.financial_transactions%rowtype;
  v_available bigint;
  v_activity_locked boolean;
begin
  if not public.is_admin_operator() then raise exception 'PERMISSION_DENIED'; end if;
  if p_status not in ('verified', 'rejected') then raise exception 'INVALID_STATUS_TRANSITION'; end if;
  select * into v_tx from public.financial_transactions where id = p_transaction_id for update;
  if v_tx.id is null then raise exception 'TRANSACTION_NOT_FOUND'; end if;
  select financial_locked into v_activity_locked from public.activities where id = v_tx.activity_id for update;
  if v_activity_locked then raise exception 'ACTIVITY_LOCKED'; end if;
  if v_tx.assignment_id is not null then perform 1 from public.humas_assignments where id = v_tx.assignment_id for update; end if;
  if v_tx.kind = 'income' then raise exception 'INVALID_STATUS_TRANSITION'; end if;
  if v_tx.status <> 'pending_verification' then raise exception 'INVALID_STATUS_TRANSITION'; end if;

  if p_status = 'verified' then
    if v_tx.kind = 'handover' then
      v_available := public.phase03_humas_cash_available(v_tx.assignment_id, v_tx.id, true);
      if v_tx.amount > v_available then raise exception 'INSUFFICIENT_HUMAS_CASH'; end if;
    elsif v_tx.funding_source = 'humas_cash' then
      v_available := public.phase03_humas_cash_available(v_tx.assignment_id, v_tx.id, true);
      if v_tx.amount > v_available then raise exception 'INSUFFICIENT_HUMAS_CASH'; end if;
    elsif v_tx.funding_source <> 'personal_reimburse' then
      v_available := public.phase03_activity_cash_available(v_tx.activity_id, v_tx.id);
      if v_tx.amount > v_available then raise exception 'INSUFFICIENT_ACTIVITY_CASH'; end if;
    end if;

    update public.financial_transactions
    set status = 'verified', verified_by_user_id = auth.uid(), verified_at = now(),
        handover_recipient_user_id = case when kind = 'handover' then auth.uid() else handover_recipient_user_id end,
        cancellation_reason = null
    where id = p_transaction_id;
  else
    update public.financial_transactions
    set status = 'rejected', cancellation_reason = coalesce(nullif(trim(p_reason), ''), 'Ditolak saat verifikasi Admin')
    where id = p_transaction_id;
  end if;

  insert into public.audit_logs(actor_user_id, action, entity_type, entity_id, reason, detail, before_data, after_data)
  values (auth.uid(), case when p_status = 'verified' then 'verify_transaction' else 'reject_transaction' end, 'financial_transaction', p_transaction_id, nullif(trim(p_reason), ''), 'Memperbarui status transaksi', to_jsonb(v_tx), (select to_jsonb(ft) from public.financial_transactions ft where ft.id = p_transaction_id));
end;
$$;

create or replace function public.rpc_cancel_financial_transaction(p_transaction_id uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_tx public.financial_transactions%rowtype;
  v_role public.app_user_role;
  v_other_collected bigint;
  v_committed bigint;
  v_spent bigint;
  v_direct bigint;
  v_handed bigint;
  v_activity_locked boolean;
begin
  if not public.current_profile_is_active() then raise exception 'PERMISSION_DENIED'; end if;
  if nullif(trim(p_reason), '') is null then raise exception 'CANCELLATION_REASON_REQUIRED'; end if;
  v_role := public.current_profile_role();
  if v_role not in ('admin', 'humas') then raise exception 'PERMISSION_DENIED'; end if;
  select * into v_tx from public.financial_transactions where id = p_transaction_id for update;
  if v_tx.id is null then raise exception 'TRANSACTION_NOT_FOUND'; end if;
  select financial_locked into v_activity_locked from public.activities where id = v_tx.activity_id for update;
  if v_activity_locked then raise exception 'ACTIVITY_LOCKED'; end if;
  if v_tx.assignment_id is not null then perform 1 from public.humas_assignments where id = v_tx.assignment_id for update; end if;
  if v_tx.status in ('cancelled', 'rejected') then raise exception 'INVALID_STATUS_TRANSITION'; end if;
  if v_role = 'humas' and (v_tx.created_by_user_id <> auth.uid() or v_tx.kind <> 'income' or lower(v_tx.category) <> 'iuran') then raise exception 'PERMISSION_DENIED'; end if;

  if v_tx.kind = 'income' and v_tx.assignment_id is not null and v_tx.status in ('received_by_humas', 'verified') then
    select coalesce(sum(amount),0)::bigint into v_other_collected from public.financial_transactions where id <> v_tx.id and assignment_id = v_tx.assignment_id and kind='income' and status in ('received_by_humas','verified');
    select coalesce(sum(amount),0)::bigint into v_committed from public.financial_transactions where assignment_id = v_tx.assignment_id and kind='handover' and status not in ('rejected','cancelled');
    select coalesce(sum(amount),0)::bigint into v_spent from public.financial_transactions where assignment_id = v_tx.assignment_id and kind='expense' and status='verified' and funding_source='humas_cash';
    if v_other_collected < v_committed + v_spent then raise exception 'INSUFFICIENT_HUMAS_CASH'; end if;
  elsif v_tx.kind = 'income' and v_tx.assignment_id is null and v_tx.status = 'verified' then
    select coalesce(sum(ft.amount),0)::bigint into v_direct from public.financial_transactions ft where ft.id<>v_tx.id and ft.activity_id=v_tx.activity_id and ft.kind='income' and ft.status='verified' and ft.created_by_role='admin';
    select coalesce(sum(amount),0)::bigint into v_handed from public.financial_transactions where activity_id=v_tx.activity_id and kind='handover' and status='verified';
    select coalesce(sum(amount),0)::bigint into v_spent from public.financial_transactions where activity_id=v_tx.activity_id and kind='expense' and status='verified' and funding_source not in ('humas_cash','personal_reimburse');
    if v_direct + v_handed < v_spent then raise exception 'INSUFFICIENT_ACTIVITY_CASH'; end if;
  elsif v_tx.kind = 'handover' and v_tx.status = 'verified' then
    select coalesce(sum(ft.amount),0)::bigint into v_direct from public.financial_transactions ft where ft.activity_id=v_tx.activity_id and ft.kind='income' and ft.status='verified' and ft.created_by_role='admin';
    select coalesce(sum(amount),0)::bigint into v_handed from public.financial_transactions where id<>v_tx.id and activity_id=v_tx.activity_id and kind='handover' and status='verified';
    select coalesce(sum(amount),0)::bigint into v_spent from public.financial_transactions where activity_id=v_tx.activity_id and kind='expense' and status='verified' and funding_source not in ('humas_cash','personal_reimburse');
    if v_direct + v_handed < v_spent then raise exception 'INSUFFICIENT_ACTIVITY_CASH'; end if;
  end if;

  update public.financial_transactions set status='cancelled', cancellation_reason=trim(p_reason) where id=p_transaction_id;
  insert into public.audit_logs(actor_user_id, action, entity_type, entity_id, reason, detail, before_data, after_data)
  values (auth.uid(), 'cancel_transaction', 'financial_transaction', p_transaction_id, trim(p_reason), 'Membatalkan transaksi', to_jsonb(v_tx), (select to_jsonb(ft) from public.financial_transactions ft where ft.id=p_transaction_id));
end;
$$;

create or replace function public.rpc_correct_income_transaction(p_transaction_id uuid, p_amount bigint, p_reason text)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_tx public.financial_transactions%rowtype;
  v_new_id uuid;
  v_other_collected bigint;
  v_committed bigint;
  v_spent bigint;
  v_activity_locked boolean;
begin
  if not public.is_active_humas() then raise exception 'PERMISSION_DENIED'; end if;
  if p_amount is null or p_amount <= 0 then raise exception 'INVALID_AMOUNT'; end if;
  if nullif(trim(p_reason), '') is null then raise exception 'CORRECTION_REASON_REQUIRED'; end if;
  select * into v_tx from public.financial_transactions where id=p_transaction_id for update;
  if v_tx.id is null or v_tx.kind <> 'income' or lower(v_tx.category) <> 'iuran' then raise exception 'TRANSACTION_NOT_FOUND'; end if;
  if v_tx.created_by_user_id <> auth.uid() then raise exception 'PERMISSION_DENIED'; end if;
  if v_tx.status in ('cancelled','rejected') then raise exception 'INVALID_STATUS_TRANSITION'; end if;
  select financial_locked into v_activity_locked from public.activities where id=v_tx.activity_id for update;
  if v_activity_locked then raise exception 'ACTIVITY_LOCKED'; end if;
  perform 1 from public.humas_assignments where id=v_tx.assignment_id for update;

  select coalesce(sum(amount),0)::bigint into v_other_collected from public.financial_transactions where id<>v_tx.id and assignment_id=v_tx.assignment_id and kind='income' and status in ('received_by_humas','verified');
  select coalesce(sum(amount),0)::bigint into v_committed from public.financial_transactions where assignment_id=v_tx.assignment_id and kind='handover' and status not in ('rejected','cancelled');
  select coalesce(sum(amount),0)::bigint into v_spent from public.financial_transactions where assignment_id=v_tx.assignment_id and kind='expense' and status='verified' and funding_source='humas_cash';
  if v_other_collected + p_amount < v_committed + v_spent then raise exception 'INSUFFICIENT_HUMAS_CASH'; end if;

  insert into public.financial_transactions(
    activity_id, kind, status, label, category, amount, created_by_user_id, created_by_role, assignment_id,
    collection_target_id, area_label_snapshot, funding_source, vendor, quantity, unit_price,
    payment_method, note, transaction_date, correction_of_transaction_id
  ) values (
    v_tx.activity_id, 'income', 'received_by_humas', v_tx.label, v_tx.category, p_amount, auth.uid(), 'humas', v_tx.assignment_id,
    v_tx.collection_target_id, v_tx.area_label_snapshot, null, null, null, null, v_tx.payment_method,
    concat_ws(' · ', nullif(v_tx.note,''), 'Koreksi: ' || trim(p_reason)), current_date, v_tx.id
  ) returning id into v_new_id;

  insert into public.transaction_evidence(transaction_id, title, provider, url, mime_type)
  select v_new_id, title, provider, url, mime_type from public.transaction_evidence where transaction_id=v_tx.id;

  update public.financial_transactions set status='cancelled', cancellation_reason='Dikoreksi: '||trim(p_reason), corrected_by_transaction_id=v_new_id where id=v_tx.id;
  insert into public.audit_logs(actor_user_id, action, entity_type, entity_id, reason, detail, before_data, after_data)
  values (auth.uid(), 'correct_income_transaction', 'financial_transaction', v_tx.id, trim(p_reason), 'Mengoreksi iuran '||v_tx.amount::text||' → '||p_amount::text, to_jsonb(v_tx), jsonb_build_object('replacement_id',v_new_id,'amount',p_amount));
  return v_new_id;
end;
$$;

create or replace function public.rpc_record_cash_reconciliation(p_assignment_id uuid, p_physical_amount bigint, p_note text default null)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_assignment public.humas_assignments%rowtype;
  v_expected bigint;
  v_difference bigint;
  v_id uuid;
  v_activity_locked boolean;
begin
  if not public.is_active_humas() then raise exception 'PERMISSION_DENIED'; end if;
  if p_physical_amount is null or p_physical_amount < 0 then raise exception 'INVALID_AMOUNT'; end if;
  select * into v_assignment from public.humas_assignments where id=p_assignment_id and humas_user_id=auth.uid() and is_active for update;
  if v_assignment.id is null then raise exception 'ASSIGNMENT_NOT_FOUND'; end if;
  select financial_locked into v_activity_locked from public.activities where id=v_assignment.activity_id for update;
  if v_activity_locked then raise exception 'ACTIVITY_LOCKED'; end if;
  v_expected := public.phase03_humas_cash_available(p_assignment_id, null, false);
  v_difference := p_physical_amount - v_expected;
  insert into public.cash_reconciliations(activity_id, assignment_id, humas_user_id, expected_amount, physical_amount, difference, note, reconciled_at, created_by_user_id)
  values(v_assignment.activity_id, p_assignment_id, auth.uid(), v_expected, p_physical_amount, v_difference, nullif(trim(p_note),''), now(), auth.uid())
  returning id into v_id;
  insert into public.audit_logs(actor_user_id, action, entity_type, entity_id, reason, detail, after_data)
  values(auth.uid(),'cash_reconciliation','cash_reconciliation',v_id,nullif(trim(p_note),''),'Tutup kas Humas',jsonb_build_object('expected',v_expected,'physical',p_physical_amount,'difference',v_difference));
  return jsonb_build_object('id',v_id,'expected_amount',v_expected,'physical_amount',p_physical_amount,'difference',v_difference);
end;
$$;

create or replace function public.rpc_update_activity_report_status(p_report_id uuid, p_status public.report_status)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare v_report public.activity_reports%rowtype;
begin
  if not public.is_admin_operator() then raise exception 'PERMISSION_DENIED'; end if;
  select * into v_report from public.activity_reports where id=p_report_id for update;
  if v_report.id is null then raise exception 'REPORT_NOT_FOUND'; end if;
  if v_report.status='approved' then raise exception 'REPORT_ALREADY_APPROVED'; end if;
  if p_status='draft' then raise exception 'INVALID_STATUS_TRANSITION'; end if;
  if v_report.status='draft' and p_status not in ('ready','approved') then raise exception 'INVALID_STATUS_TRANSITION'; end if;
  update public.activity_reports set status=p_status where id=p_report_id;
  insert into public.audit_logs(actor_user_id,action,entity_type,entity_id,detail,before_data,after_data)
  values(auth.uid(),'update_report_status','activity_report',p_report_id,'Mengubah status laporan menjadi '||p_status::text,to_jsonb(v_report),(select to_jsonb(ar) from public.activity_reports ar where ar.id=p_report_id));
end;
$$;

create or replace function public.rpc_unlock_activity(p_activity_id uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare v_report_id uuid;
begin
  if not public.is_admin_operator() then raise exception 'PERMISSION_DENIED'; end if;
  if nullif(trim(p_reason),'') is null then raise exception 'UNLOCK_REASON_REQUIRED'; end if;
  if not exists(select 1 from public.activities where id=p_activity_id and financial_locked) then raise exception 'ACTIVITY_NOT_LOCKED'; end if;
  select id into v_report_id from public.activity_reports where activity_id=p_activity_id and lower(report_type) like '%lpj%' and status='approved' order by approved_at desc nulls last limit 1;
  if v_report_id is null then raise exception 'APPROVED_LPJ_NOT_FOUND'; end if;
  update public.activity_reports set status='ready' where id=v_report_id;
  insert into public.audit_logs(actor_user_id, action, entity_type, entity_id, reason, detail)
  values(auth.uid(),'unlock_activity','activity',p_activity_id,trim(p_reason),'Membuka kegiatan untuk koreksi setelah LPJ');
end;
$$;

-- ============================================================
-- PUBLIC SANITIZED SNAPSHOT
-- Deliberately masks payer names and internal account ids.
-- ============================================================
create or replace function public.get_public_operations_snapshot()
returns jsonb
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  select jsonb_build_object(
    'activities', coalesce((select jsonb_agg(jsonb_build_object(
      'id',a.id,'name',a.name,'category',a.category,'phase',a.phase,'event_date',a.event_date,
      'location',a.location,'summary',a.summary,'public_visible',true,'financial_locked',false
    ) order by a.event_date desc) from public.activities a where a.public_visible), '[]'::jsonb),

    'assignments', coalesce((select jsonb_agg(jsonb_build_object(
      'id',ha.id,'activity_id',ha.activity_id,'humas_user_id',ha.id,'area_label',ha.area_label,'humas_public_label',ha.area_label
    )) from public.humas_assignments ha join public.activities a on a.id=ha.activity_id and a.public_visible where ha.is_active), '[]'::jsonb),

    'permissions', coalesce((select jsonb_agg(jsonb_build_object('assignment_id',hp.assignment_id,'permission',hp.permission))
      from public.humas_assignment_permissions hp join public.humas_assignments ha on ha.id=hp.assignment_id join public.activities a on a.id=ha.activity_id and a.public_visible where ha.is_active), '[]'::jsonb),

    'community_members', coalesce((select jsonb_agg(jsonb_build_object('id',ct.id,'full_name','Warga','area_label',cm.area_label))
      from public.activity_collection_targets ct join public.community_members cm on cm.id=ct.member_id join public.activities a on a.id=ct.activity_id and a.public_visible), '[]'::jsonb),

    'collection_targets', coalesce((select jsonb_agg(jsonb_build_object('id',ct.id,'activity_id',ct.activity_id,'assignment_id',ct.assignment_id,'member_id',ct.id,'public_name','Warga','area_label',cm.area_label))
      from public.activity_collection_targets ct join public.community_members cm on cm.id=ct.member_id join public.activities a on a.id=ct.activity_id and a.public_visible), '[]'::jsonb),

    'budget_items', coalesce((select jsonb_agg(jsonb_build_object('id',bi.id,'activity_id',bi.activity_id,'category',bi.category,'planned_amount',bi.planned_amount))
      from public.budget_items bi join public.activities a on a.id=bi.activity_id and a.public_visible), '[]'::jsonb),

    'transactions', coalesce((select jsonb_agg(jsonb_build_object(
      'id',ft.id,'activity_id',ft.activity_id,'kind',ft.kind,'status',ft.status,
      'label',case when ft.kind='income' and lower(ft.category)='iuran' then 'Iuran warga diterima Humas' else ft.label end,
      'public_label',case when ft.kind='income' and lower(ft.category)='iuran' then 'Iuran warga diterima Humas' else ft.label end,
      'category',ft.category,'amount',ft.amount,
      'created_by_role',ft.created_by_role,
      'actor_scope_id',coalesce(ft.assignment_id::text, case when ft.created_by_role='admin' then 'admin-kegiatan' else 'petugas-kegiatan' end),
      'actor_public_label',case when ft.created_by_role='humas' then coalesce(ft.area_label_snapshot,'Petugas Humas') else 'Admin Kegiatan' end,
      'assignment_id',ft.assignment_id,'collection_target_id',ft.collection_target_id,'area_label_snapshot',ft.area_label_snapshot,
      'funding_source',ft.funding_source,'vendor',ft.vendor,'quantity',ft.quantity,'unit_price',ft.unit_price,'payment_method',ft.payment_method,
      'transaction_date',ft.transaction_date,'created_at',ft.created_at,
      'evidence_present',exists(select 1 from public.transaction_evidence te where te.transaction_id=ft.id and te.provider <> 'metadata_only' and nullif(trim(te.url),'') is not null)
    ) order by ft.transaction_date desc, ft.created_at desc)
      from public.financial_transactions ft
      join public.activities a on a.id=ft.activity_id and a.public_visible
      where (ft.kind='income' and ft.status in ('received_by_humas','verified')) or (ft.kind in ('expense','handover') and ft.status='verified')
    ), '[]'::jsonb),

    'reports', coalesce((select jsonb_agg(jsonb_build_object('id',ar.id,'activity_id',ar.activity_id,'title',ar.title,'report_type',ar.report_type,'period_label',ar.period_label,'status',ar.status))
      from public.activity_reports ar join public.activities a on a.id=ar.activity_id and a.public_visible), '[]'::jsonb),

    'activity_media', coalesce((select jsonb_agg(jsonb_build_object(
      'id',m.id,'activity_id',m.activity_id,'type',m.type,'provider',m.provider,'title',m.title,'public_url',m.public_url,'sort_order',m.sort_order,'is_cover',m.is_cover,'public_visible',true
    ) order by m.sort_order)
      from public.activity_media m join public.activities a on a.id=m.activity_id and a.public_visible where m.public_visible), '[]'::jsonb)
  );
$$;

-- Explicit function privileges. Default function privileges are hardened in Phase 01.
revoke all on function public.rpc_create_activity(text,text,date,text,text,text,boolean,bigint) from public, anon;
revoke all on function public.rpc_create_humas_assignment(uuid,uuid,text,public.assignment_permission[]) from public, anon;
revoke all on function public.rpc_add_collection_target(uuid,uuid,text,text) from public, anon;
revoke all on function public.rpc_add_collection_targets_bulk(uuid,uuid,jsonb) from public, anon;
revoke all on function public.rpc_add_activity_media(uuid,public.media_type,public.media_provider,text,text,boolean,boolean) from public, anon;
revoke all on function public.rpc_set_activity_cover(uuid) from public, anon;
revoke all on function public.rpc_move_activity_media(uuid,text) from public, anon;
revoke all on function public.rpc_create_financial_transaction(uuid,public.transaction_kind,text,text,bigint,uuid,uuid,text,public.funding_source,text,numeric,bigint,text,text,text,text) from public, anon;
revoke all on function public.rpc_set_financial_transaction_status(uuid,public.transaction_status,text) from public, anon;
revoke all on function public.rpc_cancel_financial_transaction(uuid,text) from public, anon;
revoke all on function public.rpc_correct_income_transaction(uuid,bigint,text) from public, anon;
revoke all on function public.rpc_record_cash_reconciliation(uuid,bigint,text) from public, anon;
revoke all on function public.rpc_update_activity_report_status(uuid,public.report_status) from public, anon;
revoke all on function public.rpc_unlock_activity(uuid,text) from public, anon;
revoke all on function public.get_public_operations_snapshot() from public;

grant execute on function public.rpc_create_activity(text,text,date,text,text,text,boolean,bigint) to authenticated;
grant execute on function public.rpc_create_humas_assignment(uuid,uuid,text,public.assignment_permission[]) to authenticated;
grant execute on function public.rpc_add_collection_target(uuid,uuid,text,text) to authenticated;
grant execute on function public.rpc_add_collection_targets_bulk(uuid,uuid,jsonb) to authenticated;
grant execute on function public.rpc_add_activity_media(uuid,public.media_type,public.media_provider,text,text,boolean,boolean) to authenticated;
grant execute on function public.rpc_set_activity_cover(uuid) to authenticated;
grant execute on function public.rpc_move_activity_media(uuid,text) to authenticated;
grant execute on function public.rpc_create_financial_transaction(uuid,public.transaction_kind,text,text,bigint,uuid,uuid,text,public.funding_source,text,numeric,bigint,text,text,text,text) to authenticated;
grant execute on function public.rpc_set_financial_transaction_status(uuid,public.transaction_status,text) to authenticated;
grant execute on function public.rpc_cancel_financial_transaction(uuid,text) to authenticated;
grant execute on function public.rpc_correct_income_transaction(uuid,bigint,text) to authenticated;
grant execute on function public.rpc_record_cash_reconciliation(uuid,bigint,text) to authenticated;
grant execute on function public.rpc_update_activity_report_status(uuid,public.report_status) to authenticated;
grant execute on function public.rpc_unlock_activity(uuid,text) to authenticated;
grant execute on function public.get_public_operations_snapshot() to anon, authenticated;

commit;
