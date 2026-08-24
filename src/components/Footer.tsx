import { Mail, MapPin, MessageCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { buildWhatsAppLink } from '../config/whatsapp'
import { useSiteContent } from '../prototype/SiteContentContext'

const footerGroups = [
  { title: 'Organisasi', links: [{ label: 'Profil', to: '/profil' }, { label: 'Keabsahan', to: '/keabsahan' }, { label: 'Struktur Pengurus', to: '/kepengurusan' }] },
  { title: 'Transparansi', links: [{ label: 'Kas & Keuangan', to: '/keuangan' }, { label: 'Kegiatan', to: '/kegiatan' }, { label: 'Dokumentasi', to: '/dokumentasi' }] },
  { title: 'Komunitas', links: [{ label: 'Program Pemuda', to: '/#program' }, { label: 'Jadi Relawan', whatsappIntent: true }] },
] as const

export default function Footer() {
  const volunteerLink = buildWhatsAppLink('relawan')
  const { identity } = useSiteContent()

  return (
    <footer className="bg-warmwhite">
      <div className="container-content py-16">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-[1.45fr_1fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-md bg-forest text-sm font-bold text-offwhite">PD</span><span className="text-sm font-bold tracking-[0.04em] text-forest">{identity.name}</span></div>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">Organisasi kepemudaan Dusun 3 Sidodadi yang bergerak dalam kegiatan sosial, olahraga, budaya, pemberdayaan, dan pelayanan masyarakat dengan tata kelola yang terbuka.</p>
            <div className="mt-5 space-y-2 text-sm text-charcoal/75">
              <p className="flex items-center gap-2"><MapPin size={16} className="text-forest" aria-hidden="true" />{identity.locationLabel}</p>
              {identity.email && <a href={`mailto:${identity.email}`} className="inline-flex items-center gap-2 text-charcoal/75 hover:text-forest"><Mail size={16} aria-hidden="true" />{identity.email}</a>}
              {volunteerLink && <div><a href={volunteerLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 font-semibold text-forest hover:text-forest-deep" aria-label={`WhatsApp ${identity.name}`}><MessageCircle size={16} aria-hidden="true" /> WhatsApp resmi</a></div>}
            </div>
          </div>
          {footerGroups.map((group) => <div key={group.title}><p className="eyebrow text-forest">{group.title}</p><ul className="mt-4 space-y-3">{group.links.map((link) => {
            if ('to' in link && link.to) return <li key={link.label}><Link to={link.to} className="text-sm text-charcoal/80 transition-colors hover:text-forest">{link.label}</Link></li>
            if ('whatsappIntent' in link && link.whatsappIntent && volunteerLink) return <li key={link.label}><a href={volunteerLink} target="_blank" rel="noopener noreferrer" className="text-sm text-charcoal/80 transition-colors hover:text-forest">{link.label}</a></li>
            return <li key={link.label}><span className="text-sm text-muted/60">{link.label}</span></li>
          })}</ul></div>)}
        </div>
        <div className="mt-14 flex flex-col gap-3 border-t border-border-soft pt-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between"><p>© 2026 {identity.name}.</p><p className="eyebrow text-muted">Transparan · Partisipatif · Berdampak</p></div>
      </div>
    </footer>
  )
}
