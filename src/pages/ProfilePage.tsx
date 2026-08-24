import { ArrowDownRight, ArrowUpRight, Quote } from 'lucide-react'
import { Link } from 'react-router-dom'
import PageIntro from '../components/PageIntro'
import { organizationProfile } from '../data/organizationData'

const journeySteps = [
  { label: 'Identitas', title: 'Organisasi dan periode', description: 'Nama, struktur, dan periode menjadi fondasi arsip yang mudah diteruskan saat kepengurusan berganti.' },
  { label: 'Gerak', title: 'Program dan kegiatan', description: 'Setiap kegiatan disimpan sebagai jejak kerja, bukan hanya unggahan sesaat.' },
  { label: 'Tanggung jawab', title: 'Transparansi dan laporan', description: 'Keuangan, dokumentasi, dan LPJ dapat ditelusuri kembali dari kegiatan yang sama.' },
]

export default function ProfilePage() {
  return (
    <div className="bg-offwhite">
      <PageIntro
        eyebrow="PROFIL ORGANISASI"
        title={<>Pemuda yang bergerak <span className="text-forest">bersama warga.</span></>}
        description={organizationProfile.intro}
        aside={
          <div className="max-w-xs border-l border-border-soft pl-5 text-sm leading-relaxed text-muted">
            <p className="font-semibold text-charcoal">Tentang halaman ini</p>
            <p className="mt-2">Identitas, nilai, dan perjalanan organisasi disusun sebagai arsip yang dapat terus dilengkapi setiap periode.</p>
          </div>
        }
      />

      <section className="bg-warmwhite">
        <div className="container-content grid gap-10 py-14 md:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-end lg:gap-14">
          <div className="overflow-hidden rounded-sm">
            <img
              src="https://images.unsplash.com/photo-1660749411531-1efe3e9c6fd1?q=80&w=1800&auto=format&fit=crop"
              alt="Kebersamaan pemuda dalam kegiatan komunitas"
              loading="lazy"
              className="h-[26rem] w-full object-cover md:h-[34rem]"
            />
          </div>
          <div className="pb-2">
            <p className="eyebrow text-forest">CERITA ORGANISASI</p>
            <h2 className="mt-4 text-3xl font-extrabold leading-tight text-charcoal md:text-5xl">Bukan sekadar nama, tetapi ruang untuk bertumbuh bersama.</h2>
            <div className="mt-7 space-y-5 text-base leading-8 text-charcoal/80">
              <p>{organizationProfile.history}</p>
              <p>Ke depan, arsip periode, dokumentasi kegiatan, kepengurusan, dan laporan akan saling terhubung sehingga pergantian pengurus tidak menghilangkan jejak kerja organisasi.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-offwhite">
        <div className="container-content grid gap-8 py-16 md:grid-cols-2 md:py-24">
          <div className="border-t border-forest pt-6 md:pr-10">
            <p className="eyebrow text-forest">VISI</p>
            <p className="mt-5 text-2xl font-bold leading-snug text-charcoal md:text-3xl">{organizationProfile.vision}</p>
          </div>
          <div className="border-t border-border-soft pt-6 md:pl-10">
            <p className="eyebrow text-forest">MISI</p>
            <ol className="mt-5 space-y-4">
              {organizationProfile.missions.map((mission, index) => (
                <li key={mission} className="flex gap-4 border-b border-border-soft pb-4 text-sm leading-relaxed text-charcoal/80 md:text-base">
                  <span className="font-bold text-forest">0{index + 1}</span>
                  <span>{mission}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="bg-forest-deep text-offwhite">
        <div className="container-content py-16 md:py-24">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
            <div>
              <Quote className="text-sage" size={34} strokeWidth={1.5} />
              <p className="mt-6 max-w-sm text-3xl font-extrabold leading-tight md:text-4xl">Nilai yang dijaga dalam setiap kegiatan.</p>
            </div>
            <div className="grid gap-px overflow-hidden border border-white/15 sm:grid-cols-2">
              {organizationProfile.values.map((value) => (
                <article key={value.number} className="bg-forest-deep p-6 transition-colors hover:bg-white/[0.04] md:p-8">
                  <div className="flex items-start justify-between gap-6">
                    <span className="text-xs font-bold tracking-[0.18em] text-sage">{value.number}</span>
                    <ArrowDownRight size={18} className="text-sage" aria-hidden="true" />
                  </div>
                  <h3 className="mt-8 text-xl font-bold">{value.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-offwhite/70">{value.description}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-warmwhite">
        <div className="container-content py-16 md:py-24">
          <div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:gap-16">
            <div>
              <p className="eyebrow text-forest">JEJAK ORGANISASI</p>
              <h2 className="mt-4 text-3xl font-extrabold text-charcoal md:text-4xl">Dirancang agar sejarah tidak hilang saat pengurus berganti.</h2>
            </div>
            <div className="divide-y divide-border-soft border-y border-border-soft">
              {journeySteps.map((step, index) => (
                <div key={step.label} className="grid gap-3 py-6 sm:grid-cols-[4rem_1fr]">
                  <span className="text-sm font-extrabold text-forest">0{index + 1}</span>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted">{step.label}</p>
                    <h3 className="mt-2 text-xl font-extrabold text-charcoal">{step.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-12 flex flex-wrap gap-3 border-t border-border-soft pt-8">
            <Link to="/kepengurusan" className="btn btn-primary">Lihat Kepengurusan <ArrowUpRight size={16} /></Link>
            <Link to="/keabsahan" className="btn btn-secondary">Lihat Keabsahan</Link>
          </div>
        </div>
      </section>
    </div>
  )
}
