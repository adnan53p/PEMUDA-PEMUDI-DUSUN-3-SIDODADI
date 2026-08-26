import { useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  BanknoteArrowDown,
  ChevronDown,
  CircleDollarSign,
  HandCoins,
  History,
  LockKeyhole,
  LoaderCircle,
  ReceiptText,
  UploadCloud,
  Search,
  WalletCards,
} from 'lucide-react'
import InternalLayout from '../../components/internal/InternalLayout'
import InternalNotice from '../../components/internal/InternalNotice'
import PrototypeModal from '../../components/internal/PrototypeModal'
import TransactionPdfActions from '../../components/internal/TransactionPdfActions'
import { useAuth } from '../../auth/AuthContext'
import type { ActivityPermission } from '../../auth/types'
import { formatCurrency } from '../../data/internal/workspaceData'
import { deleteExternalMedia, MEDIA_UPLOAD_CONFIGURED, uploadExternalMedia } from '../../data/mediaUploadService'
import { categoriesMatch, isRecordedIncome, transactionStatusLabel, useOperations } from '../../prototype/OperationsContext'

const actionItems: Array<{
  key: 'iuran' | 'belanja' | 'kas' | 'rekonsiliasi' | 'riwayat'
  label: string
  note: string
  icon: typeof HandCoins
  permission?: ActivityPermission
}> = [
  { key: 'iuran', label: 'Catat Iuran', note: 'Penarikan warga', icon: HandCoins, permission: 'collect_dues' },
  { key: 'belanja', label: 'Catat Belanja', note: 'Pembelian kegiatan', icon: ReceiptText, permission: 'record_purchases' },
  { key: 'kas', label: 'Serahkan Kas', note: 'Ke kas kegiatan', icon: BanknoteArrowDown, permission: 'handover_cash' },
  { key: 'rekonsiliasi', label: 'Tutup Kas', note: 'Cocokkan uang fisik', icon: WalletCards, permission: 'collect_dues' },
  { key: 'riwayat', label: 'Riwayat Saya', note: 'Aktivitas terakhir', icon: History },
]

const permissionLabels: Record<ActivityPermission, string> = {
  collect_dues: 'Penarikan Iuran',
  record_purchases: 'Pembelanjaan',
  handover_cash: 'Serah Terima Kas',
}

type ModalMode = 'iuran' | 'belanja' | 'kas' | 'rekonsiliasi' | 'riwayat' | 'correct' | null

export default function HumasWorkspace() {
  const { user } = useAuth()
  const { addTransaction, attachTransactionEvidence, transactions, collectionTargets, budgets, activities, correctIncomeTransaction, cancelTransactionWithReason, recordCashReconciliation, cashReconciliations } = useOperations()
  const [query, setQuery] = useState('')
  const [targetStatusFilter, setTargetStatusFilter] = useState('Semua')
  const [notice, setNotice] = useState('')
  const [modalMode, setModalMode] = useState<ModalMode>(null)
  const [selectedActivityId, setSelectedActivityId] = useState(() => user?.assignments[0]?.activityId ?? '')
  const [selectedTargetId, setSelectedTargetId] = useState('')
  const [iuranAmount, setIuranAmount] = useState('')
  const [purchaseName, setPurchaseName] = useState('')
  const [purchaseCategory, setPurchaseCategory] = useState('Konsumsi')
  const [purchaseVendor, setPurchaseVendor] = useState('')
  const [purchaseQuantity, setPurchaseQuantity] = useState('1')
  const [purchaseUnitPrice, setPurchaseUnitPrice] = useState('')
  const [purchasePaymentMethod, setPurchasePaymentMethod] = useState('Tunai')
  const [purchaseFundingSource, setPurchaseFundingSource] = useState<'Kas Kegiatan' | 'Kas Humas' | 'Uang Pribadi/Reimburse' | 'Uang Muka' | 'Lainnya'>('Kas Kegiatan')
  const [purchaseEvidenceFile, setPurchaseEvidenceFile] = useState<File | null>(null)
  const [purchaseBusy, setPurchaseBusy] = useState(false)
  const [handoverAmount, setHandoverAmount] = useState('')
  const [correctionId, setCorrectionId] = useState('')
  const [correctionAmount, setCorrectionAmount] = useState('')
  const [correctionReason, setCorrectionReason] = useState('')
  const [physicalCash, setPhysicalCash] = useState('')
  const [reconciliationNote, setReconciliationNote] = useState('')

  useEffect(() => {
    if (!user?.assignments.length) {
      setSelectedActivityId('')
      return
    }
    if (!user.assignments.some((assignment) => assignment.activityId === selectedActivityId)) {
      setSelectedActivityId(user.assignments[0].activityId)
    }
  }, [selectedActivityId, user])

  const assignment = useMemo(
    () => user?.assignments.find((item) => item.activityId === selectedActivityId) ?? user?.assignments[0],
    [selectedActivityId, user],
  )

  const myTransactions = transactions.filter((item) => item.activityId === assignment?.activityId && item.createdByUserId === user?.id)
  const recordedIncome = myTransactions.filter(isRecordedIncome).reduce((sum, item) => sum + item.amount, 0)
  const verifiedHandover = myTransactions.filter((item) => item.kind === 'handover' && item.status === 'Terverifikasi').reduce((sum, item) => sum + item.amount, 0)
  const displayCollected = recordedIncome
  const spentFromHumasCash = myTransactions.filter((item) => item.kind === 'expense' && item.status === 'Terverifikasi' && item.fundingSource === 'Kas Humas').reduce((sum, item) => sum + item.amount, 0)
  const displayCashOnHand = Math.max(0, recordedIncome - verifiedHandover - spentFromHumasCash)
  const canCollect = Boolean(assignment?.permissions.includes('collect_dues'))
  const canPurchase = Boolean(assignment?.permissions.includes('record_purchases'))
  const canHandover = canCollect && Boolean(assignment?.permissions.includes('handover_cash'))
  const currentActivity = activities.find((item) => item.id === assignment?.activityId)
  const myExpenses = myTransactions.filter((item) => item.kind === 'expense')
  const verifiedExpenses = myExpenses.filter((item) => item.status === 'Terverifikasi').reduce((sum, item) => sum + item.amount, 0)
  const pendingExpenses = myExpenses.filter((item) => item.status === 'Menunggu Verifikasi').reduce((sum, item) => sum + item.amount, 0)
  const evidenceCount = myExpenses.filter((item) => Boolean(item.evidenceName)).length

  const assignedTargets = collectionTargets.filter((target) => canCollect && target.assignmentId === assignment?.id)
  const filteredTargets = assignedTargets.filter((target) => target.name.toLowerCase().includes(query.trim().toLowerCase()))

  const targetState = (targetId: string) => {
    const related = transactions.filter((item) => item.targetId === targetId && item.status !== 'Ditolak' && item.status !== 'Dibatalkan')
    const received = related.filter(isRecordedIncome).reduce((sum, item) => sum + item.amount, 0)
    const status = received > 0 ? 'Sudah Berkontribusi' : 'Belum Berkontribusi'
    return { received, status }
  }

  const displayTargets = filteredTargets.filter((target) => targetStatusFilter === 'Semua' || targetState(target.id).status === targetStatusFilter)

  const selectedTarget = collectionTargets.find((target) => target.id === selectedTargetId && target.assignmentId === assignment?.id)
  const selectableTargets = assignedTargets.filter((target) => targetState(target.id).status !== 'Sudah Berkontribusi')
  const contributedCount = assignedTargets.filter((target) => targetState(target.id).status === 'Sudah Berkontribusi').length
  const participationProgress = assignedTargets.length > 0 ? Math.round((contributedCount / assignedTargets.length) * 100) : 0

  const purchaseCategories = useMemo(() => Array.from(new Set([
    ...budgets.filter((item) => item.activityId === assignment?.activityId).map((item) => item.category),
    'Konsumsi', 'Perlengkapan', 'Transportasi', 'Hadiah', 'Dokumentasi', 'Operasional', 'Lainnya',
  ])), [assignment?.activityId, budgets])
  const purchaseTotal = Math.max(0, Number(purchaseQuantity) || 0) * Math.max(0, Number(purchaseUnitPrice) || 0)
  const filteredHistory = myTransactions
  const pendingHandoverAmount = myTransactions.filter((item) => item.kind === 'handover' && item.status === 'Menunggu Verifikasi').reduce((sum, item) => sum + item.amount, 0)
  const availableCashToHandover = Math.max(0, displayCashOnHand - pendingHandoverAmount)
  const permissionLabel = assignment?.permissions.filter((permission) => permission !== 'handover_cash' || canCollect).map((permission) => permissionLabels[permission]).join(' · ')
  const visibleActionItems = actionItems.filter((item) => (item.key === 'kas' || item.key === 'rekonsiliasi') ? canCollect : true)

  useEffect(() => {
    if (!assignment) return
    const firstBudgetCategory = budgets.find((item) => item.activityId === assignment.activityId)?.category
    if (firstBudgetCategory && !purchaseCategories.includes(purchaseCategory)) setPurchaseCategory(firstBudgetCategory)
  }, [assignment, budgets, purchaseCategory, purchaseCategories])

  const saveReconciliation = async (event: FormEvent) => {
    event.preventDefault()
    if (!canCollect) {
      showNotice('Tutup Kas hanya tersedia untuk Humas penarikan iuran.')
      setModalMode(null)
      return
    }
    if (!assignment || !user) return
    const result = await recordCashReconciliation({
      activityId: assignment.activityId,
      assignmentId: assignment.id,
      humasUserId: user.id,
      humasName: user.fullName,
      expectedAmount: displayCashOnHand,
      physicalAmount: Number(physicalCash) || 0,
      note: reconciliationNote,
    }, { userId: user.id, name: user.fullName, role: user.role })
    showNotice(result.message)
    if (result.ok) {
      setPhysicalCash('')
      setReconciliationNote('')
      setModalMode(null)
    }
  }

  const showNotice = (message: string) => {
    setNotice(message)
    window.setTimeout(() => setNotice(''), 3200)
  }

  const openAction = (key: ModalMode, label: string, permission?: ActivityPermission) => {
    if (key === 'kas' && !canHandover) {
      showNotice('Serahkan Kas hanya tersedia untuk Humas penarikan iuran yang memegang kas lapangan.')
      return
    }
    if (key === 'rekonsiliasi' && !canCollect) {
      showNotice('Tutup Kas hanya tersedia untuk Humas penarikan iuran.')
      return
    }
    if (permission && !assignment?.permissions.includes(permission)) {
      showNotice(`${label} tidak diizinkan untuk penugasan kegiatan ini.`)
      return
    }
    if (key === 'rekonsiliasi') {
      setPhysicalCash(String(displayCashOnHand))
      setReconciliationNote('')
    }
    if (key === 'iuran') {
      const first = selectableTargets[0]
      setSelectedTargetId(first?.id ?? '')
      setIuranAmount('')
    }
    setModalMode(key)
  }

  const saveIuran = async (event: FormEvent) => {
    event.preventDefault()
    if (!assignment || !user || !selectedTarget || Number(iuranAmount) <= 0) return
    const result = await addTransaction({
      activityId: assignment.activityId,
      activityName: assignment.activityName,
      kind: 'income',
      label: `Iuran ${selectedTarget.name}`,
      category: 'Iuran',
      amount: Number(iuranAmount),
      createdBy: { userId: user.id, name: user.fullName, role: user.role },
      assignmentId: assignment.id,
      targetId: selectedTarget.id,
      areaLabel: assignment.areaLabel,
    })
    if (!result.ok) {
      showNotice(result.message)
      return
    }
    setModalMode(null)
    setSelectedTargetId('')
    setIuranAmount('')
    showNotice('Iuran langsung tercatat sebagai Diterima Humas, status warga menjadi Sudah Berkontribusi, dan nominal masuk Kas di Tangan Humas.')
  }

  const savePurchase = async (event: FormEvent) => {
    event.preventDefault()
    if (!assignment || !user || !purchaseName.trim() || purchaseTotal <= 0 || purchaseBusy) return
    if (purchaseEvidenceFile && !MEDIA_UPLOAD_CONFIGURED) {
      showNotice('Layanan unggah bukti belum tersedia. Hubungi pengelola website.')
      return
    }

    setPurchaseBusy(true)
    try {
      const result = await addTransaction({
        activityId: assignment.activityId,
        activityName: assignment.activityName,
        kind: 'expense',
        label: purchaseName.trim(),
        category: purchaseCategory,
        amount: purchaseTotal,
        createdBy: { userId: user.id, name: user.fullName, role: user.role },
        assignmentId: assignment.id,
        areaLabel: assignment.areaLabel,
        vendor: purchaseVendor.trim() || undefined,
        quantity: Number(purchaseQuantity) || undefined,
        unitPrice: Number(purchaseUnitPrice) || undefined,
        paymentMethod: purchasePaymentMethod,
        fundingSource: purchaseFundingSource,
      })
      if (!result.ok) {
        showNotice(result.message)
        return
      }

      let evidenceMessage = ''
      if (purchaseEvidenceFile && result.id) {
        let uploadedFileId = ''
        try {
          const uploaded = await uploadExternalMedia({
            file: purchaseEvidenceFile,
            scope: 'transaction-evidence',
            activityId: assignment.activityId,
            transactionId: result.id,
          })
          uploadedFileId = uploaded.externalFileId
          const attachResult = await attachTransactionEvidence(result.id, {
            title: purchaseEvidenceFile.name,
            url: uploaded.url,
            mimeType: purchaseEvidenceFile.type,
            externalFileId: uploaded.externalFileId,
          }, { userId: user.id, name: user.fullName, role: user.role })
          if (!attachResult.ok) {
            try { await deleteExternalMedia({ externalFileId: uploadedFileId, scope: 'transaction-evidence', activityId: assignment.activityId, transactionId: result.id }) } catch { /* cleanup best effort */ }
            evidenceMessage = ` Transaksi tersimpan, tetapi bukti gagal ditautkan: ${attachResult.message}`
          } else {
            evidenceMessage = ' Bukti transaksi juga berhasil dilampirkan.'
          }
        } catch (error) {
          evidenceMessage = ` Transaksi tersimpan, tetapi upload bukti gagal: ${error instanceof Error ? error.message : 'kesalahan upload'}`
        }
      }

      setModalMode(null)
      setPurchaseName('')
      setPurchaseVendor('')
      setPurchaseQuantity('1')
      setPurchaseUnitPrice('')
      setPurchaseEvidenceFile(null)
      showNotice(`Pembelanjaan berhasil disimpan. Setelah diverifikasi Admin, nominal otomatis menjadi realisasi RAB sesuai kategori.${evidenceMessage}`)
    } finally {
      setPurchaseBusy(false)
    }
  }

  const saveHandover = async (event: FormEvent) => {
    event.preventDefault()
    if (!canHandover) {
      showNotice('Penugasan pembelanjaan tidak memiliki alur Serahkan Kas. Serah kas hanya untuk Humas penarikan iuran.')
      setModalMode(null)
      return
    }
    if (!assignment || !user || Number(handoverAmount) <= 0 || Number(handoverAmount) > availableCashToHandover) return
    const result = await addTransaction({
      activityId: assignment.activityId,
      activityName: assignment.activityName,
      kind: 'handover',
      label: `Serah terima kas ${assignment.areaLabel ?? ''}`.trim(),
      category: 'Serah Terima Kas',
      amount: Number(handoverAmount),
      createdBy: { userId: user.id, name: user.fullName, role: user.role },
      assignmentId: assignment.id,
      areaLabel: assignment.areaLabel,
    })
    if (!result.ok) {
      showNotice(result.message)
      return
    }
    setModalMode(null)
    setHandoverAmount('')
    showNotice('Serah kas diajukan. Kas Kegiatan baru bertambah setelah Admin memverifikasi.')
  }

  const openTargetIuran = (targetId: string) => {
    if (!canCollect) {
      showNotice('Catat Iuran tidak diizinkan pada kegiatan ini.')
      return
    }
    const state = targetState(targetId)
    if (state.status === 'Sudah Berkontribusi') {
      showNotice('Iuran warga ini sudah tercatat. Gunakan fitur Koreksi jika nominal sebelumnya salah.')
      return
    }
    setSelectedTargetId(targetId)
    setIuranAmount('')
    setModalMode('iuran')
  }

  const openCorrection = (transactionId: string, amount: number) => {
    setCorrectionId(transactionId)
    setCorrectionAmount(String(amount))
    setCorrectionReason('')
    setModalMode('correct')
  }

  const submitCorrection = async (event: FormEvent) => {
    event.preventDefault()
    if (!user) return
    const result = await correctIncomeTransaction(correctionId, Number(correctionAmount) || 0, correctionReason, { userId: user.id, name: user.fullName, role: user.role })
    showNotice(result.message)
    if (result.ok) setModalMode(null)
  }

  const cancelIncome = async () => {
    if (!user) return
    const result = await cancelTransactionWithReason(correctionId, correctionReason, { userId: user.id, name: user.fullName, role: user.role })
    showNotice(result.message)
    if (result.ok) setModalMode(null)
  }


  return (
    <InternalLayout title="Ruang Kerja Humas" subtitle="Untuk penarikan iuran, belanja, dan serah terima kas di lapangan.">
      <div className="mx-auto max-w-5xl">
        <InternalNotice />
        {currentActivity?.financialLocked && <div className="mt-4 border border-[#D7B4B0] bg-[#FFF3F1] px-4 py-3 text-xs font-semibold text-[#8A473E]">Kegiatan sudah selesai dan LPJ disahkan. Pencatatan transaksi baru dikunci sampai Admin membuka kembali kegiatan untuk koreksi.</div>}

        {notice && (
          <div role="status" className="fixed inset-x-4 bottom-5 z-50 mx-auto max-w-md rounded-md bg-charcoal px-4 py-3 text-center text-sm font-semibold text-offwhite shadow-xl sm:left-auto sm:right-6 sm:mx-0">
            {notice}
          </div>
        )}

        <PrototypeModal open={modalMode === 'iuran'} onClose={() => setModalMode(null)} title="Catat Iuran" description="Pilih warga dari daftar penugasan Admin lalu masukkan nominal kontribusi yang diterima. Iuran bersifat sukarela dan tidak memiliki nominal wajib.">
          <form onSubmit={saveIuran} className="space-y-4">
            <div className="border border-forest/15 bg-sage/35 p-4 text-xs leading-relaxed text-muted">Dicatat oleh: <strong className="text-charcoal">{user?.fullName}</strong><br />Identitas penginput berasal dari akun login dan tidak dapat dipilih manual.</div>
            <label className="block">
              <span className="text-xs font-extrabold uppercase tracking-[0.08em] text-muted">Warga / Keluarga</span>
              <select required value={selectedTargetId} onChange={(event) => { setSelectedTargetId(event.target.value); setIuranAmount('') }} className="mt-2 h-12 w-full border border-border-soft bg-white px-3 text-sm font-semibold outline-none focus:border-forest">
                <option value="">Pilih warga / keluarga</option>
                {selectableTargets.map((target) => <option key={target.id} value={target.id}>{target.name} · {target.area}</option>)}
              </select>
            </label>
            <label className="block"><span className="text-xs font-extrabold uppercase tracking-[0.08em] text-muted">Nominal</span><input required type="number" min="1" value={iuranAmount} onChange={(event) => setIuranAmount(event.target.value)} className="mt-2 h-12 w-full border border-border-soft bg-white px-3 text-sm font-bold outline-none focus:border-forest" /></label>
            {selectedTarget && <div className="border border-border-soft bg-white p-4 text-xs leading-relaxed text-muted">Warga: <strong className="text-charcoal">{selectedTarget.name}</strong><br />Wilayah: <strong className="text-charcoal">{selectedTarget.area}</strong><br />Iuran bersifat sukarela; masukkan nominal yang benar-benar diterima.</div>}
            <div className="border border-forest/15 bg-sage/35 p-4 text-xs leading-relaxed text-muted">Kegiatan: <strong className="text-charcoal">{assignment?.activityName}</strong><br />Wilayah: <strong className="text-charcoal">{assignment?.areaLabel ?? '-'}</strong></div>
            <button type="submit" disabled={!selectedTargetId} className="btn btn-primary w-full justify-center disabled:cursor-not-allowed disabled:opacity-45">Simpan Iuran</button>
          </form>
        </PrototypeModal>

        <PrototypeModal open={modalMode === 'belanja'} onClose={() => setModalMode(null)} title="Catat Pembelanjaan" description="Kategori belanja menghubungkan transaksi langsung ke realisasi RAB setelah diverifikasi Admin.">
          <form onSubmit={savePurchase} className="space-y-4">
            <div className="border border-forest/15 bg-sage/35 p-4 text-xs leading-relaxed text-muted">Dicatat oleh: <strong className="text-charcoal">{user?.fullName}</strong><br />Laporan pembelanjaan otomatis memakai identitas akun ini.</div>
            <label className="block"><span className="text-xs font-extrabold uppercase tracking-[0.08em] text-muted">Nama pembelian</span><input required value={purchaseName} onChange={(event) => setPurchaseName(event.target.value)} placeholder="Contoh: Air mineral panitia" className="mt-2 h-12 w-full border border-border-soft bg-white px-3 text-sm outline-none focus:border-forest" /></label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block"><span className="text-xs font-extrabold uppercase tracking-[0.08em] text-muted">Kategori RAB</span><select value={purchaseCategory} onChange={(event) => setPurchaseCategory(event.target.value)} className="mt-2 h-12 w-full border border-border-soft bg-white px-3 text-sm font-semibold outline-none focus:border-forest">{purchaseCategories.map((item) => <option key={item}>{item}</option>)}</select></label>
              <label className="block"><span className="text-xs font-extrabold uppercase tracking-[0.08em] text-muted">Toko / Vendor</span><input value={purchaseVendor} onChange={(event) => setPurchaseVendor(event.target.value)} placeholder="Nama toko/vendor" className="mt-2 h-12 w-full border border-border-soft bg-white px-3 text-sm outline-none focus:border-forest" /></label>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block"><span className="text-xs font-extrabold uppercase tracking-[0.08em] text-muted">Jumlah</span><input required type="number" min="1" value={purchaseQuantity} onChange={(event) => setPurchaseQuantity(event.target.value)} className="mt-2 h-12 w-full border border-border-soft bg-white px-3 text-sm font-bold outline-none focus:border-forest" /></label>
              <label className="block"><span className="text-xs font-extrabold uppercase tracking-[0.08em] text-muted">Harga satuan</span><input required type="number" min="1" value={purchaseUnitPrice} onChange={(event) => setPurchaseUnitPrice(event.target.value)} placeholder="0" className="mt-2 h-12 w-full border border-border-soft bg-white px-3 text-sm font-bold outline-none focus:border-forest" /></label>
            </div>
            <div className="border border-border-soft bg-warmwhite p-4"><p className="text-xs font-semibold text-muted">Total otomatis</p><p className="mt-1 text-xl font-extrabold text-charcoal">{formatCurrency(purchaseTotal)}</p></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block"><span className="text-xs font-extrabold uppercase tracking-[0.08em] text-muted">Metode pembayaran</span><select value={purchasePaymentMethod} onChange={(event) => setPurchasePaymentMethod(event.target.value)} className="mt-2 h-12 w-full border border-border-soft bg-white px-3 text-sm font-semibold outline-none focus:border-forest"><option>Tunai</option><option>Transfer</option><option>QRIS</option><option>Lainnya</option></select></label>
              <label className="block"><span className="text-xs font-extrabold uppercase tracking-[0.08em] text-muted">Sumber dana</span><select value={purchaseFundingSource} onChange={(event) => setPurchaseFundingSource(event.target.value as typeof purchaseFundingSource)} className="mt-2 h-12 w-full border border-border-soft bg-white px-3 text-sm font-semibold outline-none focus:border-forest"><option>Kas Kegiatan</option><option>Kas Humas</option><option>Uang Pribadi/Reimburse</option><option>Uang Muka</option><option>Lainnya</option></select></label>
            </div><label className="block"><span className="text-xs font-extrabold uppercase tracking-[0.08em] text-muted">Bukti transaksi (opsional)</span><div className="mt-2 flex min-h-12 items-center gap-3 border border-dashed border-border-soft bg-white px-3 py-2"><UploadCloud size={18} className="text-forest" /><input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={(event) => setPurchaseEvidenceFile(event.target.files?.[0] ?? null)} className="min-w-0 flex-1 text-xs text-muted" /></div><p className="mt-1 text-[0.68rem] text-muted">JPG/PNG/WebP/PDF, maksimal 8 MB. Bukti hanya dapat diakses oleh pengurus yang berwenang.</p></label><div className="grid gap-4 sm:grid-cols-1">
            </div>
            {(() => { const budget = budgets.find((item) => item.activityId === assignment?.activityId && categoriesMatch(item.category, purchaseCategory)); return budget && budget.realized + purchaseTotal > budget.plan ? <div className="border border-[#E8D8B7] bg-[#FFF9EC] p-3 text-xs font-semibold text-[#6F5830]">Peringatan: jika pembelian ini diverifikasi, realisasi {purchaseCategory} akan melebihi RAB sebesar {formatCurrency((budget.realized + purchaseTotal) - budget.plan)}.</div> : null })()}<button type="submit" disabled={Boolean(currentActivity?.financialLocked) || purchaseBusy} className="btn btn-primary w-full justify-center disabled:opacity-40">{purchaseBusy ? <><LoaderCircle size={16} className="animate-spin" /> Menyimpan...</> : 'Simpan Pembelanjaan'}</button>
          </form>
        </PrototypeModal>

        <PrototypeModal open={modalMode === 'correct'} onClose={() => setModalMode(null)} title="Koreksi / Batalkan Iuran" description="Transaksi lama tidak dihapus. Koreksi membuat transaksi pengganti dan menyimpan jejak alasan.">
          <form onSubmit={submitCorrection} className="space-y-4"><label className="block"><span className="text-xs font-extrabold uppercase tracking-[0.08em] text-muted">Nominal yang benar</span><input required type="number" min="1" value={correctionAmount} onChange={(event)=>setCorrectionAmount(event.target.value)} className="mt-2 h-12 w-full border border-border-soft bg-white px-3 text-sm font-bold"/></label><label className="block"><span className="text-xs font-extrabold uppercase tracking-[0.08em] text-muted">Alasan wajib</span><textarea required value={correctionReason} onChange={(event)=>setCorrectionReason(event.target.value)} rows={3} className="mt-2 w-full border border-border-soft bg-white px-3 py-3 text-sm"/></label><div className="grid gap-2 sm:grid-cols-2"><button type="button" onClick={cancelIncome} className="btn btn-secondary justify-center text-[#93483F]">Batalkan Transaksi</button><button type="submit" className="btn btn-primary justify-center">Simpan Koreksi</button></div></form>
        </PrototypeModal>

        <PrototypeModal open={modalMode === 'kas' && canHandover} onClose={() => setModalMode(null)} title="Serahkan Kas" description="Uang masih dianggap Kas di Tangan Humas sampai Admin mengonfirmasi serah terima.">
          <form onSubmit={saveHandover} className="space-y-4">
            <div className="border border-border-soft bg-white p-4"><p className="text-xs text-muted">Kas di tangan saat ini</p><p className="mt-2 text-xl font-extrabold text-charcoal">{formatCurrency(availableCashToHandover)}</p><p className="mt-1 text-[0.68rem] text-muted">Sudah diajukan dan menunggu verifikasi: {formatCurrency(pendingHandoverAmount)}</p></div>
            <label className="block"><span className="text-xs font-extrabold uppercase tracking-[0.08em] text-muted">Nominal diserahkan</span><input required type="number" min="1" max={availableCashToHandover || undefined} value={handoverAmount} onChange={(event) => setHandoverAmount(event.target.value)} placeholder="0" className="mt-2 h-12 w-full border border-border-soft bg-white px-3 text-sm font-bold outline-none focus:border-forest" /></label>
            <button type="submit" className="btn btn-primary w-full justify-center">Ajukan Serah Terima</button>
          </form>
        </PrototypeModal>

        <PrototypeModal open={modalMode === 'rekonsiliasi' && canCollect} onClose={() => setModalMode(null)} title="Tutup Kas Humas" description="Cocokkan saldo menurut sistem dengan uang fisik yang benar-benar dipegang. Rekonsiliasi tidak memindahkan uang ke Kas Kegiatan.">
          <form onSubmit={saveReconciliation} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2"><div className="border border-border-soft bg-warmwhite p-4"><p className="text-[0.65rem] font-extrabold uppercase tracking-[0.08em] text-muted">Menurut Sistem</p><p className="mt-2 text-lg font-extrabold text-forest">{formatCurrency(displayCashOnHand)}</p></div><div className="border border-border-soft bg-warmwhite p-4"><p className="text-[0.65rem] font-extrabold uppercase tracking-[0.08em] text-muted">Rekonsiliasi Terakhir</p><p className="mt-2 text-sm font-extrabold text-charcoal">{cashReconciliations.find((item) => item.assignmentId === assignment?.id)?.createdAt ? new Date(cashReconciliations.find((item) => item.assignmentId === assignment?.id)!.createdAt).toLocaleString('id-ID') : 'Belum ada'}</p></div></div>
            <label className="block"><span className="text-xs font-extrabold uppercase tracking-[0.08em] text-muted">Uang fisik saat ini</span><input required type="number" min="0" value={physicalCash} onChange={(event) => setPhysicalCash(event.target.value)} className="mt-2 h-12 w-full border border-border-soft bg-white px-3 text-sm font-bold outline-none focus:border-forest" /></label>
            <div className={`border p-4 text-sm font-extrabold ${(Number(physicalCash) || 0) === displayCashOnHand ? 'border-sage bg-sage/25 text-forest' : 'border-[#E8D8B7] bg-[#FFF9EC] text-[#6F5830]'}`}>Selisih: {formatCurrency((Number(physicalCash) || 0) - displayCashOnHand)}</div>
            <label className="block"><span className="text-xs font-extrabold uppercase tracking-[0.08em] text-muted">Catatan opsional</span><textarea rows={3} value={reconciliationNote} onChange={(event) => setReconciliationNote(event.target.value)} className="mt-2 w-full border border-border-soft bg-white px-3 py-3 text-sm outline-none focus:border-forest" /></label>
            <button type="submit" className="btn btn-primary w-full justify-center">Simpan Tutup Kas</button>
          </form>
        </PrototypeModal>

        <PrototypeModal open={modalMode === 'riwayat'} onClose={() => setModalMode(null)} title="Riwayat Saya" description="Riwayat hanya untuk akun Humas dan kegiatan yang sedang dipilih.">
          <div className="divide-y divide-border-soft border border-border-soft bg-white">{filteredHistory.length > 0 ? filteredHistory.map((item) => <div key={item.id} className="p-4"><div className="flex items-start justify-between gap-4"><div><p className="text-sm font-extrabold text-charcoal">{item.label}</p><p className="mt-1 text-xs text-muted">{item.category} · {item.date}</p></div><p className="text-sm font-extrabold text-forest">{formatCurrency(item.amount)}</p></div><div className="mt-2 flex flex-wrap items-center justify-between gap-2"><p className="text-[0.65rem] font-bold uppercase tracking-[0.08em] text-muted">{transactionStatusLabel(item)}</p><TransactionPdfActions transaction={item} compact /></div></div>) : <p className="p-5 text-sm text-muted">Belum ada riwayat.</p>}</div>
        </PrototypeModal>

        {user && user.assignments.length > 1 && (
          <section className="mt-6 border border-border-soft bg-white p-4 sm:p-5">
            <div className="grid gap-3 sm:grid-cols-[1fr_minmax(260px,0.8fr)] sm:items-center">
              <div>
                <p className="eyebrow text-forest">PENUGASAN SAYA</p>
                <p className="mt-2 text-sm font-semibold text-muted">Pilih kegiatan sebelum mencatat aktivitas lapangan. Data dan izin selalu mengikuti kegiatan yang dipilih.</p>
              </div>
              <label className="relative block">
                <span className="sr-only">Pilih kegiatan</span>
                <select value={assignment?.activityId ?? ''} onChange={(event) => { setSelectedActivityId(event.target.value); setQuery('') }} className="h-12 w-full appearance-none border border-border-soft bg-offwhite px-4 pr-11 text-sm font-extrabold text-charcoal outline-none focus:border-forest">
                  {user.assignments.map((item) => <option key={item.activityId} value={item.activityId}>{item.activityName}</option>)}
                </select>
                <ChevronDown size={17} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted" />
              </label>
            </div>
          </section>
        )}

        <section className="mt-6 overflow-hidden bg-forest-deep text-offwhite">
          <div className="px-5 py-6 sm:px-7 sm:py-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between"><div><p className="eyebrow text-sage">KEGIATAN AKTIF</p><h2 className="mt-3 max-w-2xl text-2xl font-extrabold leading-tight sm:text-3xl">{assignment?.activityName ?? 'Belum ada penugasan kegiatan'}</h2><p className="mt-3 text-sm text-offwhite/65">{assignment?.areaLabel ? `Wilayah / tugas: ${assignment.areaLabel}` : 'Penugasan ditentukan Admin per kegiatan.'}</p></div><span className="w-fit bg-sage px-3 py-1.5 text-[0.68rem] font-extrabold uppercase tracking-[0.1em] text-forest">{assignment ? 'Penugasan Aktif' : 'Belum ada kegiatan'}</span></div>
            {canCollect ? (
              <>
                <div className="mt-8 grid grid-cols-2 border-y border-white/15 sm:grid-cols-4">
                  <div className="border-b border-white/15 py-4 pr-3 sm:border-b-0"><p className="text-[0.65rem] font-bold uppercase tracking-[0.1em] text-offwhite/50">Warga Ditugaskan</p><p className="mt-2 text-lg font-extrabold sm:text-xl">{assignedTargets.length}</p></div>
                  <div className="border-b border-l border-white/15 py-4 pl-4 sm:border-b-0 sm:px-4"><p className="text-[0.65rem] font-bold uppercase tracking-[0.1em] text-offwhite/50">Sudah Kontribusi</p><p className="mt-2 text-lg font-extrabold text-sage sm:text-xl">{contributedCount}</p></div>
                  <div className="py-4 pr-3 sm:border-l sm:border-white/15 sm:px-4"><p className="text-[0.65rem] font-bold uppercase tracking-[0.1em] text-offwhite/50">Terkumpul</p><p className="mt-2 text-lg font-extrabold text-sage sm:text-xl">{formatCurrency(displayCollected)}</p></div>
                  <div className="border-l border-white/15 py-4 pl-4 sm:px-4"><p className="text-[0.65rem] font-bold uppercase tracking-[0.1em] text-offwhite/50">Di Tangan Saya</p><p className="mt-2 text-lg font-extrabold text-[#F2C97D] sm:text-xl">{formatCurrency(displayCashOnHand)}</p></div>
                </div>
                <div className="mt-6">
                  <div className="flex items-center justify-between gap-3 text-xs font-semibold text-offwhite/60">
                    <span>Partisipasi warga</span>
                    <span>{contributedCount}/{assignedTargets.length} · {participationProgress}%</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden bg-white/12">
                    <div className="h-full bg-sage" style={{ width: `${participationProgress}%` }} />
                  </div>
                  <p className="mt-2 text-[0.68rem] text-offwhite/50">Iuran bersifat sukarela; progress dihitung dari jumlah warga yang sudah berkontribusi, bukan target rupiah.</p>
                </div>
              </>
            ) : canPurchase ? (
              <div className="mt-8 grid grid-cols-2 border-y border-white/15 sm:grid-cols-4">
                <div className="border-b border-white/15 py-4 pr-3 sm:border-b-0"><p className="text-[0.65rem] font-bold uppercase tracking-[0.1em] text-offwhite/50">Tugas</p><p className="mt-2 text-lg font-extrabold sm:text-xl">Pembelanjaan</p></div>
                <div className="border-b border-l border-white/15 py-4 pl-4 sm:border-b-0 sm:px-4"><p className="text-[0.65rem] font-bold uppercase tracking-[0.1em] text-offwhite/50">Terverifikasi</p><p className="mt-2 text-lg font-extrabold text-sage sm:text-xl">{formatCurrency(verifiedExpenses)}</p></div>
                <div className="py-4 pr-3 sm:border-l sm:border-white/15 sm:px-4"><p className="text-[0.65rem] font-bold uppercase tracking-[0.1em] text-offwhite/50">Menunggu</p><p className="mt-2 text-lg font-extrabold text-[#F2C97D] sm:text-xl">{formatCurrency(pendingExpenses)}</p></div>
                <div className="border-l border-white/15 py-4 pl-4 sm:px-4"><p className="text-[0.65rem] font-bold uppercase tracking-[0.1em] text-offwhite/50">Bukti Tercatat</p><p className="mt-2 text-lg font-extrabold sm:text-xl">{evidenceCount}</p></div>
              </div>
            ) : null}
          </div>
        </section>

        <section className={`mt-5 grid grid-cols-2 gap-3 ${canCollect ? 'sm:grid-cols-5' : 'sm:grid-cols-3'}`}>
          {visibleActionItems.map((item) => {
            const Icon = item.icon
            const permissionAllowed = item.key === 'kas' ? canHandover : (!item.permission || Boolean(assignment?.permissions.includes(item.permission)))
            const allowed = permissionAllowed && (!currentActivity?.financialLocked || item.key === 'riwayat')
            return <button key={item.key} type="button" onClick={() => openAction(item.key, item.label, item.permission)} aria-disabled={!allowed} className={`min-h-32 border p-4 text-left transition-transform sm:min-h-36 sm:p-5 ${allowed ? 'border-border-soft bg-white hover:-translate-y-0.5 hover:border-forest/35' : 'cursor-not-allowed border-border-soft bg-warmwhite opacity-55'}`}><span className="flex h-10 w-10 items-center justify-center rounded-full bg-sage/60 text-forest">{allowed ? <Icon size={19} /> : <LockKeyhole size={18} />}</span><p className="mt-5 text-sm font-extrabold text-charcoal sm:text-base">{item.label}</p><p className="mt-1 text-xs text-muted">{allowed ? item.note : 'Tidak diizinkan'}</p></button>
          })}
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="border border-border-soft bg-white">
            <div className="border-b border-border-soft px-4 py-5 sm:px-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="eyebrow text-forest">{canCollect ? 'DAFTAR WARGA IURAN' : 'TUGAS SAYA'}</p>
                  <h2 className="mt-2 text-xl font-extrabold text-charcoal">{canCollect ? `Wilayah saya · ${assignment?.areaLabel ?? '-'}` : 'Pembelanjaan kegiatan'}</h2>
                </div>
                {canCollect && <div className="flex flex-col gap-2 sm:flex-row"><label className="flex h-10 items-center border border-border-soft bg-offwhite px-3 sm:w-60"><Search size={16} className="mr-2 text-muted" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari nama" className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted/65" /></label><select value={targetStatusFilter} onChange={(event) => setTargetStatusFilter(event.target.value)} className="h-10 border border-border-soft bg-offwhite px-3 text-xs font-bold text-charcoal outline-none focus:border-forest"><option>Semua</option><option>Belum Berkontribusi</option><option>Sudah Berkontribusi</option></select></div>}
              </div>
            </div>
            {canCollect ? (
              <div className="divide-y divide-border-soft">
                {displayTargets.length > 0 ? displayTargets.map((target) => {
                  const state = targetState(target.id)
                  const locked = state.status === 'Sudah Berkontribusi'
                  const statusClass = locked ? 'bg-sage/65 text-forest' : 'bg-warmwhite text-muted'
                  return (
                    <div key={target.id} className="grid gap-3 px-4 py-4 sm:grid-cols-[1fr_auto_auto] sm:items-center sm:px-6">
                      <div><p className="text-sm font-extrabold text-charcoal">{target.name}</p><p className="mt-1 text-xs text-muted">{target.area} · Iuran diterima {formatCurrency(state.received)}</p></div>
                      <span className={`w-fit px-2.5 py-1 text-[0.65rem] font-extrabold uppercase tracking-[0.08em] ${statusClass}`}>{state.status}</span>
                      <button type="button" disabled={locked} onClick={() => openTargetIuran(target.id)} className="text-left text-xs font-extrabold text-forest disabled:cursor-not-allowed disabled:text-muted/40 sm:text-right">{locked ? 'Tercatat' : 'Catat iuran →'}</button>
                    </div>
                  )
                }) : <p className="px-5 py-8 text-sm text-muted sm:px-6">Tidak ada warga yang cocok untuk kegiatan, wilayah, atau pencarian ini.</p>}
              </div>
            ) : (
              <div className="divide-y divide-border-soft">
                {myExpenses.length > 0 ? myExpenses.slice(0, 6).map((item) => (
                  <div key={item.id} className="grid gap-2 px-5 py-4 sm:grid-cols-[1fr_auto] sm:items-center sm:px-6"><div><p className="text-sm font-extrabold text-charcoal">{item.label}</p><p className="mt-1 text-xs text-muted">{item.evidenceName ? `Bukti: ${item.evidenceName}` : 'Belum ada bukti'} · {transactionStatusLabel(item)}</p></div><p className="text-sm font-extrabold text-[#9A4C43]">{formatCurrency(item.amount)}</p></div>
                )) : <div className="px-5 py-8 sm:px-6"><p className="text-sm font-extrabold text-charcoal">Belum ada pembelanjaan dari akun ini.</p><p className="mt-2 text-xs leading-relaxed text-muted">Gunakan tombol Catat Belanja. Nama penginput otomatis tercatat sebagai {user?.fullName}.</p></div>}
              </div>
            )}
          </div>

          <div className="border border-border-soft bg-white">
            <div className="border-b border-border-soft px-5 py-5 sm:px-6">
              <p className="eyebrow text-forest">RIWAYAT SAYA</p>
              <h2 className="mt-2 text-xl font-extrabold text-charcoal">Aktivitas terakhir.</h2>
            </div>
            <div className="divide-y divide-border-soft">
              {filteredHistory.length > 0 ? filteredHistory.slice(0, 5).map((item) => (
                <div key={item.id} className="px-5 py-4 sm:px-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-extrabold text-charcoal">{item.label}</p>
                      <p className="mt-1 text-xs text-muted">{item.category} · {item.date}</p>
                    </div>
                    <p className="text-sm font-extrabold text-forest">{formatCurrency(item.amount)}</p>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-3"><p className="text-[0.68rem] font-bold uppercase tracking-[0.08em] text-muted">{transactionStatusLabel(item)}</p>{item.kind === 'income' && item.status !== 'Dibatalkan' && item.status !== 'Ditolak' && !currentActivity?.financialLocked && <button type="button" onClick={() => openCorrection(item.id,item.amount)} className="text-xs font-extrabold text-forest">Koreksi</button>}</div>
                </div>
              )) : (
                <p className="px-5 py-8 text-sm text-muted sm:px-6">Belum ada riwayat untuk kegiatan ini.</p>
              )}
            </div>
            <div className="flex items-center gap-2 border-t border-border-soft bg-warmwhite px-5 py-4 text-xs font-semibold text-muted sm:px-6">
              <WalletCards size={15} /> Kas di tangan Humas dipisahkan dari Kas Kegiatan.
            </div>
          </div>
        </section>

        <section className="mt-6 border border-border-soft bg-white p-5 sm:p-6"><div className="flex gap-4"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sage/55 text-forest"><CircleDollarSign size={19} /></span><div><p className="text-sm font-extrabold text-charcoal">Hak akses mengikuti kegiatan.</p><p className="mt-1 text-xs leading-relaxed text-muted">Akun ini hanya melihat data kegiatan yang ditugaskan. Izin aktif saat ini: {permissionLabel || 'belum ada'}.</p></div></div></section>
      </div>
    </InternalLayout>
  )
}
