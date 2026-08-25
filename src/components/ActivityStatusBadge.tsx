import type { ActivityStatus } from '../data/activityData'

const statusStyles: Record<ActivityStatus, string> = {
  Perencanaan: 'border border-border-soft bg-white text-muted',
  Penggalangan: 'bg-[#FCE8E9] text-[#9F1D24]',
  Berlangsung: 'bg-[#E8EDF9] text-forest',
  Penyelesaian: 'bg-sage text-charcoal',
  LPJ: 'bg-[#EEF0F4] text-charcoal',
  Selesai: 'bg-forest text-white',
}

export default function ActivityStatusBadge({ status }: { status: ActivityStatus }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-1 text-[0.66rem] font-semibold uppercase tracking-[0.12em] ${statusStyles[status]}`}>
      {status}
    </span>
  )
}
