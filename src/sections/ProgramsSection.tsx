import { ArrowUpRight } from 'lucide-react'
import { programs } from '../data/mockData'

export default function ProgramsSection() {
  return (
    <section id="program" className="section-rule scroll-mt-20 bg-white">
      <div className="container-content section-space">
        <div className="grid gap-10 lg:grid-cols-[.82fr_1.18fr] lg:items-end">
          <div>
            <p className="eyebrow text-forest">Program Pemuda</p>
            <h2 className="section-title mt-6 max-w-xl text-charcoal">Lima bidang, satu tujuan: lingkungan yang lebih kuat.</h2>
          </div>
          <p className="lead-copy lg:justify-self-end">Kami mengambil struktur yang lebih tenang seperti halaman inisiatif yayasan: setiap program diberi ruang yang setara, dengan aksen warna yang konsisten.</p>
        </div>

        <div className="mt-14 grid border-t border-border-soft md:grid-cols-2 lg:grid-cols-5">
          {programs.map((program, index) => (
            <article key={program.id} className={`group min-h-[320px] border-b border-border-soft px-0 py-8 md:px-6 lg:border-b-0 ${index > 0 ? 'lg:border-l lg:border-border-soft' : ''}`}>
              <div className="flex items-start justify-between gap-4">
                <span className="text-[11px] font-semibold uppercase tracking-[.15em] text-accent">{program.number}</span>
                <ArrowUpRight size={17} className="text-muted transition-colors group-hover:text-forest" />
              </div>
              <div className="mt-10 h-1 w-10 bg-forest" />
              <h3 className="mt-6 text-2xl font-semibold leading-tight tracking-[-.035em] text-charcoal">{program.title}</h3>
              <p className="mt-4 text-sm leading-7 text-muted">{program.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
