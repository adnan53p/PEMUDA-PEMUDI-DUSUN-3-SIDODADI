export const websiteMetrics = {
  publicPages: 8,
  homepageSections: 6,
  officialDocumentsPublished: 0,
  adminAccounts: 1,
} as const

export const publicPageItems = [
  { id: 'home', title: 'Beranda', path: '/', status: 'Publik', purpose: 'Identitas, program, kegiatan pilihan, dokumentasi, dan CTA.' },
  { id: 'profile', title: 'Profil', path: '/profil', status: 'Publik', purpose: 'Cerita, visi, misi, nilai, dan perjalanan organisasi.' },
  { id: 'legality', title: 'Keabsahan', path: '/keabsahan', status: 'Publik', purpose: 'Dokumen resmi yang memang diizinkan untuk ditampilkan.' },
  { id: 'organization', title: 'Kepengurusan', path: '/kepengurusan', status: 'Publik', purpose: 'Bagan kepengurusan aktif dan arsip periode.' },
  { id: 'activities', title: 'Kegiatan', path: '/kegiatan', status: 'Publik', purpose: 'Daftar dan cerita kegiatan Pemuda Dusun 3 Sidodadi.' },
  { id: 'documentation', title: 'Dokumentasi', path: '/dokumentasi', status: 'Publik', purpose: 'Galeri kegiatan yang telah dipublikasikan.' },
  { id: 'finance', title: 'Keuangan', path: '/keuangan', status: 'Publik', purpose: 'Transparansi keuangan publik tanpa data pribadi.' },
  { id: 'login', title: 'Portal Pengurus', path: '/login', status: 'Internal', purpose: 'Pintu masuk Superadmin, Admin, dan Humas.' },
] as const

export const homepageSectionItems = [
  { id: 'hero', title: 'Hero', description: 'Headline, foto utama, subheadline, dan CTA.', visible: true },
  { id: 'impact', title: 'Dampak Organisasi', description: 'Statistik non-keuangan pada beranda.', visible: true },
  { id: 'activities', title: 'Kegiatan Pilihan', description: 'Kegiatan terbaru yang ditonjolkan di beranda.', visible: true },
  { id: 'programs', title: 'Program Pemuda', description: 'Bidang sosial, UMKM, olahraga, pendidikan, dan budaya.', visible: true },
  { id: 'documentation', title: 'Dokumentasi', description: 'Foto kegiatan pilihan.', visible: true },
  { id: 'cta', title: 'CTA Akhir', description: 'Ajakan bergabung dan akses ke informasi penting.', visible: true },
] as const

export const websiteChangeLog = [
  { id: 'cms-log-001', actor: 'Superadmin', action: 'mengatur identitas website', detail: 'Nama brand dan informasi publik.' },
  { id: 'cms-log-002', actor: 'Superadmin', action: 'mengelola navigasi publik', detail: 'Urutan menu dan tujuan halaman.' },
  { id: 'cms-log-003', actor: 'Superadmin', action: 'mengatur tampilan website', detail: 'Palet Forest Green, Off-white, Sage, dan Charcoal.' },
] as const

export const adminAccountPreview = [
  {
    id: 'usr-admin-001',
    name: 'Admin Organisasi',
    role: 'Admin',
    status: 'Aktif (demo)',
    scope: 'Operasional organisasi, kegiatan, keuangan, verifikasi, laporan, dan audit operasional.',
  },
] as const
