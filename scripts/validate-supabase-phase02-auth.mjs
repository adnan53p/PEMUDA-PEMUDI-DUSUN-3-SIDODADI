import { readFileSync, existsSync } from 'node:fs'

const requiredFiles = [
  'src/lib/supabaseClient.ts',
  'src/auth/supabaseAuthService.ts',
  'src/auth/AuthContext.tsx',
  'src/auth/ProtectedRoute.tsx',
  'src/auth/accountManagementService.ts',
  'src/pages/LoginPage.tsx',
  'src/pages/internal/AdminAccountsPage.tsx',
  'src/pages/internal/AdminCommitteeHumasPage.tsx',
  'supabase/functions/manage-account/index.ts',
  '.env.example',
]

for (const file of requiredFiles) {
  if (!existsSync(file)) throw new Error(`PHASE02_AUTH_MISSING_FILE: ${file}`)
}

const pkg = JSON.parse(readFileSync('package.json', 'utf8'))
if (!pkg.dependencies?.['@supabase/supabase-js']) throw new Error('PHASE02_AUTH_MISSING_SUPABASE_JS')
if (!pkg.scripts?.['audit:supabase-phase02-auth']) throw new Error('PHASE02_AUTH_MISSING_AUDIT_SCRIPT')

const client = readFileSync('src/lib/supabaseClient.ts', 'utf8')
const auth = readFileSync('src/auth/AuthContext.tsx', 'utf8')
const service = readFileSync('src/auth/supabaseAuthService.ts', 'utf8')
const accountService = readFileSync('src/auth/accountManagementService.ts', 'utf8')
const edge = readFileSync('supabase/functions/manage-account/index.ts', 'utf8')
const login = readFileSync('src/pages/LoginPage.tsx', 'utf8')
const adminAccounts = readFileSync('src/pages/internal/AdminAccountsPage.tsx', 'utf8')
const humasAccounts = readFileSync('src/pages/internal/AdminCommitteeHumasPage.tsx', 'utf8')
const route = readFileSync('src/auth/ProtectedRoute.tsx', 'utf8')
const env = readFileSync('.env.example', 'utf8')
const gitignore = readFileSync('.gitignore', 'utf8')

const checks = [
  [client.includes('createClient'), 'createClient'],
  [client.includes('VITE_SUPABASE_URL'), 'VITE_SUPABASE_URL'],
  [client.includes('VITE_SUPABASE_PUBLISHABLE_KEY'), 'publishable key'],
  [auth.includes('signInWithPassword'), 'signInWithPassword'],
  [auth.includes('expectedRole') && auth.includes('appUser.role !== expectedRole'), 'selected-role server profile guard'],
  [auth.includes('auth.getUser'), 'server-validated getUser restore'],
  [auth.includes('onAuthStateChange'), 'onAuthStateChange'],
  [auth.includes('signOut'), 'signOut'],
  [service.includes(".from('profiles')"), 'profile lookup'],
  [service.includes('is_active'), 'active-profile guard'],
  [service.includes('humas_assignments'), 'Humas assignment loader'],
  [login.includes('type="email"'), 'email login input'],
  [login.includes('selectedRole') && login.includes('Pilih akses'), 'three-role login selector'],
  [!login.includes('Akun demo development'), 'demo credential panel removed'],
  [route.includes('loading'), 'route session loading guard'],
  [accountService.includes("functions.invoke('manage-account'"), 'frontend account management uses Edge Function'],
  [edge.includes('SUPABASE_SERVICE_ROLE_KEY'), 'service role isolated in Edge Function'],
  [edge.includes('canManage') && edge.includes("callerRole === 'superadmin'") && edge.includes("callerRole === 'admin'"), 'role-scoped account management'],
  [edge.includes('auth.admin.createUser'), 'Admin API account creation'],
  [edge.includes('auth.admin.updateUserById'), 'Admin API password reset'],
  [adminAccounts.includes('Email login') && adminAccounts.includes('createAdminAccount'), 'Admin provisioning UI'],
  [humasAccounts.includes('Email login') && humasAccounts.includes('createHumasAccount'), 'Humas provisioning UI'],
  [env.includes('VITE_SUPABASE_URL='), 'env URL'],
  [env.includes('VITE_SUPABASE_PUBLISHABLE_KEY='), 'env publishable key'],
  [!env.includes('SERVICE_ROLE'), 'service role absent from frontend env example'],
  [gitignore.split(/\r?\n/).includes('.env'), '.env ignored'],
]

const failed = checks.filter(([ok]) => !ok)
if (failed.length) {
  for (const [, label] of failed) console.error(`FAIL: ${label}`)
  process.exit(1)
}

console.log('SUPABASE PHASE 02 AUTH + ACCOUNT MANAGEMENT AUDIT: PASS')
console.log('Login, role guard, session restore, account provisioning, password reset, and activation controls checked.')
console.log('Authentication scope checked independently from the operational Phase 03 integration.')
