/**
 * MOCK DATA — Phase 01
 * Seluruh angka, kegiatan, dan dokumentasi di file ini adalah data contoh lokal
 * untuk development. Jangan dianggap sebagai data resmi organisasi sebelum
 * diganti dengan data terverifikasi pada fase berikutnya.
 */

export const mediaAssets = {
  hero:
    'https://images.unsplash.com/photo-1660749414248-a59e87e49862?q=80&w=2200&auto=format&fit=crop',
} as const

export interface ImpactStat {
  id: string
  value: string
  label: string
}

export const impactStats: ImpactStat[] = [
  { id: 'anggota', value: '128', label: 'Anggota Aktif' },
  { id: 'kegiatan', value: '24', label: 'Kegiatan Tahun Ini' },
  { id: 'program', value: '5', label: 'Bidang Program' },
  { id: 'warga', value: '600+', label: 'Warga Terlibat' },
]

export interface Activity {
  id: string
  title: string
  category: string
  date: string
  description: string
  image: string
  featured?: boolean
}

export const activities: Activity[] = [
  {
    id: 'festival-kemerdekaan-2026',
    title: 'Festival Kemerdekaan Dusun 3 Sidodadi 2026',
    category: 'BUDAYA',
    date: '17 Agustus 2026',
    description:
      'Tiga hari perayaan pentas seni tradisional, lomba anak desa, dan malam tirakatan di lapangan desa yang dihadiri lebih dari 600 warga.',
    image:
      'https://images.unsplash.com/photo-1660746912153-5a4cc3f5a4ea?q=80&w=1800&auto=format&fit=crop',
    featured: true,
  },
  {
    id: 'turnamen-futsal-antar-rt',
    title: 'Turnamen Futsal Antar RT',
    category: 'OLAHRAGA',
    date: '12 Juli 2026',
    description:
      'Delapan tim RT bertanding sepak bola pekan sore, seluruh hasil tiket dan sponsor tercatat terbuka pada laporan kas bulan Juli.',
    image:
      'https://images.unsplash.com/photo-1676444920926-c8a084ec4003?q=80&w=1800&auto=format&fit=crop',
  },
  {
    id: 'bakti-sosial-desa',
    title: 'Bakti Sosial Desa',
    category: 'SOSIAL',
    date: '9 Juni 2026',
    description:
      'Distribusi 150 paket kebutuhan pokok untuk lansia dan keluarga prasejahtera, bekerja sama dengan posyandu dan karang taruna.',
    image:
      'https://images.unsplash.com/photo-1660749413245-20ebc39eb6cd?q=80&w=1800&auto=format&fit=crop',
  },
]

export interface ProgramItem {
  id: string
  number: string
  title: string
  description: string
}

export const programs: ProgramItem[] = [
  {
    id: 'sosial-lingkungan',
    number: '01',
    title: 'Sosial & Lingkungan',
    description: 'Kerja bakti rutin, bantuan warga prasejahtera, dan kepedulian lingkungan dusun.',
  },
  {
    id: 'umkm-pemuda',
    number: '02',
    title: 'UMKM Pemuda',
    description: 'Pendampingan usaha kecil dan promosi produk warga muda dusun.',
  },
  {
    id: 'olahraga',
    number: '03',
    title: 'Olahraga',
    description: 'Turnamen antar RT dan latihan rutin untuk menjaga kebersamaan warga.',
  },
  {
    id: 'pendidikan',
    number: '04',
    title: 'Pendidikan',
    description: 'Bimbingan belajar anak dusun dan literasi bagi generasi muda.',
  },
  {
    id: 'kreatif-budaya',
    number: '05',
    title: 'Kreatif & Budaya',
    description: 'Pelestarian seni tradisi dan wadah kreativitas pemuda dusun.',
  },
]

export interface DocumentationImage {
  id: string
  image: string
  caption: string
  orientation: 'portrait' | 'landscape'
}

export const documentationImages: DocumentationImage[] = [
  {
    id: 'doc-1',
    image:
      'https://images.unsplash.com/photo-1643214257135-9750f75a6cca?q=80&w=1400&auto=format&fit=crop',
    caption: 'Pemuda menyiapkan lingkungan dan atribut kegiatan bersama warga.',
    orientation: 'portrait',
  },
  {
    id: 'doc-2',
    image:
      'https://images.unsplash.com/photo-1660749411531-1efe3e9c6fd1?q=80&w=1800&auto=format&fit=crop',
    caption: 'Warga dan pemuda berkumpul dalam suasana kegiatan kampung yang meriah.',
    orientation: 'landscape',
  },
]

/** Hanya section yang benar-benar tersedia pada Homepage Phase 01. */
export const navLinks = [
  { label: 'Beranda', href: '#beranda', sectionId: 'beranda' },
  { label: 'Kegiatan', href: '#kegiatan', sectionId: 'kegiatan' },
  { label: 'Program', href: '#program', sectionId: 'program' },
  { label: 'Dokumentasi', href: '#dokumentasi', sectionId: 'dokumentasi' },
] as const

export function formatRupiah(value: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value)
}
