import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import ActivityStatusBadge from '../components/ActivityStatusBadge'
import { usePublicActivities } from '../prototype/publicActivitySelectors'

export default function ActivitiesSection() {
  const publicActivities = usePublicActivities()
  const featured = publicActivities.find((activity) => activity.featured) ?? publicActivities[0]
  const rest = publicActivities.filter((activity) => activity.id !== featured?.id)

  if (!featured) return null

  return (
    <section id="kegiatan" className="bg-warmwhite scroll-mt-20">
      <div className="container-content py-20 md:py-24">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow text-forest">Kegiatan Terbaru</p>
            <h2 className="mt-3 max-w-2xl text-3xl font-bold tracking-[-0.035em] text-charcoal md:text-4xl">
              Yang sedang kami kerjakan
              <br className="hidden sm:block" /> bersama warga.
            </h2>
          </div>
          <Link to="/kegiatan" className="text-link text-sm">Semua Kegiatan <ArrowUpRight size={16} /></Link>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-8 md:grid-cols-2 md:items-center md:gap-12">
          <Link to={`/kegiatan/${featured.id}`} className="group overflow-hidden rounded-sm">
            <img
              src={featured.image}
              alt={featured.title}
              loading="lazy"
              decoding="async"
              className="h-72 w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.015] sm:h-96 md:h-[26rem]"
            />
          </Link>
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <ActivityStatusBadge status={featured.status} />
              <span className="text-xs font-semibold uppercase tracking-wide text-muted">{featured.category}</span>
              <span className="text-xs font-semibold uppercase tracking-wide text-muted">{featured.date}</span>
            </div>
            <h3 className="mt-4 text-2xl font-bold tracking-[-0.03em] text-charcoal md:text-3xl">
              {featured.shortTitle}
            </h3>
            <p className="mt-4 text-[0.95rem] leading-relaxed text-muted">{featured.summary}</p>
            <Link to={`/kegiatan/${featured.id}`} className="text-link mt-6 text-sm">Baca Selengkapnya <ArrowUpRight size={16} /></Link>
          </div>
        </div>

        <div className="mt-16 divide-y divide-border-soft border-t border-border-soft">
          {rest.slice(0, 3).map((activity) => (
            <Link
              to={`/kegiatan/${activity.id}`}
              key={activity.id}
              className="group flex flex-col gap-4 py-6 sm:flex-row sm:items-center sm:gap-8"
            >
              <div className="w-full overflow-hidden rounded-sm sm:w-40">
                <img
                  src={activity.image}
                  alt={activity.title}
                  loading="lazy"
                  decoding="async"
                  className="h-40 w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.015] sm:h-24"
                />
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-wide text-muted">
                  <span>{activity.category}</span>
                  <span aria-hidden="true">·</span>
                  <span>{activity.date}</span>
                  <span aria-hidden="true">·</span>
                  <span>{activity.status}</span>
                </div>
                <h4 className="mt-1 text-lg font-bold tracking-[-0.02em] text-charcoal transition-colors group-hover:text-forest">
                  {activity.shortTitle}
                </h4>
              </div>
              <ArrowUpRight size={18} aria-hidden="true" className="hidden shrink-0 text-forest/40 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1 sm:block" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
