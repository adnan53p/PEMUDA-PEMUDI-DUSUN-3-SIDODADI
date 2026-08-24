import { Archive, ChevronDown, Users } from 'lucide-react'
import PageIntro from '../components/PageIntro'
import { organizationRoles } from '../data/organizationData'

function RoleCard({ title, name, featured = false, compact = false }: { title: string; name: string; featured?: boolean; compact?: boolean }) {
  const hasOfficialName = name && name !== 'Nama belum diisi'
  return (
    <article className={`${featured ? 'border-forest bg-forest text-offwhite' : 'border-border-soft bg-white text-charcoal'} relative border ${compact ? 'p-4' : 'p-5 md:p-6'} text-center shadow-[0_10px_30px_rgba(18,61,50,0.035)]`}>
      <div className={`mx-auto flex ${compact ? 'h-10 w-10' : 'h-12 w-12'} items-center justify-center rounded-full ${featured ? 'bg-offwhite/10 text-offwhite' : 'bg-sage text-forest'}`}>
        <Users size={compact ? 18 : 20} />
      </div>
      <p className={`mt-4 text-[0.68rem] font-bold uppercase tracking-[0.14em] ${featured ? 'text-sage' : 'text-forest'}`}>{title}</p>
      {hasOfficialName ? (
        <p className={`mt-2 text-sm font-extrabold ${featured ? 'text-offwhite' : 'text-charcoal'}`}>{name}</p>
      ) : (
        <p className={`mt-2 text-xs ${featured ? 'text-offwhite/60' : 'text-muted'}`}>Data nama menunggu konfirmasi</p>
      )}
    </article>
  )
}

export default function OrganizationPage() {
  const byId = Object.fromEntries(organizationRoles.map((role) => [role.id, role]))

  return (
    <div className="bg-offwhite">
      <PageIntro
        eyebrow="SUSUNAN KEPENGURUSAN"
        title={<>Struktur yang jelas, <span className="text-forest">tanggung jawab yang terbaca.</span></>}
        description="Bagan kepengurusan ditampilkan per periode agar warga dapat memahami jalur koordinasi organisasi aktif tanpa kehilangan arsip kepengurusan sebelumnya."
        aside={
          <div className="border-l border-border-soft pl-5">
            <p className="eyebrow text-forest">PERIODE</p>
            <button type="button" className="mt-3 inline-flex items-center gap-3 text-sm font-bold text-charcoal" title="Pemilihan periode akan aktif saat data periode resmi tersedia">
              Periode Aktif <ChevronDown size={16} />
            </button>
          </div>
        }
      />

      <section className="bg-warmwhite">
        <div className="container-content py-14 md:py-20">
          <div className="grid gap-8 lg:grid-cols-[0.72fr_1.28fr] lg:items-end">
            <div>
              <p className="eyebrow text-forest">BAGAN ORGANISASI</p>
              <h2 className="mt-3 text-3xl font-extrabold text-charcoal md:text-4xl">Kepengurusan aktif</h2>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-muted">Nama pengurus belum diberikan sebagai data resmi. Karena itu bagan menampilkan jabatan terlebih dahulu tanpa membuat identitas fiktif.</p>
            </div>
            <div className="overflow-hidden rounded-sm">
              <img src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=1600&auto=format&fit=crop" alt="Kebersamaan pemuda dalam organisasi komunitas" loading="lazy" className="h-56 w-full object-cover md:h-72" />
            </div>
          </div>

          <div className="mt-12 border-t border-border-soft pt-8">
            <div className="mb-6 flex items-center gap-2 text-xs text-muted"><Archive size={15} /> Arsip periode sebelumnya disiapkan pada struktur data.</div>

            {/* Mobile hierarchy */}
            <div className="space-y-3 md:hidden">
              {organizationRoles.map((role, index) => (
                <div key={role.id} className="grid grid-cols-[2.25rem_1fr] items-stretch gap-3">
                  <div className="flex flex-col items-center">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full border border-forest/20 bg-offwhite text-[0.68rem] font-bold text-forest">{String(index + 1).padStart(2, '0')}</span>
                    {index < organizationRoles.length - 1 && <span className="mt-1 h-full w-px bg-border-soft" />}
                  </div>
                  <RoleCard title={role.title} name={role.name} featured={role.id === 'ketua'} compact />
                </div>
              ))}
            </div>

            {/* Desktop organizational chart */}
            <div className="mx-auto hidden max-w-5xl overflow-x-auto pb-4 md:block">
              <div className="min-w-[820px] px-8 py-4">
                <div className="mx-auto w-72"><RoleCard title={byId.ketua.title} name={byId.ketua.name} featured /></div>
                <div className="mx-auto h-10 w-px bg-forest/30" />
                <div className="mx-auto w-64"><RoleCard title={byId.wakil.title} name={byId.wakil.name} /></div>
                <div className="mx-auto h-10 w-px bg-forest/30" />

                <div className="relative mx-auto grid max-w-2xl grid-cols-2 gap-24 pt-7 before:absolute before:left-1/4 before:right-1/4 before:top-0 before:h-px before:bg-forest/30">
                  {[byId.sekretaris, byId.bendahara].map((role) => (
                    <div key={role.id} className="relative before:absolute before:left-1/2 before:top-[-28px] before:h-7 before:w-px before:bg-forest/30"><RoleCard title={role.title} name={role.name} /></div>
                  ))}
                </div>

                <div className="mx-auto h-12 w-px bg-forest/30" />
                <div className="relative grid grid-cols-4 gap-5 pt-7 before:absolute before:left-[12.5%] before:right-[12.5%] before:top-0 before:h-px before:bg-forest/30">
                  {[byId.humas, byId.sosial, byId.olahraga, byId.usaha].map((role) => (
                    <div key={role.id} className="relative before:absolute before:left-1/2 before:top-[-28px] before:h-7 before:w-px before:bg-forest/30">
                      <RoleCard title={role.title} name={role.name} compact />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-offwhite">
        <div className="container-content grid gap-8 py-14 md:grid-cols-3 md:py-20">
          <div className="md:col-span-1">
            <p className="eyebrow text-forest">PRINSIP</p>
            <h2 className="mt-3 text-3xl font-extrabold text-charcoal">Struktur bukan sekadar daftar nama.</h2>
          </div>
          <div className="grid gap-px bg-border-soft sm:grid-cols-2 md:col-span-2">
            <div className="bg-offwhite p-6"><p className="text-sm font-bold text-charcoal">Per periode</p><p className="mt-2 text-sm leading-relaxed text-muted">Periode lama tetap dapat diarsipkan saat kepengurusan berganti.</p></div>
            <div className="bg-offwhite p-6"><p className="text-sm font-bold text-charcoal">Siap dilengkapi</p><p className="mt-2 text-sm leading-relaxed text-muted">Foto, nama, jabatan, dan bidang kerja akan muncul setelah data pengurus resmi dimasukkan.</p></div>
            <div className="bg-offwhite p-6"><p className="text-sm font-bold text-charcoal">Jalur koordinasi</p><p className="mt-2 text-sm leading-relaxed text-muted">Hierarki membantu warga memahami siapa bertanggung jawab pada setiap bidang.</p></div>
            <div className="bg-offwhite p-6"><p className="text-sm font-bold text-charcoal">Arsip berkelanjutan</p><p className="mt-2 text-sm leading-relaxed text-muted">Pergantian kepengurusan tidak menghapus sejarah periode sebelumnya.</p></div>
          </div>
        </div>
      </section>
    </div>
  )
}
