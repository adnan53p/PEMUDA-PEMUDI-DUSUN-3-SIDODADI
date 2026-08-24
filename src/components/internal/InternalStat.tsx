import type { LucideIcon } from 'lucide-react'

interface InternalStatProps {
  label: string
  value: string
  note: string
  icon: LucideIcon
}

export default function InternalStat({ label, value, note, icon: Icon }: InternalStatProps) {
  return (
    <div className="border border-border-soft bg-white p-5 md:p-6">
      <div className="flex items-start justify-between gap-4">
        <p className="text-xs font-extrabold uppercase tracking-[0.11em] text-muted">{label}</p>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sage/55 text-forest"><Icon size={17} /></span>
      </div>
      <p className="mt-6 text-3xl font-extrabold tracking-[-0.045em] text-charcoal">{value}</p>
      <p className="mt-2 text-xs leading-relaxed text-muted">{note}</p>
    </div>
  )
}
