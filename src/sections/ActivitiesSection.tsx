import { ArrowUpRight, CalendarDays, MapPin } from 'lucide-react'
import { Link } from 'react-router-dom'
import ActivityStatusBadge from '../components/ActivityStatusBadge'
import { usePublicActivities } from '../prototype/publicActivitySelectors'

export default function ActivitiesSection() {
  const publicActivities = usePublicActivities()
  const featured = publicActivities.find((activity) => activity.featured) ?? publicActivities[0]
  const rest = publicActivities.filter((activity) => activity.id !== featured?.id)
  if (!featured) return null

  return (
    <section id="kegiatan" className="section-rule scroll-mt-20 bg-warmwhite">
      <div className="container-content section-space">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="eyebrow text-forest">Aktivitas</p>
            <h2 className="section-title mt-6 max-w-3xl text-charcoal">Kegiatan terbaru dari lingkungan kami.</h2>
          </div>
          <Link to="/kegiatan" className="text-link text-sm">Lihat Semua <ArrowUpRight size={16}/></Link>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-[1.45fr_.75fr]">
          <article className="group bg-white">
            <Link to={`/kegiatan/${featured.id}`} className="block">
              <div className="relative overflow-hidden bg-charcoal">
                <img src={featured.image} alt={featured.title} loading="lazy" decoding="async" className="aspect-[16/10] w-full object-cover transition-transform duration-700 group-hover:scale-[1.02]" />
                <div className="absolute left-0 top-0 h-full w-1 bg-accent" />
              </div>
              <div className="border-x border-b border-border-soft p-6 md:p-8">
                <div className="flex flex-wrap items-center gap-2"><ActivityStatusBadge status={featured.status}/><span className="border border-border-soft px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[.12em] text-muted">{featured.category}</span></div>
                <h3 className="mt-5 max-w-2xl text-3xl font-semibold leading-[1.08] tracking-[-.04em] text-charcoal md:text-4xl">{featured.shortTitle}</h3>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-muted">{featured.summary}</p>
                <div className="mt-6 flex flex-wrap gap-5 text-xs font-medium text-muted"><span className="inline-flex items-center gap-2"><CalendarDays size={14}/>{featured.date}</span><span className="inline-flex items-center gap-2"><MapPin size={14}/>{featured.location}</span></div>
              </div>
            </Link>
          </article>

          <div className="border-t border-border-soft lg:border-t-0">
            {rest.slice(0, 3).map((activity, index) => (
              <Link to={`/kegiatan/${activity.id}`} key={activity.id} className={`group grid grid-cols-[120px_1fr] gap-4 py-5 ${index > 0 ? 'border-t border-border-soft' : ''}`}>
                <div className="overflow-hidden bg-sage"><img src={activity.image} alt={activity.title} loading="lazy" decoding="async" className="h-28 w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"/></div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[.12em] text-accent">{activity.category}</p>
                  <h4 className="mt-2 text-lg font-semibold leading-snug tracking-[-.025em] text-charcoal">{activity.shortTitle}</h4>
                  <p className="mt-3 text-xs text-muted">{activity.date}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
