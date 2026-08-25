import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import ScrollReveal from '../components/ScrollReveal'
import { useSiteContent } from '../prototype/SiteContentContext'

export default function ProgramsSection() {
  const { managedPublicContent } = useSiteContent()
  const section = managedPublicContent.programs
  const programs = section.programs.filter((program) => program.visible)

  return (
    <section id="program" className="section-rule scroll-mt-20 bg-white">
      <div className="container-content section-space">
        <ScrollReveal className="grid gap-10 lg:grid-cols-[.82fr_1.18fr] lg:items-end">
          <div>
            <p className="eyebrow text-forest">{section.eyebrow}</p>
            <h2 className="section-title mt-6 max-w-xl text-charcoal">{section.title}</h2>
          </div>
          <p className="lead-copy lg:justify-self-end">{section.description}</p>
        </ScrollReveal>

        <div className="mobile-horizontal-row mt-14 border-t border-border-soft lg:grid lg:grid-cols-5 lg:overflow-visible">
          {programs.map((program, index) => (
            <ScrollReveal key={program.id} delay={index * 75} className="mobile-horizontal-item h-full lg:min-w-0">
              <Link
                to={`/bidang/${program.slug}`}
                className={`group block h-full min-h-[300px] border-b border-border-soft px-5 py-8 transition-colors hover:bg-warmwhite lg:px-6 lg:border-b-0 ${index > 0 ? 'lg:border-l lg:border-border-soft' : ''}`}
                aria-label={`Buka detail bidang ${program.title}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <span className="text-[11px] font-semibold uppercase tracking-[.15em] text-accent">{program.number}</span>
                  <ArrowUpRight size={17} className="text-muted transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-forest" />
                </div>
                <div className="mt-10 h-1 w-10 bg-forest" />
                <h3 className="mt-6 text-2xl font-semibold leading-tight tracking-[-.035em] text-charcoal">{program.title}</h3>
                <p className="mt-4 text-sm leading-7 text-muted">{program.shortDescription}</p>
                <p className="mt-6 text-xs font-semibold uppercase tracking-[.12em] text-forest">Lihat detail</p>
              </Link>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}
