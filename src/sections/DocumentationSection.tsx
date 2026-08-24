import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { documentationImages } from '../data/mockData'

export default function DocumentationSection() {
  const portrait = documentationImages.find((item) => item.orientation === 'portrait')
  const landscape = documentationImages.find((item) => item.orientation === 'landscape')

  return (
    <section id="dokumentasi" className="bg-offwhite scroll-mt-20">
      <div className="container-content py-20 md:py-24">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow text-forest">Dokumentasi</p>
            <h2 className="mt-3 max-w-2xl text-3xl font-bold tracking-[-0.035em] text-charcoal md:text-4xl">
              Wajah-wajah di balik setiap kegiatan.
            </h2>
          </div>
          <Link to="/dokumentasi" className="text-link text-sm">Lihat Arsip Foto <ArrowUpRight size={16} /></Link>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-[0.9fr_1.4fr] md:items-end md:gap-8">
          {portrait && (
            <figure className="group">
              <div className="overflow-hidden rounded-sm">
                <img
                  src={portrait.image}
                  alt={portrait.caption}
                  loading="lazy"
                  decoding="async"
                  className="h-[26rem] w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.015] sm:h-[30rem]"
                />
              </div>
              <figcaption className="mt-3 text-sm leading-relaxed text-muted">{portrait.caption}</figcaption>
            </figure>
          )}
          {landscape && (
            <figure className="group">
              <div className="overflow-hidden rounded-sm">
                <img
                  src={landscape.image}
                  alt={landscape.caption}
                  loading="lazy"
                  decoding="async"
                  className="h-64 w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.015] sm:h-96"
                />
              </div>
              <figcaption className="mt-3 text-sm leading-relaxed text-muted">{landscape.caption}</figcaption>
            </figure>
          )}
        </div>
      </div>
    </section>
  )
}
