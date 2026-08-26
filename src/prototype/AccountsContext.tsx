import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { ActivityAssignment, ActivityPermission, AuthUser, DemoCredential, UserRole } from '../auth/types'
import { initialDemoCredentials } from '../data/internal/demoUsers'
import { useOperations } from './OperationsContext'
import { SUPABASE_CONFIGURED, supabase } from '../lib/supabaseClient'
import { createManagedAccount, resetManagedAccountPassword, setManagedAccountActive } from '../auth/accountManagementService'

interface CreateHumasAccountInput {
  email: string
  fullName: string
  username: string
  password: string
  phone?: string
  assignment: {
    activityId: string
    activityName: string
    areaLabel?: string
    permissions: ActivityPermission[]
  }
}

interface CreateAdminAccountInput {
  email: string
  fullName: string
  username: string
  password: string
  phone?: string
}

interface AddHumasAssignmentInput {
  userId: string
  activityId: string
  activityName: string
  areaLabel?: string
  permissions: ActivityPermission[]
}

interface ActionResult {
  ok: boolean
  message: string
}

interface AccountsContextValue {
  accounts: DemoCredential[]
  publicUsers: AuthUser[]
  humasAccounts: DemoCredential[]
  adminAccounts: DemoCredential[]
  productionAccounts: boolean
  accountsLoading: boolean
  refreshAccounts: () => Promise<void>
  findCredential: (username: string, password: string) => DemoCredential | null
  findAccountById: (id: string) => DemoCredential | undefined
  createHumasAccount: (input: CreateHumasAccountInput) => Promise<{ ok: boolean; message: string; account?: DemoCredential }>
  createAdminAccount: (input: CreateAdminAccountInput) => Promise<{ ok: boolean; message: string; account?: DemoCredential }>
  addHumasAssignment: (input: AddHumasAssignmentInput) => Promise<{ ok: boolean; message: string; assignment?: ActivityAssignment }>
  setHumasActive: (userId: string, active: boolean) => Promise<ActionResult>
  setAdminActive: (userId: string, active: boolean) => Promise<ActionResult>
  resetHumasPassword: (userId: string, password: string) => Promise<ActionResult>
  resetAdminPassword: (userId: string, password: string) => Promise<ActionResult>
}

interface ProfileRow {
  id: string
  username: string
  full_name: string
  role: UserRole
  phone: string | null
  is_active: boolean
}

const AccountsContext = createContext<AccountsContextValue | null>(null)

const operationToPermission: Record<string, ActivityPermission | undefined> = {
  Iuran: 'collect_dues',
  Belanja: 'record_purchases',
  'Serah Kas': 'handover_cash',
}
const permissionToOperation: Record<ActivityPermission, string> = {
  collect_dues: 'Iuran',
  record_purchases: 'Belanja',
  handover_cash: 'Serah Kas',
}

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'HM'
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('') || 'HM'
}

function sanitize(account: DemoCredential): AuthUser {
  return {
    id: account.id,
    username: account.username,
    fullName: account.fullName,
    role: account.role,
    initials: account.initials,
    isActive: account.isActive,
    phone: account.phone,
    assignments: account.assignments,
  }
}

function profileToAccount(profile: ProfileRow): DemoCredential {
  return {
    id: profile.id,
    username: profile.username,
    password: '',
    fullName: profile.full_name,
    role: profile.role,
    initials: initialsFromName(profile.full_name),
    isActive: profile.is_active,
    phone: profile.phone ?? undefined,
    assignments: [],
  }
}

export function AccountsProvider({ children }: { children: ReactNode }) {
  const { assignments, addAssignment } = useOperations()
  const [baseAccounts, setBaseAccounts] = useState<DemoCredential[]>(() => SUPABASE_CONFIGURED ? [] : initialDemoCredentials.map((account) => ({
    ...account,
    assignments: [],
  })))
  const [accountsLoading, setAccountsLoading] = useState(SUPABASE_CONFIGURED)

  const refreshProductionAccounts = useCallback(async () => {
    if (!SUPABASE_CONFIGURED || !supabase) {
      setAccountsLoading(false)
      return
    }

    setAccountsLoading(true)
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      if (!sessionData.session) {
        setBaseAccounts([])
        return
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, full_name, role, phone, is_active')
        .in('role', ['admin', 'humas'])
        .order('full_name', { ascending: true })

      if (error) throw error
      setBaseAccounts(((data ?? []) as ProfileRow[]).map(profileToAccount))
    } catch {
      setBaseAccounts([])
    } finally {
      setAccountsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!SUPABASE_CONFIGURED || !supabase) return

    void refreshProductionAccounts()
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setBaseAccounts([])
        setAccountsLoading(false)
        return
      }
      window.setTimeout(() => void refreshProductionAccounts(), 0)
    })
    return () => listener.subscription.unsubscribe()
  }, [refreshProductionAccounts])

  const assignmentsForUser = (userId: string): ActivityAssignment[] => assignments
    .filter((item) => item.humasUserId === userId)
    .map((item) => ({
      id: item.id,
      activityId: item.activityId,
      activityName: item.activity,
      areaLabel: item.area,
      permissions: item.permissions.map((permission) => operationToPermission[permission]).filter(Boolean) as ActivityPermission[],
    }))

  const enrich = (account: DemoCredential): DemoCredential => ({
    ...account,
    assignments: account.role === 'humas' ? assignmentsForUser(account.id) : [],
  })

  const accounts = useMemo(() => baseAccounts.map(enrich), [baseAccounts, assignments])

  const findCredential = (username: string, password: string) => {
    if (SUPABASE_CONFIGURED) return null
    const normalized = username.trim().toLowerCase()
    const account = baseAccounts.find((item) => item.isActive && item.username.toLowerCase() === normalized && item.password === password)
    return account ? enrich(account) : null
  }

  const findAccountById = (id: string) => {
    const account = baseAccounts.find((item) => item.id === id)
    return account ? enrich(account) : undefined
  }

  const createHumasAccount = async (input: CreateHumasAccountInput) => {
    const email = input.email.trim().toLowerCase()
    const username = input.username.trim().toLowerCase()
    if (!email || !input.fullName.trim() || !username || !input.password) return { ok: false, message: 'Email, nama, username, dan password wajib diisi.' }
    if (input.password.length < 6) return { ok: false, message: 'Password minimal 6 karakter.' }
    if (baseAccounts.some((account) => account.username.toLowerCase() === username)) return { ok: false, message: 'Username sudah digunakan.' }
    if (input.assignment.permissions.length === 0) return { ok: false, message: 'Pilih minimal satu tugas.' }

    if (SUPABASE_CONFIGURED) {
      const result = await createManagedAccount({
        email,
        fullName: input.fullName,
        username,
        password: input.password,
        phone: input.phone,
        role: 'humas',
      })
      if (!result.ok || !result.userId) return { ok: false, message: result.message }

      const assignmentResult = await addAssignment({
        humasUserId: result.userId,
        humas: input.fullName.trim(),
        activityId: input.assignment.activityId,
        activity: input.assignment.activityName,
        area: input.assignment.areaLabel?.trim() || 'Tanpa wilayah',
        permissions: input.assignment.permissions.map((permission) => permissionToOperation[permission]),
      })
      await refreshProductionAccounts()
      if (!assignmentResult.ok) {
        return {
          ok: false,
          message: `${result.message} Akun berhasil dibuat, tetapi penugasan belum berhasil: ${assignmentResult.message} Tambahkan penugasan dari akun Humas yang sudah ada.`,
        }
      }

      const assignmentId = assignmentResult.id ?? `assign-${Date.now()}`
      const account: DemoCredential = {
        id: result.userId,
        username,
        password: '',
        fullName: input.fullName.trim(),
        role: 'humas',
        initials: initialsFromName(input.fullName),
        isActive: true,
        phone: input.phone?.trim() || undefined,
        assignments: [{ id: assignmentId, ...input.assignment }],
      }
      return { ok: true, message: `${result.message} Penugasan Humas berhasil disimpan.`, account }
    }

    const id = `usr-humas-${Date.now()}`
    const assignmentId = `assign-${Date.now()}-${Math.random().toString(16).slice(2)}`
    const account: DemoCredential = {
      id,
      username,
      password: input.password,
      fullName: input.fullName.trim(),
      role: 'humas',
      initials: initialsFromName(input.fullName),
      isActive: true,
      phone: input.phone?.trim() || undefined,
      assignments: [],
    }
    setBaseAccounts((items) => [...items, account])
    await addAssignment({
      assignmentId,
      humasUserId: id,
      humas: account.fullName,
      activityId: input.assignment.activityId,
      activity: input.assignment.activityName,
      area: input.assignment.areaLabel?.trim() || 'Tanpa wilayah',
      permissions: input.assignment.permissions.map((permission) => permissionToOperation[permission]),
    })
    return {
      ok: true,
      message: 'Akun Humas berhasil dibuat dan penugasannya berhasil disimpan.',
      account: { ...account, assignments: [{ id: assignmentId, ...input.assignment }] },
    }
  }

  const createAdminAccount = async (input: CreateAdminAccountInput) => {
    const email = input.email.trim().toLowerCase()
    const username = input.username.trim().toLowerCase()
    if (!email || !input.fullName.trim() || !username || !input.password) return { ok: false, message: 'Email, nama, username, dan password wajib diisi.' }
    if (input.password.length < 6) return { ok: false, message: 'Password minimal 6 karakter.' }
    if (baseAccounts.some((account) => account.username.toLowerCase() === username)) return { ok: false, message: 'Username sudah digunakan.' }

    if (SUPABASE_CONFIGURED) {
      const result = await createManagedAccount({
        email,
        fullName: input.fullName,
        username,
        password: input.password,
        phone: input.phone,
        role: 'admin',
      })
      if (!result.ok || !result.userId) return { ok: false, message: result.message }
      await refreshProductionAccounts()
      const account: DemoCredential = {
        id: result.userId,
        username,
        password: '',
        fullName: input.fullName.trim(),
        role: 'admin',
        initials: initialsFromName(input.fullName),
        isActive: true,
        phone: input.phone?.trim() || undefined,
        assignments: [],
      }
      return { ok: true, message: result.message, account }
    }

    const account: DemoCredential = {
      id: `usr-admin-${Date.now()}`,
      username,
      password: input.password,
      fullName: input.fullName.trim(),
      role: 'admin',
      initials: initialsFromName(input.fullName),
      isActive: true,
      phone: input.phone?.trim() || undefined,
      assignments: [],
    }
    setBaseAccounts((items) => [...items, account])
    return { ok: true, message: 'Akun Admin berhasil dibuat.', account }
  }

  const addHumasAssignment = async (input: AddHumasAssignmentInput) => {
    const account = baseAccounts.find((item) => item.id === input.userId && item.role === 'humas')
    if (!account) return { ok: false, message: 'Akun Humas tidak ditemukan.' }
    if (input.permissions.length === 0) return { ok: false, message: 'Pilih minimal satu tugas.' }
    const normalizedArea = input.areaLabel?.trim().toLowerCase() ?? ''
    if (assignments.some((assignment) => assignment.humasUserId === input.userId && assignment.activityId === input.activityId && assignment.area.trim().toLowerCase() === normalizedArea)) {
      return { ok: false, message: 'Humas sudah memiliki penugasan pada kegiatan dan wilayah/tugas ini.' }
    }
    const assignmentId = `assign-${Date.now()}-${Math.random().toString(16).slice(2)}`
    const result = await addAssignment({
      assignmentId,
      humasUserId: input.userId,
      humas: account.fullName,
      activityId: input.activityId,
      activity: input.activityName,
      area: input.areaLabel?.trim() || 'Tanpa wilayah',
      permissions: input.permissions.map((permission) => permissionToOperation[permission]),
    })
    if (!result.ok) return { ok: false, message: result.message }
    const assignment: ActivityAssignment = {
      id: result.id ?? assignmentId,
      activityId: input.activityId,
      activityName: input.activityName,
      areaLabel: input.areaLabel,
      permissions: input.permissions,
    }
    return { ok: true, message: SUPABASE_CONFIGURED ? 'Penugasan Humas berhasil disimpan.' : 'Penugasan tambahan berhasil diberikan.', assignment }
  }

  const setRoleActive = async (userId: string, role: Extract<UserRole, 'admin' | 'humas'>, active: boolean): Promise<ActionResult> => {
    if (SUPABASE_CONFIGURED) {
      const result = await setManagedAccountActive(userId, role, active)
      if (result.ok) await refreshProductionAccounts()
      return result
    }
    setBaseAccounts((items) => items.map((item) => item.id === userId && item.role === role ? { ...item, isActive: active } : item))
    return { ok: true, message: active ? 'Akun diaktifkan.' : 'Akun dinonaktifkan.' }
  }
  const setHumasActive = (userId: string, active: boolean) => setRoleActive(userId, 'humas', active)
  const setAdminActive = (userId: string, active: boolean) => setRoleActive(userId, 'admin', active)

  const resetRolePassword = async (userId: string, role: Extract<UserRole, 'admin' | 'humas'>, password: string): Promise<ActionResult> => {
    if (password.length < 6) return { ok: false, message: 'Password minimal 6 karakter.' }
    if (!baseAccounts.some((item) => item.id === userId && item.role === role)) return { ok: false, message: 'Akun tidak ditemukan.' }
    if (SUPABASE_CONFIGURED) return resetManagedAccountPassword(userId, role, password)
    setBaseAccounts((items) => items.map((item) => item.id === userId && item.role === role ? { ...item, password } : item))
    return { ok: true, message: 'Kata sandi berhasil direset.' }
  }
  const resetHumasPassword = (userId: string, password: string) => resetRolePassword(userId, 'humas', password)
  const resetAdminPassword = (userId: string, password: string) => resetRolePassword(userId, 'admin', password)

  const value = useMemo<AccountsContextValue>(() => ({
    accounts,
    publicUsers: accounts.map(sanitize),
    humasAccounts: accounts.filter((account) => account.role === 'humas'),
    adminAccounts: accounts.filter((account) => account.role === 'admin'),
    productionAccounts: SUPABASE_CONFIGURED,
    accountsLoading,
    refreshAccounts: refreshProductionAccounts,
    findCredential,
    findAccountById,
    createHumasAccount,
    createAdminAccount,
    addHumasAssignment,
    setHumasActive,
    setAdminActive,
    resetHumasPassword,
    resetAdminPassword,
  }), [accounts, accountsLoading, assignments, refreshProductionAccounts])

  return <AccountsContext.Provider value={value}>{children}</AccountsContext.Provider>
}

export function useAccounts() {
  const value = useContext(AccountsContext)
  if (!value) throw new Error('useAccounts harus digunakan di dalam AccountsProvider')
  return value
}
