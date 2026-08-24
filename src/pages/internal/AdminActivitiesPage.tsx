import { useMemo, useState, type FormEvent } from 'react'
import { CalendarDays, ChevronDown, Eye, EyeOff, Filter, Images, LockKeyhole, MapPin, Search, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import InternalLayout from '../../components/internal/InternalLayout'
import InternalNotice from '../../components/internal/InternalNotice'
import AdminPageIntro from '../../components/internal/AdminPageIntro'
import PrototypeToast from '../../components/internal/PrototypeToast'
import PrototypeModal from '../../components/internal/PrototypeModal'
import ActivityCommitteeManager from '../../components/internal/ActivityCommitteeManager'
import ActivityMediaManager from '../../components/internal/ActivityMediaManager'
import { formatCurrency } from '../../data/internal/workspaceData'
import { isRecognizedTransaction, useOperations } from '../../prototype/OperationsContext'
import { useAuth } from '../../auth/AuthContext'

const phases = ['Semua Fase', 'Perencanaan', 'Penggalangan/Iuran', 'Berlangsung', 'Penyelesaian', 'LPJ', 'Selesai']

function dateLabel(value: string) {
  if (!value) return ''
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(`${value}T00:00:00`))
}

export default function AdminActivitiesPage() {
  const { user } = useAuth()
  const { activities, addActivity, updateActivityPhase, updateActivityPublication, transactions, assignments, committeeMembers, activityMedia } = useOperations()
  const actor = user ? { userId: user.id, name: user.fullName, role: user.role } : undefined
  const [query, setQuery] = useState('')
  const [phase, setPhase] = useState('Semua Fase')
  const [toast, setToast] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDateISO, setNewDateISO] = useState('')
  const [newLocation, setNewLocation] = useState('Dusun 3 Sidodadi')
  const [newBudget, setNewBudget] = useState('0')
  const [newCategory, setNewCategory] = useState('Kegiatan')
  const [newSummary, setNewSummary] = useState('')
  const [newPublic, setNewPublic] = useState(false)
  const [managedCommitteeActivityId, setManagedCommitteeActivityId] = useState('')
  const [managedMediaActivityId, setManagedMediaActivityId] = useState('')

  const filtered = useMemo(() => activities.filter((activity) => {
    const matchesQuery = activity.name.toLowerCase().includes(query.trim().toLowerCase())
    const matchesPhase = phase === 'Semua Fase' || activity.phase === phase
    return matchesQuery && matchesPhase
  }), [activities, phase, query])

  const showToast = (message: string) => {
    setToast(message)
    window.setTimeout(() => setToast(''), 3000)
  }

  const submitActivity = async (event: FormEvent) => {
    event.preventDefault()
    if (!newName.trim() || !newDateISO) return
    const result = await addActivity({
      name: newName.trim(),
      phase: 'Perencanaan',
      date: dateLabel(newDateISO),
      dateISO: newDateISO,
      location: newLocation.trim() || 'Dusun 3 Sidodadi',
      budgetTarget: Number(newBudget) || 0,
      category: newCategory.trim() || 'Kegiatan',
      summary: newSummary.trim(),
      publicVisible: newPublic,
    }, actor)
    showToast(result.message)
    if (!result.ok) return
    setCreateOpen(false)
    setNewName('')
    setNewDateISO('')
    setNewBudget('0')
    setNewCategory('Kegiatan')
    setNewSummary('')
    setNewPublic(false)
  }

  return (
    <InternalLayout title="Kegiatan" subtitle="Kelola siklus kegiatan dari perencanaan sampai LPJ dan publikasi.">
      <InternalNotice />
      <PrototypeToast message={toast} />

      <PrototypeModal open={createOpen} onClose={() => setCreateOpen(false)} title="Buat kegiatan baru" description="Kegiatan dibuat satu kali. Admin dapat menentukan kapan kegiatan tampil di website publik.">
        <form onSubmit={submitActivity} className="space-y-4">
          <label className="block"><span className="text-xs font-extrabold uppercase tracking-[0.08em] text-muted">Nama kegiatan</span><input required value={newName} onChange={(event) => setNewName(event.target.value)} className="mt-2 h-11 w-full border border-border-soft bg-white px-3 text-sm outline-none focus:border-forest" /></label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block"><span className="text-xs font-extrabold uppercase tracking-[0.08em] text-muted">Tanggal</span><input required type="date" value={newDateISO} onChange={(event) => setNewDateISO(event.target.value)} className="mt-2 h-11 w-full border border-border-soft bg-white px-3 text-sm outline-none focus:border-forest" /></label>
            <label className="block"><span className="text-xs font-extrabold uppercase tracking-[0.08em] text-muted">Target RAB awal</span><input type="number" min="0" value={newBudget} onChange={(event) => setNewBudget(event.target.value)} className="mt-2 h-11 w-full border border-border-soft bg-white px-3 text-sm outline-none focus:border-forest" /></label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block"><span className="text-xs font-extrabold uppercase tracking-[0.08em] text-muted">Kategori</span><input value={newCategory} onChange={(event) => setNewCategory(event.target.value)} className="mt-2 h-11 w-full border border-border-soft bg-white px-3 text-sm outline-none focus:border-forest" /></label>
            <label className="block"><span className="text-xs font-extrabold uppercase tracking-[0.08em] text-muted">Lokasi</span><input value={newLocation} onChange={(event) => setNewLocation(event.target.value)} className="mt-2 h-11 w-full border border-border-soft bg-white px-3 text-sm outline-none focus:border-forest" /></label>
          </div>
          <label className="block"><span className="text-xs font-extrabold uppercase tracking-[0.08em] text-muted">Ringkasan publik</span><textarea value={newSummary} onChange={(event) => setNewSummary(event.target.value)} rows={3} className="mt-2 w-full border border-border-soft bg-white px-3 py-3 text-sm outline-none focus:border-forest" /></label>
          <label className="flex items-start gap-3 border border-border-soft bg-warmwhite p-4"><input type="checkbox" checked={newPublic} onChange={(event) => setNewPublic(event.target.checked)} className="mt-1" /><span><span className="block text-sm font-extrabold text-charcoal">Publikasikan ke website</span><span className="mt-1 block text-xs leading-relaxed text-muted">Jika aktif, record kegiatan yang sama langsung tersedia pada /kegiatan. Tidak dibuat salinan data publik.</span></span></label>
          <div className="flex justify-end gap-2 border-t border-border-soft pt-5"><button type="button" onClick={() => setCreateOpen(false)} className="btn btn-secondary">Batal</button><button type="submit" className="btn btn-primary">Simpan Kegiatan</button></div>
        </form>
      </PrototypeModal>

      <div className="mt-6"><AdminPageIntro eyebrow="KEGIATAN ORGANISASI" title="Satu kegiatan menjadi pusat seluruh data operasional." description="Fase, LPJ, status kunci, transaksi, dan publikasi membaca record kegiatan yang sama. Fase Selesai hanya dapat dicapai setelah LPJ disahkan." actions={<button type="button" onClick={() => setCreateOpen(true)} className="btn btn-primary">+ Kegiatan Baru</button>} /></div>

      <section className="mt-5 border border-border-soft bg-white p-4 sm:p-5">
        <div className="grid gap-3 md:grid-cols-[1fr_230px]">
          <label className="flex h-11 items-center border border-border-soft bg-offwhite px-3"><Search size={16} className="mr-2 text-muted" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari kegiatan" className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted/65" /></label>
          <label className="relative flex h-11 items-center border border-border-soft bg-offwhite px-3"><Filter size={16} className="mr-2 text-muted" /><select value={phase} onChange={(event) => setPhase(event.target.value)} className="min-w-0 flex-1 appearance-none bg-transparent pr-7 text-sm font-semibold outline-none">{phases.map((item) => <option key={item}>{item}</option>)}</select><ChevronDown size={15} className="pointer-events-none absolute right-3 text-muted" /></label>
        </div>
      </section>

      <section className="mt-5 grid gap-4 xl:grid-cols-2">
        {filtered.map((activity) => {
          const activityTransactions = transactions.filter((item) => item.activityId === activity.id)
          const recognized = activityTransactions.filter(isRecognizedTransaction)
          const income = recognized.filter((item) => item.kind === 'income').reduce((sum, item) => sum + item.amount, 0)
          const expense = recognized.filter((item) => item.kind === 'expense').reduce((sum, item) => sum + item.amount, 0)
          const assigned = assignments.filter((item) => item.activityId === activity.id).length
          const committeeCount = committeeMembers.filter((item) => item.activityId === activity.id).length
          const mediaForActivity = activityMedia.filter((item) => item.activityId === activity.id)
          const photoCount = mediaForActivity.filter((item) => item.type === 'photo').length
          const videoCount = mediaForActivity.filter((item) => item.type === 'video').length
          return (
            <article key={activity.id} className="border border-border-soft bg-white">
              <div className="border-b border-border-soft px-5 py-5 sm:px-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="eyebrow text-forest">{activity.phase}</p>
                      <span className={`px-2 py-1 text-[0.62rem] font-extrabold uppercase tracking-[0.08em] ${activity.publicVisible ? 'bg-sage/65 text-forest' : 'bg-warmwhite text-muted'}`}>{activity.publicVisible ? 'Publik' : 'Internal'}</span>
                      {activity.financialLocked && <span className="inline-flex items-center gap-1 bg-[#F3E5E0] px-2 py-1 text-[0.62rem] font-extrabold uppercase tracking-[0.08em] text-[#8A4A39]"><LockKeyhole size={12} /> Keuangan Dikunci</span>}
                    </div>
                    <h2 className="mt-2 text-xl font-extrabold leading-tight text-charcoal">{activity.name}</h2>
                    <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted"><span className="inline-flex items-center gap-1.5"><CalendarDays size={14} />{activity.date}</span><span className="inline-flex items-center gap-1.5"><MapPin size={14} />{activity.location}</span><span className="inline-flex items-center gap-1.5"><Users size={14} />{committeeCount} panitia · {assigned} Humas</span><span className="inline-flex items-center gap-1.5"><Images size={14} />{photoCount} foto · {videoCount} video</span></div>
                  </div>
                  <span className="text-2xl font-extrabold text-forest">{activity.progress}%</span>
                </div>
                <div className="mt-4 h-1.5 overflow-hidden bg-sage/60"><div className="h-full bg-forest" style={{ width: `${activity.progress}%` }} /></div>
              </div>
              <div className="grid grid-cols-3 divide-x divide-border-soft border-b border-border-soft">
                <div className="px-4 py-4"><p className="text-[0.62rem] font-bold uppercase tracking-[0.08em] text-muted">Target RAB</p><p className="mt-1 text-sm font-extrabold text-charcoal">{formatCurrency(activity.budgetTarget)}</p></div>
                <div className="px-4 py-4"><p className="text-[0.62rem] font-bold uppercase tracking-[0.08em] text-muted">Pemasukan</p><p className="mt-1 text-sm font-extrabold text-forest">{formatCurrency(income)}</p></div>
                <div className="px-4 py-4"><p className="text-[0.62rem] font-bold uppercase tracking-[0.08em] text-muted">Pengeluaran</p><p className="mt-1 text-sm font-extrabold text-charcoal">{formatCurrency(expense)}</p></div>
              </div>
              <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <label className="flex items-center gap-2 text-xs font-semibold text-muted">Fase:
                  <select disabled={activity.financialLocked} value={activity.phase} onChange={async (event) => { const result = await updateActivityPhase(activity.id, event.target.value, actor); showToast(result.message) }} className="border border-border-soft bg-offwhite px-2.5 py-2 text-xs font-bold text-charcoal outline-none focus:border-forest disabled:cursor-not-allowed disabled:opacity-50">{phases.slice(1).map((item) => <option key={item}>{item}</option>)}</select>
                </label>
                <div className="flex flex-wrap items-center gap-3"><button type="button" onClick={() => { setManagedCommitteeActivityId((current) => current === activity.id ? '' : activity.id); setManagedMediaActivityId('') }} className="inline-flex items-center gap-1.5 text-xs font-extrabold text-forest"><Users size={15} /> {managedCommitteeActivityId === activity.id ? 'Tutup Struktur Panitia' : 'Struktur Panitia'}</button><button type="button" onClick={() => { setManagedMediaActivityId((current) => current === activity.id ? '' : activity.id); setManagedCommitteeActivityId('') }} className="inline-flex items-center gap-1.5 text-xs font-extrabold text-forest"><Images size={15} /> {managedMediaActivityId === activity.id ? 'Tutup Media' : 'Media Kegiatan'}</button><button type="button" onClick={async () => { const result = await updateActivityPublication(activity.id, !activity.publicVisible, actor); showToast(result.message) }} className="inline-flex items-center gap-1.5 text-xs font-extrabold text-forest">{activity.publicVisible ? <EyeOff size={15} /> : <Eye size={15} />} {activity.publicVisible ? 'Sembunyikan' : 'Publikasikan'}</button>{activity.publicVisible && <Link to={`/kegiatan/${activity.id}`} className="inline-flex items-center gap-1.5 text-xs font-extrabold text-forest">Lihat Publik <Eye size={15} /></Link>}</div>
              </div>
              {managedCommitteeActivityId === activity.id && (
                <div className="border-t border-border-soft bg-warmwhite p-4 sm:p-5">
                  <ActivityCommitteeManager activityId={activity.id} onNotify={showToast} />
                </div>
              )}
              {managedMediaActivityId === activity.id && (
                <div className="border-t border-border-soft bg-warmwhite p-4 sm:p-5">
                  <ActivityMediaManager activityId={activity.id} onNotify={showToast} />
                </div>
              )}
            </article>
          )
        })}
      </section>
      {filtered.length === 0 && <div className="mt-5 border border-border-soft bg-white px-5 py-10 text-center text-sm text-muted">Tidak ada kegiatan yang cocok dengan filter.</div>}
    </InternalLayout>
  )
}
