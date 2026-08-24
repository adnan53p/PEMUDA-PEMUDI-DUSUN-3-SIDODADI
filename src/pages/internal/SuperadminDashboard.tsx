import { ExternalLink, FileText, LayoutTemplate, Palette, Settings, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import InternalLayout from '../../components/internal/InternalLayout'
import InternalNotice from '../../components/internal/InternalNotice'
import InternalStat from '../../components/internal/InternalStat'
import { publicPageItems, websiteChangeLog, websiteMetrics } from '../../data/internal/cmsData'

const managementCards = [
  { to: '/superadmin/konten', label: 'Konten Website', note: 'Edit identitas, hero, copy, dan section Homepage.', icon: FileText },
  { to: '/superadmin/tampilan', label: 'Tampilan & Brand', note: 'Atur warna, tipografi, surface, dan gaya visual.', icon: Palette },
  { to: '/superadmin/navigasi', label: 'Navigasi Publik', note: 'Kelola menu dan urutan halaman website.', icon: LayoutTemplate },
  { to: '/superadmin/admin', label: 'Akun Admin', note: 'Kelola siapa yang memegang operasional organisasi.', icon: Users },
  { to: '/superadmin/pengaturan', label: 'Pengaturan Website', note: 'Identitas, kontak publik, SEO, dan konfigurasi.', icon: Settings },
]

export default function SuperadminDashboard() {
  return (
    <InternalLayout title="Website Management" subtitle="Kelola website publik, tampilan, konten, navigasi, dan akun Admin. Bukan area operasional kegiatan.">
      <InternalNotice />

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <InternalStat label="Halaman publik" value={String(websiteMetrics.publicPages)} note="Route publik yang tersedia" icon={LayoutTemplate} />
        <InternalStat label="Section Homepage" value={String(websiteMetrics.homepageSections)} note="Komponen utama beranda" icon={FileText} />
        <InternalStat label="Dokumen resmi publik" value={String(websiteMetrics.officialDocumentsPublished)} note="Belum ada dokumen resmi dikonfirmasi" icon={FileText} />
        <InternalStat label="Akun Admin" value={String(websiteMetrics.adminAccounts)} note="Pengelola operasional organisasi" icon={Users} />
      </section>

      <section className="mt-6 overflow-hidden border border-border-soft bg-white">
        <div className="flex flex-col gap-4 border-b border-border-soft px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <p className="eyebrow text-forest">KONTROL WEBSITE</p>
            <h2 className="mt-2 text-xl font-extrabold text-charcoal">Kelola apa yang dilihat masyarakat.</h2>
            <p className="mt-2 max-w-3xl text-xs leading-relaxed text-muted">Superadmin mengelola konten dan presentasi website. Kegiatan, transaksi, Humas, RAB, verifikasi, laporan, dan LPJ berada di area Admin.</p>
          </div>
          <Link to="/" className="btn btn-secondary shrink-0">Buka Website <ExternalLink size={16} /></Link>
        </div>
        <div className="grid gap-px bg-border-soft sm:grid-cols-2 xl:grid-cols-5">
          {managementCards.map((item) => {
            const Icon = item.icon
            return (
              <Link key={item.to} to={item.to} className="group bg-white p-5 transition-colors hover:bg-warmwhite">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-sage/60 text-forest"><Icon size={18} /></span>
                <p className="mt-5 text-sm font-extrabold text-charcoal group-hover:text-forest">{item.label}</p>
                <p className="mt-2 text-xs leading-relaxed text-muted">{item.note}</p>
              </Link>
            )
          })}
        </div>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="border border-border-soft bg-white">
          <div className="border-b border-border-soft px-5 py-5 sm:px-6">
            <p className="eyebrow text-forest">HALAMAN WEBSITE</p>
            <h2 className="mt-2 text-xl font-extrabold text-charcoal">Struktur publik saat ini.</h2>
          </div>
          <div className="divide-y divide-border-soft">
            {publicPageItems.map((page) => (
              <div key={page.id} className="grid gap-2 px-5 py-4 sm:grid-cols-[150px_90px_1fr] sm:items-start sm:px-6">
                <div>
                  <p className="text-sm font-extrabold text-charcoal">{page.title}</p>
                  <p className="mt-1 text-xs font-semibold text-forest">{page.path}</p>
                </div>
                <span className="w-fit bg-sage/60 px-2.5 py-1 text-[0.62rem] font-extrabold uppercase tracking-[0.08em] text-forest">{page.status}</span>
                <p className="text-xs leading-relaxed text-muted">{page.purpose}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="border border-border-soft bg-white">
          <div className="border-b border-border-soft px-5 py-5 sm:px-6">
            <p className="eyebrow text-forest">JEJAK WEBSITE</p>
            <h2 className="mt-2 text-xl font-extrabold text-charcoal">Perubahan CMS.</h2>
          </div>
          <div className="divide-y divide-border-soft">
            {websiteChangeLog.map((item) => (
              <div key={item.id} className="px-5 py-5 sm:px-6">
                <p className="text-sm text-charcoal"><strong>{item.actor}</strong> {item.action}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted">{item.detail}</p>
              </div>
            ))}
          </div>
          <div className="border-t border-border-soft bg-warmwhite px-5 py-4 text-xs leading-relaxed text-muted sm:px-6">Audit transaksi organisasi tidak berada di sini. Audit operasional adalah tanggung jawab Admin.</div>
        </div>
      </section>
    </InternalLayout>
  )
}
