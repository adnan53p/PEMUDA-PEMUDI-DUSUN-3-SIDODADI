import { programs } from '../data/mockData'

export default function ProgramsSection() {
  return (
    <section id="program" className="bg-offwhite scroll-mt-20">
      <div className="container-content py-20 md:py-24">
        <p className="eyebrow text-forest">Program Pemuda</p>
        <h2 className="mt-3 max-w-2xl text-3xl font-bold tracking-[-0.035em] text-charcoal md:text-4xl">
          Lima arah gerak yang kami jalankan.
        </h2>

        <div className="mt-12 divide-y divide-border-soft border-t border-border-soft">
          {programs.map((program) => (
            <div
              key={program.id}
              className="grid grid-cols-[3rem_1fr] items-baseline gap-4 py-6 transition-colors hover:bg-sage/25 sm:grid-cols-[4rem_1fr_2fr] sm:px-4"
            >
              <span className="text-lg font-bold tracking-[-0.02em] text-muted">{program.number}</span>
              <h3 className="text-lg font-bold tracking-[-0.02em] text-charcoal sm:text-xl">
                {program.title}
              </h3>
              <p className="col-span-2 mt-1 text-sm leading-relaxed text-muted sm:col-span-1 sm:mt-0">
                {program.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
