import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const root = process.cwd()
const migrationPath = path.join(root, 'supabase/migrations/202608240001_initial_schema_auth_rls.sql')
const sql = fs.readFileSync(migrationPath, 'utf8')

const expectedTables = [
  'organization_periods',
  'profiles',
  'activities',
  'activity_committee_members',
  'humas_assignments',
  'humas_assignment_permissions',
  'community_members',
  'activity_collection_targets',
  'budget_items',
  'financial_transactions',
  'transaction_evidence',
  'cash_reconciliations',
  'activity_reports',
  'activity_media',
  'audit_logs',
]

const errors = []
for (const table of expectedTables) {
  if (!new RegExp(`create table if not exists public\\.${table}\\b`, 'i').test(sql)) {
    errors.push(`table missing: ${table}`)
  }
  if (!new RegExp(`alter table public\\.${table} enable row level security`, 'i').test(sql)) {
    errors.push(`RLS missing: ${table}`)
  }
}

const requiredMarkers = [
  'references auth.users(id)',
  'create trigger on_auth_user_created',
  'raw_app_meta_data',
  'create or replace function public.is_assigned_humas',
  'create or replace function public.humas_has_permission',
  'create or replace trigger financial_transactions_no_delete',
  'create or replace trigger activities_financial_lock_guard',
  'create or replace trigger activity_reports_approval_guard',
  'create or replace trigger budget_items_locked_guard',
  'create or replace view public.public_activity_cards',
  'alter default privileges in schema public revoke all on tables from anon, authenticated',
]
for (const marker of requiredMarkers) {
  if (!sql.toLowerCase().includes(marker.toLowerCase())) errors.push(`marker missing: ${marker}`)
}

// Phase 01 invariant: browser roles must not get direct transaction write grants.
if (/grant\s+(?:insert|update|delete)[^;]*financial_transactions/i.test(sql)) {
  errors.push('financial_transactions must remain client read-only in Phase 01')
}
if (/raw_user_meta_data\s*->>\s*'role'/i.test(sql)) {
  errors.push('role must never be provisioned from raw_user_meta_data')
}

if (errors.length) {
  console.error('SUPABASE PHASE 01 AUDIT: FAIL')
  for (const error of errors) console.error(`- ${error}`)
  process.exit(1)
}

console.log(`SUPABASE PHASE 01 AUDIT: PASS (${expectedTables.length} tables + RLS + Auth guard checked)`)
console.log('Operational financial writes: intentionally disabled until safe RPC phase')
