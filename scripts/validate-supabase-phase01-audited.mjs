import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const root = process.cwd()
const initial = fs.readFileSync(path.join(root, 'supabase/migrations/202608240001_initial_schema_auth_rls.sql'), 'utf8')
const patch = fs.readFileSync(path.join(root, 'supabase/migrations/202608240002_phase01_audit_corrections.sql'), 'utf8')
const all = `${initial}\n${patch}`
const errors = []

const markers = [
  'create or replace function public.is_admin_operator()',
  'create or replace function public.is_active_humas()',
  'public.is_active_humas() and exists',
  'humas_assignments_scope_ci_uidx',
  'cash_reconciliations_difference_chk',
  'CASH_RECONCILIATION_ASSIGNMENT_MISMATCH',
  'assignment_permissions_locked_guard',
  'BUDGET_ITEM_HAS_TRANSACTION_HISTORY',
  'activity_media_cover_photo_only_chk',
  'LPJ_APPROVAL_ADMIN_ONLY',
  'activity_reports_lock_sync',
  'revoke insert, update on public.activity_reports from authenticated',
  'grant update (period_id, slug, name, category, phase, event_date, location, summary, public_visible)',
  'create or replace function public.audit_structural_change()',
]
for (const marker of markers) if (!all.toLowerCase().includes(marker.toLowerCase())) errors.push(`missing: ${marker}`)

if (!/values \(new\.id, v_username, v_full_name, v_role, nullif\(new\.phone, ''\), v_is_provisioned\)/i.test(patch)) {
  errors.push('self-signup inactive provisioning guard missing')
}
if (!/create policy activities_admin_insert[\s\S]*public\.is_admin_operator\(\)/i.test(patch)) {
  errors.push('activities operational write is not Admin-only')
}
if (!/create policy transactions_scoped_read[\s\S]*public\.is_active_humas\(\)/i.test(patch)) {
  errors.push('transaction Humas read does not require active Humas')
}
if (/create policy activities_admin_insert[\s\S]{0,250}is_admin_or_superadmin/i.test(patch)) {
  errors.push('activities write still grants Superadmin operational mutation')
}

if (errors.length) {
  console.error('SUPABASE PHASE 01 AUDITED: FAIL')
  errors.forEach((e) => console.error(`- ${e}`))
  process.exit(1)
}

console.log('SUPABASE PHASE 01 AUDITED: PASS')
console.log('Role split, active-Humas RLS, LPJ lock lifecycle, cash reconciliation, RAB/history, and structural audit markers checked.')
