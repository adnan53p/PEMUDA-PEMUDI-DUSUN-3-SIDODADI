import type { ReactNode } from 'react'

interface PageIntroProps {
  eyebrow: string
  title: ReactNode
  description: string
  aside?: ReactNode
}

export default function PageIntro({ eyebrow, title, description, aside }: PageIntroProps) {
  return (
    <section className="border-b border-border-soft bg-offwhite">
      <div className="container-content grid gap-10 py-16 md:py-20 lg:grid-cols-[1.25fr_0.75fr] lg:items-end lg:py-24">
        <div>
          <p className="eyebrow text-forest">{eyebrow}</p>
          <h1 className="mt-5 max-w-4xl text-4xl font-extrabold leading-[0.98] tracking-[-0.05em] text-charcoal sm:text-5xl md:text-6xl lg:text-7xl">
            {title}
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted md:text-lg">{description}</p>
        </div>
        {aside ? <div className="lg:justify-self-end">{aside}</div> : null}
      </div>
    </section>
  )
}
