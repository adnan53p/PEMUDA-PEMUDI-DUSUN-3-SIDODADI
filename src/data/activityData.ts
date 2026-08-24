/**
 * PHASE 03 — PUBLIC ACTIVITY MOCK DATA
 * Seluruh nominal, jumlah peserta, tanggal, lokasi rinci, dan status pada file ini
 * adalah data contoh untuk menguji UI/UX. Ganti dengan data kegiatan terverifikasi
 * sebelum website dipublikasikan sebagai sumber informasi resmi.
 */

export type ActivityStatus =
  | 'Perencanaan'
  | 'Penggalangan'
  | 'Berlangsung'
  | 'Penyelesaian'
  | 'LPJ'
  | 'Selesai'

export interface BudgetItem {
  category: string
  plan: number
  actual: number
}

export interface PurchaseItem {
  id: string
  item: string
  category: string
  vendor: string
  date: string
  total: number
  evidence: 'Tersedia' | 'Menunggu'
}

export interface PublicActivityVideo {
  id: string
  title: string
  provider: 'youtube' | 'google-drive'
  url: string
  embedUrl: string
  thumbnailUrl?: string
}

export interface PublicActivity {
  id: string
  title: string
  shortTitle: string
  category: string
  status: ActivityStatus
  date: string
  dateISO: string
  location: string
  summary: string
  description: string[]
  image: string
  featured?: boolean
  participantTarget: number
  participantActual: number
  finance: {
    target: number
    income: number
    expense: number
    cash: number
  }
  budget: BudgetItem[]
  purchases: PurchaseItem[]
  committeeRoles: string[]
  gallery: string[]
  videos?: PublicActivityVideo[]
  reportStatus: 'Belum tersedia' | 'Disusun' | 'Tersedia'
}

const indonesiaActivityImages = {
  festivalMain: 'https://images.unsplash.com/photo-1660746912153-5a4cc3f5a4ea?q=80&w=1800&auto=format&fit=crop',
  festivalVillage: 'https://images.unsplash.com/photo-1660749411531-1efe3e9c6fd1?q=80&w=1800&auto=format&fit=crop',
  festivalParade: 'https://images.unsplash.com/photo-1660749414248-a59e87e49862?q=80&w=1800&auto=format&fit=crop',
  committeePrep: 'https://images.unsplash.com/photo-1643214257135-9750f75a6cca?q=80&w=1800&auto=format&fit=crop',
  ceremony: 'https://images.unsplash.com/photo-1566409031818-9508be68fc74?q=80&w=1800&auto=format&fit=crop',
  community: 'https://images.unsplash.com/photo-1660749413245-20ebc39eb6cd?q=80&w=1800&auto=format&fit=crop',
  futsal: 'https://images.unsplash.com/photo-1676444920926-c8a084ec4003?q=80&w=1800&auto=format&fit=crop',
  localBusiness: 'https://images.unsplash.com/photo-1771573750025-c428ca6bcaaa?q=80&w=1800&auto=format&fit=crop',
}

const festivalGallery = [
  indonesiaActivityImages.festivalVillage,
  indonesiaActivityImages.festivalParade,
  indonesiaActivityImages.committeePrep,
  indonesiaActivityImages.ceremony,
]


export const publicActivities: PublicActivity[] = [
  {
    id: 'festival-kemerdekaan-2026',
    title: 'Festival Kemerdekaan Dusun 3 Sidodadi 2026',
    shortTitle: 'Festival Kemerdekaan 2026',
    category: 'Budaya',
    status: 'Selesai',
    date: '17 Agustus 2026',
    dateISO: '2026-08-17',
    location: 'Dusun 3 Sidodadi',
    summary:
      'Rangkaian perayaan kemerdekaan yang mempertemukan pemuda dan warga melalui lomba, pentas, dan kerja bersama.',
    description: [
      'Kegiatan ini dirancang sebagai ruang kebersamaan warga, bukan hanya rangkaian perlombaan. Pemuda terlibat dari tahap persiapan, penggalangan dukungan, pelaksanaan, hingga pertanggungjawaban kegiatan.',
      'Halaman ini menjadi contoh bagaimana sebuah kegiatan nantinya dapat memperlihatkan rencana, realisasi anggaran, pembelanjaan, dokumentasi, dan laporan dalam satu cerita publik yang mudah dipahami.',
    ],
    image:
      indonesiaActivityImages.festivalMain,
    featured: true,
    participantTarget: 500,
    participantActual: 620,
    finance: { target: 12_000_000, income: 13_250_000, expense: 10_875_000, cash: 2_375_000 },
    budget: [
      { category: 'Konsumsi', plan: 3_000_000, actual: 2_850_000 },
      { category: 'Perlengkapan', plan: 2_000_000, actual: 2_150_000 },
      { category: 'Hadiah', plan: 4_000_000, actual: 3_950_000 },
      { category: 'Dokumentasi', plan: 1_000_000, actual: 825_000 },
      { category: 'Operasional', plan: 2_000_000, actual: 1_100_000 },
    ],
    purchases: [
      { id: 'p-001', item: 'Konsumsi panitia & peserta', category: 'Konsumsi', vendor: 'Vendor lokal', date: '17 Agustus 2026', total: 2_850_000, evidence: 'Tersedia' },
      { id: 'p-002', item: 'Perlengkapan lomba', category: 'Perlengkapan', vendor: 'Toko lokal', date: '15 Agustus 2026', total: 2_150_000, evidence: 'Tersedia' },
      { id: 'p-003', item: 'Hadiah perlombaan', category: 'Hadiah', vendor: 'Mitra kegiatan', date: '16 Agustus 2026', total: 3_950_000, evidence: 'Tersedia' },
    ],
    committeeRoles: ['Ketua Panitia', 'Sekretaris', 'Bendahara', 'Koordinator Humas', 'Koordinator Acara', 'Koordinator Dokumentasi'],
    gallery: festivalGallery,
    reportStatus: 'Tersedia',
  },
  {
    id: 'turnamen-futsal-antar-rt',
    title: 'Turnamen Futsal Antar RT',
    shortTitle: 'Turnamen Futsal Antar RT',
    category: 'Olahraga',
    status: 'Selesai',
    date: '12 Juli 2026',
    dateISO: '2026-07-12',
    location: 'Lapangan Dusun 3 Sidodadi',
    summary: 'Kompetisi olahraga antar-RT yang menjadi ruang pertemuan, sportivitas, dan kebersamaan pemuda.',
    description: ['Turnamen menjadi agenda olahraga sekaligus ruang kolaborasi antar-RT. Data pada halaman ini masih berupa contoh pengembangan UI.'],
    image: indonesiaActivityImages.futsal,
    participantTarget: 120,
    participantActual: 136,
    finance: { target: 6_000_000, income: 6_500_000, expense: 5_950_000, cash: 550_000 },
    budget: [
      { category: 'Hadiah', plan: 3_000_000, actual: 3_000_000 },
      { category: 'Perlengkapan', plan: 1_500_000, actual: 1_450_000 },
      { category: 'Konsumsi', plan: 1_500_000, actual: 1_500_000 },
    ],
    purchases: [],
    committeeRoles: ['Ketua Panitia', 'Koordinator Pertandingan', 'Humas', 'Bendahara'],
    gallery: [indonesiaActivityImages.futsal, indonesiaActivityImages.community],
    reportStatus: 'Tersedia',
  },
  {
    id: 'bakti-sosial-desa',
    title: 'Bakti Sosial Warga Dusun 3',
    shortTitle: 'Bakti Sosial Warga',
    category: 'Sosial',
    status: 'Selesai',
    date: '9 Juni 2026',
    dateISO: '2026-06-09',
    location: 'Dusun 3 Sidodadi',
    summary: 'Kegiatan sosial bersama warga untuk menyalurkan bantuan dan memperkuat kepedulian lingkungan.',
    description: ['Kegiatan sosial menghubungkan dukungan warga, relawan pemuda, dan dokumentasi penyaluran dalam satu kegiatan.'],
    image: indonesiaActivityImages.community,
    participantTarget: 60,
    participantActual: 74,
    finance: { target: 8_000_000, income: 8_600_000, expense: 8_100_000, cash: 500_000 },
    budget: [
      { category: 'Paket bantuan', plan: 7_000_000, actual: 7_200_000 },
      { category: 'Transportasi', plan: 500_000, actual: 450_000 },
      { category: 'Operasional', plan: 500_000, actual: 450_000 },
    ],
    purchases: [],
    committeeRoles: ['Koordinator Sosial', 'Humas', 'Bendahara', 'Dokumentasi'],
    gallery: [indonesiaActivityImages.community, indonesiaActivityImages.festivalVillage, indonesiaActivityImages.festivalParade],
    reportStatus: 'Tersedia',
  },
  {
    id: 'pelatihan-umkm-pemuda',
    title: 'Pelatihan UMKM & Promosi Digital Pemuda',
    shortTitle: 'Pelatihan UMKM Pemuda',
    category: 'UMKM',
    status: 'Perencanaan',
    date: '20 September 2026',
    dateISO: '2026-09-20',
    location: 'Balai Pertemuan Dusun 3',
    summary: 'Pelatihan praktis untuk membantu pemuda dan warga memperkuat usaha, kemasan, dan pemasaran digital.',
    description: ['Kegiatan masih berada pada tahap perencanaan. Anggaran dan susunan panitia akan berkembang sesuai proses persiapan.'],
    image: indonesiaActivityImages.localBusiness,
    participantTarget: 50,
    participantActual: 0,
    finance: { target: 4_500_000, income: 0, expense: 0, cash: 0 },
    budget: [
      { category: 'Narasumber', plan: 2_000_000, actual: 0 },
      { category: 'Konsumsi', plan: 1_500_000, actual: 0 },
      { category: 'Perlengkapan', plan: 1_000_000, actual: 0 },
    ],
    purchases: [],
    committeeRoles: ['Ketua Panitia', 'Koordinator Materi', 'Humas', 'Bendahara'],
    gallery: [indonesiaActivityImages.localBusiness],
    reportStatus: 'Belum tersedia',
  },
  {
    id: 'kerja-bakti-lingkungan',
    title: 'Kerja Bakti Lingkungan Dusun 3',
    shortTitle: 'Kerja Bakti Lingkungan',
    category: 'Lingkungan',
    status: 'Penggalangan',
    date: '6 September 2026',
    dateISO: '2026-09-06',
    location: 'Lingkungan Dusun 3 Sidodadi',
    summary: 'Gerakan bersama membersihkan fasilitas umum dan menyiapkan kebutuhan lingkungan warga.',
    description: ['Tahap penggalangan dipakai untuk menyiapkan kebutuhan alat dan konsumsi sebelum kegiatan berlangsung.'],
    image: indonesiaActivityImages.committeePrep,
    participantTarget: 80,
    participantActual: 0,
    finance: { target: 2_500_000, income: 1_350_000, expense: 0, cash: 1_350_000 },
    budget: [
      { category: 'Perlengkapan', plan: 1_250_000, actual: 0 },
      { category: 'Konsumsi', plan: 1_000_000, actual: 0 },
      { category: 'Operasional', plan: 250_000, actual: 0 },
    ],
    purchases: [],
    committeeRoles: ['Koordinator Lapangan', 'Humas', 'Bendahara'],
    gallery: [indonesiaActivityImages.committeePrep, indonesiaActivityImages.festivalVillage],
    reportStatus: 'Belum tersedia',
  },
]

export const activityCategories = ['Semua', ...Array.from(new Set(publicActivities.map((item) => item.category)))]
export const activityStatuses = ['Semua', 'Perencanaan', 'Penggalangan', 'Berlangsung', 'Penyelesaian', 'LPJ', 'Selesai'] as const

export function getActivityById(id?: string) {
  return publicActivities.find((activity) => activity.id === id)
}

export function formatRupiah(value: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value)
}
