import type { ReactNode } from 'react'
import {
  ArrowLeft,
  CalendarDays,
  FileText,
  FolderOpen,
  Home,
  List,
  LogOut,
  Menu,
  Palette,
  Settings,
  Users,
  WalletCards,
  X,
} from 'lucide-react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../../auth/AuthContext'
import RoleBadge from './RoleBadge'
import type { UserRole } from '../../auth/types'

interface MenuItem {
  label: string
  to: string
  icon: typeof Home
  roles: UserRole[]
}

const menuItems: MenuItem[] = [
  // SUPERADMIN = Website / Platform Management only
  { label: 'Ringkasan Website', to: '/superadmin', icon: Home, roles: ['superadmin'] },
  { label: 'Konten Website', to: '/superadmin/konten', icon: FileText, roles: ['superadmin'] },
  { label: 'Tampilan & Brand', to: '/superadmin/tampilan', icon: Palette, roles: ['superadmin'] },
  { label: 'Navigasi Publik', to: '/superadmin/navigasi', icon: List, roles: ['superadmin'] },
  { label: 'Dokumen Publik', to: '/superadmin/dokumen', icon: FolderOpen, roles: ['superadmin'] },
  { label: 'Akun Admin', to: '/superadmin/admin', icon: Users, roles: ['superadmin'] },
  { label: 'Pengaturan Website', to: '/superadmin/pengaturan', icon: Settings, roles: ['superadmin'] },

  // ADMIN = Organization operations only
  { label: 'Ringkasan', to: '/admin', icon: Home, roles: ['admin'] },
  { label: 'Kegiatan', to: '/admin/kegiatan', icon: CalendarDays, roles: ['admin'] },
  { label: 'Humas & Warga', to: '/admin/panitia-humas', icon: Users, roles: ['admin'] },
  { label: 'Keuangan', to: '/admin/keuangan', icon: WalletCards, roles: ['admin'] },
  { label: 'Laporan & LPJ', to: '/admin/laporan', icon: FileText, roles: ['admin'] },

  // HUMAS = Field workspace
  { label: 'Beranda Humas', to: '/humas', icon: Home, roles: ['humas'] },
]

const workspaceLabels: Record<UserRole, string> = {
  superadmin: 'Website Management',
  admin: 'Operasional Organisasi',
  humas: 'Workspace Humas',
}

const sidebarLabels: Record<UserRole, string> = {
  superadmin: 'SIDODADI · WEBSITE',
  admin: 'SIDODADI · OPERASIONAL',
  humas: 'SIDODADI · LAPANGAN',
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { user, logout } = useAuth()
  const location = useLocation()
  if (!user) return null

  const items = menuItems.filter((item) => item.roles.includes(user.role))

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-white/10 px-5 py-5">
        <Link to="/" onClick={onNavigate} className="flex items-center gap-3 text-offwhite">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-offwhite text-xs font-extrabold text-forest">PD</span>
          <div>
            <p className="text-xs font-extrabold tracking-[0.04em]">PEMUDA DUSUN 3</p>
            <p className="text-[0.7rem] text-offwhite/55">{sidebarLabels[user.role]}</p>
          </div>
        </Link>
      </div>

      <div className="px-5 py-5">
        <p className="text-[0.68rem] font-bold uppercase tracking-[0.12em] text-offwhite/45">Akun aktif</p>
        <p className="mt-2 text-sm font-bold text-offwhite">{user.fullName}</p>
        <div className="mt-2"><RoleBadge role={user.role} /></div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4" aria-label="Navigasi internal">
        {items.map((item) => {
          const Icon = item.icon
          const isCurrent = location.pathname === item.to
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold transition-colors ${
                isCurrent ? 'bg-offwhite text-forest' : 'text-offwhite/72 hover:bg-white/8 hover:text-offwhite'
              }`}
            >
              <Icon size={17} />
              {item.label}
            </NavLink>
          )
        })}
      </nav>

      <div className="border-t border-white/10 p-3">
        <Link to="/" onClick={onNavigate} className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold text-offwhite/70 hover:bg-white/8 hover:text-offwhite">
          <ArrowLeft size={17} /> Website publik
        </Link>
        <button
          type="button"
          onClick={() => { void logout(); onNavigate?.() }}
          className="mt-1 flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold text-offwhite/70 hover:bg-white/8 hover:text-offwhite"
        >
          <LogOut size={17} /> Keluar
        </button>
      </div>
    </div>
  )
}

export default function InternalLayout({ children, title, subtitle }: { children: ReactNode; title: string; subtitle: string }) {
  const { user } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[#F3F5F1] text-charcoal">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 bg-forest-deep lg:block">
        <SidebarContent />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" className="absolute inset-0 bg-charcoal/45" aria-label="Tutup menu internal" onClick={() => setMobileOpen(false)} />
          <aside className="relative h-full w-[82%] max-w-xs bg-forest-deep shadow-2xl">
            <button type="button" onClick={() => setMobileOpen(false)} className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-offwhite" aria-label="Tutup menu">
              <X size={18} />
            </button>
            <SidebarContent onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-border-soft bg-offwhite/95 backdrop-blur-md">
          <div className="flex min-h-16 items-center gap-3 px-3 py-2.5 sm:min-h-18 sm:gap-4 sm:px-6 sm:py-3 lg:px-8">
            <button type="button" onClick={() => setMobileOpen(true)} className="flex h-10 w-10 items-center justify-center rounded-md border border-border-soft bg-white text-forest lg:hidden" aria-label="Buka menu internal">
              <Menu size={20} />
            </button>
            <div className="min-w-0 flex-1">
              <p className="text-[0.68rem] font-extrabold uppercase tracking-[0.12em] text-forest">{user ? workspaceLabels[user.role] : 'Workspace Internal'}</p>
              <h1 className="truncate text-lg font-extrabold tracking-[-0.025em] text-charcoal sm:text-xl">{title}</h1>
              <p className="hidden text-xs text-muted sm:block">{subtitle}</p>
            </div>
            <div className="hidden items-center gap-3 sm:flex">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sage/55 text-xs font-extrabold text-forest">{user?.initials}</span>
              <div className="max-w-40">
                <p className="truncate text-xs font-bold text-charcoal">{user?.fullName}</p>
                {user && <RoleBadge role={user.role} />}
              </div>
            </div>
          </div>
        </header>

        <main className="px-3 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  )
}
