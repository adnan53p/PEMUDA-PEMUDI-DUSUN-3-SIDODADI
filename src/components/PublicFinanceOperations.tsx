import { useMemo, useState } from 'react'
import {
  Banknote,
  CheckCircle2,
  Filter,
  MapPinned,
  ReceiptText,
  ShieldCheck,
  ShoppingBag,
  UsersRound,
} from 'lucide-react'
import { formatRupiah } from '../data/financeData'
import { isRecognizedTransaction, useOperations } from '../prototype/OperationsContext'

type TransparencyTab = 'iuran' | 'belanja'

function percentage(value: number, total: number) {
  if (total <= 0) return 0
  return Math.min(Math.round((value / total) * 100), 100)
}

function unique<T>(items: T[]) {
  return Array.from(new Set(items))
}

export default function PublicFinanceOperations() {
  const { activities, assignments, collectionTargets, transactions } = useOperations()
  const [tab, setTab] = useState<TransparencyTab>('iuran')
  const [activityId, setActivityId] = useState('semua')
  const [actorId, setActorId] = useState('semua')

  const publicActivityIds = useMemo(() => new Set(activities.filter((item) => item.publicVisible).map((item) => item.id)), [activities])
  const publicActivities = useMemo(() => activities.filter((item) => item.publicVisible), [activities])

  const recognized = useMemo(
    () => transactions.filter((item) => isRecognizedTransaction(item) && publicActivityIds.has(item.activityId)),
    [transactions, publicActivityIds],
  )

  const verifiedIuran = useMemo(
    () => recognized.filter((item) => item.kind === 'income' && item.category === 'Iuran' && item.createdByRole === 'humas'),
    [recognized],
  )

  const verifiedPurchases = useMemo(
    () => recognized.filter((item) => item.kind === 'expense'),
    [recognized],
  )

  const actors = useMemo(() => {
    const source = (tab === 'iuran' ? verifiedIuran : verifiedPurchases)
      .filter((item) => activityId === 'semua' || item.activityId === activityId)
    return unique<string>(source.map((item) => `${item.assignmentId ?? `${item.createdByRole}-${item.activityId}`}|||${item.areaLabel ?? (item.createdByRole === 'admin' ? 'Admin Kegiatan' : 'Tugas Humas')}`))
      .map((item) => {
        const [id, name] = item.split('|||')
        return { id, name }
      })
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [tab, activityId, verifiedIuran, verifiedPurchases])

  const filteredIuran = useMemo(() => verifiedIuran.filter((item) => {
    const activityMatches = activityId === 'semua' || item.activityId === activityId
    const actorMatches = actorId === 'semua' || (item.assignmentId ?? `${item.createdByRole}-${item.activityId}`) === actorId
    return activityMatches && actorMatches
  }), [verifiedIuran, activityId, actorId])

  const filteredPurchases = useMemo(() => verifiedPurchases.filter((item) => {
    const activityMatches = activityId === 'semua' || item.activityId === activityId
    const actorMatches = actorId === 'semua' || (item.assignmentId ?? `${item.createdByRole}-${item.activityId}`) === actorId
    return activityMatches && actorMatches
  }), [verifiedPurchases, activityId, actorId])

  const iuranAssignments = useMemo(() => assignments.filter((item) => {
    const hasPermission = item.permissions.includes('Iuran')
    const isPublic = publicActivityIds.has(item.activityId)
    const activityMatches = activityId === 'semua' || item.activityId === activityId
    const actorMatches = actorId === 'semua' || item.id === actorId
    return hasPermission && isPublic && activityMatches && actorMatches
  }), [assignments, activityId, actorId, publicActivityIds])

  const iuranCollected = filteredIuran.reduce((sum, item) => sum + item.amount, 0)
  const iuranAssignmentIds = useMemo(() => new Set(iuranAssignments.map((item) => item.id)), [iuranAssignments])
  const iuranResidents = useMemo(() => collectionTargets.filter((item) => iuranAssignmentIds.has(item.assignmentId)), [collectionTargets, iuranAssignmentIds])
  const contributedTargetIds = useMemo(() => new Set(filteredIuran.map((item) => item.targetId).filter(Boolean)), [filteredIuran])
  const contributedResidents = iuranResidents.filter((item) => contributedTargetIds.has(item.id)).length
  const participationProgress = percentage(contributedResidents, iuranResidents.length)

  const areaRows = useMemo(() => iuranAssignments.map((assignment) => {
    const residents = collectionTargets.filter((item) => item.assignmentId === assignment.id)
    const contributionTransactions = verifiedIuran.filter((item) => item.assignmentId === assignment.id)
    const contributedIds = new Set(contributionTransactions.map((item) => item.targetId).filter(Boolean))
    const collected = contributionTransactions.reduce((sum, item) => sum + item.amount, 0)
    return {
      ...assignment,
      residents: residents.length,
      contributed: residents.filter((item) => contributedIds.has(item.id)).length,
      collected,
    }
  }), [iuranAssignments, verifiedIuran, collectionTargets])

  const purchaseTotal = filteredPurchases.reduce((sum, item) => sum + item.amount, 0)
  const purchaseCategories = unique(filteredPurchases.map((item) => item.category))
  const purchaseEvidenceCount = filteredPurchases.filter((item) => item.evidenceName).length

  const categoryRows = useMemo(() => purchaseCategories.map((category) => {
    const total = filteredPurchases.filter((item) => item.category === category).reduce((sum, item) => sum + item.amount, 0)
    return { category, total }
  }).sort((a, b) => b.total - a.total), [purchaseCategories, filteredPurchases])

  return (
    <section id="iuran-pembelanjaan" className="border-y border-border-soft bg-offwhite">
      <div className="container-content py-16 md:py-24">
        <div className="flex flex-col gap-6 border-b border-border-soft pb-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="eyebrow text-forest">IURAN & PEMBELANJAAN</p>
            <h2 className="mt-3 text-3xl font-extrabold text-charcoal md:text-4xl">Data operasional langsung, dengan status yang jelas.</h2>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted">Iuran yang diterima Humas langsung masuk rekap transparansi sebagai dana terkumpul. Pembelanjaan hanya muncul setelah diverifikasi Admin. Nama pembayar iuran tetap disembunyikan dari publik.</p>
          </div>
          <div className="inline-flex w-fit border border-border-soft bg-warmwhite p-1" role="tablist" aria-label="Data transparansi iuran dan pembelanjaan">
            <button type="button" role="tab" aria-selected={tab === 'iuran'} onClick={() => { setTab('iuran'); setActorId('semua') }} className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-extrabold transition-colors ${tab === 'iuran' ? 'bg-forest text-offwhite' : 'text-charcoal hover:bg-sage/45'}`}>
              <Banknote size={16} /> Iuran
            </button>
            <button type="button" role="tab" aria-selected={tab === 'belanja'} onClick={() => { setTab('belanja'); setActorId('semua') }} className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-extrabold transition-colors ${tab === 'belanja' ? 'bg-forest text-offwhite' : 'text-charcoal hover:bg-sage/45'}`}>
              <ShoppingBag size={16} /> Pembelanjaan
            </button>
          </div>
        </div>

        <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:max-w-3xl">
          <label>
            <span className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-muted"><Filter size={14} /> Kegiatan</span>
            <select value={activityId} onChange={(event) => { setActivityId(event.target.value); setActorId('semua') }} className="h-12 w-full border border-border-soft bg-white px-4 text-sm font-semibold text-charcoal outline-none focus:border-forest">
              <option value="semua">Semua Kegiatan</option>
              {publicActivities.map((activity) => <option key={activity.id} value={activity.id}>{activity.name}</option>)}
            </select>
          </label>
          <label>
            <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-muted">{tab === 'iuran' ? 'Wilayah Penarikan' : 'Wilayah / Tugas Belanja'}</span>
            <select value={actorId} onChange={(event) => setActorId(event.target.value)} className="h-12 w-full border border-border-soft bg-white px-4 text-sm font-semibold text-charcoal outline-none focus:border-forest">
              <option value="semua">Semua Wilayah/Tugas</option>
              {actors.map((actor) => <option key={actor.id} value={actor.id}>{actor.name}</option>)}
            </select>
          </label>
        </div>

        {tab === 'iuran' ? (
          <div className="mt-9">
            <div className="grid grid-cols-2 gap-px overflow-hidden bg-border-soft lg:grid-cols-4">
              <div className="bg-white p-5 sm:p-6"><p className="text-[0.68rem] font-extrabold uppercase tracking-[0.1em] text-muted">Warga Terdaftar</p><p className="mt-2 text-xl font-extrabold text-charcoal sm:text-2xl">{iuranResidents.length}</p></div>
              <div className="bg-white p-5 sm:p-6"><p className="text-[0.68rem] font-extrabold uppercase tracking-[0.1em] text-muted">Sudah Berkontribusi</p><p className="mt-2 text-xl font-extrabold text-forest sm:text-2xl">{contributedResidents}</p></div>
              <div className="bg-white p-5 sm:p-6"><p className="text-[0.68rem] font-extrabold uppercase tracking-[0.1em] text-muted">Partisipasi</p><p className="mt-2 text-xl font-extrabold text-charcoal sm:text-2xl">{participationProgress}%</p></div>
              <div className="bg-white p-5 sm:p-6"><p className="text-[0.68rem] font-extrabold uppercase tracking-[0.1em] text-muted">Total Iuran</p><p className="mt-2 text-xl font-extrabold text-forest sm:text-2xl">{formatRupiah(iuranCollected)}</p></div>
            </div>

            <div className="mt-8 grid gap-8 xl:grid-cols-[0.9fr_1.1fr]">
              <div className="border border-border-soft bg-warmwhite p-5 sm:p-6">
                <div className="flex items-center gap-3 border-b border-border-soft pb-4"><MapPinned size={19} className="text-forest" /><div><p className="text-sm font-extrabold text-charcoal">Partisipasi per wilayah</p><p className="mt-1 text-xs text-muted">Daftar warga mengikuti penugasan Humas. Tidak ada target nominal iuran.</p></div></div>
                <div className="mt-5 space-y-5">
                  {areaRows.length > 0 ? areaRows.map((row) => (
                    <div key={row.id}>
                      <div className="flex items-start justify-between gap-4"><div><p className="text-sm font-extrabold text-charcoal">{row.area}</p><p className="mt-1 text-xs text-muted">{row.humas}</p></div><p className="text-right text-xs font-bold text-muted">{row.contributed}/{row.residents} warga · {formatRupiah(row.collected)}</p></div>
                      <div className="mt-3 h-1.5 bg-sage/55"><div className="h-full bg-forest" style={{ width: `${percentage(row.contributed, row.residents)}%` }} /></div>
                      <p className="mt-2 text-[0.68rem] font-bold text-forest">{percentage(row.contributed, row.residents)}% warga sudah berkontribusi</p>
                    </div>
                  )) : <p className="text-sm leading-relaxed text-muted">Belum ada penugasan penarikan iuran pada filter ini.</p>}
                </div>
              </div>

              <div className="border border-border-soft bg-white">
                <div className="flex items-center justify-between gap-4 border-b border-border-soft px-5 py-4 sm:px-6"><div className="flex items-center gap-3"><UsersRound size={18} className="text-forest" /><p className="text-sm font-extrabold text-charcoal">Catatan iuran diterima Humas</p></div><span className="text-xs font-bold text-muted">{filteredIuran.length} transaksi</span></div>
                <div className="divide-y divide-border-soft">
                  {filteredIuran.length > 0 ? filteredIuran.map((item) => (
                    <div key={item.id} className="grid gap-3 px-5 py-4 sm:grid-cols-[1fr_auto] sm:px-6 sm:items-center">
                      <div><p className="text-sm font-extrabold text-charcoal">Iuran warga diterima Humas</p><p className="mt-1 text-xs leading-relaxed text-muted">Wilayah/Tugas {item.areaLabel ?? 'Humas kegiatan'} · {item.activityName}</p><p className="mt-1 text-[0.68rem] font-semibold text-muted">{item.date}</p></div>
                      <p className="text-sm font-extrabold text-forest sm:text-right">+ {formatRupiah(item.amount)}</p>
                    </div>
                  )) : <div className="px-5 py-9 text-center sm:px-6"><p className="font-bold text-charcoal">Belum ada iuran yang diterima Humas.</p><p className="mt-2 text-sm text-muted">Iuran baru akan tampil setelah dicatat oleh Humas pada warga/keluarga yang ditugaskan.</p></div>}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-9">
            <div className="grid grid-cols-2 gap-px overflow-hidden bg-border-soft lg:grid-cols-4">
              <div className="bg-white p-5 sm:p-6"><p className="text-[0.68rem] font-extrabold uppercase tracking-[0.1em] text-muted">Total Belanja</p><p className="mt-2 text-xl font-extrabold text-[#9A4C43] sm:text-2xl">{formatRupiah(purchaseTotal)}</p></div>
              <div className="bg-white p-5 sm:p-6"><p className="text-[0.68rem] font-extrabold uppercase tracking-[0.1em] text-muted">Transaksi</p><p className="mt-2 text-xl font-extrabold text-charcoal sm:text-2xl">{filteredPurchases.length}</p></div>
              <div className="bg-white p-5 sm:p-6"><p className="text-[0.68rem] font-extrabold uppercase tracking-[0.1em] text-muted">Kategori</p><p className="mt-2 text-xl font-extrabold text-charcoal sm:text-2xl">{purchaseCategories.length}</p></div>
              <div className="bg-white p-5 sm:p-6"><p className="text-[0.68rem] font-extrabold uppercase tracking-[0.1em] text-muted">Ada Bukti</p><p className="mt-2 text-xl font-extrabold text-forest sm:text-2xl">{purchaseEvidenceCount}</p></div>
            </div>

            <div className="mt-8 grid gap-8 xl:grid-cols-[0.7fr_1.3fr]">
              <div className="border border-border-soft bg-warmwhite p-5 sm:p-6">
                <div className="flex items-center gap-3 border-b border-border-soft pb-4"><ShoppingBag size={19} className="text-forest" /><div><p className="text-sm font-extrabold text-charcoal">Kategori pembelanjaan</p><p className="mt-1 text-xs text-muted">Hanya belanja yang sudah terverifikasi.</p></div></div>
                <div className="mt-5 space-y-4">
                  {categoryRows.length > 0 ? categoryRows.map((row) => {
                    const width = purchaseTotal > 0 ? Math.round((row.total / purchaseTotal) * 100) : 0
                    return <div key={row.category}><div className="flex items-end justify-between gap-4"><p className="text-sm font-bold text-charcoal">{row.category}</p><p className="text-xs font-extrabold text-charcoal">{formatRupiah(row.total)}</p></div><div className="mt-2 h-1.5 bg-sage/55"><div className="h-full bg-[#A35B45]" style={{ width: `${width}%` }} /></div></div>
                  }) : <p className="text-sm text-muted">Belum ada pembelanjaan terverifikasi pada filter ini.</p>}
                </div>
              </div>

              <div className="border border-border-soft bg-white">
                <div className="flex items-center justify-between gap-4 border-b border-border-soft px-5 py-4 sm:px-6"><div className="flex items-center gap-3"><ReceiptText size={18} className="text-forest" /><p className="text-sm font-extrabold text-charcoal">Pembelanjaan terverifikasi</p></div><span className="text-xs font-bold text-muted">{filteredPurchases.length} transaksi</span></div>
                <div className="divide-y divide-border-soft">
                  {filteredPurchases.length > 0 ? filteredPurchases.map((item) => (
                    <div key={item.id} className="grid gap-3 px-5 py-4 sm:grid-cols-[1fr_auto] sm:px-6 sm:items-center">
                      <div><div className="flex flex-wrap items-center gap-2"><p className="text-sm font-extrabold text-charcoal">{item.label}</p><span className="bg-sage/45 px-2 py-0.5 text-[0.62rem] font-extrabold uppercase tracking-[0.08em] text-forest">{item.category}</span></div><p className="mt-1 text-xs leading-relaxed text-muted">Wilayah/Tugas {item.areaLabel ?? 'Operasional'} · {item.activityName}</p><div className="mt-2 flex flex-wrap items-center gap-3 text-[0.68rem] font-semibold text-muted"><span>{item.date}</span><span className="inline-flex items-center gap-1"><CheckCircle2 size={13} className="text-forest" /> {item.evidenceName ? 'Bukti tersedia' : 'Belum ada bukti publik'}</span></div></div>
                      <p className="text-sm font-extrabold text-[#9A4C43] sm:text-right">− {formatRupiah(item.amount)}</p>
                    </div>
                  )) : <div className="px-5 py-9 text-center sm:px-6"><p className="font-bold text-charcoal">Belum ada pembelanjaan terverifikasi.</p><p className="mt-2 text-sm text-muted">Transaksi menunggu verifikasi tidak ditampilkan ke publik.</p></div>}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 flex items-start gap-3 border border-forest/15 bg-sage/30 px-5 py-4 text-xs leading-relaxed text-muted sm:px-6"><ShieldCheck size={17} className="mt-0.5 shrink-0 text-forest" /><p><strong className="text-charcoal">Aturan publik:</strong> data langsung mengikuti sumber transaksi operasional yang sama. Iuran berstatus Diterima Humas dapat tampil sebagai dana terkumpul; pembelanjaan baru tampil setelah Terverifikasi. Data ditolak/dibatalkan tidak muncul. Nama pembayar iuran dan informasi sensitif bukti transaksi disembunyikan.</p></div>
      </div>
    </section>
  )
}
