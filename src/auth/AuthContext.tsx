import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { AuthUser, UserRole } from './types'
import { SUPABASE_CONFIGURED, supabase } from '../lib/supabaseClient'
import { loadAuthenticatedUser } from './supabaseAuthService'

interface LoginResult {
  ok: boolean
  message?: string
  user?: AuthUser
}

interface AuthContextValue {
  user: AuthUser | null
  loading: boolean
  supabaseConfigured: boolean
  login: (email: string, password: string, expectedRole?: UserRole) => Promise<LoginResult>
  logout: () => Promise<void>
  isRole: (...roles: UserRole[]) => boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

function authErrorMessage(message: string) {
  const normalized = message.toLowerCase()
  if (normalized.includes('invalid login credentials')) return 'Email atau kata sandi tidak sesuai.'
  if (normalized.includes('email not confirmed')) return 'Email akun belum dikonfirmasi.'
  return 'Login gagal. Periksa akun dan koneksi internet Anda.'
}

const roleLabels: Record<UserRole, string> = {
  superadmin: 'Superadmin',
  admin: 'Admin',
  humas: 'Humas',
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshCurrentUser = useCallback(async () => {
    if (!supabase) {
      setUser(null)
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase.auth.getUser()
      if (error || !data.user) {
        setUser(null)
        return
      }
      const appUser = await loadAuthenticatedUser(data.user)
      setUser(appUser)
    } catch {
      setUser(null)
      await supabase.auth.signOut().catch(() => undefined)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }

    let active = true
    void refreshCurrentUser()

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return
      if (!session) {
        setUser(null)
        setLoading(false)
        return
      }
      void refreshCurrentUser()
    })

    return () => {
      active = false
      listener.subscription.unsubscribe()
    }
  }, [refreshCurrentUser])

  const value = useMemo<AuthContextValue>(() => ({
    user,
    loading,
    supabaseConfigured: SUPABASE_CONFIGURED,
    login: async (email, password, expectedRole) => {
      if (!supabase) {
        return {
          ok: false,
          message: 'Supabase belum dikonfigurasi. Isi VITE_SUPABASE_URL dan publishable key pada file .env.',
        }
      }

      const normalizedEmail = email.trim().toLowerCase()
      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      })

      if (error || !data.user) {
        return { ok: false, message: authErrorMessage(error?.message ?? 'Login gagal') }
      }

      try {
        const appUser = await loadAuthenticatedUser(data.user)

        if (expectedRole && appUser.role !== expectedRole) {
          await supabase.auth.signOut().catch(() => undefined)
          setUser(null)
          return {
            ok: false,
            message: `Akun ini terdaftar sebagai ${roleLabels[appUser.role]}, bukan ${roleLabels[expectedRole]}. Silakan pilih akses ${roleLabels[appUser.role]}.`,
          }
        }

        setUser(appUser)
        return { ok: true, user: appUser }
      } catch (profileError) {
        await supabase.auth.signOut().catch(() => undefined)
        setUser(null)
        return {
          ok: false,
          message: profileError instanceof Error ? profileError.message : 'Profil akun tidak dapat divalidasi.',
        }
      }
    },
    logout: async () => {
      try {
        if (supabase) await supabase.auth.signOut()
      } finally {
        setUser(null)
      }
    },
    isRole: (...roles) => Boolean(user && roles.includes(user.role)),
  }), [loading, user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth harus digunakan di dalam AuthProvider')
  return value
}
