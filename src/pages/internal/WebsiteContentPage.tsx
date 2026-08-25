import { useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, ExternalLink, Eye, RotateCcw, Save } from 'lucide-react'
import { Link } from 'react-router-dom'
import InternalLayout from '../../components/internal/InternalLayout'
import InternalNotice from '../../components/internal/InternalNotice'
import SiteMediaManager from '../../components/internal/SiteMediaManager'
import { useAuth } from '../../auth/AuthContext'
import { savePublicHomepageContent, type PublicHomepageManagedContent } from '../../data/publicContentRepository'
import { useSiteContent, type HomepageContent, type ManagedHomepageSection } from '../../prototype/SiteContentContext'

const inputClass = 'h-12 w-full border border-border-soft bg-offwhite px-4 text-sm text-charcoal outline-none focus:border-forest'
const textareaClass = 'w-full resize-y border border-border-soft bg-offwhite px-4 py-3 text-sm leading-relaxed text-charcoal outline-none focus:border-forest'

function cloneManaged(value: PublicHomepageManagedContent): PublicHomepageManagedContent {
  return JSON.parse(JSON.stringify(value)) as PublicHomepageManagedContent
}

export default function WebsiteContentPage() {
  const { user } = useAuth()
  const { homepage, setHomepage, sections, setSections, managedPublicContent, setManagedPublicContent } = useSiteContent()
  const [draftHomepage, setDraftHomepage] = useState<HomepageContent>(() => ({ ...homepage }))
  const [draftSections, setDraftSections] = useState<ManagedHomepageSection[]>(() => sections.map((item) => ({ ...item })))
  const [draftManaged, setDraftManaged] = useState<PublicHomepageManagedContent>(() => cloneManaged(managedPublicContent))
  const [notice, setNotice] = useState('')
  const [saving, setSaving] = useState(false)

  const changed = useMemo(() => (
    JSON.stringify(draftHomepage) !== JSON.stringify(homepage)
    || JSON.stringify(draftSections) !== JSON.stringify(sections)
    || JSON.stringify(draftManaged) !== JSON.stringify(managedPublicContent)
  ), [draftHomepage, draftSections, draftManaged, homepage, sections, managedPublicContent])

  const publish = async () => {
    if (!user) return
    setSaving(true)
    try {
      await savePublicHomepageContent(draftManaged, user.id)
      setHomepage({ ...draftHomepage })
      setSections(draftSections.map((item) => ({ ...item })))
      setManagedPublicContent(cloneManaged(draftManaged))
      setNotice('Konten Pencapaian dan Lima Bidang berhasil dipublikasikan ke Supabase.')
    } catch (error) {
      setNotice(error instanceof Error ? `Gagal publish: ${error.message}` : 'Gagal mempublikasikan konten.')
    } finally {
      setSaving(false)
      window.setTimeout(() => setNotice(''), 4200)
    }
  }

  const reset = () => {
    setDraftHomepage({ ...homepage })
    setDraftSections(sections.map((item) => ({ ...item })))
    setDraftManaged(cloneManaged(managedPublicContent))
    setNotice('Draft dikembalikan ke versi yang sedang dipublikasikan.')
    window.setTimeout(() => setNotice(''), 2800)
  }

  const updateImpact = (patch: Partial<PublicHomepageManagedContent['impact']>) => {
    setDraftManaged((current) => ({ ...current, impact: { ...current.impact, ...patch } }))
  }

  const updateProgramSection = (patch: Partial<PublicHomepageManagedContent['programs']>) => {
    setDraftManaged((current) => ({ ...current, programs: { ...current.programs, ...patch } }))
  }

  const updateProgram = (index: number, patch: Partial<PublicHomepageManagedContent['programs']['programs'][number]>) => {
    setDraftManaged((current) => {
      const programs = current.programs.programs.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item)
      return { ...current, programs: { ...current.programs, programs } }
    })
  }

  const moveProgram = (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= draftManaged.programs.programs.length) return
    setDraftManaged((current) => {
      const programs = [...current.programs.programs]
      const [item] = programs.splice(index, 1)
      programs.splice(target, 0, item)
      programs.forEach((program, order) => { program.number = String(order + 1).padStart(2, '0') })
      return { ...current, programs: { ...current.programs, programs } }
    })
  }

  return <InternalLayout title="Konten Website" subtitle="Kelola konten publik, statistik, lima bidang, detail program, dan SEO dari satu tempat.">
    <InternalNotice />
    {notice && <div role="status" className="mt-5 border border-[#E8D8B7] bg-[#FFF9EC] px-4 py-3 text-xs font-semibold text-[#6F5830]">{notice}</div>}
    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border border-border-soft bg-white px-4 py-3">
      <p className="text-xs font-semibold text-muted"><strong className="text-charcoal">Status:</strong> {changed ? 'Ada perubahan Draft yang belum dipublikasikan.' : 'Draft sama dengan versi publik.'}</p>
      <div className="flex gap-2">
        <button type="button" onClick={reset} disabled={!changed || saving} className="btn btn-secondary disabled:opacity-40"><RotateCcw size={15}/> Reset Draft</button>
        <button type="button" onClick={() => void publish()} disabled={!changed || saving} className="btn btn-primary disabled:opacity-40"><Save size={15}/> {saving ? 'Menyimpan...' : 'Publish'}</button>
      </div>
    </div>

    <section className="mt-6 grid gap-6 xl:grid-cols-[1fr_0.9fr]">
      <div className="border border-border-soft bg-white p-5 sm:p-6">
        <p className="eyebrow text-forest">HOMEPAGE HERO · DRAFT</p>
        <h2 className="mt-2 text-xl font-extrabold text-charcoal">Konten utama beranda.</h2>
        <div className="mt-6 space-y-5">
          <label className="block"><span className="mb-2 block text-xs font-extrabold uppercase tracking-[0.1em] text-muted">Headline</span><textarea value={draftHomepage.headline} onChange={(event) => setDraftHomepage({ ...draftHomepage, headline: event.target.value })} rows={3} className={`${textareaClass} text-lg font-extrabold`} /></label>
          <label className="block"><span className="mb-2 block text-xs font-extrabold uppercase tracking-[0.1em] text-muted">Subheadline</span><textarea value={draftHomepage.subheadline} onChange={(event) => setDraftHomepage({ ...draftHomepage, subheadline: event.target.value })} rows={4} className={textareaClass} /></label>
          <div className="grid gap-4 sm:grid-cols-2"><label className="block"><span className="mb-2 block text-xs font-extrabold uppercase tracking-[0.1em] text-muted">CTA Utama</span><input value={draftHomepage.primaryCta} onChange={(event) => setDraftHomepage({ ...draftHomepage, primaryCta: event.target.value })} className={inputClass} /></label><label className="block"><span className="mb-2 block text-xs font-extrabold uppercase tracking-[0.1em] text-muted">CTA Kedua</span><input value={draftHomepage.secondaryCta} onChange={(event) => setDraftHomepage({ ...draftHomepage, secondaryCta: event.target.value })} className={inputClass} /></label></div>
        </div>
      </div>
      <div className="overflow-hidden border border-border-soft bg-white">
        <div className="border-b border-border-soft px-5 py-5 sm:px-6"><p className="eyebrow text-forest">PREVIEW DRAFT</p><h2 className="mt-2 text-xl font-extrabold text-charcoal">Pratinjau sebelum Publish.</h2></div>
        <div className="bg-forest-deep p-6 text-offwhite sm:p-8"><p className="text-[0.66rem] font-extrabold uppercase tracking-[0.13em] text-sage">ORGANISASI PEMUDA DUSUN 3 · SIDODADI</p><p className="mt-6 whitespace-pre-line text-4xl font-extrabold leading-[0.94] tracking-[-0.05em]">{draftHomepage.headline || 'Headline kosong'}</p><p className="mt-5 text-sm leading-relaxed text-offwhite/70">{draftHomepage.subheadline || 'Subheadline kosong'}</p></div>
        <div className="flex flex-wrap gap-3 px-5 py-4 sm:px-6"><Link to="/" className="btn btn-secondary"><Eye size={16}/> Lihat versi publik <ExternalLink size={14}/></Link></div>
      </div>
    </section>

    <SiteMediaManager />

    <section className="mt-6 border border-border-soft bg-white">
      <div className="border-b border-border-soft px-5 py-5 sm:px-6">
        <p className="eyebrow text-forest">PENCAPAIAN & TRANSPARANSI · SUPABASE</p>
        <h2 className="mt-2 text-xl font-extrabold text-charcoal">Konten statistik publik.</h2>
        <p className="mt-2 text-xs leading-relaxed text-muted">Judul, deskripsi, label, dan angka dapat diubah tanpa edit source code.</p>
      </div>
      <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-2">
        <label><span className="mb-2 block text-xs font-bold uppercase tracking-[.08em] text-muted">Label section</span><input value={draftManaged.impact.eyebrow} onChange={(e) => updateImpact({ eyebrow: e.target.value })} className={inputClass}/></label>
        <label><span className="mb-2 block text-xs font-bold uppercase tracking-[.08em] text-muted">Judul besar</span><textarea rows={3} value={draftManaged.impact.title} onChange={(e) => updateImpact({ title: e.target.value })} className={textareaClass}/></label>
        <label className="lg:col-span-2"><span className="mb-2 block text-xs font-bold uppercase tracking-[.08em] text-muted">Deskripsi</span><textarea rows={3} value={draftManaged.impact.description} onChange={(e) => updateImpact({ description: e.target.value })} className={textareaClass}/></label>
      </div>
      <div className="grid gap-4 border-t border-border-soft p-5 sm:grid-cols-2 sm:p-6 xl:grid-cols-4">
        {draftManaged.impact.stats.map((stat, index) => <div key={stat.id} className="border border-border-soft bg-warmwhite p-4"><p className="text-[11px] font-bold uppercase tracking-[.12em] text-accent">Statistik {index + 1}</p><label className="mt-4 block"><span className="mb-2 block text-xs font-semibold text-muted">Label</span><input value={stat.label} onChange={(e) => updateImpact({ stats: draftManaged.impact.stats.map((item, i) => i === index ? { ...item, label: e.target.value } : item) })} className={inputClass}/></label><label className="mt-3 block"><span className="mb-2 block text-xs font-semibold text-muted">Nilai</span><input value={stat.value} onChange={(e) => updateImpact({ stats: draftManaged.impact.stats.map((item, i) => i === index ? { ...item, value: e.target.value } : item) })} className={inputClass}/></label></div>)}
      </div>
    </section>

    <section className="mt-6 border border-border-soft bg-white">
      <div className="border-b border-border-soft px-5 py-5 sm:px-6">
        <p className="eyebrow text-forest">LIMA BIDANG · KONTEN & SEO</p>
        <h2 className="mt-2 text-xl font-extrabold text-charcoal">Kelola section dan halaman detail setiap bidang.</h2>
        <p className="mt-2 text-xs leading-relaxed text-muted">Setiap kartu di website publik dapat diklik ke /bidang/slug dan memiliki metadata SEO sendiri.</p>
      </div>
      <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-2">
        <label><span className="mb-2 block text-xs font-bold uppercase tracking-[.08em] text-muted">Label section</span><input value={draftManaged.programs.eyebrow} onChange={(e) => updateProgramSection({ eyebrow: e.target.value })} className={inputClass}/></label>
        <label><span className="mb-2 block text-xs font-bold uppercase tracking-[.08em] text-muted">Judul besar</span><textarea rows={3} value={draftManaged.programs.title} onChange={(e) => updateProgramSection({ title: e.target.value })} className={textareaClass}/></label>
        <label className="lg:col-span-2"><span className="mb-2 block text-xs font-bold uppercase tracking-[.08em] text-muted">Deskripsi section</span><textarea rows={3} value={draftManaged.programs.description} onChange={(e) => updateProgramSection({ description: e.target.value })} className={textareaClass}/></label>
      </div>
      <div className="divide-y divide-border-soft border-t border-border-soft">
        {draftManaged.programs.programs.map((program, index) => (
          <details key={program.id} className="group p-5 sm:p-6" open={index === 0}>
            <summary className="flex cursor-pointer list-none items-center gap-4">
              <span className="text-sm font-extrabold text-accent">{program.number}</span>
              <div className="min-w-0 flex-1"><p className="font-extrabold text-charcoal">{program.title || 'Bidang tanpa judul'}</p><p className="mt-1 truncate text-xs text-muted">/bidang/{program.slug}</p></div>
              <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase ${program.visible ? 'bg-sage text-forest' : 'bg-warmwhite text-muted'}`}>{program.visible ? 'Tampil' : 'Sembunyi'}</span>
            </summary>
            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              <label><span className="mb-2 block text-xs font-semibold text-muted">Nama bidang</span><input value={program.title} onChange={(e) => updateProgram(index, { title: e.target.value })} className={inputClass}/></label>
              <label><span className="mb-2 block text-xs font-semibold text-muted">Slug URL</span><input value={program.slug} onChange={(e) => updateProgram(index, { slug: e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') })} className={inputClass}/></label>
              <label className="lg:col-span-2"><span className="mb-2 block text-xs font-semibold text-muted">Deskripsi singkat (kartu)</span><textarea rows={2} value={program.shortDescription} onChange={(e) => updateProgram(index, { shortDescription: e.target.value })} className={textareaClass}/></label>
              <label className="lg:col-span-2"><span className="mb-2 block text-xs font-semibold text-muted">Deskripsi lengkap (halaman detail)</span><textarea rows={5} value={program.fullDescription} onChange={(e) => updateProgram(index, { fullDescription: e.target.value })} className={textareaClass}/></label>
              <label className="lg:col-span-2"><span className="mb-2 block text-xs font-semibold text-muted">Tujuan bidang</span><textarea rows={3} value={program.objective} onChange={(e) => updateProgram(index, { objective: e.target.value })} className={textareaClass}/></label>
              <label><span className="mb-2 block text-xs font-semibold text-muted">SEO Title</span><input value={program.seoTitle} onChange={(e) => updateProgram(index, { seoTitle: e.target.value })} className={inputClass}/></label>
              <label><span className="mb-2 block text-xs font-semibold text-muted">SEO Keywords</span><input value={program.seoKeywords} onChange={(e) => updateProgram(index, { seoKeywords: e.target.value })} className={inputClass}/></label>
              <label className="lg:col-span-2"><span className="mb-2 block text-xs font-semibold text-muted">SEO Description</span><textarea rows={3} value={program.seoDescription} onChange={(e) => updateProgram(index, { seoDescription: e.target.value })} className={textareaClass}/></label>
              <label className="lg:col-span-2"><span className="mb-2 block text-xs font-semibold text-muted">URL foto ImageKit (opsional)</span><input value={program.imageUrl} onChange={(e) => updateProgram(index, { imageUrl: e.target.value })} placeholder="https://ik.imagekit.io/..." className={inputClass}/></label>
              <label><span className="mb-2 block text-xs font-semibold text-muted">CTA label (opsional)</span><input value={program.ctaLabel} onChange={(e) => updateProgram(index, { ctaLabel: e.target.value })} className={inputClass}/></label>
              <label><span className="mb-2 block text-xs font-semibold text-muted">CTA URL (opsional)</span><input value={program.ctaUrl} onChange={(e) => updateProgram(index, { ctaUrl: e.target.value })} className={inputClass}/></label>
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-border-soft pt-4">
              <button type="button" onClick={() => updateProgram(index, { visible: !program.visible })} className="btn btn-secondary">{program.visible ? 'Sembunyikan' : 'Tampilkan'}</button>
              <button type="button" onClick={() => moveProgram(index, -1)} disabled={index === 0} className="btn btn-secondary disabled:opacity-35"><ArrowUp size={15}/> Naik</button>
              <button type="button" onClick={() => moveProgram(index, 1)} disabled={index === draftManaged.programs.programs.length - 1} className="btn btn-secondary disabled:opacity-35"><ArrowDown size={15}/> Turun</button>
              <Link to={`/bidang/${program.slug}`} target="_blank" className="btn btn-secondary"><Eye size={15}/> Preview detail</Link>
            </div>
          </details>
        ))}
      </div>
    </section>

    <section className="mt-6 border border-border-soft bg-white">
      <div className="border-b border-border-soft px-5 py-5 sm:px-6"><p className="eyebrow text-forest">SECTION HOMEPAGE · DRAFT</p><h2 className="mt-2 text-xl font-extrabold text-charcoal">Atur bagian yang ditampilkan.</h2></div>
      <div className="divide-y divide-border-soft">{draftSections.map((section) => <div key={section.id} className="flex gap-4 px-5 py-4 sm:items-center sm:px-6"><div className="min-w-0 flex-1"><p className="text-sm font-extrabold text-charcoal">{section.title}</p><p className="mt-1 text-xs leading-relaxed text-muted">{section.description}</p></div><button type="button" onClick={() => setDraftSections(draftSections.map((item) => item.id === section.id ? { ...item, visible: !item.visible } : item))} className={`shrink-0 px-3 py-2 text-[0.68rem] font-extrabold uppercase tracking-[0.08em] ${section.visible ? 'bg-sage/65 text-forest' : 'bg-warmwhite text-muted'}`}>{section.visible ? 'Tampil' : 'Disembunyikan'}</button></div>)}</div>
    </section>
  </InternalLayout>
}
