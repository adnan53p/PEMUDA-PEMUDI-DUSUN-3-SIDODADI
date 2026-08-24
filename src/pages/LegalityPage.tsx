import { useState } from 'react'
import { Archive, Download, Eye, FileCheck2, FileText, ShieldCheck, X } from 'lucide-react'
import PageIntro from '../components/PageIntro'
import type { LegalityDocument } from '../data/organizationData'
import { useSiteContent } from '../prototype/SiteContentContext'

function statusClass(status: LegalityDocument['status']) {
  if (status === 'Berlaku') return 'bg-forest text-offwhite'
  if (status === 'Arsip') return 'bg-sage text-forest'
  return 'bg-warmwhite text-muted'
}

export default function LegalityPage() {
  const [previewDoc, setPreviewDoc] = useState<LegalityDocument | null>(null)
  const { documents } = useSiteContent()
  const publicDocuments = documents.filter((document) => document.publicVisible)

  return (
    <div className="bg-offwhite">
      <PageIntro
        eyebrow="KEABSAHAN ORGANISASI"
        title={<>Dokumen resmi, <span className="text-forest">terlihat dan terarsip.</span></>}
        description="Ruang publik untuk melihat dokumen pengesahan, aturan organisasi, dan arsip administratif yang memang diperbolehkan untuk dipublikasikan."
        aside={
          <div className="flex items-center gap-4 border border-border-soft bg-white p-5">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-sage text-forest"><ShieldCheck size={22} /></span>
            <div>
              <p className="text-sm font-bold text-charcoal">Arsip per periode</p>
              <p className="mt-1 text-xs leading-relaxed text-muted">Dokumen lama tidak hilang ketika kepengurusan berganti.</p>
            </div>
          </div>
        }
      />

      <section className="bg-warmwhite">
        <div className="container-content py-14 md:py-20">
          <div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:items-end">
            <div>
              <p className="eyebrow text-forest">PERIODE AKTIF</p>
              <h2 className="mt-3 text-3xl font-extrabold text-charcoal md:text-4xl">Arsip keabsahan</h2>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-muted">Nomor, tanggal, penerbit, dan file resmi tidak dibuat-buat. Informasi dapat diisi setelah dokumen organisasi diberikan oleh pengurus.</p>
            </div>
            <div className="grid gap-px bg-border-soft sm:grid-cols-3">
              <div className="bg-offwhite p-5"><FileCheck2 size={19} className="text-forest" /><p className="mt-4 text-sm font-bold text-charcoal">Dokumen pengesahan</p><p className="mt-1 text-xs leading-relaxed text-muted">SK dan dokumen resmi kepengurusan.</p></div>
              <div className="bg-offwhite p-5"><FileText size={19} className="text-forest" /><p className="mt-4 text-sm font-bold text-charcoal">Aturan organisasi</p><p className="mt-1 text-xs leading-relaxed text-muted">AD/ART dan pedoman internal yang boleh dipublikasikan.</p></div>
              <div className="bg-offwhite p-5"><Archive size={19} className="text-forest" /><p className="mt-4 text-sm font-bold text-charcoal">Arsip periode</p><p className="mt-1 text-xs leading-relaxed text-muted">Riwayat tetap tersedia saat periode berganti.</p></div>
            </div>
          </div>

          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {publicDocuments.length > 0 ? publicDocuments.map((doc) => (
              <article key={doc.id} className="group flex min-h-[320px] flex-col border border-border-soft bg-white p-6 transition-transform duration-200 hover:-translate-y-1">
                <div className="flex items-start justify-between gap-4">
                  <span className="flex h-11 w-11 items-center justify-center bg-warmwhite text-forest"><FileText size={21} /></span>
                  <span className={`px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-[0.12em] ${statusClass(doc.status)}`}>{doc.status}</span>
                </div>
                <p className="mt-8 text-xs font-semibold uppercase tracking-[0.12em] text-muted">{doc.type}</p>
                <h3 className="mt-2 text-2xl font-extrabold text-charcoal">{doc.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted">{doc.description}</p>

                <dl className="mt-6 space-y-2 border-t border-border-soft pt-5 text-xs">
                  <div className="flex justify-between gap-4"><dt className="text-muted">Nomor</dt><dd className="text-right font-semibold text-charcoal">{doc.number}</dd></div>
                  <div className="flex justify-between gap-4"><dt className="text-muted">Tanggal</dt><dd className="text-right font-semibold text-charcoal">{doc.date}</dd></div>
                  <div className="flex justify-between gap-4"><dt className="text-muted">Penerbit</dt><dd className="text-right font-semibold text-charcoal">{doc.issuer}</dd></div>
                </dl>

                <div className="mt-auto pt-6">
                  {doc.pdfUrl ? (
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setPreviewDoc(doc)} className="btn btn-primary flex-1 justify-center px-4 py-3 text-xs">
                        <Eye size={15} /> Preview PDF
                      </button>
                      <a href={doc.pdfUrl} download className="btn btn-secondary justify-center px-4 py-3 text-xs" aria-label={`Download ${doc.title}`}>
                        <Download size={15} />
                      </a>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 border-t border-border-soft pt-4 text-xs font-semibold text-muted"><FileCheck2 size={16} /> File resmi belum diunggah</div>
                  )}
                </div>
              </article>
            )) : <div className="lg:col-span-3 border border-border-soft bg-offwhite p-8 text-center"><p className="font-extrabold text-charcoal">Belum ada dokumen yang dipublikasikan.</p><p className="mt-2 text-sm text-muted">Superadmin dapat mengatur publikasi dari menu Dokumen Publik.</p></div>}
          </div>
        </div>
      </section>

      <section className="bg-offwhite">
        <div className="container-content grid gap-8 py-14 md:grid-cols-[0.7fr_1.3fr] md:py-20">
          <div><p className="eyebrow text-forest">PRIVASI DOKUMEN</p><h2 className="mt-3 text-3xl font-extrabold text-charcoal">Terbuka tidak berarti semua harus dipublikasikan.</h2></div>
          <div className="border-l border-border-soft pl-6 text-sm leading-7 text-muted md:pl-10">Dokumen yang tampil di halaman publik harus melalui keputusan pengurus. Informasi sensitif, data pribadi, atau lampiran yang tidak layak disebarkan tidak perlu ditampilkan hanya demi transparansi.</div>
        </div>
      </section>

      {previewDoc?.pdfUrl && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-charcoal/70 p-3 backdrop-blur-sm md:p-6" role="dialog" aria-modal="true" aria-label={`Preview ${previewDoc.title}`}>
          <div className="flex h-[88vh] w-full max-w-5xl flex-col overflow-hidden bg-offwhite shadow-2xl">
            <div className="flex items-center justify-between border-b border-border-soft px-4 py-3 md:px-5">
              <div>
                <p className="text-sm font-bold text-charcoal">{previewDoc.title}</p>
                <p className="text-xs text-muted">{previewDoc.isSample ? 'CONTOH — bukan dokumen resmi' : previewDoc.number}</p>
              </div>
              <button type="button" onClick={() => setPreviewDoc(null)} className="flex h-10 w-10 items-center justify-center rounded-md text-charcoal hover:bg-sage/40" aria-label="Tutup preview dokumen">
                <X size={20} />
              </button>
            </div>
            <iframe title={`Preview ${previewDoc.title}`} src={previewDoc.pdfUrl} className="min-h-0 flex-1 bg-white" />
          </div>
        </div>
      )}
    </div>
  )
}
