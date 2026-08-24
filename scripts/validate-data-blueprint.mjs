import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const sqlPath = path.join(root, 'docs', 'POSTGRES_SCHEMA_BLUEPRINT.sql')
const modelPath = path.join(root, 'src', 'domain', 'productionTypes.ts')
const rulesPath = path.join(root, 'src', 'domain', 'productionRules.ts')

const sql = fs.readFileSync(sqlPath, 'utf8')
const model = fs.readFileSync(modelPath, 'utf8')
const rules = fs.readFileSync(rulesPath, 'utf8')

const requiredTables = [
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

const failures = []
for (const table of requiredTables) {
  if (!new RegExp(`create\\s+table\\s+${table}\\b`, 'i').test(sql)) failures.push(`Missing table: ${table}`)
}

const forbiddenRuntimeTokens = ['createClient(', 'supabaseUrl', 'supabaseKey', 'auth.uid()']
for (const token of forbiddenRuntimeTokens) {
  if (model.includes(token) || rules.includes(token)) failures.push(`Domain model unexpectedly contains runtime Supabase token: ${token}`)
}

if (!sql.includes('unique (activity_id, member_id)')) failures.push('Missing unique activity/member collection target constraint')
if (!sql.includes("status <> 'pending_verification'")) failures.push('Missing rule: voluntary dues must not wait for per-resident Admin verification')
if (!sql.includes('activity_media_one_cover_uidx')) failures.push('Missing one-cover-per-activity constraint')
if (!sql.includes('budget_activity_category_uidx')) failures.push('Missing unique budget category per activity constraint')
if (!model.includes('ActivityCollectionTargetRow')) failures.push('Missing canonical collection target model')
if (!model.includes('FinancialTransactionRow')) failures.push('Missing canonical financial transaction model')
if (!rules.includes('validateTransactionInvariant')) failures.push('Missing transaction invariant validator')

if (failures.length) {
  console.error('DATA BLUEPRINT AUDIT: FAIL')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(`DATA BLUEPRINT AUDIT: PASS (${requiredTables.length} tables checked)`)
console.log('Supabase runtime integration: NOT PRESENT in production domain model')
