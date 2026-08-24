import { useMemo, useState } from 'react'
import { ArrowUpRight, CheckCircle2, FileText, Filter, Landmark, LockKeyhole, ReceiptText, ShieldCheck, TrendingDown, TrendingUp, WalletCards } from 'lucide-react'
import { Link } from 'react-router-dom'
import PageIntro from '../components/PageIntro'
import PublicFinanceOperations from '../components/PublicFinanceOperations'
import { formatRupiah } from '../data/financeData'
import { isRecognizedTransaction, useOperations } from '../prototype/OperationsContext'
import { summarizeFinanceTransactions } from '../prototype/financeSelectors'
import { usePublicActivities } from '../prototype/publicActivitySelectors'

const CHART_HEIGHT = 210
const MONTHS_ID = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']

function groupByCategory(items: { category: string; amount: number }[]) {
  const map = new Map<string, number>()
  items.forEach((item) => map.set(item.category, (map.get(item.category) ?? 0) + item.amount))
  return Array.from(map, ([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value)
}

function BreakdownList({ items, total }: { items: { label: string; value: number }[]; total: number }) {
  if (!items.length) return <p className="mt-6 text-sm text-muted">Belum ada transaksi yang dapat ditampilkan.</p>
  return <div className="mt-8 space-y-5">{items.map((item) => {
    const width = total > 0 ? Math.min((item.value / total) * 100, 100) : 0
    return <div key={item.label}><div className="flex items-end justify-between gap-4"><p className="text-sm font-semibold text-charcoal">{item.label}</p><p className="text-sm font-extrabold text-charcoal">{formatRupiah(item.value)}</p></div><div className="mt-2 h-1.5 overflow-hidden bg-sage/60"><div className="h-full bg-forest" style={{ width: `${width}%` }}/></div></div>
  })}</div>
}

function monthKey(dateISO: string) { return dateISO.slice(0, 7) }
function shiftMonth(key: string, delta: number) {
  const [year, month] = key.split('-').map(Number)
  const d = new Date(year, month - 1 + delta, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}
function monthLabel(key: string) { const [, month] = key.split('-').map(Number); return MONTHS_ID[month - 1] ?? key }
function periodLabel(key: string) { const [year, month] = key.split('-').map(Number); return `${MONTHS_ID[month - 1]} ${year}` }

export default function FinancePage() {
  const { transactions, activities, budgets } = useOperations()
  const publicActivities = usePublicActivities()
  const [period, setPeriod] = useState('semua')
  const [activityId, setActivityId] = useState('semua')
  const [hoveredMonth, setHoveredMonth] = useState<string | null>(null)

  const publicActivityIds = useMemo(() => new Set(activities.filter((item) => item.publicVisible).map((item) => item.id)), [activities])
  const recognized = useMemo(() => transactions.filter((item) => isRecognizedTransaction(item) && publicActivityIds.has(item.activityId)), [transactions, publicActivityIds])
  const verifiedIncome = useMemo(() => recognized.filter((item) => item.kind === 'income'), [recognized])
  const verifiedExpense = useMemo(() => recognized.filter((item) => item.kind === 'expense'), [recognized])

  const financeSummary = useMemo(() => summarizeFinanceTransactions(recognized), [recognized])
  const recordedIncome = financeSummary.recordedIncome
  const cashAtHumas = financeSummary.cashAtHumas
  const cashReceived = financeSummary.activityCashReceived
  const expense = financeSummary.totalExpense
  const cashExpense = financeSummary.activityFundedExpense
  const reimbursementOutstanding = financeSummary.reimbursementOutstanding
  const cashBalance = financeSummary.activityCashBalance

  const periodOptions = useMemo(() => Array.from(new Set(recognized.map((item) => monthKey(item.dateISO)))).sort().reverse(), [recognized])
  const latestMonth = periodOptions[0] ?? new Date().toISOString().slice(0, 7)
  const chartMonths = useMemo(() => Array.from({ length: 6 }, (_, index) => shiftMonth(latestMonth, index - 5)).map((key) => {
    const monthItems = recognized.filter((item) => monthKey(item.dateISO) === key)
    return { key, month: monthLabel(key), pemasukan: monthItems.filter((item) => item.kind === 'income').reduce((sum, item) => sum + item.amount, 0), pengeluaran: monthItems.filter((item) => item.kind === 'expense').reduce((sum, item) => sum + item.amount, 0) }
  }), [latestMonth, recognized])
  const maxValue = Math.max(1, ...chartMonths.flatMap((month) => [month.pemasukan, month.pengeluaran]))
  const barHeight = (value: number) => value <= 0 ? 2 : Math.max((value / maxValue) * CHART_HEIGHT, 4)

  const incomeBreakdown = useMemo(() => groupByCategory(verifiedIncome), [verifiedIncome])
  const expenseBreakdown = useMemo(() => groupByCategory(verifiedExpense), [verifiedExpense])

  const filteredTransactions = useMemo(() => recognized.filter((transaction) => transaction.kind !== 'handover' && (period === 'semua' || monthKey(transaction.dateISO) === period) && (activityId === 'semua' || transaction.activityId === activityId)).sort((a,b)=>b.dateISO.localeCompare(a.dateISO)), [recognized, period, activityId])
  const activityFinance = useMemo(() => publicActivities.filter((activity) => activityId === 'semua' || activity.id === activityId), [publicActivities, activityId])

  return <div className="bg-offwhite">
    <PageIntro eyebrow="TRANSPARANSI KEUANGAN" title={<>Keuangan terbuka, <span className="text-forest">mudah dipahami warga.</span></>} description="Halaman ini membaca transaksi operasional yang sama dengan Admin dan Humas. Iuran yang diterima Humas langsung tercatat sebagai dana terkumpul, sementara pembelanjaan dan serah kas tetap menunggu verifikasi Admin." aside={<div className="max-w-xs border-l border-border-soft pl-5 text-sm leading-relaxed text-muted"><p className="flex items-center gap-2 font-semibold text-charcoal"><ShieldCheck size={17} className="text-forest"/> Publik tanpa membuka data pribadi</p><p className="mt-2">Nama pembayar iuran dan informasi sensitif bukti transaksi tidak ditampilkan.</p></div>} />

    <section className="bg-forest-deep text-offwhite"><div className="container-content py-16 md:py-20"><div className="grid gap-12 lg:grid-cols-[0.78fr_1.22fr] lg:items-end"><div><p className="eyebrow text-sage">POSISI KAS ORGANISASI</p><p className="mt-5 text-4xl font-extrabold tracking-[-0.05em] sm:text-5xl md:text-6xl">{formatRupiah(cashBalance)}</p><p className="mt-3 text-sm text-offwhite/60">Saldo Kas Kegiatan = kas diterima − pengeluaran yang menggunakan sumber dana kegiatan.</p><div className="mt-10 grid grid-cols-2 border-y border-offwhite/15 sm:grid-cols-4"><div className="py-5 pr-3"><p className="text-[0.66rem] font-bold uppercase tracking-[0.1em] text-offwhite/55">Terkumpul</p><p className="mt-2 text-base font-extrabold text-sage">{formatRupiah(recordedIncome)}</p></div><div className="border-l border-offwhite/15 px-3 py-5"><p className="text-[0.66rem] font-bold uppercase tracking-[0.1em] text-offwhite/55">Di Humas</p><p className="mt-2 text-base font-extrabold text-[#F0D7A5]">{formatRupiah(cashAtHumas)}</p></div><div className="border-l border-offwhite/15 px-3 py-5"><p className="text-[0.66rem] font-bold uppercase tracking-[0.1em] text-offwhite/55">Kas Diterima</p><p className="mt-2 text-base font-extrabold text-sage">{formatRupiah(cashReceived)}</p></div><div className="border-l border-offwhite/15 pl-3 py-5"><p className="text-[0.66rem] font-bold uppercase tracking-[0.1em] text-offwhite/55">Pengeluaran</p><p className="mt-2 text-base font-extrabold text-[#E3A48F]">{formatRupiah(cashExpense)}</p></div></div>{reimbursementOutstanding > 0 && <p className="mt-4 text-xs text-[#F0D7A5]">Reimburse belum dibayar: {formatRupiah(reimbursementOutstanding)}. Nilai ini tercatat sebagai pengeluaran kegiatan tetapi belum mengurangi Kas Kegiatan.</p>}</div>
      <div className="border border-offwhite/15 p-5 sm:p-7"><div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><p className="eyebrow text-sage">ARUS 6 BULAN</p><h2 className="mt-2 text-2xl font-extrabold">Pemasukan vs Pengeluaran</h2></div><div className="flex gap-4 text-xs text-offwhite/65"><span className="flex items-center gap-2"><span className="h-2 w-2 bg-sage"/> Pemasukan</span><span className="flex items-center gap-2"><span className="h-2 w-2 bg-[#C97B5F]"/> Pengeluaran</span></div></div><div className="mt-8 flex h-52 items-end gap-3 sm:gap-6" aria-label="Grafik pemasukan dan pengeluaran enam bulan terakhir">{chartMonths.map((month)=><div key={month.key} className="relative flex flex-1 items-end justify-center gap-1" onMouseEnter={()=>setHoveredMonth(month.key)} onMouseLeave={()=>setHoveredMonth(null)} onFocus={()=>setHoveredMonth(month.key)} onBlur={()=>setHoveredMonth(null)} tabIndex={0}>{hoveredMonth===month.key && <div className="absolute -top-14 z-10 whitespace-nowrap border border-offwhite/20 bg-forest-deep px-2 py-1 text-[11px]"><p>Masuk: {formatRupiah(month.pemasukan)}</p><p>Keluar: {formatRupiah(month.pengeluaran)}</p></div>}<div className="w-2.5 bg-sage sm:w-3" style={{height:`${barHeight(month.pemasukan)}px`}}/><div className="w-2.5 bg-[#C97B5F] sm:w-3" style={{height:`${barHeight(month.pengeluaran)}px`}}/></div>)}</div><div className="mt-3 flex gap-3 border-t border-offwhite/15 pt-3 text-[11px] font-semibold uppercase tracking-wide text-offwhite/50 sm:gap-6">{chartMonths.map((m)=><span key={m.key} className="flex-1 text-center">{m.month}</span>)}</div></div></div>
      <div className="mt-8 flex items-start gap-3 border-t border-offwhite/15 pt-6 text-xs leading-relaxed text-offwhite/60"><WalletCards size={16} className="mt-0.5 shrink-0"/><p><strong className="text-offwhite">Kas di tangan Humas tidak dianggap sudah masuk Kas Kegiatan.</strong> Kas baru berpindah setelah serah-terima diverifikasi Admin.</p></div></div></section>

    <section className="bg-offwhite"><div className="container-content py-16 md:py-24"><div className="flex flex-col gap-5 border-b border-border-soft pb-7 lg:flex-row lg:items-end lg:justify-between"><div><p className="eyebrow text-forest">RINGKASAN ARUS DANA</p><h2 className="mt-3 text-3xl font-extrabold text-charcoal md:text-4xl">Dari mana dana datang, ke mana dana digunakan.</h2></div><p className="max-w-md text-sm leading-relaxed text-muted">Ringkasan dihitung langsung dari sumber transaksi yang sama: iuran diterima Humas, sementara pembelanjaan dan serah kas mengikuti hasil verifikasi Admin.</p></div><div className="mt-10 grid gap-12 lg:grid-cols-2 lg:gap-16"><div><div className="flex items-center justify-between border-b border-border-soft pb-4"><p className="flex items-center gap-2 text-sm font-extrabold text-charcoal"><TrendingUp size={18} className="text-forest"/> Sumber Pemasukan</p><p className="text-sm font-bold text-forest">{formatRupiah(recordedIncome)}</p></div><BreakdownList items={incomeBreakdown} total={recordedIncome}/></div><div><div className="flex items-center justify-between border-b border-border-soft pb-4"><p className="flex items-center gap-2 text-sm font-extrabold text-charcoal"><TrendingDown size={18} className="text-[#A35B45]"/> Kategori Pengeluaran</p><p className="text-sm font-bold text-charcoal">{formatRupiah(expense)}</p></div><BreakdownList items={expenseBreakdown} total={expense}/></div></div></div></section>

    <PublicFinanceOperations />

    <section className="bg-warmwhite"><div className="container-content py-16 md:py-24"><div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-end"><div><p className="eyebrow text-forest">JEJAK TRANSAKSI PUBLIK</p><h2 className="mt-3 text-3xl font-extrabold text-charcoal md:text-4xl">Transaksi yang sudah diverifikasi.</h2><p className="mt-4 max-w-xl text-sm leading-relaxed text-muted">Tidak ada daftar transaksi publik kedua. Area ini membaca record operasional yang sama.</p></div><div className="grid gap-3 sm:grid-cols-2"><label><span className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-muted"><Filter size={14}/> Periode</span><select value={period} onChange={(e)=>setPeriod(e.target.value)} className="h-12 w-full border border-border-soft bg-white px-4 text-sm font-semibold text-charcoal outline-none focus:border-forest"><option value="semua">Semua Periode</option>{periodOptions.map((item)=><option key={item} value={item}>{periodLabel(item)}</option>)}</select></label><label><span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-muted">Kegiatan</span><select value={activityId} onChange={(e)=>setActivityId(e.target.value)} className="h-12 w-full border border-border-soft bg-white px-4 text-sm font-semibold text-charcoal outline-none focus:border-forest"><option value="semua">Semua Kegiatan</option>{publicActivities.map((activity)=><option key={activity.id} value={activity.id}>{activity.shortTitle}</option>)}</select></label></div></div>
      <div className="mt-10 border-y border-border-soft bg-offwhite">{filteredTransactions.length ? filteredTransactions.map((transaction)=><div key={transaction.id} className="grid gap-4 border-b border-border-soft px-4 py-5 last:border-b-0 sm:px-6 md:grid-cols-[0.8fr_1.7fr_0.8fr_0.65fr] md:items-center"><div><p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted">{transaction.date.split(' · ')[0]}</p><span className={`mt-2 inline-flex text-[0.68rem] font-extrabold uppercase tracking-[0.1em] ${transaction.kind==='income'?'text-forest':'text-[#9B503C]'}`}>{transaction.kind==='income'?'Pemasukan':'Pengeluaran'}</span></div><div><p className="text-sm font-extrabold text-charcoal">{transaction.kind==='income'&&transaction.category==='Iuran' ? `Iuran warga diterima Humas${transaction.areaLabel?` · ${transaction.areaLabel}`:''}` : transaction.label}</p><p className="mt-1 text-xs text-muted">{transaction.category} · {transaction.activityName}</p></div><p className="text-sm font-extrabold text-charcoal md:text-right">{transaction.kind==='income'?'+':'−'} {formatRupiah(transaction.amount)}</p><span className="inline-flex w-fit items-center gap-1.5 text-xs font-semibold text-muted md:justify-self-end">{transaction.evidenceName?<CheckCircle2 size={15} className="text-forest"/>:<LockKeyhole size={15}/>} {transaction.evidenceName?'Bukti tersedia':'Bukti privat/tidak ada'}</span></div>) : <div className="p-10 text-center"><p className="font-bold text-charcoal">Tidak ada transaksi pada filter ini.</p></div>}</div></div></section>

    <section className="bg-offwhite"><div className="container-content py-16 md:py-24"><div className="flex flex-col gap-5 border-b border-border-soft pb-7 sm:flex-row sm:items-end sm:justify-between"><div><p className="eyebrow text-forest">KEUANGAN PER KEGIATAN</p><h2 className="mt-3 text-3xl font-extrabold text-charcoal md:text-4xl">RAB dan realisasi berasal dari pembelanjaan terverifikasi.</h2></div><Link to="/kegiatan" className="text-link text-sm">Lihat semua kegiatan <ArrowUpRight size={16}/></Link></div><div className="mt-10 divide-y divide-border-soft border-y border-border-soft">{activityFinance.map((activity)=>{const activityBudgets=budgets.filter((b)=>b.activityId===activity.id);const plan=activityBudgets.reduce((s,i)=>s+i.plan,0);const actual=activityBudgets.reduce((s,i)=>s+i.realized,0);const percentage=plan>0?Math.round(actual/plan*100):0;return <div key={activity.id} className="grid gap-5 py-7 md:grid-cols-[1.5fr_0.7fr_0.7fr_0.7fr_auto] md:items-center"><div><p className="text-lg font-extrabold text-charcoal">{activity.shortTitle}</p><p className="mt-1 text-xs font-semibold uppercase tracking-[0.1em] text-muted">{activity.status} · {activity.date}</p></div><div><p className="text-xs font-bold uppercase tracking-[0.1em] text-muted">RAB</p><p className="mt-1 text-sm font-extrabold text-charcoal">{formatRupiah(plan)}</p></div><div><p className="text-xs font-bold uppercase tracking-[0.1em] text-muted">Realisasi</p><p className="mt-1 text-sm font-extrabold text-charcoal">{formatRupiah(actual)}</p></div><div><p className="text-xs font-bold uppercase tracking-[0.1em] text-muted">Terpakai</p><p className="mt-1 text-sm font-extrabold text-forest">{percentage}%</p></div><Link to={`/kegiatan/${activity.id}`} className="text-link text-sm">Detail <ArrowUpRight size={15}/></Link></div>})}</div></div></section>

    <section className="border-t border-border-soft bg-warmwhite"><div className="container-content grid gap-8 py-14 md:grid-cols-[1fr_0.9fr] md:items-center md:py-16"><div><p className="eyebrow text-forest">LAPORAN & LPJ</p><h2 className="mt-3 text-2xl font-extrabold text-charcoal md:text-3xl">Dokumen resmi mengikuti data yang sudah diverifikasi.</h2><p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">Laporan tidak perlu menginput ulang transaksi, RAB, atau realisasi.</p></div><div className="grid gap-3 sm:grid-cols-2"><div className="border border-border-soft bg-offwhite p-5"><FileText size={20} className="text-forest"/><p className="mt-4 text-sm font-extrabold text-charcoal">Laporan Keuangan</p></div><div className="border border-border-soft bg-offwhite p-5"><ReceiptText size={20} className="text-forest"/><p className="mt-4 text-sm font-extrabold text-charcoal">LPJ Kegiatan</p></div></div></div></section>
    <section className="bg-forest text-offwhite"><div className="container-content flex flex-col gap-6 py-12 sm:flex-row sm:items-center sm:justify-between"><div><p className="eyebrow text-sage">PRINSIP TRANSPARANSI</p><p className="mt-2 max-w-2xl text-lg font-extrabold">Satu transaksi dicatat sekali, lalu menjadi sumber untuk kas, kegiatan, laporan, dan LPJ.</p></div><span className="inline-flex items-center gap-2 text-sm font-semibold text-offwhite/70"><Landmark size={18}/> One source of truth</span></div></section>
  </div>
}
