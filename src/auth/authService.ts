import type { AuthUser, DemoCredential } from './types'
import { DEMO_SESSION_TTL_MS } from '../config/auth'

const SESSION_KEY = 'pd3s_demo_session_v3'

interface StoredSession {
  userId: string
  expiresAt: number
}

export function sanitizeUser(user: DemoCredential): AuthUser {
  return {
    id: user.id,
    username: user.username,
    fullName: user.fullName,
    role: user.role,
    initials: user.initials,
    isActive: user.isActive,
    phone: user.phone,
    assignments: user.assignments,
  }
}

export function persistSession(user: AuthUser) {
  const session: StoredSession = {
    userId: user.id,
    expiresAt: Date.now() + DEMO_SESSION_TTL_MS,
  }
  window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

export function restoreSession(accounts: DemoCredential[]): AuthUser | null {
  try {
    const raw = window.sessionStorage.getItem(SESSION_KEY)
    if (!raw) return null

    const parsed = JSON.parse(raw) as Partial<StoredSession>
    if (!parsed.userId || !parsed.expiresAt || parsed.expiresAt <= Date.now()) {
      clearSession()
      return null
    }

    const account = accounts.find((item) => item.id === parsed.userId && item.isActive)
    if (!account) {
      clearSession()
      return null
    }

    return sanitizeUser(account)
  } catch {
    clearSession()
    return null
  }
}

export function clearSession() {
  window.sessionStorage.removeItem(SESSION_KEY)
}
