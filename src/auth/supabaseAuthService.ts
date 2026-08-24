import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabaseClient'
import type { ActivityAssignment, ActivityPermission, AuthUser, UserRole } from './types'

interface ProfileRow {
  id: string
  username: string
  full_name: string
  role: UserRole
  phone: string | null
  is_active: boolean
}

interface AssignmentRow {
  id: string
  activity_id: string
  area_label: string
}

interface ActivityRow {
  id: string
  name: string
}

interface PermissionRow {
  assignment_id: string
  permission: ActivityPermission
}

const validRoles: UserRole[] = ['superadmin', 'admin', 'humas']
const validPermissions: ActivityPermission[] = ['collect_dues', 'record_purchases', 'handover_cash']

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'PD'
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('') || 'PD'
}

function isUserRole(value: unknown): value is UserRole {
  return typeof value === 'string' && validRoles.includes(value as UserRole)
}

function isPermission(value: unknown): value is ActivityPermission {
  return typeof value === 'string' && validPermissions.includes(value as ActivityPermission)
}

async function loadHumasAssignments(userId: string): Promise<ActivityAssignment[]> {
  if (!supabase) return []

  const { data: rawAssignments, error: assignmentError } = await supabase
    .from('humas_assignments')
    .select('id, activity_id, area_label')
    .eq('humas_user_id', userId)
    .eq('is_active', true)

  if (assignmentError) throw new Error('Penugasan Humas tidak dapat dibaca.')

  const assignments = (rawAssignments ?? []) as AssignmentRow[]
  if (assignments.length === 0) return []

  const activityIds = Array.from(new Set(assignments.map((item) => item.activity_id)))
  const assignmentIds = assignments.map((item) => item.id)

  const [{ data: rawActivities, error: activityError }, { data: rawPermissions, error: permissionError }] = await Promise.all([
    supabase.from('activities').select('id, name').in('id', activityIds),
    supabase.from('humas_assignment_permissions').select('assignment_id, permission').in('assignment_id', assignmentIds),
  ])

  if (activityError) throw new Error('Kegiatan penugasan Humas tidak dapat dibaca.')
  if (permissionError) throw new Error('Permission Humas tidak dapat dibaca.')

  const activities = (rawActivities ?? []) as ActivityRow[]
  const permissions = (rawPermissions ?? []) as PermissionRow[]
  const activityNameById = new Map(activities.map((item) => [item.id, item.name]))

  return assignments.map((assignment) => ({
    id: assignment.id,
    activityId: assignment.activity_id,
    activityName: activityNameById.get(assignment.activity_id) ?? 'Kegiatan',
    areaLabel: assignment.area_label,
    permissions: permissions
      .filter((item) => item.assignment_id === assignment.id && isPermission(item.permission))
      .map((item) => item.permission),
  }))
}

export async function loadAuthenticatedUser(authUser: User): Promise<AuthUser> {
  if (!supabase) throw new Error('Supabase belum dikonfigurasi.')

  const { data: rawProfile, error } = await supabase
    .from('profiles')
    .select('id, username, full_name, role, phone, is_active')
    .eq('id', authUser.id)
    .maybeSingle()

  if (error) throw new Error('Profil akun tidak dapat dibaca.')
  if (!rawProfile) throw new Error('Profil akun belum tersedia.')

  const profile = rawProfile as ProfileRow
  if (!isUserRole(profile.role)) throw new Error('Role akun tidak valid.')
  if (!profile.is_active) throw new Error('Akun belum aktif. Hubungi pengelola sistem.')

  const assignments = profile.role === 'humas' ? await loadHumasAssignments(profile.id) : []

  return {
    id: profile.id,
    username: profile.username,
    fullName: profile.full_name,
    role: profile.role,
    initials: initialsFromName(profile.full_name),
    isActive: profile.is_active,
    phone: profile.phone ?? undefined,
    assignments,
  }
}
