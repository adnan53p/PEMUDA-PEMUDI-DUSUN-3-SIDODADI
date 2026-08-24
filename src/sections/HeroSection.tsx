import { ChevronDown } from 'lucide-react'
import { Link } from 'react-router-dom'
import { mediaAssets } from '../data/mockData'
import { useSiteContent } from '../prototype/SiteContentContext'

export default function HeroSection() {
  const { homepage, identity, isSectionVisible } = useSiteContent()
  const nextAnchor = isSectionVisible('impact') ? '#dampak' : isSectionVisible('activities') ? '#kegiatan' : '#program'

  return (
    <section id="beranda" className="relative overflow-hidden scroll-mt-20">
      <div className="absolute inset-0">
        <img
          src={mediaAssets.hero}
          alt={`Kegiatan ${identity.name}`}
          className="h-full w-full object-cover"
          fetchPriority="high"
          decoding="async"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-forest-deep/62 via-forest-deep/30 to-forest-deep/5" />
      </div>

      <div className="container-content relative flex min-h-[84vh] flex-col justify-end pb-14 pt-36 sm:min-h-[86vh] md:min-h-[90vh] md:pb-20 md:pt-40">
        <p className="eyebrow text-sage">Organisasi Pemuda Dusun 3 · Sidodadi</p>
        <h1 className="mt-4 max-w-3xl whitespace-pre-line text-5xl font-extrabold uppercase leading-[0.94] tracking-[-0.055em] text-offwhite sm:text-6xl md:text-7xl lg:text-8xl">
          {homepage.headline}
        </h1>
        <p className="mt-6 max-w-lg text-base leading-relaxed text-offwhite/85 md:text-lg">{homepage.subheadline}</p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/kegiatan" className="btn bg-offwhite text-forest hover:bg-sage">{homepage.primaryCta}</Link>
          <Link to="/keuangan" className="btn btn-ghost-light">{homepage.secondaryCta}</Link>
        </div>

        <a href={nextAnchor} className="group mt-12 inline-flex w-fit items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-offwhite/70 transition-colors hover:text-offwhite md:mt-14">
          Gulir untuk melihat dampak kami
          <ChevronDown size={14} className="transition-transform duration-200 group-hover:translate-y-0.5" />
        </a>
      </div>
    </section>
  )
}
