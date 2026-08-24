import type { ActivityStatus } from '../data/activityData'

const phases: Array<{ status: ActivityStatus; label: string }> = [
  { status: 'Perencanaan', label: 'Perencanaan' },
  { status: 'Penggalangan', label: 'Penggalangan / Iuran' },
  { status: 'Berlangsung', label: 'Berlangsung' },
  { status: 'Penyelesaian', label: 'Penyelesaian' },
  { status: 'LPJ', label: 'LPJ' },
  { status: 'Selesai', label: 'Selesai' },
]

export default function ActivityPhaseTrack({ status }: { status: ActivityStatus }) {
  const activeIndex = phases.findIndex((phase) => phase.status === status)

  return (
    <div className="overflow-x-auto pb-2" aria-label={`Tahap kegiatan saat ini: ${status}`}>
      <ol className="flex min-w-[660px] items-start">
        {phases.map((phase, index) => {
          const reached = index <= activeIndex
          const current = index === activeIndex
          return (
            <li key={phase.status} className="relative flex flex-1 flex-col items-center px-2 text-center">
              {index < phases.length - 1 && (
                <span
                  aria-hidden="true"
                  className={`absolute left-1/2 top-3 h-px w-full ${index < activeIndex ? 'bg-forest' : 'bg-border-soft'}`}
                />
              )}
              <span
                className={`relative z-10 flex h-6 w-6 items-center justify-center rounded-full border text-[0.62rem] font-extrabold ${
                  current
                    ? 'border-forest bg-forest text-offwhite ring-4 ring-sage/60'
                    : reached
                      ? 'border-forest bg-forest text-offwhite'
                      : 'border-border-soft bg-offwhite text-muted'
                }`}
              >
                {index + 1}
              </span>
              <span className={`mt-3 text-[0.66rem] font-bold uppercase tracking-[0.08em] ${reached ? 'text-forest' : 'text-muted'}`}>
                {phase.label}
              </span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
