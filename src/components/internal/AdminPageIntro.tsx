import type { ReactNode } from 'react'

export default function AdminPageIntro({ eyebrow, title, description, actions }: { eyebrow: string; title: string; description: string; actions?: ReactNode }) {
  return (
    <section className="border border-border-soft bg-white px-5 py-6 sm:px-7 sm:py-7">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <p className="eyebrow text-forest">{eyebrow}</p>
          <h2 className="mt-2 text-2xl font-extrabold tracking-[-0.035em] text-charcoal sm:text-3xl">{title}</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">{description}</p>
        </div>
        {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
      </div>
    </section>
  )
}
