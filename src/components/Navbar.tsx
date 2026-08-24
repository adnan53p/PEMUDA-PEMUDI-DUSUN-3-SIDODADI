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
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (location.pathname !== '/') return
    const configuredSectionIds = visibleNavigation.filter((item) => item.kind === 'home-section').map((item) => item.sectionId)
    const sectionIds = Array.from(new Set(['beranda', ...configuredSectionIds, 'kegiatan', 'program', 'dokumentasi']))
    const sections = sectionIds.map((id) => document.getElementById(id)).filter((section): section is HTMLElement => Boolean(section))
    if (!sections.length) return
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
      if (visible?.target.id) setActiveSection(visible.target.id)
    }, { rootMargin: '-22% 0px -62% 0px', threshold: [0.05, 0.2, 0.45] })
    sections.forEach((section) => observer.observe(section))
    return () => observer.disconnect()
  }, [location.pathname, visibleNavigation])

  useEffect(() => {
    setMobileOpen(false)
    if (location.pathname !== '/') window.scrollTo({ top: 0, behavior: 'auto' })
  }, [location.pathname])

  return (
    <header className={`sticky top-0 z-50 bg-offwhite/95 backdrop-blur-md transition-[box-shadow,border-color] duration-200 ${scrolled ? 'border-b border-border-soft shadow-[0_8px_24px_rgba(18,61,50,0.05)]' : 'border-b border-transparent'}`}>
      <div className="container-content flex items-center justify-between py-4">
        <Link to="/" className="flex items-center gap-3" aria-label={`Kembali ke beranda ${identity.name}`}>
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-forest text-sm font-bold tracking-wide text-offwhite">PD</span>
          <span className="hidden text-sm font-extrabold tracking-[0.035em] text-charcoal sm:block md:text-[0.98rem]">{identity.name}</span>
          <span className="text-sm font-bold tracking-wide text-charcoal sm:hidden">{identity.shortName}</span>
        </Link>

        <nav className="hidden items-center gap-4 xl:flex" aria-label="Navigasi utama">
          {visibleNavigation.map((item) => {
            const active = getItemActive(item, location.pathname, activeSection)
            return <Link key={`${item.kind}-${item.to}`} to={item.to} aria-current={active ? 'page' : undefined} className={`relative py-2 text-[0.82rem] font-semibold transition-colors after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:origin-left after:bg-forest after:transition-transform ${active ? 'text-forest after:scale-x-100' : 'text-charcoal/70 after:scale-x-0 hover:text-forest hover:after:scale-x-100'}`}>{item.label}</Link>
          })}
        </nav>

        <div className="hidden items-center gap-3 xl:flex">
          <Link to={workspacePath} className="inline-flex items-center gap-1.5 px-2 py-2 text-[0.82rem] font-semibold text-charcoal/70 transition-colors hover:text-forest">{user ? <LayoutDashboard size={15} /> : <LogIn size={15} />} {user ? 'Workspace' : 'Masuk'}</Link>
          <Link to="/keuangan" className="btn btn-primary">Transparansi</Link>
        </div>

        <button type="button" aria-label={mobileOpen ? 'Tutup menu' : 'Buka menu'} aria-expanded={mobileOpen} aria-controls="mobile-navigation" className="flex h-10 w-10 items-center justify-center rounded-md text-charcoal transition-colors hover:bg-sage/30 xl:hidden" onClick={() => setMobileOpen((value) => !value)}>{mobileOpen ? <X size={22} /> : <Menu size={22} />}</button>
      </div>

      {mobileOpen && <div id="mobile-navigation" className="border-t border-border-soft bg-offwhite xl:hidden"><nav className="container-content flex flex-col gap-1 py-4" aria-label="Navigasi mobile">
        {visibleNavigation.map((item) => {
          const active = getItemActive(item, location.pathname, activeSection)
          return <Link key={`${item.kind}-${item.to}`} to={item.to} aria-current={active ? 'page' : undefined} className={`rounded-md px-3 py-3 text-[0.95rem] font-semibold transition-colors ${active ? 'bg-sage/50 text-forest' : 'text-charcoal hover:bg-sage/30'}`}>{item.label}</Link>
        })}
        <div className="mt-2 grid grid-cols-2 gap-2"><Link to={workspacePath} className="btn btn-secondary justify-center">{user ? <LayoutDashboard size={16} /> : <LogIn size={16} />} {user ? 'Workspace' : 'Masuk'}</Link><Link to="/keuangan" className="btn btn-primary justify-center">Transparansi</Link></div>
      </nav></div>}
    </header>
  )
}
