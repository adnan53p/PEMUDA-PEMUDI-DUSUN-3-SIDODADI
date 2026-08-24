import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CheckCircle2, ChevronDown, Download, FileCheck2, FileClock, FileText, Filter, LockKeyhole, ReceiptText, Search, Send, ShieldCheck, Users } from 'lucide-react'
import InternalLayout from '../../components/internal/InternalLayout'
import InternalNotice from '../../components/internal/InternalNotice'
import AdminPageIntro from '../../components/internal/AdminPageIntro'
import PrototypeToast from '../../components/internal/PrototypeToast'
import TransactionPdfActions from '../../components/internal/TransactionPdfActions'
import ReportExportActions from '../../components/internal/ReportExportActions'
import { isRecognizedTransaction, transactionStatusLabel, useOperations, type ReportStatus, type TransactionKind } from '../../prototype/OperationsContext'
import { useAccounts } from '../../prototype/AccountsContext'
import { useAuth } from '../../auth/AuthContext'
import { formatCurrency } from '../../data/internal/workspaceData'
import { downloadLpjDraftPdf } from '../../utils/lpjExport'

const transactionTypeLabels: Record<TransactionKind, string> = {
  income: 'Penarikan Iuran / Pemasukan',
  expense: 'Pembelanjaan / Pengeluaran',
  handover: 'Serah Terima Kas',
}

function taskLabel(kind: TransactionKind) {
  if (kind === 'income') return 'Humas Penarikan'
  if (kind === 'expense') return 'Humas Pembelanjaan'
  return 'Humas Serah Kas'
}

function transactionPeriod(dateLabel: string) {
  const datePart = dateLabel.split('·')[0]?.trim() ?? dateLabel
  const parts = datePart.split(/\s+/)
  return parts.length >= 3 ? parts.slice(1).join(' ') : datePart
}

export default function AdminReportsPage() {
  const { user } = useAuth()
  const { humasAccounts } = useAccounts()
  const { activities, reports, transactions, budgets, committeeMembers, auditLogs, updateReportStatus, unlockActivity } = useOperations()
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get('tab') === 'riwayat' ? 'riwayat' : 'laporan'
  const [activityId, setActivityId] = useState('semua')
  const [humasUserId, setHumasUserId] = useState('semua')
  const [transactionType, setTransactionType] = useState<'semua' | TransactionKind>('semua')
  const [areaLabel, setAreaLabel] = useState('semua')
  const [status, setStatus] = useState('semua')
  const [period, setPeriod] = useState('semua')
  const [toast, setToast] = useState('')
  const [page, setPage] = useState(1)
  const [showDetails, setShowDetails] = useState(false)
  const [auditQuery, setAuditQuery] = useState('')
  const [auditActor, setAuditActor] = useState('semua')
  const pageSize = 25

  const filteredReports = useMemo(
    () => reports.filter((item) => activityId === 'semua' || item.activityId === activityId),
    [activityId, reports],
  )

  const humasTransactions = useMemo(() => transactions.filter((item) => {
    if (item.createdByRole !== 'humas') return false
    if (activityId !== 'semua' && item.activityId !== activityId) return false
    if (humasUserId !== 'semua' && item.createdByUserId !== humasUserId) return false
    if (transactionType !== 'semua' && item.kind !== transactionType) return false
    if (areaLabel !== 'semua' && item.areaLabel !== areaLabel) return false
    if (status !== 'semua' && item.status !== status) return false
    if (period !== 'semua' && transactionPeriod(item.date) !== period) return false
    return true
  }), [activityId, areaLabel, humasUserId, period, status, transactionType, transactions])

  const recognizedHumasTransactions = useMemo(() => humasTransactions.filter(isRecognizedTransaction), [humasTransactions])
  const pageCount = Math.max(1, Math.ceil(humasTransactions.length / pageSize))
  const safePage = Math.min(page, pageCount)
  const pagedHumasTransactions = humasTransactions.slice((safePage - 1) * pageSize, safePage * pageSize)

  const humasPeriods = useMemo(() => Array.from(new Set(transactions.filter((item) => item.createdByRole === 'humas').map((item) => transactionPeriod(item.date)))), [transactions])
  const humasAreas = useMemo(() => Array.from(new Set(transactions.filter((item) => item.createdByRole === 'humas' && item.areaLabel).map((item) => item.areaLabel as string))), [transactions])
  const humasSummary = useMemo(() => ({
    iuran: recognizedHumasTransactions.filter((item) => item.kind === 'income').reduce((sum, item) => sum + item.amount, 0),
    belanja: recognizedHumasTransactions.filter((item) => item.kind === 'expense').reduce((sum, item) => sum + item.amount, 0),
    serahKas: recognizedHumasTransactions.filter((item) => item.kind === 'handover').reduce((sum, item) => sum + item.amount, 0),
    transaksi: humasTransactions.length,
    transaksiSah: recognizedHumasTransactions.length,
  }), [humasTransactions, recognizedHumasTransactions])

  const selectedActivityName = activityId === 'semua' ? 'Semua kegiatan' : activities.find((item) => item.id === activityId)?.name ?? activityId
  const selectedHumasName = humasUserId === 'semua' ? 'Semua Humas' : humasAccounts.find((item) => item.id === humasUserId)?.fullName ?? humasUserId
  const reportTitle = transactionType === 'income'
    ? 'Laporan Penarikan Iuran'
    : transactionType === 'expense'
      ? 'Laporan Pembelanjaan / Pengeluaran'
      : transactionType === 'handover'
        ? 'Laporan Serah Terima Kas'
        : 'Laporan Transaksi Operasional'
  const reportExportOptions = {
    title: reportTitle,
    filters: [
      { label: 'Kegiatan', value: selectedActivityName },
      { label: 'Humas', value: selectedHumasName },
      { label: 'Jenis', value: transactionType === 'semua' ? 'Semua jenis' : transactionTypeLabels[transactionType] },
      { label: 'Wilayah/Tugas', value: areaLabel === 'semua' ? 'Semua wilayah/tugas' : areaLabel },
      { label: 'Status', value: status === 'semua' ? 'Semua status' : status },
      { label: 'Periode', value: period === 'semua' ? 'Semua periode' : period },
    ],
  }

  const notify = (message: string) => { setToast(message); window.setTimeout(() => setToast(''), 2500) }

  const nextStatus = (current: ReportStatus): ReportStatus | null => {
    if (current === 'Draft') return 'Siap Diajukan'
    if (current === 'Siap Diajukan') return 'Disahkan'
    return null
  }

  const actionLabel = (current: ReportStatus) => current === 'Draft' ? 'Ajukan' : current === 'Siap Diajukan' ? 'Sahkan' : 'Terkunci'
  const actor = user ? { userId: user.id, name: user.fullName, role: user.role } : undefined
  const auditActors = useMemo(() => Array.from(new Set(auditLogs.map((item) => item.actor))).sort(), [auditLogs])
  const filteredAudit = useMemo(() => auditLogs.filter((item) => {
    const matchesActor = auditActor === 'semua' || item.actor === auditActor
    const text = `${item.actor} ${item.actorUserId ?? ''} ${item.action} ${item.detail} ${item.reason ?? ''}`.toLowerCase()
    return matchesActor && text.includes(auditQuery.trim().toLowerCase())
  }), [auditActor, auditLogs, auditQuery])

  return (
    <InternalLayout title="Laporan & LPJ" subtitle="Filter laporan per Humas, kegiatan, jenis transaksi, lalu susun pertanggungjawaban tanpa input ulang.">
      <InternalNotice />
      <PrototypeToast message={toast} />
      <div className="mt-6"><AdminPageIntro eyebrow="LAPORAN & LPJ" title="Laporan untuk pertanggungjawaban, bukan tempat memeriksa ulang transaksi." description="Gunakan filter untuk membuat rekap dan export. Detail transaksi hanya dibuka bila diperlukan; riwayat audit tersedia sebagai tab terpisah di halaman yang sama." /></div>

      <div className="mt-5 flex gap-1 border-b border-border-soft bg-white px-3 pt-3"><button type="button" onClick={() => setSearchParams({})} className={`border-b-2 px-4 py-3 text-sm font-extrabold ${activeTab === 'laporan' ? 'border-forest text-forest' : 'border-transparent text-muted'}`}>Laporan & LPJ</button><button type="button" onClick={() => setSearchParams({ tab: 'riwayat' })} className={`border-b-2 px-4 py-3 text-sm font-extrabold ${activeTab === 'riwayat' ? 'border-forest text-forest' : 'border-transparent text-muted'}`}>Riwayat Aktivitas</button></div>

      {activeTab === 'laporan' && <>
      <section className="mt-5 border border-border-soft bg-white">
        <div className="border-b border-border-soft px-5 py-5 sm:px-6">
          <div className="flex items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sage/55 text-forest"><Users size={18} /></span><div><p className="eyebrow text-forest">LAPORAN PER HUMAS</p><h2 className="mt-2 text-xl font-extrabold text-charcoal">Siapa menarik iuran dan siapa melakukan pembelanjaan.</h2><p className="mt-2 max-w-4xl text-xs leading-relaxed text-muted">Nama tidak diketik pada transaksi. Sistem mengambil identitas dari akun Humas yang sedang login, sehingga laporan dapat difilter per orang tanpa kehilangan audit trail.</p></div></div>
        </div>

        <div className="grid gap-3 border-b border-border-soft bg-offwhite p-4 sm:grid-cols-2 xl:grid-cols-6 sm:p-5">
          <label className="relative"><span className="mb-1.5 block text-[0.62rem] font-extrabold uppercase tracking-[0.08em] text-muted">Kegiatan</span><select value={activityId} onChange={(event) => { setActivityId(event.target.value); setPage(1) }} className="h-11 w-full appearance-none border border-border-soft bg-white px-3 pr-8 text-sm font-semibold outline-none focus:border-forest"><option value="semua">Semua kegiatan</option>{activities.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><ChevronDown size={14} className="pointer-events-none absolute bottom-3.5 right-3 text-muted" /></label>
          <label className="relative"><span className="mb-1.5 block text-[0.62rem] font-extrabold uppercase tracking-[0.08em] text-muted">Nama Humas</span><select value={humasUserId} onChange={(event) => { setHumasUserId(event.target.value); setPage(1) }} className="h-11 w-full appearance-none border border-border-soft bg-white px-3 pr-8 text-sm font-semibold outline-none focus:border-forest"><option value="semua">Semua Humas</option>{humasAccounts.map((item) => <option key={item.id} value={item.id}>{item.fullName}</option>)}</select><ChevronDown size={14} className="pointer-events-none absolute bottom-3.5 right-3 text-muted" /></label>
          <label className="relative"><span className="mb-1.5 block text-[0.62rem] font-extrabold uppercase tracking-[0.08em] text-muted">Jenis catatan</span><select value={transactionType} onChange={(event) => { setTransactionType(event.target.value as 'semua' | TransactionKind); setPage(1) }} className="h-11 w-full appearance-none border border-border-soft bg-white px-3 pr-8 text-sm font-semibold outline-none focus:border-forest"><option value="semua">Semua jenis</option><option value="income">Penarikan Iuran</option><option value="expense">Pembelanjaan</option><option value="handover">Serah Terima Kas</option></select><ChevronDown size={14} className="pointer-events-none absolute bottom-3.5 right-3 text-muted" /></label>
          <label className="relative"><span className="mb-1.5 block text-[0.62rem] font-extrabold uppercase tracking-[0.08em] text-muted">Wilayah / Tugas</span><select value={areaLabel} onChange={(event) => { setAreaLabel(event.target.value); setPage(1) }} className="h-11 w-full appearance-none border border-border-soft bg-white px-3 pr-8 text-sm font-semibold outline-none focus:border-forest"><option value="semua">Semua wilayah / tugas</option>{humasAreas.map((item) => <option key={item} value={item}>{item}</option>)}</select><ChevronDown size={14} className="pointer-events-none absolute bottom-3.5 right-3 text-muted" /></label>
          <label className="relative"><span className="mb-1.5 block text-[0.62rem] font-extrabold uppercase tracking-[0.08em] text-muted">Status</span><select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1) }} className="h-11 w-full appearance-none border border-border-soft bg-white px-3 pr-8 text-sm font-semibold outline-none focus:border-forest"><option value="semua">Semua status</option><option>Diterima Humas</option><option>Menunggu Verifikasi</option><option>Terverifikasi</option><option>Ditolak</option><option>Dibatalkan</option></select><ChevronDown size={14} className="pointer-events-none absolute bottom-3.5 right-3 text-muted" /></label>
          <label className="relative"><span className="mb-1.5 block text-[0.62rem] font-extrabold uppercase tracking-[0.08em] text-muted">Periode</span><select value={period} onChange={(event) => { setPeriod(event.target.value); setPage(1) }} className="h-11 w-full appearance-none border border-border-soft bg-white px-3 pr-8 text-sm font-semibold outline-none focus:border-forest"><option value="semua">Semua periode</option>{humasPeriods.map((item) => <option key={item} value={item}>{item}</option>)}</select><ChevronDown size={14} className="pointer-events-none absolute bottom-3.5 right-3 text-muted" /></label>
        </div>

        <div className="flex flex-col gap-3 border-b border-border-soft bg-warmwhite px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div>
            <p className="text-xs font-extrabold text-charcoal">Export laporan sesuai filter aktif</p>
            <p className="mt-1 text-[0.68rem] leading-relaxed text-muted">{humasTransactions.length} baris sesuai filter; {recognizedHumasTransactions.length} transaksi sah masuk total. Pending/ditolak/dibatalkan tetap dapat muncul sebagai jejak tetapi tidak dijumlahkan sebagai transaksi sah.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2"><button type="button" onClick={() => setShowDetails((value) => !value)} className="border border-border-soft bg-white px-3 py-2 text-xs font-extrabold text-forest">{showDetails ? 'Sembunyikan Detail' : 'Lihat Detail Transaksi'}</button><ReportExportActions transactions={humasTransactions} options={reportExportOptions} /></div>
        </div>

        <div className="grid grid-cols-2 gap-px bg-border-soft lg:grid-cols-4">
          <div className="bg-white p-5"><p className="text-[0.62rem] font-extrabold uppercase tracking-[0.08em] text-muted">Total Iuran</p><p className="mt-2 text-lg font-extrabold text-forest">{formatCurrency(humasSummary.iuran)}</p></div>
          <div className="bg-white p-5"><p className="text-[0.62rem] font-extrabold uppercase tracking-[0.08em] text-muted">Total Pembelanjaan</p><p className="mt-2 text-lg font-extrabold text-[#9A4C43]">{formatCurrency(humasSummary.belanja)}</p></div>
          <div className="bg-white p-5"><p className="text-[0.62rem] font-extrabold uppercase tracking-[0.08em] text-muted">Serah Kas</p><p className="mt-2 text-lg font-extrabold text-charcoal">{formatCurrency(humasSummary.serahKas)}</p></div>
          <div className="bg-white p-5"><p className="text-[0.62rem] font-extrabold uppercase tracking-[0.08em] text-muted">Jumlah Catatan</p><p className="mt-2 text-lg font-extrabold text-charcoal">{humasSummary.transaksi}</p><p className="mt-1 text-[0.65rem] text-muted">{humasSummary.transaksiSah} transaksi sah</p></div>
        </div>

        {showDetails && <>
        <div className="overflow-x-auto border-t border-border-soft">
          <table className="min-w-[980px] w-full text-left text-sm">
            <thead className="bg-warmwhite text-[0.62rem] uppercase tracking-[0.08em] text-muted"><tr><th className="px-5 py-3">Nama Humas</th><th className="px-5 py-3">Tugas</th><th className="px-5 py-3">Wilayah</th><th className="px-5 py-3">Kegiatan</th><th className="px-5 py-3">Catatan</th><th className="px-5 py-3">Nominal</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Waktu</th><th className="px-5 py-3">PDF</th></tr></thead>
            <tbody className="divide-y divide-border-soft">{pagedHumasTransactions.length > 0 ? pagedHumasTransactions.map((item) => <tr key={item.id}><td className="px-5 py-4"><p className="font-extrabold text-charcoal">{item.createdByName}</p><p className="mt-1 text-[0.68rem] text-muted">ID {item.createdByUserId}</p></td><td className="px-5 py-4"><span className="bg-sage/55 px-2.5 py-1 text-[0.62rem] font-extrabold uppercase tracking-[0.08em] text-forest">{taskLabel(item.kind)}</span></td><td className="px-5 py-4 text-xs font-bold text-muted">{item.areaLabel ?? '-'}</td><td className="max-w-64 px-5 py-4 text-xs leading-relaxed text-muted">{item.activityName}</td><td className="px-5 py-4"><p className="font-bold text-charcoal">{item.label}</p><p className="mt-1 text-xs text-muted">{transactionTypeLabels[item.kind]}</p></td><td className="px-5 py-4 font-extrabold text-charcoal">{formatCurrency(item.amount)}</td><td className="px-5 py-4 text-xs font-bold text-muted">{transactionStatusLabel(item)}</td><td className="px-5 py-4 text-xs text-muted">{item.date}</td><td className="px-5 py-4"><TransactionPdfActions transaction={item} compact /></td></tr>) : <tr><td colSpan={9} className="px-5 py-10 text-center text-sm text-muted">Tidak ada catatan Humas yang sesuai filter.</td></tr>}</tbody>
          </table>
        </div>
        <div className="flex flex-col gap-3 border-t border-border-soft bg-warmwhite px-5 py-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-2 text-xs font-semibold text-muted"><Filter size={15} /> Filter laporan ini tidak membuat data baru; hanya membaca transaksi yang sama berdasarkan ID Humas.</div><div className="flex items-center gap-2 text-xs font-bold text-muted"><button type="button" disabled={safePage <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))} className="border border-border-soft bg-white px-3 py-2 disabled:opacity-35">Sebelumnya</button><span>Halaman {safePage} / {pageCount}</span><button type="button" disabled={safePage >= pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))} className="border border-border-soft bg-white px-3 py-2 disabled:opacity-35">Berikutnya</button></div></div>
        </>}
      </section>

      <section className="mt-8">
        <div className="mb-4 flex items-center gap-3"><ReceiptText size={18} className="text-forest" /><div><p className="eyebrow text-forest">DOKUMEN PERTANGGUNGJAWABAN</p><h2 className="mt-1 text-xl font-extrabold text-charcoal">Laporan kegiatan & LPJ.</h2></div></div>
        <div className="grid gap-4 xl:grid-cols-3">
          {filteredReports.map((report) => {
            const next = nextStatus(report.status)
            return (
              <article key={report.id} className="border border-border-soft bg-white">
                <div className="border-b border-border-soft p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-4"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-sage/55 text-forest"><FileText size={18} /></span><span className={`px-2.5 py-1 text-[0.62rem] font-extrabold uppercase tracking-[0.08em] ${report.status === 'Disahkan' ? 'bg-forest text-offwhite' : report.status === 'Siap Diajukan' ? 'bg-[#FFF2D8] text-[#7A5B21]' : 'bg-warmwhite text-muted'}`}>{report.status}</span></div>
                  <h2 className="mt-5 text-lg font-extrabold leading-tight text-charcoal">{report.title}</h2>
                  <p className="mt-2 text-xs leading-relaxed text-muted">{report.activityName}</p>
                  <div className="mt-5 flex items-center justify-between text-xs font-semibold text-muted"><span>{report.type}</span><span>{report.period}</span></div>
                </div>
                <div className="p-5 sm:p-6">
                  <div className="flex items-center justify-between text-xs font-semibold text-muted"><span>Kelengkapan data</span><span>{report.progress}%</span></div>
                  <div className="mt-2 h-1.5 overflow-hidden bg-sage/55"><div className="h-full bg-forest" style={{ width: `${report.progress}%` }} /></div>
                  {report.type.toLowerCase().includes('lpj') && (() => { const targetActivity = activities.find((item) => item.id === report.activityId); if (!targetActivity) return null; return <button type="button" onClick={() => { downloadLpjDraftPdf(targetActivity, committeeMembers.filter((item) => item.activityId === report.activityId), budgets.filter((item) => item.activityId === report.activityId), transactions); notify('Draft LPJ otomatis diunduh.') }} className="mt-5 inline-flex w-full items-center justify-center gap-2 border border-border-soft bg-white px-4 py-3 text-sm font-extrabold text-forest"><Download size={16}/> Download Draft LPJ Otomatis</button> })()}
                  <button type="button" disabled={!next} onClick={async () => { if (!next) return; const result = await updateReportStatus(report.id, next, actor); notify(result.message) }} className={`${report.type.toLowerCase().includes('lpj') ? 'mt-2' : 'mt-5'} inline-flex w-full items-center justify-center gap-2 border border-forest bg-forest px-4 py-3 text-sm font-extrabold text-offwhite disabled:cursor-not-allowed disabled:border-border-soft disabled:bg-warmwhite disabled:text-muted`}>
                    {report.status === 'Draft' ? <Send size={16} /> : report.status === 'Siap Diajukan' ? <CheckCircle2 size={16} /> : <LockKeyhole size={16} />}{actionLabel(report.status)}
                  </button>
                  {activities.find((item) => item.id === report.activityId)?.financialLocked && <button type="button" onClick={async () => { const reason = window.prompt('Alasan membuka kembali kegiatan untuk koreksi'); if (!reason) return; const result = await unlockActivity(report.activityId, reason, actor); notify(result.message) }} className="mt-2 w-full border border-[#D7B4B0] bg-white px-4 py-2.5 text-xs font-extrabold text-[#93483F]">Buka Kunci untuk Koreksi</button>}
                </div>
              </article>
            )
          })}
        </div>
      </section>

      <section className="mt-5 border border-forest/15 bg-sage/35 px-5 py-5 sm:px-6"><div className="flex gap-3"><FileCheck2 size={19} className="mt-0.5 shrink-0 text-forest" /><div><p className="text-sm font-extrabold text-charcoal">Aturan keuangan aktif</p><p className="mt-1 text-xs leading-relaxed text-muted">Setelah LPJ disahkan, data finansial kegiatan dikunci. Koreksi berikutnya tidak menghapus sejarah, melainkan membuat jejak perubahan pada audit log.</p></div></div></section>
      </>}

      {activeTab === 'riwayat' && <section className="mt-5 border border-border-soft bg-white">
        <div className="flex items-start gap-3 border-b border-border-soft px-5 py-5 sm:px-6"><ShieldCheck size={19} className="mt-0.5 shrink-0 text-forest" /><div><p className="eyebrow text-forest">RIWAYAT AKTIVITAS</p><h2 className="mt-2 text-xl font-extrabold text-charcoal">Jejak perubahan operasional.</h2><p className="mt-2 text-xs leading-relaxed text-muted">Audit tidak menjadi menu utama karena bukan pekerjaan harian. Histori tetap tersedia untuk penelusuran koreksi, pembatalan, dan perubahan penting.</p></div></div>
        <div className="grid gap-3 border-b border-border-soft p-4 md:grid-cols-[1fr_260px] sm:p-5"><label className="flex h-11 items-center border border-border-soft bg-offwhite px-3"><Search size={16} className="mr-2 text-muted" /><input value={auditQuery} onChange={(event) => setAuditQuery(event.target.value)} placeholder="Cari tindakan, alasan, atau detail" className="min-w-0 flex-1 bg-transparent text-sm outline-none" /></label><label className="relative flex h-11 items-center border border-border-soft bg-offwhite px-3"><FileClock size={16} className="mr-2 text-muted" /><select value={auditActor} onChange={(event) => setAuditActor(event.target.value)} className="w-full appearance-none bg-transparent pr-7 text-sm font-semibold outline-none"><option value="semua">Semua pelaku</option>{auditActors.map((item) => <option key={item}>{item}</option>)}</select><ChevronDown size={15} className="pointer-events-none absolute right-3 text-muted" /></label></div>
        <div className="divide-y divide-border-soft">{filteredAudit.length > 0 ? filteredAudit.map((item) => <div key={item.id} className="grid gap-3 px-5 py-4 lg:grid-cols-[160px_210px_1fr] lg:items-start sm:px-6"><div><span className="text-xs font-extrabold text-forest">{item.timestampISO ? new Date(item.timestampISO).toLocaleString('id-ID') : item.time}</span><p className="mt-1 text-[0.65rem] text-muted">{item.id}</p></div><div><p className="text-sm font-extrabold text-charcoal">{item.actor}</p><p className="mt-1 text-[0.68rem] text-muted">{item.actorUserId ?? 'Actor ID belum tersedia'}</p></div><div><p className="text-sm font-semibold text-charcoal">{item.action}</p><p className="mt-1 text-xs leading-relaxed text-muted">{item.detail}</p>{item.reason && <p className="mt-2 text-xs font-semibold text-[#8A4A39]">Alasan: {item.reason}</p>}</div></div>) : <div className="px-5 py-10 text-center text-sm text-muted">Tidak ada riwayat yang cocok.</div>}</div>
      </section>}
    </InternalLayout>
  )
}
