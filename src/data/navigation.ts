export type NavigationItem =
  | { label: string; kind: 'route'; to: string }
  | { label: string; kind: 'home-section'; to: string; sectionId: string }

export const mainNavigation: NavigationItem[] = [
  { label: 'Beranda', kind: 'route', to: '/' },
  { label: 'Profil', kind: 'route', to: '/profil' },
  { label: 'Keabsahan', kind: 'route', to: '/keabsahan' },
  { label: 'Kepengurusan', kind: 'route', to: '/kepengurusan' },
  { label: 'Kegiatan', kind: 'route', to: '/kegiatan' },
  { label: 'Dokumentasi', kind: 'route', to: '/dokumentasi' },
  { label: 'Keuangan', kind: 'route', to: '/keuangan' },
]
