import { supabase } from '../lib/supabaseClient'

export interface ImpactStatContent {
  id: string
  label: string
  value: string
}

export interface ImpactSectionContent {
  eyebrow: string
  title: string
  description: string
  stats: ImpactStatContent[]
}

export interface ProgramContent {
  id: string
  number: string
  slug: string
  title: string
  shortDescription: string
  fullDescription: string
  objective: string
  seoTitle: string
  seoDescription: string
  seoKeywords: string
  imageUrl: string
  ctaLabel: string
  ctaUrl: string
  visible: boolean
}

export interface ProgramsSectionContent {
  eyebrow: string
  title: string
  description: string
  programs: ProgramContent[]
}

export interface SeoPageContent {
  title: string
  description: string
  keywords: string
}

export interface GlobalSeoContent {
  siteUrl: string
  defaultOgImage: string
  organizationName: string
  organizationDescription: string
  pages: {
    home: SeoPageContent
    profile: SeoPageContent
    legality: SeoPageContent
    organization: SeoPageContent
    activities: SeoPageContent
    documentation: SeoPageContent
    finance: SeoPageContent
  }
}

export interface PublicHomepageManagedContent {
  impact: ImpactSectionContent
  programs: ProgramsSectionContent
  seo: GlobalSeoContent
}

export const defaultPublicHomepageContent: PublicHomepageManagedContent = {
  impact: {
    eyebrow: 'Pencapaian & Transparansi',
    title: 'Angka yang bisa dilihat, dipahami, dan dipertanggungjawabkan.',
    description: 'Ringkasan organisasi ditampilkan secara langsung agar masyarakat mudah memahami perkembangan kegiatan dan keterlibatan warga.',
    stats: [
      { id: 'anggota', label: 'Anggota Aktif', value: '128' },
      { id: 'kegiatan', label: 'Kegiatan Tahun Ini', value: '2' },
      { id: 'program', label: 'Bidang Program', value: '5' },
      { id: 'warga', label: 'Warga Terlibat', value: '600+' },
    ],
  },

  seo: {
    siteUrl: 'https://pemudadusun3.my.id',
    defaultOgImage: '',
    organizationName: 'Pemuda Dusun 3 Sidodadi',
    organizationDescription: 'Organisasi kepemudaan Dusun 3 Sidodadi yang aktif, transparan, dan bergerak bersama masyarakat.',
    pages: {
      home: { title: 'Pemuda Dusun 3 Sidodadi | Kegiatan, Program & Transparansi', description: 'Website resmi Pemuda Dusun 3 Sidodadi. Informasi kegiatan pemuda, program sosial, organisasi, dokumentasi, dan transparansi keuangan masyarakat.', keywords: 'pemuda dusun 3 sidodadi, pemuda sidodadi, kegiatan pemuda, organisasi pemuda' },
      profile: { title: 'Profil | Pemuda Dusun 3 Sidodadi', description: 'Mengenal Pemuda Dusun 3 Sidodadi, identitas organisasi, tujuan, dan semangat kebersamaan pemuda di lingkungan Dusun 3 Sidodadi.', keywords: 'profil pemuda dusun 3 sidodadi, organisasi pemuda sidodadi' },
      legality: { title: 'Keabsahan & Dokumen | Pemuda Dusun 3 Sidodadi', description: 'Informasi keabsahan dan dokumen publik Pemuda Dusun 3 Sidodadi sebagai bagian dari keterbukaan organisasi.', keywords: 'dokumen pemuda dusun 3 sidodadi, keabsahan organisasi pemuda' },
      organization: { title: 'Kepengurusan | Pemuda Dusun 3 Sidodadi', description: 'Struktur kepengurusan Pemuda Dusun 3 Sidodadi dan informasi organisasi yang menggerakkan kegiatan pemuda serta masyarakat.', keywords: 'kepengurusan pemuda dusun 3 sidodadi, struktur organisasi pemuda' },
      activities: { title: 'Kegiatan Pemuda | Dusun 3 Sidodadi', description: 'Informasi kegiatan, agenda, dan aktivitas Pemuda Dusun 3 Sidodadi bersama warga dan masyarakat.', keywords: 'kegiatan pemuda sidodadi, agenda dusun 3 sidodadi, kegiatan warga' },
      documentation: { title: 'Dokumentasi Kegiatan | Pemuda Dusun 3 Sidodadi', description: 'Dokumentasi foto dan publikasi kegiatan Pemuda Dusun 3 Sidodadi.', keywords: 'dokumentasi pemuda sidodadi, foto kegiatan sidodadi' },
      finance: { title: 'Transparansi Keuangan | Pemuda Dusun 3 Sidodadi', description: 'Lihat transparansi keuangan Pemuda Dusun 3 Sidodadi, meliputi pemasukan, pengeluaran, penggunaan dana kegiatan, dan laporan pertanggungjawaban.', keywords: 'keuangan pemuda dusun 3 sidodadi, transparansi keuangan, laporan keuangan pemuda' },
    },
  },
  programs: {
    eyebrow: 'Program Pemuda',
    title: 'Lima bidang, satu tujuan: lingkungan yang lebih kuat.',
    description: 'Setiap bidang menjadi ruang kerja pemuda yang bisa dipelajari lebih lanjut, diperbarui oleh Superadmin, dan dikembangkan sebagai konten publik yang ramah SEO.',
    programs: [
      {
        id: 'sosial-lingkungan', number: '01', slug: 'sosial-lingkungan', title: 'Sosial & Lingkungan',
        shortDescription: 'Kerja bakti rutin, bantuan warga prasejahtera, dan kepedulian lingkungan dusun.',
        fullDescription: 'Bidang Sosial & Lingkungan menjadi ruang kerja bersama untuk kegiatan kemasyarakatan, kepedulian sosial, kebersihan lingkungan, dan aksi gotong royong di Dusun 3 Sidodadi.',
        objective: 'Membangun lingkungan yang bersih, peduli, dan saling menguatkan melalui kegiatan sosial yang teratur.',
        seoTitle: 'Program Sosial & Lingkungan Pemuda Dusun 3 Sidodadi',
        seoDescription: 'Informasi program sosial, kerja bakti, kepedulian warga, dan kegiatan lingkungan Pemuda Dusun 3 Sidodadi.',
        seoKeywords: 'pemuda dusun 3 sidodadi, sosial, lingkungan, kerja bakti, gotong royong', imageUrl: '', ctaLabel: '', ctaUrl: '', visible: true,
      },
      {
        id: 'umkm-pemuda', number: '02', slug: 'umkm-pemuda', title: 'UMKM Pemuda',
        shortDescription: 'Pendampingan usaha kecil dan promosi produk warga muda dusun.',
        fullDescription: 'Bidang UMKM Pemuda mendorong tumbuhnya usaha produktif melalui promosi, kolaborasi, berbagi pengetahuan, dan dukungan pemasaran bagi pemuda serta warga.',
        objective: 'Mendorong kemandirian ekonomi pemuda dan memperluas peluang usaha lokal.',
        seoTitle: 'UMKM Pemuda Dusun 3 Sidodadi', seoDescription: 'Program UMKM Pemuda Dusun 3 Sidodadi untuk mendukung usaha lokal, promosi produk, dan kemandirian ekonomi.',
        seoKeywords: 'umkm pemuda, usaha pemuda sidodadi, produk lokal, ekonomi kreatif', imageUrl: '', ctaLabel: '', ctaUrl: '', visible: true,
      },
      {
        id: 'olahraga', number: '03', slug: 'olahraga', title: 'Olahraga',
        shortDescription: 'Turnamen antar RT dan latihan rutin untuk menjaga kebersamaan warga.',
        fullDescription: 'Bidang Olahraga menghadirkan kegiatan yang sehat, kompetitif, dan mempererat kebersamaan melalui latihan rutin, pertandingan persahabatan, serta turnamen warga.',
        objective: 'Menjaga kesehatan, sportivitas, dan kekompakan antar pemuda serta warga.',
        seoTitle: 'Program Olahraga Pemuda Dusun 3 Sidodadi', seoDescription: 'Kegiatan olahraga, turnamen, dan program kebersamaan Pemuda Dusun 3 Sidodadi.',
        seoKeywords: 'olahraga pemuda, turnamen sidodadi, kegiatan pemuda, olahraga desa', imageUrl: '', ctaLabel: '', ctaUrl: '', visible: true,
      },
      {
        id: 'pendidikan', number: '04', slug: 'pendidikan', title: 'Pendidikan',
        shortDescription: 'Bimbingan belajar anak dusun dan literasi bagi generasi muda.',
        fullDescription: 'Bidang Pendidikan berfokus pada kegiatan belajar, literasi, berbagi keterampilan, dan dukungan pengembangan generasi muda di lingkungan Dusun 3 Sidodadi.',
        objective: 'Menciptakan ruang belajar yang dekat, terbuka, dan bermanfaat bagi generasi muda.',
        seoTitle: 'Program Pendidikan Pemuda Dusun 3 Sidodadi', seoDescription: 'Program pendidikan, literasi, dan bimbingan belajar yang digerakkan Pemuda Dusun 3 Sidodadi.',
        seoKeywords: 'pendidikan sidodadi, bimbingan belajar, literasi pemuda, kegiatan anak desa', imageUrl: '', ctaLabel: '', ctaUrl: '', visible: true,
      },
      {
        id: 'kreatif-budaya', number: '05', slug: 'kreatif-budaya', title: 'Kreatif & Budaya',
        shortDescription: 'Pelestarian seni tradisi dan wadah kreativitas pemuda dusun.',
        fullDescription: 'Bidang Kreatif & Budaya menjadi wadah bagi pemuda untuk berkarya, mengembangkan potensi kreatif, sekaligus menjaga tradisi dan identitas lokal.',
        objective: 'Menghidupkan kreativitas pemuda sambil menjaga nilai budaya dan tradisi lingkungan.',
        seoTitle: 'Kreatif & Budaya Pemuda Dusun 3 Sidodadi', seoDescription: 'Kegiatan kreatif, seni, dan pelestarian budaya oleh Pemuda Dusun 3 Sidodadi.',
        seoKeywords: 'budaya sidodadi, kreativitas pemuda, seni tradisi, kegiatan budaya desa', imageUrl: '', ctaLabel: '', ctaUrl: '', visible: true,
      },
    ],
  },
}

function normalize(raw: any): PublicHomepageManagedContent {
  const fallback = defaultPublicHomepageContent
  const impactStats = Array.isArray(raw?.impact?.stats) && raw.impact.stats.length ? raw.impact.stats : fallback.impact.stats
  const programs = Array.isArray(raw?.programs?.programs) && raw.programs.programs.length ? raw.programs.programs : fallback.programs.programs
  return {
    impact: {
      eyebrow: String(raw?.impact?.eyebrow ?? fallback.impact.eyebrow),
      title: String(raw?.impact?.title ?? fallback.impact.title),
      description: String(raw?.impact?.description ?? fallback.impact.description),
      stats: impactStats.slice(0, 8).map((item: any, index: number) => ({
        id: String(item?.id ?? `stat-${index + 1}`), label: String(item?.label ?? ''), value: String(item?.value ?? ''),
      })),
    },
    seo: {
      siteUrl: String(raw?.seo?.siteUrl ?? fallback.seo.siteUrl).replace(/\/$/, ''),
      defaultOgImage: String(raw?.seo?.defaultOgImage ?? fallback.seo.defaultOgImage),
      organizationName: String(raw?.seo?.organizationName ?? fallback.seo.organizationName),
      organizationDescription: String(raw?.seo?.organizationDescription ?? fallback.seo.organizationDescription),
      pages: {
        home: { title: String(raw?.seo?.pages?.home?.title ?? fallback.seo.pages.home.title), description: String(raw?.seo?.pages?.home?.description ?? fallback.seo.pages.home.description), keywords: String(raw?.seo?.pages?.home?.keywords ?? fallback.seo.pages.home.keywords) },
        profile: { title: String(raw?.seo?.pages?.profile?.title ?? fallback.seo.pages.profile.title), description: String(raw?.seo?.pages?.profile?.description ?? fallback.seo.pages.profile.description), keywords: String(raw?.seo?.pages?.profile?.keywords ?? fallback.seo.pages.profile.keywords) },
        legality: { title: String(raw?.seo?.pages?.legality?.title ?? fallback.seo.pages.legality.title), description: String(raw?.seo?.pages?.legality?.description ?? fallback.seo.pages.legality.description), keywords: String(raw?.seo?.pages?.legality?.keywords ?? fallback.seo.pages.legality.keywords) },
        organization: { title: String(raw?.seo?.pages?.organization?.title ?? fallback.seo.pages.organization.title), description: String(raw?.seo?.pages?.organization?.description ?? fallback.seo.pages.organization.description), keywords: String(raw?.seo?.pages?.organization?.keywords ?? fallback.seo.pages.organization.keywords) },
        activities: { title: String(raw?.seo?.pages?.activities?.title ?? fallback.seo.pages.activities.title), description: String(raw?.seo?.pages?.activities?.description ?? fallback.seo.pages.activities.description), keywords: String(raw?.seo?.pages?.activities?.keywords ?? fallback.seo.pages.activities.keywords) },
        documentation: { title: String(raw?.seo?.pages?.documentation?.title ?? fallback.seo.pages.documentation.title), description: String(raw?.seo?.pages?.documentation?.description ?? fallback.seo.pages.documentation.description), keywords: String(raw?.seo?.pages?.documentation?.keywords ?? fallback.seo.pages.documentation.keywords) },
        finance: { title: String(raw?.seo?.pages?.finance?.title ?? fallback.seo.pages.finance.title), description: String(raw?.seo?.pages?.finance?.description ?? fallback.seo.pages.finance.description), keywords: String(raw?.seo?.pages?.finance?.keywords ?? fallback.seo.pages.finance.keywords) },
      },
    },
    programs: {
      eyebrow: String(raw?.programs?.eyebrow ?? fallback.programs.eyebrow),
      title: String(raw?.programs?.title ?? fallback.programs.title),
      description: String(raw?.programs?.description ?? fallback.programs.description),
      programs: programs.slice(0, 12).map((item: any, index: number) => ({
        id: String(item?.id ?? `program-${index + 1}`),
        number: String(item?.number ?? String(index + 1).padStart(2, '0')),
        slug: String(item?.slug ?? `program-${index + 1}`).toLowerCase().trim().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, ''),
        title: String(item?.title ?? ''), shortDescription: String(item?.shortDescription ?? ''), fullDescription: String(item?.fullDescription ?? ''),
        objective: String(item?.objective ?? ''), seoTitle: String(item?.seoTitle ?? ''), seoDescription: String(item?.seoDescription ?? ''),
        seoKeywords: String(item?.seoKeywords ?? ''), imageUrl: String(item?.imageUrl ?? ''), ctaLabel: String(item?.ctaLabel ?? ''), ctaUrl: String(item?.ctaUrl ?? ''),
        visible: item?.visible !== false,
      })),
    },
  }
}

export async function fetchPublicHomepageContent(): Promise<PublicHomepageManagedContent> {
  if (!supabase) return defaultPublicHomepageContent
  const { data, error } = await supabase.from('public_site_content').select('content').eq('content_key', 'homepage_managed').maybeSingle()
  if (error) {
    if (error.code === '42P01' || error.message?.toLowerCase().includes('public_site_content')) return defaultPublicHomepageContent
    throw error
  }
  return normalize(data?.content)
}

export async function savePublicHomepageContent(content: PublicHomepageManagedContent, updatedByUserId: string): Promise<void> {
  if (!supabase) throw new Error('Layanan konten belum tersedia.')
  const { error } = await supabase.from('public_site_content').upsert({
    content_key: 'homepage_managed', content: normalize(content), updated_by_user_id: updatedByUserId, updated_at: new Date().toISOString(),
  }, { onConflict: 'content_key' })
  if (error) throw error
}
