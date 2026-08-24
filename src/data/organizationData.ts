/**
 * Phase 02 organization content.
 * Konten nama pengurus/dokumen resmi belum diberikan pemilik project.
 * Karena itu data faktual yang belum dikonfirmasi tidak dibuat-buat.
 */

export const organizationProfile = {
  eyebrow: 'PEMUDA DUSUN 3 SIDODADI',
  title: 'Ruang tumbuh, bergerak, dan bertanggung jawab bersama.',
  intro:
    'Pemuda Dusun 3 Sidodadi menjadi ruang kolaborasi pemuda untuk menggerakkan kegiatan sosial, budaya, olahraga, pemberdayaan, dan pelayanan masyarakat dengan tata kelola yang terbuka.',
  history:
    'Halaman profil ini disiapkan sebagai rumah informasi organisasi. Riwayat resmi, tonggak kegiatan, dan cerita perjalanan organisasi dapat dilengkapi setelah data periode dan arsip lama dikonfirmasi oleh pengurus.',
  vision:
    'Membangun pemuda yang aktif, kompak, mandiri, dan mampu memberi dampak nyata bagi lingkungan Dusun 3 Sidodadi.',
  missions: [
    'Menciptakan kegiatan yang relevan dengan kebutuhan warga dan pemuda.',
    'Mendorong budaya gotong royong, keterbukaan, dan tanggung jawab bersama.',
    'Membuka ruang pengembangan keterampilan, kreativitas, olahraga, dan usaha pemuda.',
    'Mendokumentasikan kegiatan dan pertanggungjawaban organisasi secara rapi dan berkelanjutan.',
  ],
  values: [
    { number: '01', title: 'Gotong Royong', description: 'Bergerak bersama dan saling menguatkan ketika kegiatan membutuhkan banyak tangan.' },
    { number: '02', title: 'Transparan', description: 'Keputusan, kegiatan, dan keuangan dikelola dengan informasi yang dapat dipertanggungjawabkan.' },
    { number: '03', title: 'Partisipatif', description: 'Pemuda dan warga diberi ruang untuk ikut, menyampaikan gagasan, dan berkontribusi.' },
    { number: '04', title: 'Berdampak', description: 'Kegiatan tidak berhenti pada seremoni, tetapi diarahkan pada manfaat yang terasa bagi lingkungan.' },
  ],
} as const

export type DocumentStatus = 'Berlaku' | 'Arsip' | 'Belum tersedia'

export interface LegalityDocument {
  id: string
  title: string
  type: string
  number: string
  date: string
  issuer: string
  period: string
  status: DocumentStatus
  description: string
  pdfUrl?: string
  isSample?: boolean
}

export const organizationPeriods = ['Periode Aktif', 'Arsip Periode Sebelumnya'] as const

export const legalityDocuments: LegalityDocument[] = [
  {
    id: 'sk-pengurus',
    title: 'SK Kepengurusan',
    type: 'Surat Keputusan',
    number: 'Belum dikonfirmasi',
    date: 'Belum dikonfirmasi',
    issuer: 'Belum dikonfirmasi',
    period: 'Periode Aktif',
    status: 'Belum tersedia',
    description: 'Dokumen pengesahan susunan kepengurusan aktif. File resmi akan ditempatkan di sini setelah diberikan oleh pengurus.',
  },
  {
    id: 'ad-art',
    title: 'AD / ART Organisasi',
    type: 'Dokumen Organisasi',
    number: 'Belum dikonfirmasi',
    date: 'Belum dikonfirmasi',
    issuer: 'Pemuda Dusun 3 Sidodadi',
    period: 'Periode Aktif',
    status: 'Belum tersedia',
    description: 'Ruang untuk dokumen aturan dasar dan tata kelola organisasi.',
  },
  {
    id: 'contoh-preview',
    title: 'Contoh Tampilan Dokumen',
    type: 'Preview Sistem',
    number: 'CONTOH / DEVELOPMENT',
    date: 'Bukan dokumen resmi',
    issuer: 'System Preview',
    period: 'Periode Aktif',
    status: 'Arsip',
    description: 'Contoh PDF hanya untuk menguji pengalaman preview dokumen. Bukan dokumen resmi Karang Taruna.',
    pdfUrl: '/documents/contoh-keabsahan.pdf',
    isSample: true,
  },
]

export interface OrganizationRole {
  id: string
  title: string
  name: string
  level: number
  branch?: 'left' | 'right' | 'center'
}

export const organizationRoles: OrganizationRole[] = [
  { id: 'ketua', title: 'Ketua', name: 'Nama belum diisi', level: 0, branch: 'center' },
  { id: 'wakil', title: 'Wakil Ketua', name: 'Nama belum diisi', level: 1, branch: 'center' },
  { id: 'sekretaris', title: 'Sekretaris', name: 'Nama belum diisi', level: 2, branch: 'left' },
  { id: 'bendahara', title: 'Bendahara', name: 'Nama belum diisi', level: 2, branch: 'right' },
  { id: 'humas', title: 'Humas', name: 'Nama belum diisi', level: 3, branch: 'left' },
  { id: 'sosial', title: 'Seksi Sosial & Lingkungan', name: 'Nama belum diisi', level: 3, branch: 'left' },
  { id: 'olahraga', title: 'Seksi Olahraga', name: 'Nama belum diisi', level: 3, branch: 'right' },
  { id: 'usaha', title: 'Seksi Usaha & Kreatif', name: 'Nama belum diisi', level: 3, branch: 'right' },
]
