import { useMemo, useState } from 'react'
import { ChevronDown, Eye, FileImage, FileText, Search } from 'lucide-react'
import InternalLayout from '../../components/internal/InternalLayout'
import InternalNotice from '../../components/internal/InternalNotice'
import AdminPageIntro from '../../components/internal/AdminPageIntro'
import PrototypeModal from '../../components/internal/PrototypeModal'
import TransactionPdfActions from '../../components/internal/TransactionPdfActions'
import SecureEvidencePreview from '../../components/internal/SecureEvidencePreview'
import { formatCurrency } from '../../data/internal/workspaceData'
import { transactionStatusLabel, type OperationTransaction, useOperations } from '../../prototype/OperationsContext'

export default function AdminEvidencePage() {
  const { activities, transactions } = useOperations()
  const [activityId, setActivityId] = useState('semua')
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<OperationTransaction | null>(null)

  const items = useMemo(() => transactions.filter((item) => {
    const matchesActivity = activityId === 'semua' || item.activityId === activityId
    const text = `${item.label} ${item.evidenceName ?? ''} ${item.createdByName}`.toLowerCase()
    return matchesActivity && text.includes(query.trim().toLowerCase())
  }), [activityId, query, transactions])

  return (
    <InternalLayout title="Bukti Transaksi" subtitle="Cocokkan setiap nota, bukti transfer, atau serah terima dengan transaksi asalnya.">
      <InternalNotice />
      <PrototypeModal open={Boolean(selected)} onClose={() => setSelected(null)} title="Preview bukti transaksi" description="File bukti disimpan privat di ImageKit. Supabase hanya menyimpan metadata, URL, dan fileId; akses diberikan melalui signed URL singkat untuk pengurus yang berwenang.">
        {selected && <div><SecureEvidencePreview transactionId={selected.id} url={selected.evidenceUrl} title={selected.evidenceName} mimeType={selected.evidenceType} /><div className="mt-5 grid gap-3 sm:grid-cols-2"><div className="border border-border-soft bg-white p-4"><p className="text-[0.64rem] uppercase tracking-[0.08em] text-muted">Transaksi</p><p className="mt-2 text-sm font-bold text-charcoal">{selected.label}</p></div><div className="border border-border-soft bg-white p-4"><p className="text-[0.64rem] uppercase tracking-[0.08em] text-muted">Nominal</p><p className="mt-2 text-sm font-extrabold text-forest">{formatCurrency(selected.amount)}</p></div></div></div>}
      </PrototypeModal>

      <div className="mt-6"><AdminPageIntro eyebrow="BUKTI TRANSAKSI" title="Bukti selalu melekat pada transaksi asal." description="Tidak ada folder bukti yang berdiri sendiri. Nota, transfer, dan dokumentasi pembayaran ditelusuri melalui transaksi, kegiatan, dan penginput yang sama." /></div>

      <section className="mt-5 border border-border-soft bg-white p-4 sm:p-5"><div className="grid gap-3 md:grid-cols-[1fr_300px]"><label className="flex h-11 items-center border border-border-soft bg-offwhite px-3"><Search size={16} className="mr-2 text-muted" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari transaksi, bukti, atau penginput" className="min-w-0 flex-1 bg-transparent text-sm outline-none" /></label><label className="relative flex h-11 items-center border border-border-soft bg-offwhite px-3"><select value={activityId} onChange={(event) => setActivityId(event.target.value)} className="w-full appearance-none bg-transparent pr-7 text-sm font-semibold outline-none"><option value="semua">Semua kegiatan</option>{activities.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><ChevronDown size={15} className="pointer-events-none absolute right-3 text-muted" /></label></div></section>

      <section className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{items.map((item) => (
        <article key={item.id} className="border border-border-soft bg-white"><div className="flex min-h-36 items-center justify-center bg-warmwhite"><FileText size={34} className="text-forest/38" /></div><div className="p-5"><div className="flex items-start justify-between gap-3"><span className={`px-2.5 py-1 text-[0.62rem] font-extrabold uppercase tracking-[0.08em] ${item.evidenceName ? 'bg-sage/60 text-forest' : 'bg-[#FFF2D8] text-[#7A5B21]'}`}>{item.evidenceName ? 'Bukti ada' : 'Belum ada'}</span><span className="text-[0.62rem] font-bold uppercase tracking-[0.08em] text-muted">{transactionStatusLabel(item)}</span></div><h2 className="mt-4 text-base font-extrabold text-charcoal">{item.label}</h2><p className="mt-2 text-xs leading-relaxed text-muted">{item.activityName} · {item.createdByName}</p><div className="mt-4 flex items-center justify-between gap-3"><p className="text-sm font-extrabold text-forest">{formatCurrency(item.amount)}</p><button type="button" onClick={() => setSelected(item)} className="inline-flex items-center gap-1.5 text-xs font-extrabold text-forest"><Eye size={14} /> Preview</button></div><div className="mt-4 border-t border-border-soft pt-4"><TransactionPdfActions transaction={item} compact /></div></div></article>
      ))}</section>
    </InternalLayout>
  )
}
