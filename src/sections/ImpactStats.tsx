import { impactStats } from '../data/mockData'
import { useOperations } from '../prototype/OperationsContext'

export default function ImpactStats() {
  const { activities } = useOperations()
  const publicActivityCount = activities.filter((activity) => activity.publicVisible).length
  const stats = impactStats.map((stat) => stat.id === 'kegiatan' ? { ...stat, value: String(publicActivityCount) } : stat)

  return (
    <section id="dampak" className="section-rule scroll-mt-20 bg-white">
      <div className="container-content section-space">
        <div className="grid gap-10 lg:grid-cols-[.82fr_1.18fr] lg:items-end">
          <div>
            <p className="eyebrow text-forest">Pencapaian & Transparansi</p>
            <h2 className="section-title mt-6 max-w-xl text-charcoal">Angka yang bisa dilihat, dipahami, dan dipertanggungjawabkan.</h2>
          </div>
          <p className="lead-copy lg:justify-self-end">Seperti pendekatan situs yayasan yang menonjolkan pencapaian, kami menampilkan ringkasan organisasi secara langsung tanpa dekorasi yang berlebihan.</p>
        </div>

        <div className="mt-14 grid border-y border-border-soft sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <article key={stat.id} className={`py-8 sm:px-6 lg:min-h-[210px] ${index > 0 ? 'sm:border-l sm:border-border-soft' : ''}`}>
              <p className="text-[11px] font-semibold uppercase tracking-[.15em] text-accent">{stat.label}</p>
              <p className="mt-8 text-5xl font-semibold tracking-[-.055em] text-charcoal md:text-6xl">{stat.value}</p>
              <div className="mt-7 h-0.5 w-9 bg-forest" />
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
