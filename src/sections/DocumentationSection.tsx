import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { documentationImages } from '../data/mockData'

export default function DocumentationSection() {
  const items = documentationImages.slice(0, 4)
  if (!items.length) return null

  return (
    <section id="dokumentasi" className="section-rule scroll-mt-20 bg-warmwhite">
      <div className="container-content section-space">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="eyebrow text-forest">Galeri</p>
            <h2 className="section-title mt-6 max-w-3xl text-charcoal">Dokumentasi yang berbicara lewat foto.</h2>
          </div>
          <Link to="/dokumentasi" className="text-link text-sm">Lihat Semua <ArrowUpRight size={16}/></Link>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {items.map((item, index) => (
            <figure key={`${item.caption}-${index}`} className="group bg-white">
              <div className="relative overflow-hidden bg-charcoal">
                <img src={item.image} alt={item.caption} loading="lazy" className={`w-full object-cover transition-transform duration-700 group-hover:scale-[1.02] ${index === 0 ? 'aspect-[4/5]' : 'aspect-[4/5]'}`}/>
                <div className="absolute bottom-0 left-0 h-1 w-16 bg-accent" />
              </div>
              <figcaption className="border-x border-b border-border-soft px-4 py-4 text-sm font-medium leading-6 text-charcoal">{item.caption}</figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}
