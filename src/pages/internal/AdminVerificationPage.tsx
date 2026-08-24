import { useMemo, useState } from 'react'
import { Check, ChevronDown, Eye, ShieldCheck, X } from 'lucide-react'
import InternalLayout from '../../components/internal/InternalLayout'
import InternalNotice from '../../components/internal/InternalNotice'
import AdminPageIntro from '../../components/internal/AdminPageIntro'
import TransactionPdfActions from '../../components/internal/TransactionPdfActions'
import PrototypeModal from '../../components/internal/PrototypeModal'
import PrototypeToast from '../../components/internal/PrototypeToast'
import { formatCurrency } from '../../data/internal/workspaceData'
import { categoriesMatch, needsAdminVerification, transactionStatusLabel, type OperationTransaction, useOperations } from '../../prototype/OperationsContext'
import { useAuth } from '../../auth/AuthContext'

export default function AdminVerificationPage() {
  const { user } = useAuth()
  const { activities, transactions, budgets, verifyTransaction, rejectTransaction } = useOperations()
  const [activityId, setActivityId] = useState('semua')
  const [selected, setSelected] = useState<OperationTransaction | null>(null)
  const [toast, setToast] = useState('')

  const pending = useMemo(() => transactions.filter((item) => needsAdminVerification(item) && (activityId === 'semua' || item.activityId === activityId)), [activityId, transactions])

  const notify = (message: string) => { setToast(message); window.setTimeout(() => setToast(''), 2400) }
  const actor = user ? { userId: user.id, name: user.fullName, role: user.role } : undefined
  const handleVerify = async (item: OperationTransaction) => { const result = await verifyTransaction(item.id, actor); notify(result.message); if (result.ok) setSelected(null) }
  const handleReject = async (item: OperationTransaction) => { const result = await rejectTransaction(item.id, actor); notify(result.message); if (result.ok) setSelected(null) }

  return (
    <InternalLayout title="Verifikasi" subtitle="Periksa transaksi, bukti, dan serah terima sebelum dianggap sah.">
      <InternalNotice />
      <PrototypeToast message={toast} />
      <PrototypeModal open={Boolean(selected)} onClose={() => setSelected(null)} title={selected?.label ?? 'Detail verifikasi'} description="Periksa konteks transaksi sebelum mengambil keputusan.">
        {selected && <div className="space-y-5"><div className="grid gap-3 sm:grid-cols-2">{[
          ['Kegiatan', selected.activityName], ['Jenis', selected.kind === 'income' ? 'Pemasukan' : selected.kind === 'expense' ? 'Pengeluaran' : 'Serah Terima Kas'], ['Kategori', selected.category], ['Nominal', formatCurrency(selected.amount)], ['Penginput', selected.createdByName], ['Waktu', selected.date], ['Bukti', selected.evidenceName ?? 'Belum ada bukti'], ['Sumber Dana', selected.kind === 'expense' ? (selected.fundingSource ?? 'Kas Kegiatan') : '-'], ['Penerima Kas', selected.kind === 'handover' ? (selected.handoverRecipientName ?? 'Akan tercatat saat dikonfirmasi') : '-'], ['Status', transactionStatusLabel(selected)],
        ].map(([label, value]) => <div key={label} className="border border-border-soft bg-white p-4"><p className="text-[0.64rem] font-bold uppercase tracking-[0.08em] text-muted">{label}</p><p className="mt-2 text-sm font-bold text-charcoal">{value}</p></div>)}</div>{selected.kind === 'expense' && (() => { const budget = budgets.find((item) => item.activityId === selected.activityId && categoriesMatch(item.category, selected.category)); return budget && budget.realized + selected.amount > budget.plan ? <div className="border border-[#E8D8B7] bg-[#FFF9EC] p-4 text-xs font-semibold text-[#6F5830]">Peringatan RAB: jika transaksi ini diverifikasi, kategori {selected.category} akan melebihi anggaran sebesar {formatCurrency((budget.realized + selected.amount) - budget.plan)}.</div> : null })()}<div className="border-t border-border-soft pt-5"><TransactionPdfActions transaction={selected} /></div><div className="flex flex-col gap-2 border-t border-border-soft pt-5 sm:flex-row sm:justify-end"><button type="button" onClick={() => handleReject(selected)} className="inline-flex items-center justify-center gap-2 border border-[#D7B4B0] bg-white px-4 py-3 text-sm font-extrabold text-[#93483F]"><X size={16} /> Tolak</button><button type="button" onClick={() => handleVerify(selected)} className="btn btn-primary"><Check size={16} /> Verifikasi</button></div></div>}
      </PrototypeModal>

      <div className="mt-6"><AdminPageIntro eyebrow="VERIFIKASI" title="Verifikasi difokuskan pada pembelanjaan dan serah terima kas." description="Iuran warga langsung tercatat sebagai Diterima Humas. Admin hanya memverifikasi pembelanjaan/pengeluaran dan mengonfirmasi serah terima kas sebelum uang dianggap masuk Kas Kegiatan." actions={<label className="relative block min-w-64"><select value={activityId} onChange={(event) => setActivityId(event.target.value)} className="h-11 w-full appearance-none border border-border-soft bg-offwhite px-3 pr-9 text-sm font-bold outline-none"><option value="semua">Semua kegiatan</option>{activities.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted" /></label>} /></div>

      <section className="mt-5 border border-border-soft bg-white">
        <div className="flex items-center justify-between gap-4 border-b border-border-soft px-5 py-4 sm:px-6"><div className="flex items-center gap-3"><ShieldCheck size={19} className="text-forest" /><div><p className="text-sm font-extrabold text-charcoal">Menunggu pemeriksaan</p><p className="text-xs text-muted">{pending.length} item pada filter saat ini</p></div></div></div>
        <div className="divide-y divide-border-soft">{pending.length > 0 ? pending.map((item) => (
          <div key={item.id} className="grid gap-4 px-5 py-5 md:grid-cols-[1fr_160px_150px_auto] md:items-center sm:px-6"><div><p className="text-sm font-extrabold text-charcoal">{item.label}</p><p className="mt-1 text-xs leading-relaxed text-muted">{item.activityName} · {item.createdByName}</p></div><div><p className="text-[0.62rem] font-bold uppercase tracking-[0.08em] text-muted">Kategori</p><p className="mt-1 text-xs font-semibold text-charcoal">{item.category}</p></div><p className="text-sm font-extrabold text-forest">{formatCurrency(item.amount)}</p><button type="button" onClick={() => setSelected(item)} className="inline-flex items-center gap-2 text-xs font-extrabold text-forest"><Eye size={15} /> Periksa</button></div>
        )) : <div className="px-5 py-10 text-center text-sm text-muted">Tidak ada transaksi yang menunggu verifikasi untuk filter ini.</div>}</div>
      </section>
    </InternalLayout>
  )
}
