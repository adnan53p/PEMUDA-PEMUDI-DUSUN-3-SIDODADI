import { ArrowLeft, CalendarDays, CheckCircle2, FileText, MapPin, MessageCircle } from 'lucide-react'
import { Link, Navigate, useParams } from 'react-router-dom'
import ActivityCategoryBadge from '../components/ActivityCategoryBadge'
import ActivityPhaseTrack from '../components/ActivityPhaseTrack'
import ActivityStatusBadge from '../components/ActivityStatusBadge'
import { formatRupiah } from '../data/activityData'
import { usePublicActivityById } from '../prototype/publicActivitySelectors'
import { buildWhatsAppShareLink } from '../config/whatsapp'
import PublicActivityMedia from '../components/PublicActivityMedia'

function progress(plan: number, actual: number) {
  if (plan <= 0) return 0
  return Math.min((actual / plan) * 100, 100)
}

export default function ActivityDetailPage() {
  const { activityId } = useParams()
  const activity = usePublicActivityById(activityId)

  if (!activity) return <Navigate to="/kegiatan" replace />

  const currentUrl = typeof window !== 'undefined' ? window.location.href : ''
  const shareLink = buildWhatsAppShareLink(
    `Lihat kegiatan ${activity.title} — ${activity.date}, ${activity.location}. ${currentUrl}`,
  )

  return (
    <article className="bg-offwhite">
      <section className="relative min-h-[64vh] overflow-hidden bg-forest-deep text-offwhite md:min-h-[68vh]">
        <img
          src={activity.image}
          alt={`Suasana ${activity.title}`}
          className="absolute inset-0 h-full w-full object-cover object-center"
          fetchPriority="high"
          decoding="async"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-forest-deep/90 via-forest-deep/48 to-forest-deep/12" />
        <div className="container-content relative flex min-h-[64vh] flex-col justify-end pb-10 pt-28 md:min-h-[68vh] md:pb-16 md:pt-32">
          <Link to="/kegiatan" className="mb-7 inline-flex w-fit items-center gap-2 text-sm font-semibold text-offwhite/80 transition-colors hover:text-offwhite"><ArrowLeft size={16} /> Semua kegiatan</Link>
          <div className="flex flex-wrap items-center gap-2.5">
            <ActivityStatusBadge status={activity.status} />
            <ActivityCategoryBadge category={activity.category} variant="dark" />
          </div>
          <h1 className="mt-5 max-w-5xl text-[2.35rem] font-extrabold leading-[0.98] tracking-[-0.05em] sm:text-5xl md:text-7xl">{activity.title}</h1>
          <div className="mt-7 flex flex-wrap items-center gap-x-7 gap-y-3 text-sm font-semibold text-offwhite/85">
            <span className="inline-flex items-center gap-2"><CalendarDays size={17} />{activity.date}</span>
            <span className="inline-flex items-center gap-2"><MapPin size={17} />{activity.location}</span>
            <a
              href={shareLink}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 border-b border-offwhite/45 pb-0.5 transition-colors hover:border-offwhite hover:text-white"
              aria-label={`Bagikan ${activity.title} melalui WhatsApp`}
            >
              <MessageCircle size={17} /> Bagikan via WhatsApp
            </a>
          </div>
        </div>
      </section>

      <section className="border-b border-border-soft bg-offwhite">
        <div className="container-content py-8 md:py-10">
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="eyebrow text-forest">TAHAP KEGIATAN</p>
              <p className="mt-2 text-sm text-muted">Posisi kegiatan saat ini: <span className="font-bold text-charcoal">{activity.status}</span></p>
            </div>
            <p className="text-xs text-muted">Alur: rencana → pelaksanaan → pertanggungjawaban</p>
          </div>
          <ActivityPhaseTrack status={activity.status} />
        </div>
      </section>

      <section className="bg-offwhite">
        <div className="container-content grid gap-12 py-16 md:py-24 lg:grid-cols-[0.75fr_1.25fr] lg:gap-20">
          <div>
            <p className="eyebrow text-forest">TENTANG KEGIATAN</p>
            <h2 className="mt-4 text-3xl font-extrabold leading-tight text-charcoal md:text-4xl">Satu kegiatan, satu jejak yang bisa dipahami warga.</h2>
            <div className="mt-8 border-t border-border-soft pt-6">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Status laporan</p>
              <p className="mt-2 text-lg font-bold text-charcoal">{activity.reportStatus}</p>
            </div>
          </div>
          <div className="space-y-6 text-base leading-8 text-charcoal/80 md:text-lg">
            {activity.description.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            <p className="border-l-2 border-sage pl-5 text-sm text-muted">Angka dan detail mengikuti data kegiatan yang dipublikasikan pengurus dari Supabase.</p>
          </div>
        </div>
      </section>

      <section className="bg-warmwhite">
        <div className="container-content py-16 md:py-24">
          <div className="grid gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:items-end">
            <div>
              <p className="eyebrow text-forest">HASIL & PARTISIPASI</p>
              <h2 className="mt-4 text-3xl font-extrabold text-charcoal md:text-4xl">Dampak kegiatan dalam angka.</h2>
            </div>
            <div className="grid grid-cols-2 border-y border-border-soft md:grid-cols-3">
              <div className="py-6 pr-5">
                <p className="text-3xl font-extrabold text-forest md:text-4xl">{activity.participantTarget}</p>
                <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-muted">Target Peserta</p>
              </div>
              <div className="border-l border-border-soft px-5 py-6">
                <p className="text-3xl font-extrabold text-forest md:text-4xl">{activity.participantActual || '—'}</p>
                <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-muted">Realisasi Peserta</p>
              </div>
              <div className="col-span-2 border-t border-border-soft py-6 md:col-span-1 md:border-l md:border-t-0 md:pl-5">
                <p className="text-3xl font-extrabold text-forest md:text-4xl">{activity.committeeRoles.length}</p>
                <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-muted">Bidang Panitia</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-forest-deep text-offwhite">
        <div className="container-content py-16 md:py-24">
          <div className="grid gap-12 lg:grid-cols-[0.72fr_1.28fr] lg:gap-16">
            <div>
              <p className="eyebrow text-sage">TRANSPARANSI KEGIATAN</p>
              <h2 className="mt-4 text-3xl font-extrabold leading-tight md:text-4xl">Anggaran tidak berhenti sebagai angka.</h2>
              <p className="mt-5 max-w-md text-sm leading-relaxed text-offwhite/70">Ringkasan ini dirancang agar warga dapat memahami target, pemasukan, penggunaan, dan sisa dana tanpa membuka data pribadi panitia atau penyumbang.</p>
            </div>
            <dl className="grid grid-cols-1 gap-px border border-white/15 bg-white/15 sm:grid-cols-2">
              {[
                ['Target Anggaran', activity.finance.target],
                ['Pemasukan', activity.finance.income],
                ['Pengeluaran', activity.finance.expense],
                ['Sisa Dana', activity.finance.cash],
              ].map(([label, value]) => (
                <div key={String(label)} className="min-w-0 bg-forest-deep px-5 py-6 md:px-6">
                  <dt className="text-[0.68rem] font-bold uppercase tracking-[0.12em] text-offwhite/55">{label}</dt>
                  <dd className="mt-3 break-words text-lg font-extrabold tracking-[-0.03em] min-[390px]:text-xl md:text-2xl">{formatRupiah(Number(value))}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="mt-14 border-t border-white/15 pt-10">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="eyebrow text-sage">RAB VS REALISASI</p>
                <h3 className="mt-3 text-2xl font-extrabold">Penggunaan anggaran per kategori</h3>
              </div>
              <span className="text-xs text-offwhite/50">Data kegiatan terpublikasi</span>
            </div>
            <div className="mt-8 space-y-6">
              {activity.budget.map((item) => (
                <div key={item.category}>
                  <div className="flex flex-wrap items-end justify-between gap-3 text-sm">
                    <div>
                      <p className="font-bold">{item.category}</p>
                      <p className="mt-1 text-xs text-offwhite/55">Rencana {formatRupiah(item.plan)}</p>
                    </div>
                    <p className="font-semibold text-sage">Realisasi {formatRupiah(item.actual)}</p>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden bg-white/10">
                    <div className="h-full bg-sage" style={{ width: `${progress(item.plan, item.actual)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-offwhite">
        <div className="container-content py-16 md:py-24">
          <div className="grid gap-12 lg:grid-cols-[0.72fr_1.28fr] lg:gap-16">
            <div>
              <p className="eyebrow text-forest">KEPANITIAAN</p>
              <h2 className="mt-4 text-3xl font-extrabold text-charcoal md:text-4xl">Peran jelas, data pribadi tetap dijaga.</h2>
              <p className="mt-5 text-sm leading-relaxed text-muted">Nama panitia belum dimasukkan karena belum diberikan sebagai data resmi. Struktur peran sudah disiapkan agar nantinya dapat dihubungkan dengan workspace kegiatan.</p>
            </div>
            <div className="grid gap-px bg-border-soft sm:grid-cols-2">
              {activity.committeeRoles.map((role, index) => (
                <div key={role} className="bg-white p-6">
                  <p className="text-xs font-bold tracking-[0.14em] text-forest">0{index + 1}</p>
                  <p className="mt-6 text-lg font-extrabold text-charcoal">{role}</p>
                  <p className="mt-2 text-sm text-muted">Data nama menunggu konfirmasi pengurus.</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-warmwhite">
        <div className="container-content py-16 md:py-24">
          <div className="flex flex-col gap-5 border-b border-border-soft pb-7 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="eyebrow text-forest">PEMBELANJAAN PUBLIK</p>
              <h2 className="mt-3 text-3xl font-extrabold text-charcoal">Jejak penggunaan dana.</h2>
            </div>
            <p className="max-w-md text-sm leading-relaxed text-muted">Hanya informasi yang layak dipublikasikan. Data sensitif pada nota atau bukti pembayaran tidak ditampilkan di area publik.</p>
          </div>

          {activity.purchases.length ? (
            <div className="mt-8 divide-y divide-border-soft border-y border-border-soft">
              {activity.purchases.map((purchase) => (
                <div key={purchase.id} className="grid gap-4 py-6 md:grid-cols-[1.5fr_0.8fr_0.8fr_0.7fr] md:items-center">
                  <div>
                    <p className="text-sm font-extrabold text-charcoal">{purchase.item}</p>
                    <p className="mt-1 text-xs text-muted">{purchase.category} · {purchase.vendor}</p>
                  </div>
                  <p className="text-sm text-muted">{purchase.date}</p>
                  <p className="text-sm font-bold text-charcoal md:text-right">{formatRupiah(purchase.total)}</p>
                  <span className="inline-flex w-fit items-center gap-2 text-xs font-semibold text-forest md:justify-self-end"><CheckCircle2 size={15} /> Bukti {purchase.evidence.toLowerCase()}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-8 border border-border-soft bg-white p-8 text-sm text-muted">Belum ada pembelanjaan publik pada tahap kegiatan ini.</div>
          )}
        </div>
      </section>

      <PublicActivityMedia
        title={activity.title}
        shortTitle={activity.shortTitle}
        gallery={activity.gallery}
        videos={activity.videos}
      />

      <section className="border-t border-border-soft bg-warmwhite">
        <div className="container-content grid gap-8 py-14 md:grid-cols-[1fr_auto] md:items-center md:py-16">
          <div>
            <p className="eyebrow text-forest">LAPORAN & LPJ</p>
            <h2 className="mt-3 text-2xl font-extrabold text-charcoal md:text-3xl">Status laporan: {activity.reportStatus}</h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">LPJ dibentuk dari data rencana, pemasukan, pengeluaran, bukti, dan dokumentasi kegiatan pada sumber data operasional yang sama.</p>
          </div>
          <span className="inline-flex items-center gap-2 text-sm font-bold text-muted"><FileText size={18} /> Dokumen resmi belum dihubungkan</span>
        </div>
      </section>
    </article>
  )
}
