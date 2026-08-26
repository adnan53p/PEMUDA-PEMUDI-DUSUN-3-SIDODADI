import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { usePublicActivities } from '../prototype/publicActivitySelectors'
import ScrollReveal from '../components/ScrollReveal'

export default function DocumentationSection() {
  const activities = usePublicActivities()
  const items = activities
    .flatMap((activity) => activity.gallery.map((image) => ({ image, caption: activity.shortTitle, activityId: activity.id })))
    .slice(0, 4)
  if (!items.length) return null

  return (
    <section id="dokumentasi" className="section-rule scroll-mt-20 bg-warmwhite">
      <div className="container-content section-space">
        <ScrollReveal className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="eyebrow text-forest">Galeri</p>
            <h2 className="section-title mt-6 max-w-3xl text-charcoal">Dokumentasi yang berbicara lewat foto.</h2>
          </div>
          <Link to="/dokumentasi" className="text-link text-sm">Lihat Semua <ArrowUpRight size={16}/></Link>
        </ScrollReveal>

        <div className="mt-4 flex justify-end md:hidden"><span className="mobile-swipe-hint">Geser galeri →</span></div>
        <div className="mobile-horizontal-row mt-5 gap-4 md:mt-12 md:grid md:grid-cols-2 md:overflow-visible lg:grid-cols-4">
          {items.map((item, index) => (
            <ScrollReveal key={`${item.activityId}-${index}`} delay={index * 85} className="mobile-horizontal-item w-[76vw] max-w-[280px] border-r-0 md:w-auto md:max-w-none">
            <figure className="group bg-white">
              <Link to={`/kegiatan/${item.activityId}`} className="block">
                <div className="relative overflow-hidden bg-charcoal">
                  <img src={item.image} alt={item.caption} loading="lazy" className="aspect-[4/5] w-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"/>
                  <div className="absolute bottom-0 left-0 h-1 w-16 bg-accent" />
                </div>
                <figcaption className="border-x border-b border-border-soft px-4 py-4 text-sm font-medium leading-6 text-charcoal">{item.caption}</figcaption>
              </Link>
            </figure>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}
