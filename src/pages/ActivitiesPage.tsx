import { useMemo, useState } from 'react'
import { ArrowUpRight, CalendarDays, MapPin, Search, SlidersHorizontal, Users, WalletCards } from 'lucide-react'
import { Link } from 'react-router-dom'
import ActivityCard from '../components/ActivityCard'
import ActivityCategoryBadge from '../components/ActivityCategoryBadge'
import ActivityStatusBadge from '../components/ActivityStatusBadge'
import PageIntro from '../components/PageIntro'
import { formatRupiah } from '../data/activityData'
import { usePublicActivities } from '../prototype/publicActivitySelectors'

export default function ActivitiesPage() {
  const publicActivities = usePublicActivities()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('Semua')
  const [status, setStatus] = useState('Semua')

  const featured = publicActivities.find((activity) => activity.featured) ?? publicActivities[0]
  const activityCategories = useMemo(() => ['Semua', ...Array.from(new Set(publicActivities.map((item) => item.category)))], [publicActivities])
  const activityStatuses = useMemo(() => ['Semua', ...Array.from(new Set(publicActivities.map((item) => item.status)))], [publicActivities])
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return publicActivities.filter((activity) => {
      const matchQuery = !needle || `${activity.title} ${activity.summary} ${activity.location}`.toLowerCase().includes(needle)
      const matchCategory = category === 'Semua' || activity.category === category
      const matchStatus = status === 'Semua' || activity.status === status
      return matchQuery && matchCategory && matchStatus
    })
  }, [query, category, status])

  if (!featured) return <div className="container-content py-24 text-center"><p className="text-2xl font-extrabold text-charcoal">Belum ada kegiatan yang dipublikasikan.</p><p className="mt-3 text-sm text-muted">Admin dapat mempublikasikan kegiatan dari workspace internal.</p></div>

  return (
    <div className="bg-offwhite">
      <PageIntro
        eyebrow="KEGIATAN PEMUDA"
        title={<>Dari rencana menjadi <span className="text-forest">dampak yang terlihat.</span></>}
        description="Setiap kegiatan memiliki ruang publik untuk melihat tujuan, pelaksanaan, transparansi anggaran, dokumentasi, dan laporan tanpa membuat warga membaca data yang rumit."
        aside={
          <div className="max-w-xs border-l border-border-soft pl-5 text-sm leading-relaxed text-muted">
            <p className="font-semibold text-charcoal">Satu kegiatan, satu cerita utuh</p>
            <p className="mt-2">Data di halaman ini masih contoh pengembangan. Nantinya seluruh informasi berasal dari workspace kegiatan yang sama.</p>
          </div>
        }
      />

      <section className="bg-warmwhite">
        <div className="container-content py-14 md:py-20">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <Link to={`/kegiatan/${featured.id}`} className="group block overflow-hidden rounded-sm" aria-label={`Lihat detail ${featured.title}`}>
              <img
                src={featured.image}
                alt={`Suasana kegiatan ${featured.title}`}
                fetchPriority="high"
                decoding="async"
                className="h-[19rem] w-full object-cover object-center transition-transform duration-500 group-hover:scale-[1.015] sm:h-[22rem] md:h-[32rem]"
              />
            </Link>
            <div className="pb-2">
              <div className="flex flex-wrap items-center gap-2">
                <ActivityStatusBadge status={featured.status} />
                <ActivityCategoryBadge category={featured.category} />
                <span className="eyebrow text-forest">Kegiatan Pilihan</span>
              </div>
              <h2 className="mt-5 text-3xl font-extrabold leading-tight tracking-[-0.04em] text-charcoal md:text-5xl">{featured.title}</h2>
              <p className="mt-5 text-base leading-relaxed text-muted">{featured.summary}</p>
              <div className="mt-6 space-y-2 text-sm font-semibold text-charcoal/70">
                <p className="flex items-center gap-2"><CalendarDays size={16} className="text-forest" />{featured.date}</p>
                <p className="flex items-center gap-2"><MapPin size={16} className="text-forest" />{featured.location}</p>
              </div>

              <div className="mt-7 grid grid-cols-3 border-y border-border-soft">
                <div className="py-4 pr-3">
                  <p className="flex items-center gap-1.5 text-[0.67rem] font-bold uppercase tracking-[0.1em] text-muted"><Users size={14} /> Peserta</p>
                  <p className="mt-2 text-lg font-extrabold text-charcoal">{featured.participantActual || featured.participantTarget}</p>
                </div>
                <div className="border-l border-border-soft px-3 py-4">
                  <p className="text-[0.67rem] font-bold uppercase tracking-[0.1em] text-muted">Panitia</p>
                  <p className="mt-2 text-lg font-extrabold text-charcoal">{featured.committeeRoles.length} bidang</p>
                </div>
                <div className="border-l border-border-soft pl-3 py-4">
                  <p className="flex items-center gap-1.5 text-[0.67rem] font-bold uppercase tracking-[0.1em] text-muted"><WalletCards size={14} /> Dana</p>
                  <p className="mt-2 break-words text-[0.72rem] font-extrabold leading-tight text-charcoal min-[390px]:text-sm sm:text-base">{formatRupiah(featured.finance.income)}</p>
                </div>
              </div>

              <Link to={`/kegiatan/${featured.id}`} className="btn btn-primary mt-8">Lihat Cerita Kegiatan <ArrowUpRight size={16} /></Link>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-offwhite">
        <div className="container-content py-16 md:py-24">
          <div className="flex flex-col gap-5 border-b border-border-soft pb-7 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="eyebrow text-forest">ARSIP KEGIATAN</p>
              <h2 className="mt-3 text-3xl font-extrabold text-charcoal md:text-4xl">Temukan kegiatan yang ingin dilihat.</h2>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted"><SlidersHorizontal size={15} /> {filtered.length} kegiatan ditemukan</div>
          </div>

          <div className="mt-7 grid gap-3 md:grid-cols-[1fr_0.55fr_0.55fr]">
            <label className="relative block">
              <span className="sr-only">Cari kegiatan</span>
              <Search size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari kegiatan atau lokasi..." className="h-12 w-full border border-border-soft bg-white pl-11 pr-4 text-sm text-charcoal outline-none transition-colors placeholder:text-muted/70 focus:border-forest" />
            </label>
            <label>
              <span className="sr-only">Filter kategori</span>
              <select value={category} onChange={(event) => setCategory(event.target.value)} className="h-12 w-full border border-border-soft bg-white px-4 text-sm font-semibold text-charcoal outline-none focus:border-forest">
                {activityCategories.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
            <label>
              <span className="sr-only">Filter status</span>
              <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-12 w-full border border-border-soft bg-white px-4 text-sm font-semibold text-charcoal outline-none focus:border-forest">
                {activityStatuses.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
          </div>

          {filtered.length ? (
            <div className="mt-12 grid gap-x-8 gap-y-14 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((activity) => <ActivityCard key={activity.id} activity={activity} />)}
            </div>
          ) : (
            <div className="mt-12 border border-border-soft bg-warmwhite p-10 text-center">
              <p className="text-lg font-bold text-charcoal">Kegiatan tidak ditemukan.</p>
              <p className="mt-2 text-sm text-muted">Coba ubah kata pencarian atau filter.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
