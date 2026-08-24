-- PEMUDA DUSUN 3 SIDODADI
-- PostgreSQL schema blueprint ONLY.
-- BELUM dijalankan ke Supabase / database apa pun.
-- Tidak berisi RLS, auth.uid(), credential, storage bucket, atau secret.

create extension if not exists pgcrypto;

create type app_user_role as enum ('superadmin', 'admin', 'humas');
create type activity_phase as enum ('planning', 'fundraising', 'active', 'settlement', 'lpj', 'completed');
create type assignment_permission as enum ('collect_dues', 'record_purchases', 'handover_cash');
create type transaction_kind as enum ('income', 'expense', 'handover');
create type transaction_status as enum ('received_by_humas', 'pending_verification', 'verified', 'rejected', 'cancelled');
create type funding_source as enum ('activity_cash', 'humas_cash', 'personal_reimburse', 'advance', 'other');
create type report_status as enum ('draft', 'ready', 'approved');
create type media_type as enum ('photo', 'video');
create type media_provider as enum ('imagekit', 'youtube', 'google_drive');

create table organization_periods (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  starts_on date not null,
  ends_on date not null,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  check (ends_on >= starts_on)
);

create unique index organization_periods_single_active_idx
  on organization_periods (is_active)
  where is_active = true;

create table profiles (
  id uuid primary key,
  username text not null,
  full_name text not null,
  role app_user_role not null,
  phone text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index profiles_username_lower_uidx on profiles (lower(username));

create table activities (
  id uuid primary key default gen_random_uuid(),
  period_id uuid references organization_periods(id) on delete set null,
  slug text not null,
  name text not null,
  category text not null,
  phase activity_phase not null default 'planning',
  event_date date not null,
  location text not null,
  summary text not null default '',
  public_visible boolean not null default false,
  financial_locked boolean not null default false,
  locked_at timestamptz,
  locked_by_user_id uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index activities_slug_uidx on activities (lower(slug));
create index activities_period_idx on activities(period_id);
create index activities_phase_idx on activities(phase);
create index activities_public_idx on activities(public_visible, event_date desc);

create table activity_committee_members (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references activities(id) on delete cascade,
  user_id uuid references profiles(id) on delete set null,
  name text not null,
  role_title text not null,
  phone text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index committee_activity_idx on activity_committee_members(activity_id, sort_order);

create table humas_assignments (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references activities(id) on delete cascade,
  humas_user_id uuid not null references profiles(id) on delete restrict,
  area_label text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (activity_id, humas_user_id, area_label)
);

create index humas_assignments_user_idx on humas_assignments(humas_user_id, is_active);
create index humas_assignments_activity_idx on humas_assignments(activity_id, is_active);

create table humas_assignment_permissions (
  assignment_id uuid not null references humas_assignments(id) on delete cascade,
  permission assignment_permission not null,
  primary key (assignment_id, permission)
);

create table community_members (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  area_label text not null,
  phone text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index community_members_area_idx on community_members(area_label, is_active);
create index community_members_name_idx on community_members(lower(full_name));

create table activity_collection_targets (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references activities(id) on delete cascade,
  assignment_id uuid not null references humas_assignments(id) on delete restrict,
  member_id uuid not null references community_members(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (activity_id, member_id)
);

create index collection_targets_assignment_idx on activity_collection_targets(assignment_id);

create table budget_items (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references activities(id) on delete cascade,
  category text not null,
  planned_amount bigint not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (planned_amount >= 0)
);

create unique index budget_activity_category_uidx on budget_items(activity_id, lower(category));

create table financial_transactions (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references activities(id) on delete restrict,
  kind transaction_kind not null,
  status transaction_status not null,
  label text not null,
  category text not null,
  amount bigint not null,
  created_by_user_id uuid not null references profiles(id) on delete restrict,
  assignment_id uuid references humas_assignments(id) on delete restrict,
  collection_target_id uuid references activity_collection_targets(id) on delete restrict,
  area_label_snapshot text,
  funding_source funding_source,
  vendor text,
  quantity numeric(14,3),
  unit_price bigint,
  payment_method text,
  note text,
  transaction_date date not null default current_date,
  verified_by_user_id uuid references profiles(id) on delete set null,
  verified_at timestamptz,
  handover_recipient_user_id uuid references profiles(id) on delete set null,
  cancellation_reason text,
  correction_of_transaction_id uuid references financial_transactions(id) on delete restrict,
  corrected_by_transaction_id uuid references financial_transactions(id) on delete restrict,
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

create index transactions_activity_date_idx on financial_transactions(activity_id, transaction_date desc);
create index transactions_assignment_idx on financial_transactions(assignment_id, transaction_date desc);
create index transactions_target_idx on financial_transactions(collection_target_id);
create index transactions_status_idx on financial_transactions(status, kind);
create index transactions_category_idx on financial_transactions(activity_id, category);

create table transaction_evidence (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references financial_transactions(id) on delete cascade,
  title text not null,
  provider text not null check (provider in ('imagekit', 'external_url')),
  url text not null,
  mime_type text,
  created_at timestamptz not null default now()
);

create index transaction_evidence_transaction_idx on transaction_evidence(transaction_id);

create table cash_reconciliations (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references activities(id) on delete restrict,
  assignment_id uuid not null references humas_assignments(id) on delete restrict,
  humas_user_id uuid not null references profiles(id) on delete restrict,
  expected_amount bigint not null,
  physical_amount bigint not null,
  difference bigint not null,
  note text,
  reconciled_at timestamptz not null default now(),
  created_by_user_id uuid not null references profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);

create index cash_reconciliation_assignment_idx on cash_reconciliations(assignment_id, reconciled_at desc);

create table activity_reports (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references activities(id) on delete cascade,
  title text not null,
  report_type text not null,
  period_label text not null,
  status report_status not null default 'draft',
  approved_by_user_id uuid references profiles(id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((status <> 'approved') or (approved_by_user_id is not null and approved_at is not null))
);

create index activity_reports_activity_idx on activity_reports(activity_id, status);

create table activity_media (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references activities(id) on delete cascade,
  type media_type not null,
  provider media_provider not null,
  title text not null,
  public_url text not null,
  external_file_id text,
  thumbnail_url text,
  sort_order integer not null default 0,
  is_cover boolean not null default false,
  public_visible boolean not null default true,
  created_by_user_id uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((type = 'photo' and provider = 'imagekit') or (type = 'video' and provider in ('youtube', 'google_drive')))
);

create index activity_media_activity_idx on activity_media(activity_id, sort_order);
create unique index activity_media_one_cover_uidx
  on activity_media(activity_id)
  where is_cover = true;

create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references profiles(id) on delete set null,
  action text not null,
  entity_type text,
  entity_id uuid,
  reason text,
  detail text not null,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz not null default now()
);

create index audit_logs_actor_idx on audit_logs(actor_user_id, created_at desc);
create index audit_logs_entity_idx on audit_logs(entity_type, entity_id, created_at desc);
create index audit_logs_created_idx on audit_logs(created_at desc);

-- Derived values intentionally NOT stored as editable columns:
-- 1) RAB realization / terpakai
-- 2) Humas cash balance
-- 3) Activity cash balance
-- 4) total collected dues
-- 5) contribution progress
-- These will be queries/views/RPCs later so every page reads one source of truth.

-- NEXT PHASE ONLY (not included here):
-- - bind profiles.id to Supabase auth.users(id)
-- - RLS policies by role + activity assignment
-- - safe RPC for transactional writes
-- - authenticated ImageKit upload broker + signed private evidence delivery
-- - public sanitized views for website transparency
-- - immutable/audited correction workflow
