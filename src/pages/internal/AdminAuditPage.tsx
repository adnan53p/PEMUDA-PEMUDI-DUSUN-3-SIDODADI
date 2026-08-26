import { useMemo, useState } from 'react'
import { ChevronDown, FileClock, Search, ShieldCheck } from 'lucide-react'
import InternalLayout from '../../components/internal/InternalLayout'
import InternalNotice from '../../components/internal/InternalNotice'
import AdminPageIntro from '../../components/internal/AdminPageIntro'
import { useOperations } from '../../prototype/OperationsContext'

export default function AdminAuditPage() {
  const { auditLogs } = useOperations()
  const [query, setQuery] = useState('')
  const [actor, setActor] = useState('semua')
  const actors = useMemo(() => Array.from(new Set(auditLogs.map((item) => item.actor))).sort(), [auditLogs])
  const filtered = useMemo(() => auditLogs.filter((item) => {
    const matchesQuery = `${item.actor} ${item.actorUserId ?? ''} ${item.action} ${item.detail} ${item.entityType ?? ''} ${item.entityId ?? ''} ${item.reason ?? ''}`.toLowerCase().includes(query.trim().toLowerCase())
    return matchesQuery && (actor === 'semua' || item.actor === actor)
  }), [auditLogs, actor, query])

  return (
    <InternalLayout title="Audit Operasional" subtitle="Jejak perubahan kegiatan dan transaksi yang tidak boleh hilang.">
      <InternalNotice />
      <div className="mt-6"><AdminPageIntro eyebrow="AUDIT OPERASIONAL" title="Siapa melakukan apa, kapan, dan pada data yang mana." description="Audit log bukan tempat mengedit transaksi. Koreksi dan pembatalan mempertahankan histori lama serta alasan perubahan." /></div>

      <section className="mt-5 grid gap-4 md:grid-cols-[1fr_280px]">
        <div className="border border-border-soft bg-white p-5"><div className="flex items-start gap-3"><ShieldCheck size={19} className="mt-0.5 shrink-0 text-forest" /><div><p className="text-sm font-extrabold text-charcoal">Riwayat aktivitas tersimpan.</p><p className="mt-1 text-xs leading-relaxed text-muted">Setiap tindakan penting dicatat bersama waktu dan pelakunya untuk membantu penelusuran perubahan.</p></div></div></div>
        <div className="border border-border-soft bg-white p-5"><FileClock size={19} className="text-forest" /><p className="mt-4 text-2xl font-extrabold text-charcoal">{auditLogs.length}</p><p className="mt-1 text-xs text-muted">Catatan aktivitas</p></div>
      </section>

      <section className="mt-5 border border-border-soft bg-white">
        <div className="grid gap-3 border-b border-border-soft p-4 md:grid-cols-[1fr_260px] sm:p-5"><label className="flex h-11 items-center border border-border-soft bg-offwhite px-3"><Search size={16} className="mr-2 text-muted" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari aktor, ID, tindakan, alasan, atau detail" className="min-w-0 flex-1 bg-transparent text-sm outline-none" /></label><label className="relative flex h-11 items-center border border-border-soft bg-offwhite px-3"><select value={actor} onChange={(event) => setActor(event.target.value)} className="w-full appearance-none bg-transparent pr-7 text-sm font-semibold outline-none"><option value="semua">Semua pelaku</option>{actors.map((item) => <option key={item}>{item}</option>)}</select><ChevronDown size={15} className="pointer-events-none absolute right-3 text-muted" /></label></div>
        <div className="divide-y divide-border-soft">{filtered.length > 0 ? filtered.map((item) => (
          <div key={item.id} className="grid gap-3 px-5 py-4 lg:grid-cols-[160px_210px_1fr] lg:items-start sm:px-6"><div><span className="text-xs font-extrabold text-forest">{item.timestampISO ? new Date(item.timestampISO).toLocaleString('id-ID') : item.time}</span><p className="mt-1 text-[0.65rem] text-muted">{item.id}</p></div><div><p className="text-sm font-extrabold text-charcoal">{item.actor}</p><p className="mt-1 text-[0.68rem] text-muted">{item.actorUserId ?? 'Actor ID belum tersedia'}</p></div><div><p className="text-sm font-semibold text-charcoal">{item.action}</p><p className="mt-1 text-xs leading-relaxed text-muted">{item.detail}</p>{item.reason && <p className="mt-2 text-xs font-semibold text-[#8A4A39]">Alasan: {item.reason}</p>}{(item.entityType || item.entityId) && <p className="mt-2 text-[0.65rem] uppercase tracking-[0.08em] text-muted">{item.entityType ?? 'Data'} · {item.entityId ?? '-'}</p>}</div></div>
        )) : <div className="px-5 py-10 text-center text-sm text-muted">Tidak ada audit log yang cocok dengan filter.</div>}</div>
      </section>
    </InternalLayout>
  )
}
