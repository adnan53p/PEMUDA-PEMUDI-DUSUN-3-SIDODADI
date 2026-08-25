import { ArrowRight, ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { mediaAssets } from '../data/mockData'
import { useSiteContent } from '../prototype/SiteContentContext'

export default function HeroSection() {
  const { homepage, identity } = useSiteContent()

  return (
    <section id="beranda" className="scroll-mt-20 bg-white">
      <div className="container-content grid gap-12 py-14 md:py-18 lg:grid-cols-[.9fr_1.1fr] lg:items-center lg:gap-16 lg:py-24">
        <div className="max-w-[650px]">
          <p className="eyebrow text-forest">{identity.name}</p>
          <h1 className="display-title mt-7 text-charcoal">{homepage.headline}</h1>
          <p className="lead-copy mt-7">{homepage.subheadline}</p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/kegiatan" className="btn btn-primary">{homepage.primaryCta} <ArrowUpRight size={16} /></Link>
            <Link to="/keuangan" className="btn btn-secondary">{homepage.secondaryCta} <ArrowRight size={16} /></Link>
          </div>

          <div className="mt-12 grid max-w-2xl grid-cols-3 border-y border-border-soft">
            {[
              ['Terbuka', 'Informasi warga'],
              ['Transparan', 'Keuangan jelas'],
              ['Kolaboratif', 'Bergerak bersama'],
            ].map(([title, desc], index) => (
              <div key={title} className={`py-5 ${index > 0 ? 'border-l border-border-soft pl-5' : 'pr-5'}`}>
                <p className="text-sm font-semibold text-charcoal">{title}</p>
                <p className="mt-1 text-xs leading-5 text-muted">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="absolute -left-3 top-8 z-10 h-[70%] w-1 bg-accent" aria-hidden="true" />
          <figure className="relative overflow-hidden bg-warmwhite">
            <img src={mediaAssets.hero} alt={`Kegiatan ${identity.name}`} className="aspect-[5/4] w-full object-cover lg:aspect-[4/5]" fetchPriority="high" decoding="async" />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent px-6 pb-6 pt-20 text-white md:px-8 md:pb-8">
              <p className="text-[11px] font-semibold uppercase tracking-[.16em] text-white/75">#MulaiDariLingkungan</p>
              <p className="mt-2 max-w-md text-xl font-semibold leading-snug tracking-[-.03em]">Kegiatan nyata, informasi terbuka, dan kolaborasi warga.</p>
            </div>
          </figure>
          <div className="absolute -bottom-5 right-0 hidden w-52 bg-forest px-5 py-4 text-white md:block">
            <p className="text-[10px] font-medium uppercase tracking-[.15em] text-white/65">Berbasis di</p>
            <p className="mt-1 text-sm font-semibold">Dusun 3 Sidodadi</p>
          </div>
        </div>
      </div>
    </section>
  )
}
