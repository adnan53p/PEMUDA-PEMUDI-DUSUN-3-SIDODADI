import type { UserRole } from './types'
import { supabase } from '../lib/supabaseClient'

export interface ManagedAccountInput {
  email: string
  fullName: string
  username: string
  password: string
  phone?: string
  role: Extract<UserRole, 'admin' | 'humas'>
}

export interface ManagedAccountResult {
  ok: boolean
  message: string
  userId?: string
}

type AccountActionPayload =
  | { action: 'create'; account: ManagedAccountInput }
  | { action: 'reset_password'; targetUserId: string; password: string; targetRole: Extract<UserRole, 'admin' | 'humas'> }
  | { action: 'set_active'; targetUserId: string; active: boolean; targetRole: Extract<UserRole, 'admin' | 'humas'> }

function normalizeInvokeError(message: string) {
  const normalized = message.toLowerCase()
  if (normalized.includes('failed to send a request') || normalized.includes('function not found') || normalized.includes('404')) {
    return 'Layanan pengelolaan akun belum tersedia. Hubungi pengelola website.'
  }
  return 'Pengelolaan akun gagal diproses. Periksa koneksi lalu coba lagi.'
}

async function invokeAccountAction(payload: AccountActionPayload): Promise<ManagedAccountResult> {
  if (!supabase) return { ok: false, message: 'Layanan pengelolaan akun belum tersedia.' }

  const { data, error } = await supabase.functions.invoke('manage-account', { body: payload })
  if (error) return { ok: false, message: normalizeInvokeError(error.message) }

  if (!data || typeof data !== 'object') return { ok: false, message: 'Respons pengelolaan akun tidak valid.' }
  const result = data as Partial<ManagedAccountResult>
  return {
    ok: result.ok === true,
    message: typeof result.message === 'string' ? result.message : result.ok ? 'Berhasil.' : 'Pengelolaan akun gagal.',
    userId: typeof result.userId === 'string' ? result.userId : undefined,
  }
}

export function createManagedAccount(input: ManagedAccountInput) {
  return invokeAccountAction({ action: 'create', account: input })
}

export function resetManagedAccountPassword(targetUserId: string, targetRole: 'admin' | 'humas', password: string) {
  return invokeAccountAction({ action: 'reset_password', targetUserId, targetRole, password })
}

export function setManagedAccountActive(targetUserId: string, targetRole: 'admin' | 'humas', active: boolean) {
  return invokeAccountAction({ action: 'set_active', targetUserId, targetRole, active })
}
