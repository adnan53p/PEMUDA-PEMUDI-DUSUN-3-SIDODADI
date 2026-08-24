import { ArrowUpRight, CalendarDays, MapPin } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { PublicActivity } from '../data/activityData'
import ActivityCategoryBadge from './ActivityCategoryBadge'
import ActivityStatusBadge from './ActivityStatusBadge'

export default function ActivityCard({ activity }: { activity: PublicActivity }) {
  return (
    <article className="group border-t border-border-soft pt-5">
      <Link to={`/kegiatan/${activity.id}`} className="block overflow-hidden rounded-sm" aria-label={`Lihat detail ${activity.title}`}>
        <img
          src={activity.image}
          alt={`Suasana ${activity.title}`}
          loading="lazy"
          decoding="async"
          className="h-56 w-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-[1.015] sm:h-64"
        />
      </Link>
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <ActivityStatusBadge status={activity.status} />
        <ActivityCategoryBadge category={activity.category} />
      </div>
      <h3 className="mt-3 text-2xl font-extrabold leading-tight tracking-[-0.035em] text-charcoal transition-colors group-hover:text-forest">
        <Link to={`/kegiatan/${activity.id}`}>{activity.shortTitle}</Link>
      </h3>
      <p className="mt-3 text-sm leading-relaxed text-muted">{activity.summary}</p>
      <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-muted">
        <span className="inline-flex items-center gap-2"><CalendarDays size={14} />{activity.date}</span>
        <span className="inline-flex items-center gap-2"><MapPin size={14} />{activity.location}</span>
      </div>
      <Link to={`/kegiatan/${activity.id}`} className="text-link mt-5 text-sm">
        Lihat kegiatan <ArrowUpRight size={16} />
      </Link>
    </article>
  )
}
