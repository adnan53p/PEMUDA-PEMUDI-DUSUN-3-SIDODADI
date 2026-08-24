import type { ActivityStatus } from '../data/activityData'

const statusStyles: Record<ActivityStatus, string> = {
  Perencanaan: 'bg-sage text-forest',
  Penggalangan: 'bg-[#F4E7C8] text-[#7A5718]',
  Berlangsung: 'bg-[#DDE8F5] text-[#28547A]',
  Penyelesaian: 'bg-[#ECE8DF] text-charcoal',
  LPJ: 'bg-[#E8E3F2] text-[#5B4778]',
  Selesai: 'bg-forest text-offwhite',
}

export default function ActivityStatusBadge({ status }: { status: ActivityStatus }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-[0.12em] ${statusStyles[status]}`}>
      {status}
    </span>
  )
}
