import ScrollReveal from '../components/ScrollReveal'
import { useSiteContent } from '../prototype/SiteContentContext'

export default function ImpactStats() {
  const { managedPublicContent } = useSiteContent()
  const { impact } = managedPublicContent

  return (
    <section id="dampak" className="section-rule scroll-mt-20 bg-white">
      <div className="container-content section-space">
        <ScrollReveal className="grid gap-10 lg:grid-cols-[.82fr_1.18fr] lg:items-end">
          <div>
            <p className="eyebrow text-forest">{impact.eyebrow}</p>
            <h2 className="section-title mt-6 max-w-xl text-charcoal">{impact.title}</h2>
          </div>
          <p className="lead-copy lg:justify-self-end">{impact.description}</p>
        </ScrollReveal>

        <div className="mobile-horizontal-row mt-14 border-y border-border-soft lg:grid lg:grid-cols-4 lg:overflow-visible">
          {impact.stats.map((stat, index) => (
            <ScrollReveal key={stat.id} delay={index * 90} className="mobile-horizontal-item h-full lg:min-w-0">
              <article className={`h-full py-7 px-5 lg:min-h-[210px] lg:px-6 ${index > 0 ? 'lg:border-l lg:border-border-soft' : ''}`}>
                <p className="text-[11px] font-semibold uppercase tracking-[.15em] text-accent">{stat.label}</p>
                <p className="mt-7 text-5xl font-semibold tracking-[-.055em] text-charcoal md:text-6xl">{stat.value}</p>
                <div className="mt-7 h-0.5 w-9 bg-forest" />
              </article>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}
