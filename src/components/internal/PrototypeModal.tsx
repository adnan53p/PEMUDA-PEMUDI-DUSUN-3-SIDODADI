import type { ReactNode } from 'react'
import { X } from 'lucide-react'

export default function PrototypeModal({ open, title, description, children, onClose }: { open: boolean; title: string; description?: string; children: ReactNode; onClose: () => void }) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" className="absolute inset-0 bg-charcoal/55" onClick={onClose} aria-label="Tutup dialog" />
      <div className="relative z-10 max-h-[92vh] w-full overflow-y-auto bg-offwhite shadow-2xl sm:max-w-2xl sm:border sm:border-border-soft">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-border-soft bg-offwhite px-5 py-5 sm:px-6">
          <div>
            <h3 className="text-xl font-extrabold text-charcoal">{title}</h3>
            {description && <p className="mt-1 text-xs leading-relaxed text-muted">{description}</p>}
          </div>
          <button type="button" onClick={onClose} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border-soft bg-white text-muted hover:text-forest" aria-label="Tutup"><X size={18} /></button>
        </div>
        <div className="px-5 py-5 sm:px-6 sm:py-6">{children}</div>
      </div>
    </div>
  )
}
