export type UserRole = 'superadmin' | 'admin' | 'humas'

export type ActivityPermission = 'collect_dues' | 'record_purchases' | 'handover_cash'

export interface ActivityAssignment {
  id: string
  activityId: string
  activityName: string
  areaLabel?: string
  permissions: ActivityPermission[]
}

export interface AuthUser {
  id: string
  username: string
  fullName: string
  role: UserRole
  initials: string
  isActive: boolean
  phone?: string
  assignments: ActivityAssignment[]
}

export interface DemoCredential extends AuthUser {
  password: string
}
