import { useEffect, useMemo, useState } from 'react'
import { LayoutDashboard, LogIn, Menu, X } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import type { NavigationItem } from '../data/navigation'
import { useSiteContent } from '../prototype/SiteContentContext'
import { useAuth } from '../auth/AuthContext'

function getItemActive(item: NavigationItem, pathname: string, activeSection: string) {
  if (item.kind === 'route') {
    if (item.to === '/kegiatan') return pathname === '/kegiatan' || pathname.startsWith('/kegiatan/')
    return pathname === item.to
  }
  return pathname === '/' && activeSection === item.sectionId
}

export default function Navbar() {
  const location = useLocation()
  const { navigation, identity } = useSiteContent()
  const { user } = useAuth()
  const workspacePath = user ? `/${user.role}` : '/login'
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [activeSection, setActiveSection] = useState('beranda')
  const visibleNavigation = useMemo(() => navigation.filter((item) => item.visible), [navigation])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll(); window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (location.pathname !== '/') return
    const configuredSectionIds = visibleNavigation.filter((item) => item.kind === 'home-section').map((item) => item.sectionId)
    const sectionIds = Array.from(new Set(['beranda', ...configuredSectionIds, 'kegiatan', 'program', 'dokumentasi']))
    const sections = sectionIds.map((id) => document.getElementById(id)).filter((section): section is HTMLElement => Boolean(section))
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
      if (visible?.target.id) setActiveSection(visible.target.id)
    }, { rootMargin: '-22% 0px -62% 0px', threshold: [0.05, 0.2, 0.45] })
    sections.forEach((section) => observer.observe(section))
    return () => observer.disconnect()
  }, [location.pathname, visibleNavigation])

  useEffect(() => { setMobileOpen(false); if (location.pathname !== '/') window.scrollTo({ top: 0, behavior: 'auto' }) }, [location.pathname])

  return (
    <header className={`sticky top-0 z-50 border-b transition-colors ${scrolled ? 'border-border-soft bg-white/96 backdrop-blur-xl' : 'border-transparent bg-white/94 backdrop-blur-md'}`}>
      <div className="container-content flex h-[72px] items-center justify-between">
        <Link to="/" className="flex items-center gap-3" aria-label={`Kembali ke beranda ${identity.name}`}>
          <span className="grid h-10 w-10 grid-cols-2 overflow-hidden border border-border-soft bg-white" aria-hidden="true">
            <span className="bg-accent" />
            <span className="bg-forest" />
            <span className="col-span-2 flex items-center justify-center text-[10px] font-bold tracking-[-.02em] text-charcoal">P3</span>
          </span>
          <div className="hidden sm:block">
            <p className="text-[13px] font-semibold leading-tight tracking-[-.02em] text-charcoal">{identity.name}</p>
            <p className="mt-1 text-[10px] font-medium uppercase tracking-[.15em] text-muted">Sidodadi</p>
          </div>
          <span className="text-sm font-semibold text-charcoal sm:hidden">{identity.shortName}</span>
        </Link>

        <nav className="hidden items-center gap-7 xl:flex" aria-label="Navigasi utama">
          {visibleNavigation.map((item) => {
            const active = getItemActive(item, location.pathname, activeSection)
            return <Link key={`${item.kind}-${item.to}`} to={item.to} className={`relative py-2 text-[.79rem] font-medium transition-colors ${active ? 'text-charcoal' : 'text-muted hover:text-charcoal'}`}>
              {item.label}
              {active && <span className="absolute inset-x-0 -bottom-[18px] h-0.5 bg-accent" />}
            </Link>
          })}
        </nav>

        <div className="hidden items-center gap-4 xl:flex">
          <Link to={workspacePath} className="inline-flex items-center gap-1.5 text-[.79rem] font-medium text-muted transition-colors hover:text-charcoal">{user ? <LayoutDashboard size={15}/> : <LogIn size={15}/>} {user ? 'Ruang Pengurus' : 'Masuk'}</Link>
          <Link to="/keuangan" className="btn btn-primary !min-h-10 !px-4 !py-2">Transparansi</Link>
        </div>

        <button type="button" aria-label={mobileOpen ? 'Tutup menu' : 'Buka menu'} className="flex h-11 w-11 items-center justify-center border border-border-soft bg-white xl:hidden" onClick={() => setMobileOpen((v) => !v)}>{mobileOpen ? <X size={21}/> : <Menu size={21}/>}</button>
      </div>

      {mobileOpen && <div className="border-t border-border-soft bg-white xl:hidden"><nav className="container-content flex flex-col py-4">{visibleNavigation.map((item) => {
        const active = getItemActive(item, location.pathname, activeSection)
        return <Link key={`${item.kind}-${item.to}`} to={item.to} className={`border-b border-border-soft px-1 py-3 text-sm font-medium ${active ? 'text-forest' : 'text-charcoal'}`}>{item.label}</Link>
      })}<div className="mt-4 grid grid-cols-2 gap-2"><Link to={workspacePath} className="btn btn-secondary">{user ? 'Ruang Pengurus' : 'Masuk'}</Link><Link to="/keuangan" className="btn btn-primary">Transparansi</Link></div></nav></div>}
    </header>
  )
}
