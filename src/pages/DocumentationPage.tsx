import { useMemo, useState } from 'react'
import { CalendarDays, Camera, MapPin } from 'lucide-react'
import { Link } from 'react-router-dom'
import PageIntro from '../components/PageIntro'
import { usePublicActivities } from '../prototype/publicActivitySelectors'

export default function DocumentationPage() {
  const publicActivities = usePublicActivities()
  const [category, setCategory] = useState('Semua')
  const categories = useMemo(() => ['Semua', ...Array.from(new Set(publicActivities.map((item) => item.category)))], [publicActivities])
  const visible = category === 'Semua' ? publicActivities : publicActivities.filter((item) => item.category === category)

  return (
    <div className="bg-offwhite">
      <PageIntro
        eyebrow="DOKUMENTASI"
        title={<>Jejak visual dari <span className="text-forest">setiap gerak bersama.</span></>}
        description="Dokumentasi kegiatan disusun sebagai arsip visual yang terhubung ke kegiatan, tanggal, lokasi, dan cerita dampak — bukan sekadar galeri foto terpisah."
        aside={
          <div className="flex items-center gap-4 border border-border-soft bg-white p-5">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-sage text-forest"><Camera size={21} /></span>
            <div>
              <p className="text-sm font-bold text-charcoal">Terhubung ke kegiatan</p>
              <p className="mt-1 text-xs leading-relaxed text-muted">Setiap foto nantinya mengikuti arsip kegiatan yang sama.</p>
            </div>
          </div>
        }
      />

      <section className="bg-warmwhite">
        <div className="container-content py-14 md:py-20">
          <div className="flex flex-col gap-5 border-b border-border-soft pb-7 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="eyebrow text-forest">ARSIP FOTO</p>
              <h2 className="mt-3 text-3xl font-extrabold text-charcoal md:text-4xl">Kegiatan dari dekat.</h2>
            </div>
            <label className="min-w-52">
              <span className="sr-only">Filter dokumentasi berdasarkan kategori</span>
              <select value={category} onChange={(event) => setCategory(event.target.value)} className="h-11 w-full border border-border-soft bg-white px-4 text-sm font-semibold text-charcoal outline-none focus:border-forest">
                {categories.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
          </div>

          <div className="mt-8 columns-2 gap-3 sm:mt-10 sm:gap-5 lg:columns-3">
            {visible.flatMap((activity) => activity.gallery.slice(0, 2).map((image, index) => ({ activity, image, index }))).map(({ activity, image, index }, itemIndex) => (
              <figure key={`${activity.id}-${index}`} className="mb-5 break-inside-avoid overflow-hidden bg-white">
                <Link to={`/kegiatan/${activity.id}`} className="group block overflow-hidden">
                  <img
                    src={image}
                    alt={`Dokumentasi ${activity.shortTitle}`}
                    loading="lazy"
                    className={`w-full object-cover transition-transform duration-500 group-hover:scale-[1.015] ${itemIndex % 3 === 0 ? 'h-56 sm:h-[30rem]' : itemIndex % 3 === 1 ? 'h-44 sm:h-72' : 'h-52 sm:h-96'}`}
                  />
                </Link>
                <figcaption className="border-x border-b border-border-soft p-3 sm:p-5">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-forest">{activity.category}</p>
                  <p className="mt-2 text-sm font-extrabold leading-snug text-charcoal sm:text-base">{activity.shortTitle}</p>
                  <div className="mt-2 hidden flex-wrap gap-x-4 gap-y-2 text-xs text-muted sm:flex">
                    <span className="inline-flex items-center gap-1.5"><CalendarDays size={13} />{activity.date}</span>
                    <span className="inline-flex items-center gap-1.5"><MapPin size={13} />{activity.location}</span>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
