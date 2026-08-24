-- PEMUDA DUSUN 3 SIDODADI
-- Supabase Phase 01: initial schema + Auth profile binding + RLS hardening
-- Generated from docs/POSTGRES_SCHEMA_BLUEPRINT.sql.
--
-- IMPORTANT:
-- 1) Run in a NEW / empty Supabase project only.
-- 2) This migration intentionally does NOT create public write RPCs yet.
-- 3) Operational writes stay disabled until Phase 02 repository/RPC integration.
-- 4) Cloudflare R2 / YouTube / Google Drive file flows are NOT configured here.

begin;

create extension if not exists pgcrypto;

-- ============================================================
-- ENUMS
-- ============================================================

do $$ begin
  create type public.app_user_role as enum ('superadmin', 'admin', 'humas');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.activity_phase as enum ('planning', 'fundraising', 'active', 'settlement', 'lpj', 'completed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.assignment_permission as enum ('collect_dues', 'record_purchases', 'handover_cash');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.transaction_kind as enum ('income', 'expense', 'handover');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.transaction_status as enum ('received_by_humas', 'pending_verification', 'verified', 'rejected', 'cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.funding_source as enum ('activity_cash', 'humas_cash', 'personal_reimburse', 'advance', 'other');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.report_status as enum ('draft', 'ready', 'approved');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.media_type as enum ('photo', 'video');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.media_provider as enum ('cloudflare_r2', 'youtube', 'google_drive');
exception when duplicate_object then null; end $$;

-- ============================================================
-- TABLES (15 canonical production tables)
-- ============================================================

create table if not exists public.organization_periods (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  starts_on date not null,
  ends_on date not null,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  check (ends_on >= starts_on)
);

create unique index if not exists organization_periods_single_active_idx
  on public.organization_periods (is_active)
  where is_active = true;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null,
  full_name text not null,
  role public.app_user_role not null default 'humas',
  phone text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists profiles_username_lower_uidx on public.profiles (lower(username));

create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  period_id uuid references public.organization_periods(id) on delete set null,
  slug text not null,
  name text not null,
  category text not null,
  phase public.activity_phase not null default 'planning',
  event_date date not null,
  location text not null,
  summary text not null default '',
  public_visible boolean not null default false,
  financial_locked boolean not null default false,
  locked_at timestamptz,
  locked_by_user_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((not financial_locked) or (locked_at is not null and locked_by_user_id is not null))
);

create unique index if not exists activities_slug_uidx on public.activities (lower(slug));
create index if not exists activities_period_idx on public.activities(period_id);
create index if not exists activities_phase_idx on public.activities(phase);
create index if not exists activities_public_idx on public.activities(public_visible, event_date desc);

create table if not exists public.activity_committee_members (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.activities(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  name text not null,
  role_title text not null,
  phone text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists committee_activity_idx on public.activity_committee_members(activity_id, sort_order);

create table if not exists public.humas_assignments (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.activities(id) on delete cascade,
  humas_user_id uuid not null references public.profiles(id) on delete restrict,
  area_label text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (activity_id, humas_user_id, area_label)
);

create index if not exists humas_assignments_user_idx on public.humas_assignments(humas_user_id, is_active);
create index if not exists humas_assignments_activity_idx on public.humas_assignments(activity_id, is_active);

create table if not exists public.humas_assignment_permissions (
  assignment_id uuid not null references public.humas_assignments(id) on delete cascade,
  permission public.assignment_permission not null,
  primary key (assignment_id, permission)
);

create table if not exists public.community_members (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  area_label text not null,
  phone text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists community_members_area_idx on public.community_members(area_label, is_active);
create index if not exists community_members_name_idx on public.community_members(lower(full_name));

create table if not exists public.activity_collection_targets (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.activities(id) on delete cascade,
  assignment_id uuid not null references public.humas_assignments(id) on delete restrict,
  member_id uuid not null references public.community_members(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (activity_id, member_id)
);

create index if not exists collection_targets_assignment_idx on public.activity_collection_targets(assignment_id);

create table if not exists public.budget_items (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.activities(id) on delete cascade,
  category text not null,
  planned_amount bigint not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (planned_amount >= 0)
);

create unique index if not exists budget_activity_category_uidx on public.budget_items(activity_id, lower(category));

create table if not exists public.financial_transactions (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.activities(id) on delete restrict,
  kind public.transaction_kind not null,
  status public.transaction_status not null,
  label text not null,
  category text not null,
  amount bigint not null,
  created_by_user_id uuid not null references public.profiles(id) on delete restrict,
  assignment_id uuid references public.humas_assignments(id) on delete restrict,
  collection_target_id uuid references public.activity_collection_targets(id) on delete restrict,
  area_label_snapshot text,
  funding_source public.funding_source,
  vendor text,
  quantity numeric(14,3),
  unit_price bigint,
  payment_method text,
  note text,
  transaction_date date not null default current_date,
  verified_by_user_id uuid references public.profiles(id) on delete set null,
  verified_at timestamptz,
  handover_recipient_user_id uuid references public.profiles(id) on delete set null,
  cancellation_reason text,
  correction_of_transaction_id uuid references public.financial_transactions(id) on delete restrict,
  corrected_by_transaction_id uuid references public.financial_transactions(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (amount > 0),
  check (unit_price is null or unit_price >= 0),
  check (quantity is null or quantity > 0),
  check (status <> 'cancelled' or nullif(trim(cancellation_reason), '') is not null),
  check (kind <> 'expense' or funding_source is not null),
  check (not (kind = 'income' and lower(category) = 'iuran') or (assignment_id is not null and collection_target_id is not null)),
  check (not (kind = 'income' and lower(category) = 'iuran') or status <> 'pending_verification'),
  check (kind <> 'handover' or assignment_id is not null)
);

create index if not exists transactions_activity_date_idx on public.financial_transactions(activity_id, transaction_date desc);
create index if not exists transactions_assignment_idx on public.financial_transactions(assignment_id, transaction_date desc);
create index if not exists transactions_target_idx on public.financial_transactions(collection_target_id);
create index if not exists transactions_status_idx on public.financial_transactions(status, kind);
create index if not exists transactions_category_idx on public.financial_transactions(activity_id, category);

create table if not exists public.transaction_evidence (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.financial_transactions(id) on delete cascade,
  title text not null,
  provider text not null check (provider in ('cloudflare_r2', 'external_url')),
  url text not null,
  mime_type text,
  created_at timestamptz not null default now()
);

create index if not exists transaction_evidence_transaction_idx on public.transaction_evidence(transaction_id);

create table if not exists public.cash_reconciliations (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.activities(id) on delete restrict,
  assignment_id uuid not null references public.humas_assignments(id) on delete restrict,
  humas_user_id uuid not null references public.profiles(id) on delete restrict,
  expected_amount bigint not null,
  physical_amount bigint not null,
  difference bigint not null,
  note text,
  reconciled_at timestamptz not null default now(),
  created_by_user_id uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);

create index if not exists cash_reconciliation_assignment_idx on public.cash_reconciliations(assignment_id, reconciled_at desc);

create table if not exists public.activity_reports (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.activities(id) on delete cascade,
  title text not null,
  report_type text not null,
  period_label text not null,
  status public.report_status not null default 'draft',
  approved_by_user_id uuid references public.profiles(id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((status <> 'approved') or (approved_by_user_id is not null and approved_at is not null))
);

create index if not exists activity_reports_activity_idx on public.activity_reports(activity_id, status);

create table if not exists public.activity_media (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.activities(id) on delete cascade,
  type public.media_type not null,
  provider public.media_provider not null,
  title text not null,
  public_url text not null,
  external_file_id text,
  thumbnail_url text,
  sort_order integer not null default 0,
  is_cover boolean not null default false,
  public_visible boolean not null default true,
  created_by_user_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((type = 'photo' and provider = 'cloudflare_r2') or (type = 'video' and provider in ('youtube', 'google_drive')))
);

create index if not exists activity_media_activity_idx on public.activity_media(activity_id, sort_order);
create unique index if not exists activity_media_one_cover_uidx
  on public.activity_media(activity_id)
  where is_cover = true;

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text,
  entity_id uuid,
  reason text,
  detail text not null,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz not null default now()
);

create index if not exists audit_logs_actor_idx on public.audit_logs(actor_user_id, created_at desc);
create index if not exists audit_logs_entity_idx on public.audit_logs(entity_type, entity_id, created_at desc);
create index if not exists audit_logs_created_idx on public.audit_logs(created_at desc);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

revoke all on function public.set_updated_at() from public;

create or replace trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();
create or replace trigger activities_set_updated_at before update on public.activities
for each row execute function public.set_updated_at();
create or replace trigger committee_set_updated_at before update on public.activity_committee_members
for each row execute function public.set_updated_at();
create or replace trigger humas_assignments_set_updated_at before update on public.humas_assignments
for each row execute function public.set_updated_at();
create or replace trigger community_members_set_updated_at before update on public.community_members
for each row execute function public.set_updated_at();
create or replace trigger budget_items_set_updated_at before update on public.budget_items
for each row execute function public.set_updated_at();
create or replace trigger transactions_set_updated_at before update on public.financial_transactions
for each row execute function public.set_updated_at();
create or replace trigger reports_set_updated_at before update on public.activity_reports
for each row execute function public.set_updated_at();
create or replace trigger media_set_updated_at before update on public.activity_media
for each row execute function public.set_updated_at();

-- ============================================================
-- SUPABASE AUTH -> PROFILE BINDING
-- Role is read ONLY from raw_app_meta_data; never raw_user_meta_data.
-- New accounts default to humas when app_metadata role is absent/invalid.
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
begin
  if coalesce(new.raw_app_meta_data->>'role', '') in ('superadmin', 'admin', 'humas') then
    v_role := (new.raw_app_meta_data->>'role')::public.app_user_role;
  end if;

  v_username := lower(trim(coalesce(
    nullif(new.raw_app_meta_data->>'username', ''),
    nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
    'user-' || left(new.id::text, 8)
  )));

  v_full_name := trim(coalesce(
    nullif(new.raw_app_meta_data->>'full_name', ''),
    nullif(new.raw_user_meta_data->>'full_name', ''),
    v_username
  ));

  insert into public.profiles (id, username, full_name, role, phone, is_active)
  values (new.id, v_username, v_full_name, v_role, nullif(new.phone, ''), true)
  on conflict (id) do nothing;

  return new;
end;
$$;

revoke all on function public.handle_new_auth_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_auth_user();

-- ============================================================
-- SECURITY HELPERS
-- ============================================================

create or replace function public.current_profile_role()
returns public.app_user_role
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  select p.role
  from public.profiles p
  where p.id = auth.uid() and p.is_active = true
  limit 1;
$$;

create or replace function public.current_profile_is_active()
returns boolean
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.is_active = true
  );
$$;

create or replace function public.is_superadmin()
returns boolean
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  select coalesce(public.current_profile_role() = 'superadmin', false);
$$;

create or replace function public.is_admin_or_superadmin()
returns boolean
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  select coalesce(public.current_profile_role() in ('superadmin', 'admin'), false);
$$;

create or replace function public.is_assigned_humas(p_activity_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  select exists (
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
  select exists (
    select 1
    from public.humas_assignments ha
    join public.humas_assignment_permissions hp on hp.assignment_id = ha.id
    where ha.activity_id = p_activity_id
      and ha.humas_user_id = auth.uid()
      and ha.is_active = true
      and hp.permission = p_permission
  );
$$;

revoke all on function public.current_profile_role() from public;
revoke all on function public.current_profile_is_active() from public;
revoke all on function public.is_superadmin() from public;
revoke all on function public.is_admin_or_superadmin() from public;
revoke all on function public.is_assigned_humas(uuid) from public;
revoke all on function public.humas_has_permission(uuid, public.assignment_permission) from public;
grant execute on function public.current_profile_role() to authenticated;
grant execute on function public.current_profile_is_active() to authenticated;
grant execute on function public.is_superadmin() to authenticated;
grant execute on function public.is_admin_or_superadmin() to authenticated;
grant execute on function public.is_assigned_humas(uuid) to authenticated;
grant execute on function public.humas_has_permission(uuid, public.assignment_permission) to authenticated;

-- ============================================================
-- CROSS-TABLE INTEGRITY
-- ============================================================

create or replace function public.enforce_assignment_humas_role()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if not exists (
    select 1 from public.profiles p
    where p.id = new.humas_user_id and p.role = 'humas' and p.is_active = true
  ) then
    raise exception 'HUMAS_ASSIGNMENT_INVALID_USER: user harus Humas aktif';
  end if;
  return new;
end;
$$;

create or replace trigger humas_assignment_role_guard
before insert or update of humas_user_id on public.humas_assignments
for each row execute function public.enforce_assignment_humas_role();

create or replace function public.enforce_collection_target_integrity()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if not exists (
    select 1 from public.humas_assignments ha
    where ha.id = new.assignment_id
      and ha.activity_id = new.activity_id
      and ha.is_active = true
  ) then
    raise exception 'COLLECTION_TARGET_ASSIGNMENT_MISMATCH';
  end if;
  return new;
end;
$$;

create or replace trigger collection_target_integrity_guard
before insert or update on public.activity_collection_targets
for each row execute function public.enforce_collection_target_integrity();

create or replace function public.enforce_transaction_integrity()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if exists (
    select 1 from public.activities a
    where a.id = new.activity_id and a.financial_locked = true
  ) then
    raise exception 'ACTIVITY_FINANCIAL_LOCKED';
  end if;

  if new.assignment_id is not null and not exists (
    select 1 from public.humas_assignments ha
    where ha.id = new.assignment_id and ha.activity_id = new.activity_id
  ) then
    raise exception 'TRANSACTION_ASSIGNMENT_MISMATCH';
  end if;

  if new.collection_target_id is not null and not exists (
    select 1 from public.activity_collection_targets ct
    where ct.id = new.collection_target_id
      and ct.activity_id = new.activity_id
      and (new.assignment_id is null or ct.assignment_id = new.assignment_id)
  ) then
    raise exception 'TRANSACTION_TARGET_MISMATCH';
  end if;

  if new.kind = 'handover' and new.assignment_id is not null then
    if new.funding_source is not null then
      raise exception 'HANDOVER_FUNDING_SOURCE_NOT_ALLOWED';
    end if;
  end if;

  return new;
end;
$$;

create or replace trigger transaction_integrity_guard
before insert or update on public.financial_transactions
for each row execute function public.enforce_transaction_integrity();

-- Locked activities are immutable for structural/financial planning data.
create or replace function public.block_locked_activity_mutation()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_activity_id uuid;
begin
  v_activity_id := case when tg_op = 'DELETE' then old.activity_id else new.activity_id end;
  if exists (
    select 1 from public.activities a
    where a.id = v_activity_id and a.financial_locked = true
  ) then
    raise exception 'ACTIVITY_LOCKED_MUTATION_BLOCKED';
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

create or replace trigger committee_locked_guard
before insert or update or delete on public.activity_committee_members
for each row execute function public.block_locked_activity_mutation();
create or replace trigger assignments_locked_guard
before insert or update or delete on public.humas_assignments
for each row execute function public.block_locked_activity_mutation();
create or replace trigger collection_targets_locked_guard
before insert or update or delete on public.activity_collection_targets
for each row execute function public.block_locked_activity_mutation();
create or replace trigger budget_items_locked_guard
before insert or update or delete on public.budget_items
for each row execute function public.block_locked_activity_mutation();

-- Only Superadmin can change the financial lock state.
create or replace function public.guard_activity_financial_lock()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if new.financial_locked is distinct from old.financial_locked
     or new.locked_at is distinct from old.locked_at
     or new.locked_by_user_id is distinct from old.locked_by_user_id then
    if not public.is_superadmin() then
      raise exception 'ACTIVITY_LOCK_SUPERADMIN_ONLY';
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

create or replace trigger activities_financial_lock_guard
before update on public.activities
for each row execute function public.guard_activity_financial_lock();

-- Report approval is a Superadmin-only action.
create or replace function public.guard_report_approval()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if new.status = 'approved' and (tg_op = 'INSERT' or old.status is distinct from 'approved') then
    if not public.is_superadmin() then
      raise exception 'LPJ_APPROVAL_SUPERADMIN_ONLY';
    end if;
    new.approved_by_user_id := auth.uid();
    new.approved_at := now();
  elsif tg_op = 'UPDATE' and old.status = 'approved' and new.status is distinct from 'approved' then
    if not public.is_superadmin() then
      raise exception 'LPJ_REOPEN_SUPERADMIN_ONLY';
    end if;
    new.approved_by_user_id := null;
    new.approved_at := null;
  end if;
  return new;
end;
$$;

create or replace trigger activity_reports_approval_guard
before insert or update on public.activity_reports
for each row execute function public.guard_report_approval();

-- Financial records must never be hard deleted.
create or replace function public.block_financial_delete()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  raise exception 'FINANCIAL_DELETE_BLOCKED: gunakan workflow batal/koreksi';
end;
$$;

create or replace trigger financial_transactions_no_delete
before delete on public.financial_transactions
for each row execute function public.block_financial_delete();

create or replace trigger transaction_evidence_no_delete
before delete on public.transaction_evidence
for each row execute function public.block_financial_delete();

-- ============================================================
-- RLS
-- ============================================================

alter table public.organization_periods enable row level security;
alter table public.profiles enable row level security;
alter table public.activities enable row level security;
alter table public.activity_committee_members enable row level security;
alter table public.humas_assignments enable row level security;
alter table public.humas_assignment_permissions enable row level security;
alter table public.community_members enable row level security;
alter table public.activity_collection_targets enable row level security;
alter table public.budget_items enable row level security;
alter table public.financial_transactions enable row level security;
alter table public.transaction_evidence enable row level security;
alter table public.cash_reconciliations enable row level security;
alter table public.activity_reports enable row level security;
alter table public.activity_media enable row level security;
alter table public.audit_logs enable row level security;

-- Remove any implicit table rights. PostgREST still needs SELECT grants where RLS allows it.
revoke all on all tables in schema public from anon, authenticated;

-- Public/readable organization period.
grant select on public.organization_periods to anon, authenticated;
create policy organization_periods_public_read on public.organization_periods
for select to anon, authenticated using (true);
create policy organization_periods_superadmin_insert on public.organization_periods
for insert to authenticated with check (public.is_superadmin());
create policy organization_periods_superadmin_update on public.organization_periods
for update to authenticated using (public.is_superadmin()) with check (public.is_superadmin());
create policy organization_periods_superadmin_delete on public.organization_periods
for delete to authenticated using (public.is_superadmin());

-- Profiles: authenticated users can read themselves; Admin/Superadmin can read active directory.
grant select on public.profiles to authenticated;
create policy profiles_self_or_management_read on public.profiles
for select to authenticated using (
  id = auth.uid() or public.is_admin_or_superadmin()
);
-- Direct profile writes remain Superadmin-only to prevent privilege escalation.
grant insert, update on public.profiles to authenticated;
create policy profiles_superadmin_insert on public.profiles
for insert to authenticated with check (public.is_superadmin());
create policy profiles_superadmin_update on public.profiles
for update to authenticated using (public.is_superadmin()) with check (public.is_superadmin());

-- Activities: public can read published activities; signed-in staff read according to role/assignment.
grant select on public.activities to anon, authenticated;
create policy activities_public_read on public.activities
for select to anon using (public_visible = true);
create policy activities_authenticated_read on public.activities
for select to authenticated using (
  public_visible = true
  or public.is_admin_or_superadmin()
  or public.is_assigned_humas(id)
);
-- Management writes only. Humas operational writes will go through safe RPC in next phase.
grant insert, update, delete on public.activities to authenticated;
create policy activities_management_insert on public.activities
for insert to authenticated with check (public.is_admin_or_superadmin());
create policy activities_management_update on public.activities
for update to authenticated using (public.is_admin_or_superadmin()) with check (public.is_admin_or_superadmin());
create policy activities_superadmin_delete on public.activities
for delete to authenticated using (public.is_superadmin());

-- Committee contains phone numbers: internal only.
grant select, insert, update, delete on public.activity_committee_members to authenticated;
create policy committee_internal_read on public.activity_committee_members
for select to authenticated using (
  public.is_admin_or_superadmin() or public.is_assigned_humas(activity_id)
);
create policy committee_management_insert on public.activity_committee_members
for insert to authenticated with check (public.is_admin_or_superadmin());
create policy committee_management_update on public.activity_committee_members
for update to authenticated using (public.is_admin_or_superadmin()) with check (public.is_admin_or_superadmin());
create policy committee_management_delete on public.activity_committee_members
for delete to authenticated using (public.is_admin_or_superadmin());

-- Humas assignments.
grant select, insert, update, delete on public.humas_assignments to authenticated;
create policy humas_assignments_read on public.humas_assignments
for select to authenticated using (
  public.is_admin_or_superadmin() or humas_user_id = auth.uid()
);
create policy humas_assignments_management_insert on public.humas_assignments
for insert to authenticated with check (public.is_admin_or_superadmin());
create policy humas_assignments_management_update on public.humas_assignments
for update to authenticated using (public.is_admin_or_superadmin()) with check (public.is_admin_or_superadmin());
create policy humas_assignments_management_delete on public.humas_assignments
for delete to authenticated using (public.is_admin_or_superadmin());

-- Assignment permissions.
grant select, insert, delete on public.humas_assignment_permissions to authenticated;
create policy assignment_permissions_read on public.humas_assignment_permissions
for select to authenticated using (
  public.is_admin_or_superadmin()
  or exists (
    select 1 from public.humas_assignments ha
    where ha.id = assignment_id and ha.humas_user_id = auth.uid() and ha.is_active = true
  )
);
create policy assignment_permissions_management_insert on public.humas_assignment_permissions
for insert to authenticated with check (public.is_admin_or_superadmin());
create policy assignment_permissions_management_delete on public.humas_assignment_permissions
for delete to authenticated using (public.is_admin_or_superadmin());

-- Community members: Admin sees all; Humas sees only members assigned to them.
grant select, insert, update, delete on public.community_members to authenticated;
create policy community_members_scoped_read on public.community_members
for select to authenticated using (
  public.is_admin_or_superadmin()
  or exists (
    select 1
    from public.activity_collection_targets ct
    join public.humas_assignments ha on ha.id = ct.assignment_id
    where ct.member_id = community_members.id
      and ha.humas_user_id = auth.uid()
      and ha.is_active = true
  )
);
create policy community_members_management_insert on public.community_members
for insert to authenticated with check (public.is_admin_or_superadmin());
create policy community_members_management_update on public.community_members
for update to authenticated using (public.is_admin_or_superadmin()) with check (public.is_admin_or_superadmin());
create policy community_members_management_delete on public.community_members
for delete to authenticated using (public.is_admin_or_superadmin());

-- Collection targets: Humas reads targets assigned to them; management writes only.
grant select, insert, update, delete on public.activity_collection_targets to authenticated;
create policy collection_targets_scoped_read on public.activity_collection_targets
for select to authenticated using (
  public.is_admin_or_superadmin()
  or exists (
    select 1 from public.humas_assignments ha
    where ha.id = assignment_id and ha.humas_user_id = auth.uid() and ha.is_active = true
  )
);
create policy collection_targets_management_insert on public.activity_collection_targets
for insert to authenticated with check (public.is_admin_or_superadmin());
create policy collection_targets_management_update on public.activity_collection_targets
for update to authenticated using (public.is_admin_or_superadmin()) with check (public.is_admin_or_superadmin());
create policy collection_targets_management_delete on public.activity_collection_targets
for delete to authenticated using (public.is_admin_or_superadmin());

-- RAB: internal read; management write.
grant select, insert, update, delete on public.budget_items to authenticated;
create policy budget_items_internal_read on public.budget_items
for select to authenticated using (
  public.is_admin_or_superadmin() or public.is_assigned_humas(activity_id)
);
create policy budget_items_management_insert on public.budget_items
for insert to authenticated with check (public.is_admin_or_superadmin());
create policy budget_items_management_update on public.budget_items
for update to authenticated using (public.is_admin_or_superadmin()) with check (public.is_admin_or_superadmin());
create policy budget_items_management_delete on public.budget_items
for delete to authenticated using (public.is_admin_or_superadmin());

-- Financial transactions: scoped READ only in Phase 01. No client direct writes.
grant select on public.financial_transactions to authenticated;
create policy transactions_scoped_read on public.financial_transactions
for select to authenticated using (
  public.is_admin_or_superadmin()
  or (
    created_by_user_id = auth.uid()
    and public.is_assigned_humas(activity_id)
  )
  or (
    assignment_id is not null
    and exists (
      select 1 from public.humas_assignments ha
      where ha.id = assignment_id and ha.humas_user_id = auth.uid() and ha.is_active = true
    )
  )
);

-- Evidence follows transaction visibility; no direct client writes yet.
grant select on public.transaction_evidence to authenticated;
create policy evidence_scoped_read on public.transaction_evidence
for select to authenticated using (
  exists (
    select 1
    from public.financial_transactions ft
    where ft.id = transaction_id
      and (
        public.is_admin_or_superadmin()
        or ft.created_by_user_id = auth.uid()
        or (
          ft.assignment_id is not null and exists (
            select 1 from public.humas_assignments ha
            where ha.id = ft.assignment_id and ha.humas_user_id = auth.uid() and ha.is_active = true
          )
        )
      )
  )
);

-- Cash reconciliations: scoped READ only; write via RPC later.
grant select on public.cash_reconciliations to authenticated;
create policy cash_reconciliations_scoped_read on public.cash_reconciliations
for select to authenticated using (
  public.is_admin_or_superadmin() or humas_user_id = auth.uid()
);

-- Reports: internal; management write. Public LPJ will use sanitized public endpoint/view later.
grant select, insert, update on public.activity_reports to authenticated;
create policy reports_internal_read on public.activity_reports
for select to authenticated using (
  public.is_admin_or_superadmin() or public.is_assigned_humas(activity_id)
);
create policy reports_management_insert on public.activity_reports
for insert to authenticated with check (public.is_admin_or_superadmin());
create policy reports_management_update on public.activity_reports
for update to authenticated using (public.is_admin_or_superadmin()) with check (public.is_admin_or_superadmin());

-- Activity media: public can read only media from published activities and public_visible=true.
grant select on public.activity_media to anon, authenticated;
create policy media_public_read on public.activity_media
for select to anon using (
  public_visible = true
  and exists (select 1 from public.activities a where a.id = activity_id and a.public_visible = true)
);
create policy media_internal_read on public.activity_media
for select to authenticated using (
  (public_visible = true and exists (select 1 from public.activities a where a.id = activity_id and a.public_visible = true))
  or public.is_admin_or_superadmin()
  or public.is_assigned_humas(activity_id)
);
grant insert, update, delete on public.activity_media to authenticated;
create policy media_management_insert on public.activity_media
for insert to authenticated with check (public.is_admin_or_superadmin());
create policy media_management_update on public.activity_media
for update to authenticated using (public.is_admin_or_superadmin()) with check (public.is_admin_or_superadmin());
create policy media_management_delete on public.activity_media
for delete to authenticated using (public.is_admin_or_superadmin());

-- Audit logs: management read only. Writes are reserved for DB/RPC functions.
grant select on public.audit_logs to authenticated;
create policy audit_logs_management_read on public.audit_logs
for select to authenticated using (public.is_admin_or_superadmin());

-- ============================================================
-- PUBLIC SANITIZED READ VIEWS
-- No names/phones/private transaction actors are exposed here.
-- ============================================================

create or replace view public.public_activity_cards
with (security_invoker = true)
as
select
  a.id,
  a.slug,
  a.name,
  a.category,
  a.phase,
  a.event_date,
  a.location,
  a.summary
from public.activities a
where a.public_visible = true;

grant select on public.public_activity_cards to anon, authenticated;

create or replace view public.public_activity_media
with (security_invoker = true)
as
select
  m.id,
  m.activity_id,
  m.type,
  m.provider,
  m.title,
  m.public_url,
  m.external_file_id,
  m.thumbnail_url,
  m.sort_order,
  m.is_cover
from public.activity_media m
where m.public_visible = true
  and exists (
    select 1 from public.activities a
    where a.id = m.activity_id and a.public_visible = true
  );

grant select on public.public_activity_media to anon, authenticated;

-- ============================================================
-- DEFAULT PRIVILEGES HARDENING
-- Future tables/functions should not accidentally become public-writeable.
-- ============================================================

alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke all on functions from anon, authenticated;

commit;
