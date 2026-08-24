import { Activity, ArrowRight, ClipboardCheck, HandCoins, Landmark, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import InternalLayout from '../../components/internal/InternalLayout'
import InternalNotice from '../../components/internal/InternalNotice'
import InternalStat from '../../components/internal/InternalStat'
import { formatCurrency } from '../../data/internal/workspaceData'
import { isActivityFundedExpense, isRecognizedTransaction, needsAdminVerification, transactionStatusLabel, useOperations } from '../../prototype/OperationsContext'

export default function AdminDashboard() {
  const { activities, transactions } = useOperations()
  const recognized = transactions.filter(isRecognizedTransaction)
  const directIncome = recognized.filter((item) => item.kind === 'income' && item.createdByRole !== 'humas').reduce((sum, item) => sum + item.amount, 0)
  const humasIncome = recognized.filter((item) => item.kind === 'income' && item.createdByRole === 'humas').reduce((sum, item) => sum + item.amount, 0)
  const handedOver = recognized.filter((item) => item.kind === 'handover').reduce((sum, item) => sum + item.amount, 0)
  const humasExpenses = recognized.filter((item) => item.kind === 'expense' && item.fundingSource === 'Kas Humas').reduce((sum, item) => sum + item.amount, 0)
  const activityExpenses = recognized.filter(isActivityFundedExpense).reduce((sum, item) => sum + item.amount, 0)
  const pending = transactions.filter(needsAdminVerification)
  const activeActivities = activities.filter((item) => item.phase !== 'Selesai')
  const cashOnHumas = Math.max(0, humasIncome - handedOver - humasExpenses)
  const activityCash = directIncome + handedOver - activityExpenses

  return (
    <InternalLayout title="Ringkasan" subtitle="Lihat kondisi operasional dan item yang benar-benar memerlukan perhatian Admin.">
      <InternalNotice />

      <section className="mt-6 border border-forest/15 bg-sage/35 px-5 py-4 sm:px-6">
        <div className="flex gap-3">
          <ShieldCheck size={18} className="mt-0.5 shrink-0 text-forest" />
          <div><p className="text-sm font-extrabold text-charcoal">Ringkasan hanya menampilkan hal penting.</p><p className="mt-1 text-xs leading-relaxed text-muted">Data lengkap tetap berada di Kegiatan, Humas & Warga, Keuangan, serta Laporan & LPJ. Dashboard tidak mengulang tabel yang sama.</p></div>
        </div>
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <InternalStat label="Kegiatan aktif" value={String(activeActivities.length)} note="Belum selesai / belum dikunci" icon={Activity} />
        <InternalStat label="Perlu tindakan" value={String(pending.length)} note="Belanja atau serah kas" icon={ClipboardCheck} />
        <InternalStat label="Kas Kegiatan" value={formatCurrency(activityCash)} note="Saldo operasional terhitung" icon={Landmark} />
        <InternalStat label="Kas di Humas" value={formatCurrency(cashOnHumas)} note="Belum diserahkan ke kegiatan" icon={HandCoins} />
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="border border-border-soft bg-white">
          <div className="flex items-center justify-between gap-4 border-b border-border-soft px-5 py-5 sm:px-6"><div><p className="eyebrow text-forest">PERLU TINDAKAN</p><h2 className="mt-2 text-xl font-extrabold text-charcoal">Yang perlu Admin selesaikan sekarang.</h2></div><Link to="/admin/keuangan" className="inline-flex items-center gap-1.5 text-xs font-extrabold text-forest">Buka Keuangan <ArrowRight size={14} /></Link></div>
          <div className="divide-y divide-border-soft">
            {pending.length > 0 ? pending.slice(0, 5).map((item) => <div key={item.id} className="flex flex-col gap-3 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6"><div><p className="text-sm font-extrabold text-charcoal">{item.label}</p><p className="mt-1 text-xs text-muted">{item.activityName} · {item.createdByName} · {transactionStatusLabel(item)}</p></div><Link to={`/admin/keuangan?tab=${item.kind === 'handover' ? 'serah-kas' : 'pembelanjaan'}`} className="inline-flex items-center gap-1.5 text-xs font-extrabold text-forest">Periksa <ArrowRight size={14} /></Link></div>) : <div className="px-5 py-10 text-center text-sm text-muted">Tidak ada transaksi yang membutuhkan tindakan Admin.</div>}
          </div>
        </div>

        <div className="border border-border-soft bg-white">
          <div className="flex items-center justify-between gap-4 border-b border-border-soft px-5 py-5 sm:px-6"><div><p className="eyebrow text-forest">KEGIATAN AKTIF</p><h2 className="mt-2 text-xl font-extrabold text-charcoal">Progress singkat.</h2></div><Link to="/admin/kegiatan" className="inline-flex items-center gap-1.5 text-xs font-extrabold text-forest">Kelola <ArrowRight size={14} /></Link></div>
          <div className="divide-y divide-border-soft">
            {activeActivities.slice(0, 5).map((activity) => <div key={activity.id} className="px-5 py-5 sm:px-6"><div className="flex items-start justify-between gap-4"><div><p className="text-sm font-extrabold text-charcoal">{activity.name}</p><p className="mt-1 text-xs text-muted">{activity.phase} · {activity.date}</p></div><span className="text-sm font-extrabold text-forest">{activity.progress}%</span></div><div className="mt-3 h-1.5 overflow-hidden bg-sage/60"><div className="h-full bg-forest" style={{ width: `${activity.progress}%` }} /></div></div>)}
          </div>
        </div>
      </section>
    </InternalLayout>
  )
}
