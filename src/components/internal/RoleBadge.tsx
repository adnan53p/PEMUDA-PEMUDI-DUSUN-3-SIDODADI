import type { UserRole } from '../../auth/types'

const labels: Record<UserRole, string> = {
  superadmin: 'Superadmin',
  admin: 'Admin',
  humas: 'Humas',
}

export default function RoleBadge({ role }: { role: UserRole }) {
  return (
    <span className="inline-flex items-center rounded-full bg-sage/65 px-3 py-1 text-[0.68rem] font-extrabold uppercase tracking-[0.1em] text-forest">
      {labels[role]}
    </span>
  )
}
