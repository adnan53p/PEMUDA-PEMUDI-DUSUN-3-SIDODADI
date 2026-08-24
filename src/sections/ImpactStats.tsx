import { impactStats } from '../data/mockData'
import { useOperations } from '../prototype/OperationsContext'

export default function ImpactStats() {
  const { activities } = useOperations()
  const publicActivityCount = activities.filter((activity) => activity.publicVisible).length
  const stats = impactStats.map((stat) => stat.id === 'kegiatan' ? { ...stat, value: String(publicActivityCount) } : stat)

  return (
    <section id="dampak" className="bg-offwhite scroll-mt-20">
      <div className="container-content py-20 md:py-24">
        <p className="eyebrow text-forest">Dampak Kami</p>
        <h2 className="mt-3 max-w-2xl text-3xl font-bold tracking-[-0.035em] text-charcoal md:text-4xl">Angka yang bisa dipertanggungjawabkan.</h2>
        <div className="mt-10 grid grid-cols-2 border-y border-border-soft md:grid-cols-4">
          {stats.map((stat, index) => <div key={stat.id} className={`py-6 ${index % 2 === 0 ? 'pr-4' : 'border-l border-border-soft pl-4'} ${index >= 2 ? 'border-t border-border-soft md:border-t-0' : ''} md:border-l md:border-t-0 md:px-8 md:first:border-l-0 md:first:pl-0`}><p className="text-3xl font-extrabold tracking-[-0.04em] text-forest sm:text-4xl md:text-5xl">{stat.value}</p><p className="mt-2 text-xs font-semibold uppercase tracking-wide text-muted sm:text-sm">{stat.label}</p></div>)}
        </div>
      </div>
    </section>
  )
}
