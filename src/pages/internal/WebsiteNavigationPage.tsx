import { useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, Eye, EyeOff, RotateCcw, Save } from 'lucide-react'
import InternalLayout from '../../components/internal/InternalLayout'
import InternalNotice from '../../components/internal/InternalNotice'
import { useSiteContent, type ManagedNavigationItem } from '../../prototype/SiteContentContext'

export default function WebsiteNavigationPage() {
  const { navigation, setNavigation } = useSiteContent()
  const [draft, setDraft] = useState<ManagedNavigationItem[]>(() => navigation.map((item) => ({ ...item })))
  const [notice, setNotice] = useState('')
  const changed = useMemo(() => JSON.stringify(draft) !== JSON.stringify(navigation), [draft, navigation])
  const move = (index: number, delta: number) => {
    const next = index + delta
    if (next < 0 || next >= draft.length) return
    const copy = [...draft]
    ;[copy[index], copy[next]] = [copy[next], copy[index]]
    setDraft(copy)
  }
  const publish = () => { setNavigation(draft.map((item) => ({ ...item }))); setNotice('Draft navigasi dipublikasikan ke Navbar.'); window.setTimeout(() => setNotice(''), 3000) }
  const reset = () => setDraft(navigation.map((item) => ({ ...item })))
  return <InternalLayout title="Navigasi Publik" subtitle="Atur urutan dan visibilitas menu dengan alur Draft → Publish."><InternalNotice />{notice && <div role="status" className="mt-5 border border-[#E8D8B7] bg-[#FFF9EC] px-4 py-3 text-xs font-semibold text-[#6F5830]">{notice}</div>}<section className="mt-6 border border-border-soft bg-white"><div className="flex flex-col gap-4 border-b border-border-soft px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6"><div><p className="eyebrow text-forest">MENU UTAMA · DRAFT</p><h2 className="mt-2 text-xl font-extrabold text-charcoal">Struktur navigasi publik.</h2><p className="mt-2 text-xs text-muted">Navbar publik tidak berubah sampai tombol Publish ditekan.</p></div><div className="flex gap-2"><button type="button" disabled={!changed} onClick={reset} className="btn btn-secondary disabled:opacity-40"><RotateCcw size={15}/> Reset</button><button type="button" disabled={!changed} onClick={publish} className="btn btn-primary disabled:opacity-40"><Save size={15}/> Publish</button></div></div><div className="divide-y divide-border-soft">{draft.map((item,index) => <div key={`${item.kind}-${item.to}`} className="grid gap-3 px-5 py-4 sm:grid-cols-[44px_1fr_auto_auto] sm:items-center sm:px-6"><span className="text-xs font-extrabold text-muted">{String(index+1).padStart(2,'0')}</span><div><p className="text-sm font-extrabold text-charcoal">{item.label}</p><p className="mt-1 text-xs text-muted">{item.to}</p></div><button type="button" onClick={() => setDraft(draft.map((entry) => entry === item ? { ...entry, visible: !entry.visible } : entry))} className="flex items-center gap-2 text-xs font-extrabold text-forest">{item.visible ? <Eye size={15}/> : <EyeOff size={15}/>} {item.visible ? 'Tampil' : 'Sembunyi'}</button><div className="flex gap-1"><button type="button" onClick={() => move(index,-1)} disabled={index===0} className="flex h-9 w-9 items-center justify-center border border-border-soft text-forest disabled:opacity-30" aria-label={`Naikkan ${item.label}`}><ArrowUp size={15}/></button><button type="button" onClick={() => move(index,1)} disabled={index===draft.length-1} className="flex h-9 w-9 items-center justify-center border border-border-soft text-forest disabled:opacity-30" aria-label={`Turunkan ${item.label}`}><ArrowDown size={15}/></button></div></div>)}</div></section></InternalLayout>
}
