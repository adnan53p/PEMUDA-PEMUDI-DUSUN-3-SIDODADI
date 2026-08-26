import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { ArrowDownRight, Check, ChevronDown, CircleDollarSign, Eye, FileImage, HandCoins, Landmark, LoaderCircle, Plus, Search, ShieldCheck, Trash2, UploadCloud, WalletCards, X } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import InternalLayout from '../../components/internal/InternalLayout'
import InternalNotice from '../../components/internal/InternalNotice'
import AdminPageIntro from '../../components/internal/AdminPageIntro'
import PrototypeModal from '../../components/internal/PrototypeModal'
import PrototypeToast from '../../components/internal/PrototypeToast'
import TransactionPdfActions from '../../components/internal/TransactionPdfActions'
import { formatCurrency } from '../../data/internal/workspaceData'
import { deleteExternalMedia, MEDIA_UPLOAD_CONFIGURED, uploadExternalMedia } from '../../data/mediaUploadService'
import { categoriesMatch, isActivityFundedExpense, isRecognizedTransaction, needsAdminVerification, transactionStatusLabel, type OperationTransaction, useOperations } from '../../prototype/OperationsContext'
import { useAuth } from '../../auth/AuthContext'

type FinanceTab = 'ringkasan' | 'iuran' | 'pembelanjaan' | 'serah-kas' | 'transaksi'

const financeTabs: Array<{ id: FinanceTab; label: string }> = [
  { id: 'ringkasan', label: 'Ringkasan' },
  { id: 'iuran', label: 'Iuran' },
  { id: 'pembelanjaan', label: 'Pembelanjaan' },
  { id: 'serah-kas', label: 'Serah Kas' },
  { id: 'transaksi', label: 'Transaksi' },
]

function kindLabel(item: OperationTransaction) {
  if (item.kind === 'income') return item.category === 'Iuran' ? 'Iuran' : 'Pemasukan'
  if (item.kind === 'expense') return 'Pembelanjaan'
  return 'Serah Kas'
}

export default function AdminFinancePage() {
  const { user } = useAuth()
  const { activities, assignments, collectionTargets, budgets, transactions, cashReconciliations, addBudgetItem, updateBudgetItem, removeBudgetItem, addTransaction, attachTransactionEvidence, verifyTransaction, rejectTransaction } = useOperations()
  const [searchParams, setSearchParams] = useSearchParams()
  const requestedTab = searchParams.get('tab') as FinanceTab | null
  const activeTab: FinanceTab = financeTabs.some((item) => item.id === requestedTab) ? requestedTab as FinanceTab : 'ringkasan'
  const [activityId, setActivityId] = useState(activities[0]?.id ?? '')
  const [modal, setModal] = useState<'rab' | 'income' | null>(null)
  const [selected, setSelected] = useState<OperationTransaction | null>(null)
  const [toast, setToast] = useState('')
  const [query, setQuery] = useState('')
  const [rabCategory, setRabCategory] = useState('')
  const [rabPlan, setRabPlan] = useState('')
  const [incomeLabel, setIncomeLabel] = useState('')
  const [incomeCategory, setIncomeCategory] = useState('Sponsor')
  const [incomeAmount, setIncomeAmount] = useState('')
  const [incomeEvidenceFile, setIncomeEvidenceFile] = useState<File | null>(null)
  const [incomeBusy, setIncomeBusy] = useState(false)
  const [markedTransactionIds, setMarkedTransactionIds] = useState<Set<string>>(() => new Set())
  const [bulkBusy, setBulkBusy] = useState(false)

  const actor = user ? { userId: user.id, name: user.fullName, role: user.role } : undefined

  useEffect(() => {
    if (activities.length > 0 && !activities.some((item) => item.id === activityId)) setActivityId(activities[0].id)
  }, [activities, activityId])
  const activity = activities.find((item) => item.id === activityId)
  const activityTransactions = useMemo(() => transactions.filter((item) => item.activityId === activityId), [activityId, transactions])
  const recognized = activityTransactions.filter(isRecognizedTransaction)
  const recordedIncome = recognized.filter((item) => item.kind === 'income').reduce((sum, item) => sum + item.amount, 0)
  const humasIncome = recognized.filter((item) => item.kind === 'income' && item.createdByRole === 'humas').reduce((sum, item) => sum + item.amount, 0)
  const directIncome = recordedIncome - humasIncome
  const expenses = recognized.filter((item) => item.kind === 'expense').reduce((sum, item) => sum + item.amount, 0)
  const activityFundedExpenses = recognized.filter(isActivityFundedExpense).reduce((sum, item) => sum + item.amount, 0)
  const humasFundedExpenses = recognized.filter((item) => item.kind === 'expense' && item.fundingSource === 'Kas Humas').reduce((sum, item) => sum + item.amount, 0)
  const reimburseOutstanding = recognized.filter((item) => item.kind === 'expense' && item.fundingSource === 'Uang Pribadi/Reimburse').reduce((sum, item) => sum + item.amount, 0)
  const handedOver = recognized.filter((item) => item.kind === 'handover').reduce((sum, item) => sum + item.amount, 0)
  const pendingHandover = activityTransactions.filter((item) => item.kind === 'handover' && needsAdminVerification(item)).reduce((sum, item) => sum + item.amount, 0)
  const cashReceived = directIncome + handedOver
  const cashOnHumas = Math.max(0, humasIncome - handedOver - humasFundedExpenses)
  const activityCashBalance = cashReceived - activityFundedExpenses
  const pending = activityTransactions.filter(needsAdminVerification)

  const humasCashRows = assignments
    .filter((item) => item.activityId === activityId && item.permissions.includes('Iuran'))
    .map((assignment) => {
      const collected = recognized.filter((item) => item.assignmentId === assignment.id && item.kind === 'income').reduce((sum, item) => sum + item.amount, 0)
      const transferred = recognized.filter((item) => item.assignmentId === assignment.id && item.kind === 'handover').reduce((sum, item) => sum + item.amount, 0)
      const spent = recognized.filter((item) => item.assignmentId === assignment.id && item.kind === 'expense' && item.fundingSource === 'Kas Humas').reduce((sum, item) => sum + item.amount, 0)
      const latestReconciliation = cashReconciliations.find((item) => item.assignmentId === assignment.id)
      const assignedResidents = collectionTargets.filter((item) => item.assignmentId === assignment.id).length
      const contributedResidents = new Set(recognized.filter((item) => item.assignmentId === assignment.id && item.kind === 'income' && item.targetId).map((item) => item.targetId)).size
      return { ...assignment, collected, transferred, spent, cash: Math.max(0, collected - transferred - spent), latestReconciliation, assignedResidents, contributedResidents }
    })

  const budgetItems = budgets.filter((item) => item.activityId === activityId)
  const planTotal = budgetItems.reduce((sum, item) => sum + item.plan, 0)
  const realizedTotal = budgetItems.reduce((sum, item) => sum + item.realized, 0)

  const tabTransactions = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return activityTransactions.filter((item) => {
      const matchesTab = activeTab === 'transaksi'
        || (activeTab === 'iuran' && item.kind === 'income' && item.category === 'Iuran')
        || (activeTab === 'pembelanjaan' && item.kind === 'expense')
        || (activeTab === 'serah-kas' && item.kind === 'handover')
      if (!matchesTab) return false
      if (!normalized) return true
      return `${item.label} ${item.category} ${item.createdByName} ${item.areaLabel ?? ''} ${item.evidenceName ?? ''}`.toLowerCase().includes(normalized)
    })
  }, [activeTab, activityTransactions, query])

  const bulkSelectionEnabled = activeTab === 'pembelanjaan' || activeTab === 'serah-kas'
  const bulkEligibleTransactions = bulkSelectionEnabled ? tabTransactions.filter(needsAdminVerification) : []
  const markedEligibleTransactions = bulkEligibleTransactions.filter((item) => markedTransactionIds.has(item.id))
  const allEligibleMarked = bulkEligibleTransactions.length > 0 && markedEligibleTransactions.length === bulkEligibleTransactions.length

  useEffect(() => {
    setMarkedTransactionIds(new Set())
  }, [activeTab, activityId, query])

  const notify = (message: string) => { setToast(message); window.setTimeout(() => setToast(''), 3000) }

  const changeTab = (tab: FinanceTab) => {
    setSearchParams(tab === 'ringkasan' ? {} : { tab })
    setQuery('')
  }

  const submitRab = async (event: FormEvent) => {
    event.preventDefault()
    const result = await addBudgetItem({ activityId, category: rabCategory, plan: Number(rabPlan) || 0 }, actor)
    notify(result.message)
    if (result.ok) { setRabCategory(''); setRabPlan(''); setModal(null) }
  }

  const submitIncome = async (event: FormEvent) => {
    event.preventDefault()
    if (!activity || !user || incomeBusy) return
    if (incomeEvidenceFile && !MEDIA_UPLOAD_CONFIGURED) {
      notify('Layanan unggah bukti belum tersedia. Hubungi pengelola website.')
      return
    }

    setIncomeBusy(true)
    try {
      const result = await addTransaction({
        activityId: activity.id,
        activityName: activity.name,
        kind: 'income',
        label: incomeLabel,
        category: incomeCategory,
        amount: Number(incomeAmount) || 0,
        createdBy: { userId: user.id, name: user.fullName, role: user.role },
        note: 'Pemasukan non-iuran dicatat Admin.',
      })
      if (!result.ok) {
        notify(result.message)
        return
      }

      let evidenceMessage = ''
      if (incomeEvidenceFile && result.id) {
        let uploadedFileId = ''
        try {
          const uploaded = await uploadExternalMedia({
            file: incomeEvidenceFile,
            scope: 'transaction-evidence',
            activityId: activity.id,
            transactionId: result.id,
          })
          uploadedFileId = uploaded.externalFileId
          const attachResult = await attachTransactionEvidence(result.id, {
            title: incomeEvidenceFile.name,
            url: uploaded.url,
            mimeType: incomeEvidenceFile.type,
            externalFileId: uploaded.externalFileId,
          }, { userId: user.id, name: user.fullName, role: user.role })
          if (!attachResult.ok) {
            try { await deleteExternalMedia({ externalFileId: uploadedFileId, scope: 'transaction-evidence', activityId: activity.id, transactionId: result.id }) } catch { /* cleanup best effort */ }
            evidenceMessage = ` Bukti gagal ditautkan: ${attachResult.message}`
          } else {
            evidenceMessage = ' Bukti transaksi berhasil dilampirkan.'
          }
        } catch (error) {
          evidenceMessage = ` Upload bukti gagal: ${error instanceof Error ? error.message : 'kesalahan upload'}`
        }
      }

      notify(`${result.message}${evidenceMessage}`)
      setIncomeLabel('')
      setIncomeAmount('')
      setIncomeEvidenceFile(null)
      setModal(null)
    } finally {
      setIncomeBusy(false)
    }
  }

  const handleVerify = async (item: OperationTransaction) => {
    const result = await verifyTransaction(item.id, actor)
    notify(result.message)
    if (result.ok) setSelected(null)
  }

  const handleReject = async (item: OperationTransaction) => {
    const result = await rejectTransaction(item.id, actor)
    notify(result.message)
    if (result.ok) setSelected(null)
  }

  const toggleMarkedTransaction = (id: string) => {
    setMarkedTransactionIds((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleMarkAll = () => {
    setMarkedTransactionIds((current) => {
      const next = new Set(current)
      if (allEligibleMarked) bulkEligibleTransactions.forEach((item) => next.delete(item.id))
      else bulkEligibleTransactions.forEach((item) => next.add(item.id))
      return next
    })
  }

  const verifyMarkedTransactions = async () => {
    if (markedEligibleTransactions.length === 0 || bulkBusy) return
    const actionLabel = activeTab === 'serah-kas' ? 'konfirmasi serah kas' : 'verifikasi pembelanjaan'
    if (!window.confirm(`Lanjutkan ${actionLabel} untuk ${markedEligibleTransactions.length} transaksi yang ditandai?`)) return

    setBulkBusy(true)
    const successfulIds: string[] = []
    const failedMessages: string[] = []
    for (const item of markedEligibleTransactions) {
      const result = await verifyTransaction(item.id, actor)
      if (result.ok) successfulIds.push(item.id)
      else failedMessages.push(`${item.label}: ${result.message}`)
    }
    setBulkBusy(false)
    setMarkedTransactionIds((current) => {
      const next = new Set(current)
      successfulIds.forEach((id) => next.delete(id))
      return next
    })
    if (failedMessages.length > 0) notify(`${successfulIds.length} berhasil, ${failedMessages.length} gagal. ${failedMessages[0]}`)
    else notify(`${successfulIds.length} transaksi berhasil ${activeTab === 'serah-kas' ? 'dikonfirmasi diterima' : 'diverifikasi'}.`)
  }

  const renderTransactionRows = (items: OperationTransaction[], allowBulkSelection = false) => (
    <div className="divide-y divide-border-soft">
      {items.length > 0 ? items.map((item) => {
        const canMark = allowBulkSelection && needsAdminVerification(item)
        return (
        <div key={item.id} className={`grid gap-4 px-5 py-5 ${allowBulkSelection ? 'lg:grid-cols-[34px_1fr_150px_160px_auto]' : 'lg:grid-cols-[1fr_150px_160px_auto]'} lg:items-center sm:px-6`}>
          {allowBulkSelection && <div className="flex items-center lg:justify-center">{canMark ? <input type="checkbox" checked={markedTransactionIds.has(item.id)} disabled={bulkBusy} onChange={() => toggleMarkedTransaction(item.id)} aria-label={`Tandai ${item.label}`} className="h-4 w-4 accent-[#123D32]" /> : <span className="h-4 w-4" />}</div>}
          <div><div className="flex flex-wrap items-center gap-2"><p className="text-sm font-extrabold text-charcoal">{item.label}</p>{needsAdminVerification(item) && <span className="bg-[#FFF2D8] px-2 py-1 text-[0.6rem] font-extrabold uppercase tracking-[0.08em] text-[#7A5B21]">Perlu tindakan</span>}</div><p className="mt-1 text-xs leading-relaxed text-muted">{kindLabel(item)} · {item.createdByName}{item.areaLabel ? ` · ${item.areaLabel}` : ''}{item.kind === 'expense' ? ` · ${item.fundingSource ?? 'Kas Kegiatan'}` : ''}</p></div>
          <div><p className="text-[0.62rem] font-bold uppercase tracking-[0.08em] text-muted">Status</p><p className="mt-1 text-xs font-bold text-charcoal">{transactionStatusLabel(item)}</p></div>
          <p className={`text-sm font-extrabold ${item.kind === 'income' ? 'text-forest' : item.kind === 'expense' ? 'text-[#A74C45]' : 'text-charcoal'}`}>{item.kind === 'income' ? '+' : item.kind === 'expense' ? '-' : ''}{formatCurrency(item.amount)}</p>
          <div className="flex flex-wrap gap-3 lg:justify-end"><button type="button" onClick={() => setSelected(item)} className="inline-flex items-center gap-1.5 text-xs font-extrabold text-forest"><Eye size={14} /> {needsAdminVerification(item) ? 'Periksa' : 'Detail'}</button><TransactionPdfActions transaction={item} compact /></div>
        </div>
      )}) : <div className="px-5 py-10 text-center text-sm text-muted">Tidak ada transaksi pada filter ini.</div>}
    </div>
  )

  return (
    <InternalLayout title="Keuangan" subtitle="Satu tempat untuk iuran, pembelanjaan, serah kas, verifikasi, bukti, RAB, dan transaksi.">
      <InternalNotice /><PrototypeToast message={toast} />
      <PrototypeModal open={modal === 'rab'} onClose={() => setModal(null)} title="Tambah kategori RAB" description="RAB dibuat sebelum pembelanjaan. Realisasi dihitung otomatis dari transaksi terverifikasi dengan kategori yang sama.">
        <form onSubmit={submitRab} className="space-y-4"><label className="block"><span className="text-xs font-extrabold uppercase tracking-[0.08em] text-muted">Kategori</span><input required value={rabCategory} onChange={(event) => setRabCategory(event.target.value)} placeholder="Contoh: Konsumsi" className="mt-2 h-11 w-full border border-border-soft bg-white px-3 text-sm outline-none focus:border-forest" /></label><label className="block"><span className="text-xs font-extrabold uppercase tracking-[0.08em] text-muted">Rencana anggaran</span><input required type="number" min="1" value={rabPlan} onChange={(event) => setRabPlan(event.target.value)} className="mt-2 h-11 w-full border border-border-soft bg-white px-3 text-sm outline-none focus:border-forest" /></label><button type="submit" className="btn btn-primary w-full justify-center"><Plus size={15} /> Tambah RAB</button></form>
      </PrototypeModal>
      <PrototypeModal open={modal === 'income'} onClose={() => setModal(null)} title="Catat pemasukan lain" description="Sponsor, donasi, bantuan, hasil usaha, dan pemasukan non-iuran dicatat sekali sebagai transaksi kegiatan.">
        <form onSubmit={submitIncome} className="space-y-4"><label className="block"><span className="text-xs font-extrabold uppercase tracking-[0.08em] text-muted">Keterangan</span><input required value={incomeLabel} onChange={(event) => setIncomeLabel(event.target.value)} placeholder="Contoh: Sponsor Toko Maju" className="mt-2 h-11 w-full border border-border-soft bg-white px-3 text-sm outline-none focus:border-forest" /></label><div className="grid gap-4 sm:grid-cols-2"><label><span className="text-xs font-extrabold uppercase tracking-[0.08em] text-muted">Kategori</span><select value={incomeCategory} onChange={(event) => setIncomeCategory(event.target.value)} className="mt-2 h-11 w-full border border-border-soft bg-white px-3 text-sm font-semibold"><option>Sponsor</option><option>Donasi</option><option>Bantuan Desa</option><option>Hasil Usaha</option><option>Pendapatan Kegiatan</option><option>Lainnya</option></select></label><label><span className="text-xs font-extrabold uppercase tracking-[0.08em] text-muted">Nominal</span><input required type="number" min="1" value={incomeAmount} onChange={(event) => setIncomeAmount(event.target.value)} className="mt-2 h-11 w-full border border-border-soft bg-white px-3 text-sm" /></label></div><label className="block"><span className="text-xs font-extrabold uppercase tracking-[0.08em] text-muted">Bukti pemasukan (opsional)</span><div className="mt-2 flex min-h-11 items-center gap-3 border border-dashed border-border-soft bg-white px-3 py-2"><UploadCloud size={18} className="text-forest" /><input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={(event) => setIncomeEvidenceFile(event.target.files?.[0] ?? null)} className="min-w-0 flex-1 text-xs text-muted" /></div><p className="mt-1 text-[0.68rem] text-muted">Bukti hanya dapat diakses oleh pengurus yang berwenang.</p></label><button type="submit" disabled={incomeBusy} className="btn btn-primary w-full justify-center disabled:opacity-50">{incomeBusy ? <><LoaderCircle size={16} className="animate-spin" /> Menyimpan...</> : 'Simpan Pemasukan'}</button></form>
      </PrototypeModal>
      <PrototypeModal open={Boolean(selected)} onClose={() => setSelected(null)} title={selected?.label ?? 'Detail transaksi'} description="Bukti dan tindakan verifikasi melekat pada transaksi yang sama; tidak ada menu bukti atau verifikasi terpisah.">
        {selected && <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2">{[
            ['Kegiatan', selected.activityName], ['Jenis', kindLabel(selected)], ['Kategori', selected.category], ['Nominal', formatCurrency(selected.amount)], ['Penginput', selected.createdByName], ['Waktu', selected.date], ['Status', transactionStatusLabel(selected)], ['Sumber Dana', selected.kind === 'expense' ? (selected.fundingSource ?? 'Kas Kegiatan') : '-'],
          ].map(([label, value]) => <div key={label} className="border border-border-soft bg-white p-4"><p className="text-[0.64rem] font-bold uppercase tracking-[0.08em] text-muted">{label}</p><p className="mt-2 text-sm font-bold text-charcoal">{value}</p></div>)}</div>
          <div className="border border-border-soft bg-warmwhite p-4"><div className="flex gap-3"><FileImage size={19} className="mt-0.5 shrink-0 text-forest" /><div className="min-w-0"><p className="text-xs font-extrabold uppercase tracking-[0.08em] text-muted">Bukti transaksi</p><p className="mt-2 text-sm font-bold text-charcoal">{selected.evidenceName ?? 'Belum ada file bukti'}</p><p className="mt-1 text-xs text-muted">{selected.evidenceType ?? 'Bukti belum dilampirkan'}{selected.vendor ? ` · Vendor ${selected.vendor}` : ''}</p>{selected.evidenceUrl && <p className="mt-2 text-xs font-extrabold text-forest">Bukti transaksi tersedia · buka dari menu Bukti Transaksi</p>}</div></div></div>
          {selected.kind === 'expense' && (() => { const budget = budgets.find((item) => item.activityId === selected.activityId && categoriesMatch(item.category, selected.category)); return budget && needsAdminVerification(selected) && budget.realized + selected.amount > budget.plan ? <div className="border border-[#E8D8B7] bg-[#FFF9EC] p-4 text-xs font-semibold text-[#6F5830]">Peringatan RAB: jika transaksi ini diverifikasi, kategori {selected.category} akan melebihi anggaran sebesar {formatCurrency((budget.realized + selected.amount) - budget.plan)}.</div> : null })()}
          <div className="border-t border-border-soft pt-5"><TransactionPdfActions transaction={selected} /></div>
          {needsAdminVerification(selected) && <div className="flex flex-col gap-2 border-t border-border-soft pt-5 sm:flex-row sm:justify-end"><button type="button" onClick={() => handleReject(selected)} className="inline-flex items-center justify-center gap-2 border border-[#D7B4B0] bg-white px-4 py-3 text-sm font-extrabold text-[#93483F]"><X size={16} /> Tolak</button><button type="button" onClick={() => handleVerify(selected)} className="btn btn-primary"><Check size={16} /> {selected.kind === 'handover' ? 'Konfirmasi Diterima' : 'Verifikasi'}</button></div>}
        </div>}
      </PrototypeModal>

      <div className="mt-6"><AdminPageIntro eyebrow="KEUANGAN" title="Satu transaksi, satu tempat pengelolaan." description="Verifikasi dan bukti transaksi sekarang menjadi bagian dari detail transaksi. Admin tidak perlu berpindah menu untuk memeriksa data yang sama." actions={<div className="flex flex-wrap gap-2"><button type="button" onClick={() => setModal('income')} className="btn btn-secondary"><Plus size={15} /> Pemasukan Lain</button><button type="button" onClick={() => setModal('rab')} className="btn btn-primary"><Plus size={15} /> Tambah RAB</button><label className="relative block min-w-64"><select value={activityId} onChange={(event) => setActivityId(event.target.value)} className="h-11 w-full appearance-none border border-border-soft bg-offwhite px-3 pr-9 text-sm font-bold outline-none focus:border-forest">{activities.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted" /></label></div>} /></div>

      <div className="mt-5 flex gap-1 overflow-x-auto border-b border-border-soft bg-white px-3 pt-3">
        {financeTabs.map((tab) => <button key={tab.id} type="button" onClick={() => changeTab(tab.id)} className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-extrabold ${activeTab === tab.id ? 'border-forest text-forest' : 'border-transparent text-muted hover:text-charcoal'}`}>{tab.label}{tab.id === 'pembelanjaan' && pending.filter((item) => item.kind === 'expense').length > 0 ? ` (${pending.filter((item) => item.kind === 'expense').length})` : ''}{tab.id === 'serah-kas' && pending.filter((item) => item.kind === 'handover').length > 0 ? ` (${pending.filter((item) => item.kind === 'handover').length})` : ''}</button>)}
      </div>

      {activity?.financialLocked && <div className="mt-4 border border-[#D7B4B0] bg-[#FFF3F1] px-4 py-3 text-xs font-semibold text-[#8A473E]">Keuangan kegiatan terkunci karena LPJ sudah disahkan. Transaksi dan perubahan RAB baru ditolak sampai kegiatan dibuka kembali melalui prosedur koreksi.</div>}

      {activeTab === 'ringkasan' && <>
        <section className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
          <div className="border border-border-soft bg-white p-5"><CircleDollarSign size={19} className="text-forest" /><p className="mt-4 text-[0.66rem] font-bold uppercase tracking-[0.08em] text-muted">Pemasukan tercatat</p><p className="mt-2 text-xl font-extrabold text-forest">{formatCurrency(recordedIncome)}</p></div>
          <div className="border border-border-soft bg-white p-5"><HandCoins size={19} className="text-accent" /><p className="mt-4 text-[0.66rem] font-bold uppercase tracking-[0.08em] text-muted">Kas di tangan Humas</p><p className="mt-2 text-xl font-extrabold text-charcoal">{formatCurrency(cashOnHumas)}</p></div>
          <div className="border border-border-soft bg-white p-5"><Landmark size={19} className="text-forest" /><p className="mt-4 text-[0.66rem] font-bold uppercase tracking-[0.08em] text-muted">Kas diterima kegiatan</p><p className="mt-2 text-xl font-extrabold text-charcoal">{formatCurrency(cashReceived)}</p></div>
          <div className="border border-border-soft bg-white p-5"><ArrowDownRight size={19} className="text-[#A74C45]" /><p className="mt-4 text-[0.66rem] font-bold uppercase tracking-[0.08em] text-muted">Pengeluaran total</p><p className="mt-2 text-xl font-extrabold text-charcoal">{formatCurrency(expenses)}</p></div>
          <div className="border border-border-soft bg-white p-5"><WalletCards size={19} className="text-forest" /><p className="mt-4 text-[0.66rem] font-bold uppercase tracking-[0.08em] text-muted">Saldo Kas Kegiatan</p><p className={`mt-2 text-xl font-extrabold ${activityCashBalance < 0 ? 'text-[#A74C45]' : 'text-forest'}`}>{formatCurrency(activityCashBalance)}</p></div>
          <div className="border border-border-soft bg-white p-5"><CircleDollarSign size={19} className="text-[#7A5B21]" /><p className="mt-4 text-[0.66rem] font-bold uppercase tracking-[0.08em] text-muted">Reimburse</p><p className="mt-2 text-xl font-extrabold text-[#7A5B21]">{formatCurrency(reimburseOutstanding)}</p></div>
        </section>

        {pending.length > 0 && <section className="mt-5 border border-[#E8D8B7] bg-[#FFF9EC]"><div className="flex items-center gap-3 border-b border-[#E8D8B7] px-5 py-4"><ShieldCheck size={18} className="text-[#7A5B21]" /><div><p className="text-sm font-extrabold text-charcoal">Perlu tindakan Admin</p><p className="text-xs text-muted">{pending.length} transaksi menunggu pemeriksaan. Klik sekali untuk melihat bukti dan mengambil keputusan.</p></div></div>{renderTransactionRows(pending.slice(0, 4))}</section>}

        <section className="mt-5 grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="border border-border-soft bg-white">
            <div className="border-b border-border-soft px-5 py-5 sm:px-6"><p className="eyebrow text-forest">RAB VS REALISASI</p><h2 className="mt-2 text-xl font-extrabold text-charcoal">{activity?.name ?? 'Kegiatan'}</h2><p className="mt-2 text-xs leading-relaxed text-muted">Realisasi hanya bertambah dari pengeluaran Terverifikasi dengan kategori RAB yang sama.</p></div>
            <div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="bg-warmwhite text-[0.65rem] uppercase tracking-[0.08em] text-muted"><tr><th className="px-5 py-3">Kategori</th><th className="px-5 py-3">Rencana</th><th className="px-5 py-3">Realisasi</th><th className="px-5 py-3">Selisih</th><th className="px-5 py-3">Aksi</th></tr></thead><tbody className="divide-y divide-border-soft">{budgetItems.map((item) => { const difference = item.plan - item.realized; return <tr key={item.id}><td className="px-5 py-4 font-bold text-charcoal">{item.category}</td><td className="px-5 py-4 text-muted">{formatCurrency(item.plan)}</td><td className="px-5 py-4 text-charcoal">{formatCurrency(item.realized)}</td><td className={`px-5 py-4 font-extrabold ${difference < 0 ? 'text-[#A74C45]' : 'text-forest'}`}>{difference < 0 ? '-' : '+'}{formatCurrency(Math.abs(difference))}</td><td className="px-5 py-4"><div className="flex gap-2"><button type="button" disabled={Boolean(activity?.financialLocked)} onClick={async () => { const next = window.prompt(`Ubah RAB ${item.category}`, String(item.plan)); if (next === null) return; const result = await updateBudgetItem(item.id, Number(next), actor); notify(result.message) }} className="text-xs font-extrabold text-forest disabled:text-muted">Ubah</button><button type="button" disabled={Boolean(activity?.financialLocked) || item.realized > 0} onClick={async () => { const result = await removeBudgetItem(item.id, actor); notify(result.message) }} className="text-[#93483F] disabled:text-muted" aria-label={`Hapus ${item.category}`}><Trash2 size={14} /></button></div></td></tr> })}</tbody><tfoot className="border-t border-border-soft bg-offwhite font-extrabold"><tr><td className="px-5 py-4">TOTAL</td><td className="px-5 py-4">{formatCurrency(planTotal)}</td><td className="px-5 py-4">{formatCurrency(realizedTotal)}</td><td className={`px-5 py-4 ${planTotal - realizedTotal < 0 ? 'text-[#A74C45]' : 'text-forest'}`}>{formatCurrency(planTotal - realizedTotal)}</td><td /></tr></tfoot></table></div>
            {budgetItems.some((item) => item.realized > item.plan) && <div className="border-t border-[#E8D8B7] bg-[#FFF9EC] px-5 py-4 text-xs font-semibold text-[#6F5830]">Peringatan: ada kategori yang melebihi RAB.</div>}
          </div>
          <div className="border border-border-soft bg-white"><div className="border-b border-border-soft px-5 py-5 sm:px-6"><p className="eyebrow text-forest">KAS PER HUMAS</p><h2 className="mt-2 text-xl font-extrabold text-charcoal">Uang yang masih di lapangan.</h2></div><div className="divide-y divide-border-soft">{humasCashRows.length > 0 ? humasCashRows.map((item) => <div key={item.id} className="px-5 py-4 sm:px-6"><div className="flex items-start justify-between gap-4"><div><p className="text-sm font-extrabold text-charcoal">{item.humas}</p><p className="mt-1 text-xs text-muted">{item.area} · {item.contributedResidents}/{item.assignedResidents} warga berkontribusi · Terkumpul {formatCurrency(item.collected)}</p>{item.latestReconciliation && <p className={`mt-1 text-[0.68rem] font-semibold ${item.latestReconciliation.difference === 0 ? 'text-forest' : 'text-[#93483F]'}`}>Tutup kas terakhir: fisik {formatCurrency(item.latestReconciliation.physicalAmount)} · selisih {formatCurrency(item.latestReconciliation.difference)}</p>}</div><p className="text-sm font-extrabold text-accent">{formatCurrency(item.cash)}</p></div></div>) : <p className="px-5 py-7 text-sm text-muted">Belum ada penugasan penarikan iuran pada kegiatan ini.</p>}</div><div className="border-t border-border-soft bg-warmwhite px-5 py-4 text-xs text-muted sm:px-6">Serah kas menunggu konfirmasi: <strong className="text-charcoal">{formatCurrency(pendingHandover)}</strong></div></div>
        </section>
      </>}

      {activeTab === 'iuran' && <section className="mt-5 border border-border-soft bg-white"><div className="border-b border-border-soft px-5 py-5 sm:px-6"><p className="eyebrow text-forest">IURAN SUKARELA</p><h2 className="mt-2 text-xl font-extrabold text-charcoal">Progress per Humas dan wilayah.</h2><p className="mt-2 text-xs text-muted">Tidak ada target rupiah. Yang dipantau adalah jumlah warga yang sudah berkontribusi, total terkumpul, dan kas yang masih di tangan Humas.</p></div><div className="grid gap-px bg-border-soft md:grid-cols-2 xl:grid-cols-3">{humasCashRows.map((item) => <div key={item.id} className="bg-white p-5"><p className="text-sm font-extrabold text-charcoal">{item.humas}</p><p className="mt-1 text-xs font-bold text-forest">{item.area}</p><div className="mt-4 grid grid-cols-2 gap-3"><div className="bg-warmwhite p-3"><p className="text-[0.62rem] uppercase tracking-[0.08em] text-muted">Kontribusi</p><p className="mt-1 text-base font-extrabold text-charcoal">{item.contributedResidents}/{item.assignedResidents}</p></div><div className="bg-warmwhite p-3"><p className="text-[0.62rem] uppercase tracking-[0.08em] text-muted">Terkumpul</p><p className="mt-1 text-base font-extrabold text-forest">{formatCurrency(item.collected)}</p></div></div><p className="mt-4 text-xs text-muted">Kas di tangan: <strong className="text-charcoal">{formatCurrency(item.cash)}</strong> · Sudah diserahkan: <strong className="text-charcoal">{formatCurrency(item.transferred)}</strong></p></div>)}</div></section>}

      {activeTab !== 'ringkasan' && activeTab !== 'iuran' && <section className="mt-5 border border-border-soft bg-white">
        <div className="flex flex-col gap-4 border-b border-border-soft px-5 py-5 sm:flex-row sm:items-end sm:justify-between sm:px-6">
          <div><p className="eyebrow text-forest">{activeTab === 'pembelanjaan' ? 'PEMBELANJAAN' : activeTab === 'serah-kas' ? 'SERAH KAS' : 'SEMUA TRANSAKSI'}</p><h2 className="mt-2 text-xl font-extrabold text-charcoal">{activeTab === 'transaksi' ? 'Jejak transaksi kegiatan.' : 'Data lengkap tanpa menu pemeriksaan terpisah.'}</h2></div>
          <label className="flex h-11 min-w-72 items-center border border-border-soft bg-offwhite px-3"><Search size={16} className="mr-2 text-muted" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari transaksi, Humas, bukti..." className="min-w-0 flex-1 bg-transparent text-sm outline-none" /></label>
        </div>
        {bulkSelectionEnabled && <div className="flex flex-col gap-3 border-b border-border-soft bg-warmwhite px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <label className={`flex items-center gap-3 text-sm font-extrabold ${bulkEligibleTransactions.length > 0 ? 'cursor-pointer text-charcoal' : 'text-muted'}`}>
            <input type="checkbox" checked={allEligibleMarked} disabled={bulkEligibleTransactions.length === 0 || bulkBusy} onChange={toggleMarkAll} className="h-4 w-4 accent-[#123D32]" />
            Tandai Semua <span className="text-xs font-semibold text-muted">({bulkEligibleTransactions.length} menunggu verifikasi)</span>
          </label>
          <div className="flex flex-wrap items-center gap-3"><span className="text-xs font-semibold text-muted">{markedEligibleTransactions.length} dipilih</span><button type="button" disabled={markedEligibleTransactions.length === 0 || bulkBusy || Boolean(activity?.financialLocked)} onClick={verifyMarkedTransactions} className="btn btn-primary disabled:cursor-not-allowed disabled:opacity-45"><Check size={16} /> {bulkBusy ? 'Memproses...' : activeTab === 'serah-kas' ? `Konfirmasi Dipilih (${markedEligibleTransactions.length})` : `Verifikasi Dipilih (${markedEligibleTransactions.length})`}</button></div>
        </div>}
        {renderTransactionRows(tabTransactions, bulkSelectionEnabled)}
      </section>}
    </InternalLayout>
  )
}
