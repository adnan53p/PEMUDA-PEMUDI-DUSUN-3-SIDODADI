import { useMemo, useState } from 'react'
import { ExternalLink, Eye, RotateCcw, Save } from 'lucide-react'
import { Link } from 'react-router-dom'
import InternalLayout from '../../components/internal/InternalLayout'
import InternalNotice from '../../components/internal/InternalNotice'
import SiteMediaManager from '../../components/internal/SiteMediaManager'
import { useSiteContent, type HomepageContent, type ManagedHomepageSection } from '../../prototype/SiteContentContext'

export default function WebsiteContentPage() {
  const { homepage, setHomepage, sections, setSections } = useSiteContent()
  const [draftHomepage, setDraftHomepage] = useState<HomepageContent>(() => ({ ...homepage }))
  const [draftSections, setDraftSections] = useState<ManagedHomepageSection[]>(() => sections.map((item) => ({ ...item })))
  const [notice, setNotice] = useState('')

  const changed = useMemo(() => JSON.stringify(draftHomepage) !== JSON.stringify(homepage) || JSON.stringify(draftSections) !== JSON.stringify(sections), [draftHomepage, draftSections, homepage, sections])
  const publish = () => {
    setHomepage({ ...draftHomepage })
    setSections(draftSections.map((item) => ({ ...item })))
    setNotice('Draft dipublikasikan ke website untuk sesi prototype ini.')
    window.setTimeout(() => setNotice(''), 3200)
  }
  const reset = () => {
    setDraftHomepage({ ...homepage })
    setDraftSections(sections.map((item) => ({ ...item })))
    setNotice('Draft dikembalikan ke versi yang sedang dipublikasikan.')
    window.setTimeout(() => setNotice(''), 2800)
  }

  return <InternalLayout title="Konten Website" subtitle="Kelola copy dan section website publik dengan alur Draft → Preview → Publish.">
    <InternalNotice />
    {notice && <div role="status" className="mt-5 border border-[#E8D8B7] bg-[#FFF9EC] px-4 py-3 text-xs font-semibold text-[#6F5830]">{notice}</div>}
    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border border-border-soft bg-white px-4 py-3"><p className="text-xs font-semibold text-muted"><strong className="text-charcoal">Status:</strong> {changed ? 'Ada perubahan Draft yang belum dipublikasikan.' : 'Draft sama dengan versi publik.'}</p><div className="flex gap-2"><button type="button" onClick={reset} disabled={!changed} className="btn btn-secondary disabled:opacity-40"><RotateCcw size={15}/> Reset Draft</button><button type="button" onClick={publish} disabled={!changed} className="btn btn-primary disabled:opacity-40"><Save size={15}/> Publish</button></div></div>

    <section className="mt-6 grid gap-6 xl:grid-cols-[1fr_0.9fr]">
      <div className="border border-border-soft bg-white p-5 sm:p-6"><p className="eyebrow text-forest">HOMEPAGE HERO · DRAFT</p><h2 className="mt-2 text-xl font-extrabold text-charcoal">Konten utama beranda.</h2><div className="mt-6 space-y-5">
        <label className="block"><span className="mb-2 block text-xs font-extrabold uppercase tracking-[0.1em] text-muted">Headline</span><textarea value={draftHomepage.headline} onChange={(event) => setDraftHomepage({ ...draftHomepage, headline: event.target.value })} rows={3} className="w-full resize-none border border-border-soft bg-offwhite px-4 py-3 text-lg font-extrabold text-charcoal outline-none focus:border-forest" /></label>
        <label className="block"><span className="mb-2 block text-xs font-extrabold uppercase tracking-[0.1em] text-muted">Subheadline</span><textarea value={draftHomepage.subheadline} onChange={(event) => setDraftHomepage({ ...draftHomepage, subheadline: event.target.value })} rows={4} className="w-full resize-none border border-border-soft bg-offwhite px-4 py-3 text-sm leading-relaxed text-charcoal outline-none focus:border-forest" /></label>
        <div className="grid gap-4 sm:grid-cols-2"><label className="block"><span className="mb-2 block text-xs font-extrabold uppercase tracking-[0.1em] text-muted">CTA Utama</span><input value={draftHomepage.primaryCta} onChange={(event) => setDraftHomepage({ ...draftHomepage, primaryCta: event.target.value })} className="h-12 w-full border border-border-soft bg-offwhite px-4 text-sm font-semibold outline-none focus:border-forest" /></label><label className="block"><span className="mb-2 block text-xs font-extrabold uppercase tracking-[0.1em] text-muted">CTA Kedua</span><input value={draftHomepage.secondaryCta} onChange={(event) => setDraftHomepage({ ...draftHomepage, secondaryCta: event.target.value })} className="h-12 w-full border border-border-soft bg-offwhite px-4 text-sm font-semibold outline-none focus:border-forest" /></label></div>
      </div></div>
      <div className="overflow-hidden border border-border-soft bg-white"><div className="border-b border-border-soft px-5 py-5 sm:px-6"><p className="eyebrow text-forest">PREVIEW DRAFT</p><h2 className="mt-2 text-xl font-extrabold text-charcoal">Pratinjau sebelum Publish.</h2></div><div className="bg-forest-deep p-6 text-offwhite sm:p-8"><p className="text-[0.66rem] font-extrabold uppercase tracking-[0.13em] text-sage">ORGANISASI PEMUDA DUSUN 3 · SIDODADI</p><p className="mt-6 whitespace-pre-line text-4xl font-extrabold leading-[0.94] tracking-[-0.05em]">{draftHomepage.headline || 'Headline kosong'}</p><p className="mt-5 text-sm leading-relaxed text-offwhite/70">{draftHomepage.subheadline || 'Subheadline kosong'}</p></div><div className="flex flex-wrap gap-3 px-5 py-4 sm:px-6"><Link to="/" className="btn btn-secondary"><Eye size={16}/> Lihat versi publik <ExternalLink size={14}/></Link></div></div>
    </section>

    <SiteMediaManager />

    <section className="mt-6 border border-border-soft bg-white"><div className="border-b border-border-soft px-5 py-5 sm:px-6"><p className="eyebrow text-forest">SECTION HOMEPAGE · DRAFT</p><h2 className="mt-2 text-xl font-extrabold text-charcoal">Atur bagian yang ditampilkan.</h2><p className="mt-2 text-xs leading-relaxed text-muted">Tombol hanya mengubah Draft. Website publik baru berubah setelah Publish.</p></div><div className="divide-y divide-border-soft">{draftSections.map((section) => <div key={section.id} className="flex gap-4 px-5 py-4 sm:items-center sm:px-6"><div className="min-w-0 flex-1"><p className="text-sm font-extrabold text-charcoal">{section.title}</p><p className="mt-1 text-xs leading-relaxed text-muted">{section.description}</p></div><button type="button" onClick={() => setDraftSections(draftSections.map((item) => item.id === section.id ? { ...item, visible: !item.visible } : item))} className={`shrink-0 px-3 py-2 text-[0.68rem] font-extrabold uppercase tracking-[0.08em] ${section.visible ? 'bg-sage/65 text-forest' : 'bg-warmwhite text-muted'}`}>{section.visible ? 'Tampil' : 'Disembunyikan'}</button></div>)}</div></section>
  </InternalLayout>
}
