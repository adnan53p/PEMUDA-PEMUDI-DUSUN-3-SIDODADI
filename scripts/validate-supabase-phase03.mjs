import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const requiredFiles = [
  'src/data/operationsRepository.ts',
  'src/prototype/OperationsContext.tsx',
  'src/prototype/AccountsContext.tsx',
  'src/prototype/publicActivitySelectors.ts',
  'src/prototype/financeSelectors.ts',
  'src/components/internal/InternalNotice.tsx',
  'src/App.tsx',
  'supabase/migrations/202608240003_phase03_operations_finance.sql',
  'docs/SUPABASE_PHASE03_APPLY.sql',
  'SUPABASE_PHASE03_OPERATIONS_FINANCE_NOTES.md',
]

const fail = (message) => {
  console.error(`FAIL: ${message}`)
  process.exitCode = 1
}

for (const file of requiredFiles) {
  if (!existsSync(file)) fail(`missing file ${file}`)
}
if (process.exitCode) process.exit(1)

const read = (file) => readFileSync(file, 'utf8')
const migration = read('supabase/migrations/202608240003_phase03_operations_finance.sql')
const apply = read('docs/SUPABASE_PHASE03_APPLY.sql')
const repository = read('src/data/operationsRepository.ts')
const operations = read('src/prototype/OperationsContext.tsx')
const accounts = read('src/prototype/AccountsContext.tsx')
const app = read('src/App.tsx')
const publicSelectors = read('src/prototype/publicActivitySelectors.ts')
const financeSelectors = read('src/prototype/financeSelectors.ts')
const internalNotice = read('src/components/internal/InternalNotice.tsx')
const navbar = read('src/components/Navbar.tsx')
const pkg = JSON.parse(read('package.json'))

const checks = [
  [migration === apply, 'SQL Editor apply file must exactly match migration 003'],
  [migration.includes("'metadata_only'"), 'metadata-only transaction evidence support'],
  [migration.includes('add column if not exists created_by_role') && migration.includes('alter column created_by_role set not null'), 'immutable transaction role snapshot'],
  [migration.includes("te.provider <> 'metadata_only'"), 'metadata-only evidence is not falsely exposed as public proof'],
  [migration.includes('for update') && migration.includes('v_activity_locked'), 'financial mutation serialization and lock re-check'],
  [migration.includes('rpc_create_activity'), 'activity create RPC'],
  [migration.includes('rpc_create_humas_assignment'), 'Humas assignment RPC'],
  [migration.includes('rpc_add_collection_target'), 'collection target RPC'],
  [migration.includes('rpc_add_budget_item') || repository.includes(".from('budget_items').insert"), 'RAB mutation path'],
  [migration.includes('rpc_create_financial_transaction'), 'financial transaction RPC'],
  [migration.includes('rpc_set_financial_transaction_status'), 'financial verification RPC'],
  [migration.includes('rpc_cancel_financial_transaction'), 'transaction cancellation RPC'],
  [migration.includes('rpc_correct_income_transaction'), 'income correction RPC'],
  [migration.includes('rpc_record_cash_reconciliation'), 'cash reconciliation RPC'],
  [migration.includes('rpc_update_activity_report_status'), 'LPJ status RPC'],
  [migration.includes('rpc_unlock_activity'), 'audited unlock RPC'],
  [migration.includes('get_public_operations_snapshot'), 'sanitized public snapshot RPC'],
  [migration.includes("'full_name','Warga'"), 'public payer name masking'],
  [migration.includes("'id',ct.id,'full_name','Warga'"), 'public community UUID masking'],
  [migration.includes("'member_id',ct.id"), 'public member-id masking'],
  [migration.includes("'humas_user_id',ha.id"), 'public Humas user-id masking'],
  [migration.includes("'Iuran warga diterima Humas'"), 'public iuran label masking'],
  [repository.includes('loadInternalOperationsSnapshot'), 'internal snapshot loader'],
  [repository.includes('loadPublicOperationsSnapshot'), 'public snapshot loader'],
  [repository.includes("rpc('get_public_operations_snapshot'"), 'public snapshot repository call'],
  [repository.includes("rpc('rpc_create_financial_transaction'"), 'finance repository RPC call'],
  [operations.includes('ProductionOperationsProvider'), 'production operations provider'],
  [operations.includes('SUPABASE_CONFIGURED'), 'Supabase/prototype switch'],
  [operations.includes('loadPublicOperationsSnapshot') && operations.includes('loadInternalOperationsSnapshot'), 'session/public snapshot routing'],
  [operations.includes("snapshotMode === 'public'") && operations.includes('<ProductionOperationsProvider snapshotMode="public">'), 'public provider always selects sanitized public snapshot independent of authenticated session'],
  [app.includes('<PublicOperationsProvider><PublicLayout /></PublicOperationsProvider>'), 'all public routes are scoped to PublicOperationsProvider'],
  [operations.includes('export function categoriesMatch') && operations.includes('categoriesMatch(item.category, plan.category)'), 'RAB realization uses typo-tolerant normalized category matching'],
  [navbar.includes("user ? 'Workspace' : 'Masuk'") && navbar.includes('workspacePath'), 'public navbar exposes active authenticated workspace instead of always showing login'],
  [accounts.includes('await addAssignment'), 'Humas account assignment persisted'],
  [publicSelectors.includes('summarizeActivityFinance') && publicSelectors.includes('financeSummary.netBalance'), 'public activity transparency uses centralized net-balance summary'],
  [financeSelectors.includes('activityCashBalance') && financeSelectors.includes('netBalance: recordedIncome - totalExpense'), 'finance selector separates activity cash from public net balance'],
  [operations.includes('BroadcastChannel') && operations.includes('OPERATIONS_SYNC_STORAGE_KEY') && operations.includes('refreshSilently'), 'cross-tab and focus-safe operations refresh'],
  [internalNotice.includes('syncError') && internalNotice.includes('loading'), 'internal Supabase load/error notice'],
  [pkg.scripts?.['audit:supabase-phase03'] === 'node scripts/validate-supabase-phase03.mjs', 'Phase03 audit package script'],
]

const authIndex = app.indexOf('<AuthProvider>')
const operationsIndex = app.indexOf('<OperationsProvider>')
const accountsIndex = app.indexOf('<AccountsProvider>')
checks.push([authIndex >= 0 && authIndex < operationsIndex && operationsIndex < accountsIndex, 'provider order Auth -> Operations -> Accounts'])

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const file = join(dir, entry.name)
    return entry.isDirectory() ? walk(file) : [file]
  })
}
const srcFiles = walk('src')
const serviceRoleHits = srcFiles.filter((file) => read(file).includes('SUPABASE_SERVICE_ROLE_KEY'))
checks.push([serviceRoleHits.length === 0, `service role must not exist in frontend source (${serviceRoleHits.join(', ')})`])

const failed = checks.filter(([ok]) => !ok)
for (const [, label] of failed) fail(label)
if (failed.length) process.exit(1)

console.log('SUPABASE PHASE 03 OPERATIONS + FINANCE AUDIT: PASS')
console.log('Repository wiring, RPC finance workflow, public privacy masking, provider order, and frontend service-role isolation checked.')
