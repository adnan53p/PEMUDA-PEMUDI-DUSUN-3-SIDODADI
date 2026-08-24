import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'
import type { UserRole } from './types'

const roleHome: Record<UserRole, string> = {
  superadmin: '/superadmin',
  admin: '/admin',
  humas: '/humas',
}

interface ProtectedRouteProps {
  children: ReactNode
  allowedRoles: UserRole[]
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-offwhite px-6 text-center">
        <div>
          <p className="eyebrow text-forest">PEMUDA DUSUN 3 SIDODADI</p>
          <p className="mt-3 text-sm font-semibold text-muted">Memeriksa sesi akun…</p>
        </div>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (!allowedRoles.includes(user.role)) return <Navigate to={roleHome[user.role]} replace />
  return children
}

export function getRoleHome(role: UserRole) {
  return roleHome[role]
}
