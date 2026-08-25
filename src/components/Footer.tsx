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
    <footer className="bg-[#15171A] text-white">
      <div className="h-1 bg-accent" />
      <div className="container-content py-14 md:py-18">
        <div className="grid gap-12 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-3"><span className="grid h-10 w-10 grid-cols-2 overflow-hidden bg-white"><span className="bg-accent"/><span className="bg-forest"/><span className="col-span-2 flex items-center justify-center text-[10px] font-bold text-charcoal">P3</span></span><span className="text-sm font-semibold tracking-[-.02em]">{identity.name}</span></div>
            <p className="mt-5 max-w-sm text-sm leading-7 text-white/58">Ruang digital Pemuda Dusun 3 Sidodadi untuk kegiatan, informasi, dokumentasi, dan transparansi organisasi.</p>
            <div className="mt-5 space-y-2 text-sm text-white/62"><p className="flex items-center gap-2"><MapPin size={15} className="text-white/45"/>{identity.locationLabel}</p>{identity.email && <a href={`mailto:${identity.email}`} className="inline-flex items-center gap-2 hover:text-white"><Mail size={15} className="text-white/45"/>{identity.email}</a>}{volunteerLink && <div><a href={volunteerLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 font-medium text-white"><MessageCircle size={15} className="text-white/45"/> WhatsApp resmi</a></div>}</div>
          </div>
          {footerGroups.map((group) => <div key={group.title}><p className="text-[11px] font-semibold uppercase tracking-[.15em] text-white/45">{group.title}</p><ul className="mt-4 space-y-3">{group.links.map((link) => {
            if ('to' in link && link.to) return <li key={link.label}><Link to={link.to} className="text-sm text-white/62 hover:text-white">{link.label}</Link></li>
            if ('whatsappIntent' in link && link.whatsappIntent && volunteerLink) return <li key={link.label}><a href={volunteerLink} target="_blank" rel="noopener noreferrer" className="text-sm text-white/62 hover:text-white">{link.label}</a></li>
            return <li key={link.label}><span className="text-sm text-white/35">{link.label}</span></li>
          })}</ul></div>)}
        </div>
        <div className="mt-14 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs text-white/38 sm:flex-row sm:items-center sm:justify-between"><p>© 2026 {identity.name}.</p><p>Transparan · Kolaboratif · Terbuka</p></div>
      </div>
    </footer>
  )
}
