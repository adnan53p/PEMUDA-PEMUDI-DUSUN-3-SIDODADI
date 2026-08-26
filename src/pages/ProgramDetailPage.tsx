import { ArrowLeft, ArrowUpRight } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { useSiteContent } from '../prototype/SiteContentContext'

export default function ProgramDetailPage() {
  const { slug } = useParams()
  const { managedPublicContent } = useSiteContent()
  const program = managedPublicContent.programs.programs.find((item) => item.slug === slug && item.visible)



  if (!program) {
    return (
      <section className="container-content section-space">
        <p className="eyebrow text-forest">Bidang Program</p>
        <h1 className="section-title mt-5 text-charcoal">Bidang tidak ditemukan.</h1>
        <Link to="/#program" className="btn btn-primary mt-8"><ArrowLeft size={16}/> Kembali ke program</Link>
      </section>
    )
  }

  return (
    <article className="bg-white">
      <header className="section-rule">
        <div className="container-content section-space grid gap-10 lg:grid-cols-[.9fr_1.1fr] lg:items-end">
          <div>
            <Link to="/#program" className="inline-flex items-center gap-2 text-sm font-semibold text-forest"><ArrowLeft size={16}/> Semua bidang</Link>
            <p className="eyebrow mt-10 text-accent">Bidang {program.number}</p>
            <h1 className="mt-5 max-w-3xl text-5xl font-semibold leading-[.95] tracking-[-.055em] text-charcoal sm:text-6xl lg:text-7xl">{program.title}</h1>
          </div>
          <p className="lead-copy lg:justify-self-end">{program.shortDescription}</p>
        </div>
      </header>

      {program.imageUrl && (
        <div className="container-content pb-4">
          <img src={program.imageUrl} alt={program.title} className="aspect-[16/7] w-full object-cover" />
        </div>
      )}

      <section className="container-content section-space grid gap-12 lg:grid-cols-[.72fr_1.28fr]">
        <div>
          <p className="eyebrow text-forest">Tujuan</p>
          <p className="mt-5 text-2xl font-semibold leading-snug tracking-[-.03em] text-charcoal">{program.objective || program.shortDescription}</p>
        </div>
        <div>
          <p className="eyebrow text-forest">Tentang Bidang</p>
          <div className="mt-5 whitespace-pre-line text-base leading-8 text-muted">{program.fullDescription || program.shortDescription}</div>
          {program.ctaLabel && program.ctaUrl && (
            <a href={program.ctaUrl} target="_blank" rel="noreferrer" className="btn btn-primary mt-8">{program.ctaLabel}<ArrowUpRight size={16}/></a>
          )}
        </div>
      </section>
    </article>
  )
}
