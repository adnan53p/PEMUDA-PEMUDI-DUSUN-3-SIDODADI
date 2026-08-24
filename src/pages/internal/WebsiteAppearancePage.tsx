import { useMemo, useState } from 'react'
import { Palette, RotateCcw, Save, Type } from 'lucide-react'
import InternalLayout from '../../components/internal/InternalLayout'
import InternalNotice from '../../components/internal/InternalNotice'
import { useSiteContent, type SiteColors } from '../../prototype/SiteContentContext'

export default function WebsiteAppearancePage() {
  const { colors, setColors } = useSiteContent()
  const [draft, setDraft] = useState<SiteColors>(() => ({ ...colors }))
  const [notice, setNotice] = useState('')
  const changed = useMemo(() => JSON.stringify(draft) !== JSON.stringify(colors), [draft, colors])
  const setColor = (key: keyof SiteColors, value: string) => setDraft({ ...draft, [key]: value })
  const publish = () => { setColors({ ...draft }); setNotice('Design token Draft dipublikasikan ke website.'); window.setTimeout(() => setNotice(''), 3000) }
  const reset = () => setDraft({ ...colors })
  return <InternalLayout title="Tampilan & Brand" subtitle="Kontrol visual website dengan alur Draft → Preview → Publish."><InternalNotice />{notice && <div role="status" className="mt-5 border border-[#E8D8B7] bg-[#FFF9EC] px-4 py-3 text-xs font-semibold text-[#6F5830]">{notice}</div>}<section className="mt-6 grid gap-6 xl:grid-cols-[1fr_0.9fr]">
    <div className="border border-border-soft bg-white p-5 sm:p-6"><div className="flex gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-sage/60 text-forest"><Palette size={18}/></span><div><p className="eyebrow text-forest">DESIGN TOKENS · DRAFT</p><h2 className="mt-2 text-xl font-extrabold text-charcoal">Palet utama website.</h2></div></div><div className="mt-6 grid gap-4 sm:grid-cols-2">{([['primary','Forest Green'],['deep','Deep Forest'],['surface','Off-white'],['warm','Warm White'],['sage','Sage'],['text','Charcoal']] as Array<[keyof SiteColors,string]>).map(([key,label]) => <label key={key} className="flex items-center gap-3 border border-border-soft p-3"><input type="color" value={draft[key]} onChange={(event) => setColor(key,event.target.value)} className="h-10 w-12 cursor-pointer border-0 bg-transparent"/><span className="min-w-0"><span className="block text-sm font-extrabold text-charcoal">{label}</span><span className="block text-xs uppercase text-muted">{draft[key]}</span></span></label>)}</div><div className="mt-6 flex gap-2"><button type="button" disabled={!changed} onClick={reset} className="btn btn-secondary disabled:opacity-40"><RotateCcw size={16}/> Reset</button><button type="button" disabled={!changed} onClick={publish} className="btn btn-primary disabled:opacity-40"><Save size={16}/> Publish</button></div></div>
    <div className="border border-border-soft bg-white p-5 sm:p-6"><div className="flex gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-sage/60 text-forest"><Type size={18}/></span><div><p className="eyebrow text-forest">PREVIEW DRAFT</p><h2 className="mt-2 text-xl font-extrabold text-charcoal">Modern sans-serif tetap dikunci.</h2></div></div><div className="mt-6 border border-border-soft p-5" style={{ backgroundColor: draft.surface, color: draft.text }}><p className="text-[0.68rem] font-extrabold uppercase tracking-[0.14em]" style={{ color: draft.primary }}>PEMUDA DUSUN 3 SIDODADI</p><p className="mt-4 text-4xl font-extrabold leading-[0.95] tracking-[-0.05em]">Bersama membangun desa.</p><p className="mt-4 text-sm leading-relaxed opacity-70">Clean, bright, premium, humanis, dan mudah dibaca.</p><button type="button" className="mt-6 px-4 py-3 text-sm font-extrabold" style={{ backgroundColor: draft.primary, color: draft.surface }}>Contoh Tombol</button></div></div>
  </section></InternalLayout>
}
