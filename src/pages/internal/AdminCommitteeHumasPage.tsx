import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react'
import {
  ChevronDown,
  Download,
  FileSpreadsheet,
  KeyRound,
  MapPinned,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserRoundCog,
  UserX,
  Users,
} from 'lucide-react'
import InternalLayout from '../../components/internal/InternalLayout'
import InternalNotice from '../../components/internal/InternalNotice'
import AdminPageIntro from '../../components/internal/AdminPageIntro'
import PrototypeModal from '../../components/internal/PrototypeModal'
import PrototypeToast from '../../components/internal/PrototypeToast'
import { isRecordedIncome, useOperations } from '../../prototype/OperationsContext'
import { useAccounts } from '../../prototype/AccountsContext'
import { useAuth } from '../../auth/AuthContext'
import type { ActivityPermission } from '../../auth/types'
import { downloadTargetCsvTemplate, parseTargetImportFile } from '../../utils/targetImport'

const permissionOptions: Array<{ value: ActivityPermission; label: string }> = [
  { value: 'collect_dues', label: 'Penarikan Iuran' },
  { value: 'record_purchases', label: 'Pembelanjaan / Pengeluaran' },
  { value: 'handover_cash', label: 'Serah Terima Kas' },
]

type ModalMode = 'create-account' | 'add-assignment' | 'reset-password' | 'manage-targets' | null

export default function AdminCommitteeHumasPage() {
  const { user } = useAuth()
  const {
    activities,
    assignments,
    collectionTargets,
    communityMembers,
    transactions,
    addCollectionTarget,
    addCollectionTargetsBulk,
    removeCollectionTarget,
  } = useOperations()
  const { humasAccounts, createHumasAccount, addHumasAssignment, setHumasActive, resetHumasPassword, productionAccounts, accountsLoading } = useAccounts()
  const [activityId, setActivityId] = useState('semua')
  const [query, setQuery] = useState('')
  const [modalMode, setModalMode] = useState<ModalMode>(null)
  const [toast, setToast] = useState('')
  const [viewTab, setViewTab] = useState<'akun' | 'penugasan'>('akun')

  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [area, setArea] = useState('RT 01')
  const [selectedActivity, setSelectedActivity] = useState(activities[0]?.id ?? '')
  const [permissions, setPermissions] = useState<ActivityPermission[]>(['collect_dues', 'handover_cash'])

  const [selectedHumasId, setSelectedHumasId] = useState(humasAccounts[0]?.id ?? '')
  const [assignmentActivityId, setAssignmentActivityId] = useState(activities[0]?.id ?? '')
  const [assignmentArea, setAssignmentArea] = useState('RT 01')
  const [assignmentPermissions, setAssignmentPermissions] = useState<ActivityPermission[]>(['collect_dues', 'handover_cash'])
  const [resetUserId, setResetUserId] = useState('')
  const [newPassword, setNewPassword] = useState('')

  const [targetAssignmentId, setTargetAssignmentId] = useState('')
  const [targetName, setTargetName] = useState('')
  const [targetArea, setTargetArea] = useState('')
  const [targetQuery, setTargetQuery] = useState('')
  const [importBusy, setImportBusy] = useState(false)
  const [accountBusy, setAccountBusy] = useState(false)

  const actor = user ? { userId: user.id, name: user.fullName, role: user.role } : undefined

  useEffect(() => {
    if (humasAccounts.length === 0) {
      setSelectedHumasId('')
      return
    }
    if (!humasAccounts.some((item) => item.id === selectedHumasId)) setSelectedHumasId(humasAccounts[0].id)
  }, [humasAccounts, selectedHumasId])

  useEffect(() => {
    if (activities.length === 0) {
      setSelectedActivity('')
      setAssignmentActivityId('')
      return
    }
    if (!activities.some((item) => item.id === selectedActivity)) setSelectedActivity(activities[0].id)
    if (!activities.some((item) => item.id === assignmentActivityId)) setAssignmentActivityId(activities[0].id)
  }, [activities, selectedActivity, assignmentActivityId])

  const filtered = useMemo(() => assignments.filter((item) => {
    const matchesActivity = activityId === 'semua' || item.activityId === activityId
    const normalized = query.trim().toLowerCase()
    const matchesQuery = item.humas.toLowerCase().includes(normalized) || item.area.toLowerCase().includes(normalized)
    return matchesActivity && matchesQuery
  }), [activityId, assignments, query])

  const selectedTargetAssignment = assignments.find((item) => item.id === targetAssignmentId)
  const selectedTargetAccount = humasAccounts.find((item) => item.id === selectedTargetAssignment?.humasUserId)
  const managedTargets = collectionTargets.filter((item) => item.assignmentId === targetAssignmentId)
  const filteredManagedTargets = managedTargets.filter((item) => item.name.toLowerCase().includes(targetQuery.trim().toLowerCase()))

  const targetState = (targetId: string) => {
    const related = transactions.filter((item) => item.targetId === targetId && item.status !== 'Ditolak' && item.status !== 'Dibatalkan')
    const received = related.filter(isRecordedIncome).reduce((sum, item) => sum + item.amount, 0)
    const status = received > 0 ? 'Sudah Berkontribusi' : 'Belum Berkontribusi'
    return { received, status, hasHistory: related.length > 0 }
  }

  const contributedCount = managedTargets.filter((item) => targetState(item.id).status === 'Sudah Berkontribusi').length
  const contributionTotal = managedTargets.reduce((sum, item) => sum + targetState(item.id).received, 0)

  const showToast = (message: string) => {
    setToast(message)
    window.setTimeout(() => setToast(''), 3200)
  }

  const resetCreateForm = () => {
    setEmail('')
    setName('')
    setUsername('')
    setPassword('')
    setPhone('')
    setArea('RT 01')
    setPermissions(['collect_dues', 'handover_cash'])
  }

  const createAccount = async (event: FormEvent) => {
    event.preventDefault()
    const activity = activities.find((item) => item.id === selectedActivity)
    if (!activity) return

    setAccountBusy(true)
    const result = await createHumasAccount({
      email,
      fullName: name,
      username,
      password,
      phone,
      assignment: {
        activityId: activity.id,
        activityName: activity.name,
        areaLabel: area,
        permissions,
      },
    })
    setAccountBusy(false)
    if (!result.ok || !result.account) {
      showToast(result.message)
      return
    }

    setModalMode(null)
    resetCreateForm()
    showToast(result.message)
  }

  const submitAssignment = async (event: FormEvent) => {
    event.preventDefault()
    const account = humasAccounts.find((item) => item.id === selectedHumasId)
    const activity = activities.find((item) => item.id === assignmentActivityId)
    if (!account || !activity) return

    const result = await addHumasAssignment({
      userId: account.id,
      activityId: activity.id,
      activityName: activity.name,
      areaLabel: assignmentArea,
      permissions: assignmentPermissions,
    })
    if (!result.ok) {
      showToast(result.message)
      return
    }


    setModalMode(null)
    showToast(`${account.fullName} mendapat penugasan tambahan.`)
  }

  const submitResetPassword = async (event: FormEvent) => {
    event.preventDefault()
    const account = humasAccounts.find((item) => item.id === resetUserId)
    if (!account) return
    setAccountBusy(true)
    const result = await resetHumasPassword(account.id, newPassword)
    setAccountBusy(false)
    showToast(result.message)
    if (result.ok) {
      setModalMode(null)
      setNewPassword('')
    }
  }

  const toggleHumasAccount = async (userId: string, active: boolean) => {
    setAccountBusy(true)
    const result = await setHumasActive(userId, active)
    setAccountBusy(false)
    showToast(result.message)
  }

  const togglePermission = (permission: ActivityPermission, targetStateName: 'create' | 'assignment') => {
    const setter = targetStateName === 'create' ? setPermissions : setAssignmentPermissions
    const current = targetStateName === 'create' ? permissions : assignmentPermissions

    if (permission === 'handover_cash' && !current.includes('handover_cash')) {
      setter(Array.from(new Set([...current, 'collect_dues', 'handover_cash'])))
      return
    }
    if (permission === 'collect_dues' && current.includes('collect_dues')) {
      setter(current.filter((item) => item !== 'collect_dues' && item !== 'handover_cash'))
      return
    }
    setter(current.includes(permission) ? current.filter((item) => item !== permission) : [...current, permission])
  }

  const openTargetManager = (assignmentId: string) => {
    const assignment = assignments.find((item) => item.id === assignmentId)
    if (!assignment || !assignment.permissions.includes('Iuran')) {
      showToast('Kelola Daftar Warga Iuran hanya tersedia untuk penugasan dengan izin Penarikan Iuran.')
      return
    }
    setTargetAssignmentId(assignment.id)
    setTargetName('')
    setTargetArea(assignment.area)
    setTargetQuery('')
    setModalMode('manage-targets')
  }

  const submitTarget = async (event: FormEvent) => {
    event.preventDefault()
    if (!selectedTargetAssignment) return
    const result = await addCollectionTarget({
      activityId: selectedTargetAssignment.activityId,
      assignmentId: selectedTargetAssignment.id,
      name: targetName,
      area: targetArea || selectedTargetAssignment.area,
    }, actor)
    showToast(result.message)
    if (result.ok) {
      setTargetName('')
      }
  }

  const importTargets = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || !selectedTargetAssignment) return
    setImportBusy(true)
    try {
      const rows = await parseTargetImportFile(file)
      const result = await addCollectionTargetsBulk(rows.map((row) => ({
        activityId: selectedTargetAssignment.activityId,
        assignmentId: selectedTargetAssignment.id,
        name: row.name,
        area: row.area || selectedTargetAssignment.area,
      })), actor)
      showToast(result.message)
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'File daftar warga iuran gagal dibaca.')
    } finally {
      setImportBusy(false)
    }
  }

  const deleteTarget = async (id: string) => {
    const result = await removeCollectionTarget(id, actor)
    showToast(result.message)
  }


  return (
    <InternalLayout title="Humas & Warga" subtitle="Kelola akun Humas, penugasan lapangan, wilayah, tugas, dan daftar warga per kegiatan.">
      <InternalNotice />
      <PrototypeToast message={toast} />

      <PrototypeModal open={modalMode === 'create-account'} onClose={() => setModalMode(null)} title="Buat akun Humas" description="Buat akun Humas baru dan atur aksesnya.">
        <form onSubmit={createAccount} className="space-y-5">
          <label className="block"><span className="text-xs font-extrabold uppercase tracking-[0.08em] text-muted">Email login</span><input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="humas@email.com" className="mt-2 h-11 w-full border border-border-soft bg-white px-3 text-sm outline-none focus:border-forest" /></label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block"><span className="text-xs font-extrabold uppercase tracking-[0.08em] text-muted">Nama lengkap</span><input required value={name} onChange={(event) => setName(event.target.value)} placeholder="Contoh: Budi Santoso" className="mt-2 h-11 w-full border border-border-soft bg-white px-3 text-sm outline-none focus:border-forest" /></label>
            <label className="block"><span className="text-xs font-extrabold uppercase tracking-[0.08em] text-muted">Username</span><input required value={username} onChange={(event) => setUsername(event.target.value)} placeholder="Contoh: budi.rt01" className="mt-2 h-11 w-full border border-border-soft bg-white px-3 text-sm outline-none focus:border-forest" /></label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block"><span className="text-xs font-extrabold uppercase tracking-[0.08em] text-muted">Password awal</span><input required type="password" minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Minimal 6 karakter" className="mt-2 h-11 w-full border border-border-soft bg-white px-3 text-sm outline-none focus:border-forest" /></label>
            <label className="block"><span className="text-xs font-extrabold uppercase tracking-[0.08em] text-muted">WhatsApp opsional</span><input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="08xxxxxxxxxx" className="mt-2 h-11 w-full border border-border-soft bg-white px-3 text-sm outline-none focus:border-forest" /></label>
          </div>
          <label className="block"><span className="text-xs font-extrabold uppercase tracking-[0.08em] text-muted">Kegiatan pertama</span><select value={selectedActivity} onChange={(event) => setSelectedActivity(event.target.value)} className="mt-2 h-11 w-full border border-border-soft bg-white px-3 text-sm font-semibold outline-none focus:border-forest">{activities.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          <label className="block"><span className="text-xs font-extrabold uppercase tracking-[0.08em] text-muted">Wilayah / tugas</span><input value={area} onChange={(event) => setArea(event.target.value)} placeholder="RT 01 / Tim Pembelanjaan" className="mt-2 h-11 w-full border border-border-soft bg-white px-3 text-sm outline-none focus:border-forest" /><p className="mt-1 text-[0.68rem] text-muted">Penarikan iuran bersifat sukarela. Humas tidak diberi target rupiah.</p></label>
          <fieldset><legend className="text-xs font-extrabold uppercase tracking-[0.08em] text-muted">Hak Tugas</legend><div className="mt-3 grid gap-2 sm:grid-cols-3">{permissionOptions.map((item) => <label key={item.value} className={`flex cursor-pointer items-center gap-2 border px-3 py-3 text-sm font-semibold ${permissions.includes(item.value) ? 'border-forest bg-sage/45 text-forest' : 'border-border-soft bg-white text-muted'}`}><input type="checkbox" checked={permissions.includes(item.value)} onChange={() => togglePermission(item.value, 'create')} className="accent-[#123D32]" />{item.label}</label>)}</div></fieldset>
          <div className="flex justify-end gap-2 border-t border-border-soft pt-5"><button type="button" onClick={() => setModalMode(null)} className="btn btn-secondary">Batal</button><button type="submit" disabled={accountBusy} className="btn btn-primary disabled:opacity-50">{accountBusy ? 'Memproses…' : 'Buat Akun'}</button></div>
        </form>
      </PrototypeModal>

      <PrototypeModal open={modalMode === 'add-assignment'} onClose={() => setModalMode(null)} title="Tambah penugasan Humas" description="Satu akun dapat mempunyai tugas berbeda pada kegiatan berbeda tanpa membuat akun baru.">
        <form onSubmit={submitAssignment} className="space-y-5">
          <label className="block"><span className="text-xs font-extrabold uppercase tracking-[0.08em] text-muted">Humas</span><select value={selectedHumasId} onChange={(event) => setSelectedHumasId(event.target.value)} className="mt-2 h-11 w-full border border-border-soft bg-white px-3 text-sm font-semibold outline-none focus:border-forest">{humasAccounts.map((item) => <option key={item.id} value={item.id}>{item.fullName} · @{item.username}</option>)}</select></label>
          <label className="block"><span className="text-xs font-extrabold uppercase tracking-[0.08em] text-muted">Kegiatan</span><select value={assignmentActivityId} onChange={(event) => setAssignmentActivityId(event.target.value)} className="mt-2 h-11 w-full border border-border-soft bg-white px-3 text-sm font-semibold outline-none focus:border-forest">{activities.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          <label className="block"><span className="text-xs font-extrabold uppercase tracking-[0.08em] text-muted">Wilayah / tugas</span><input value={assignmentArea} onChange={(event) => setAssignmentArea(event.target.value)} className="mt-2 h-11 w-full border border-border-soft bg-white px-3 text-sm outline-none focus:border-forest" /><p className="mt-1 text-[0.68rem] text-muted">Jika bertugas menarik iuran, Humas diberi daftar warga/wilayah tanpa target nominal.</p></label>
          <fieldset><legend className="text-xs font-extrabold uppercase tracking-[0.08em] text-muted">Hak Tugas</legend><div className="mt-3 grid gap-2 sm:grid-cols-3">{permissionOptions.map((item) => <label key={item.value} className={`flex cursor-pointer items-center gap-2 border px-3 py-3 text-sm font-semibold ${assignmentPermissions.includes(item.value) ? 'border-forest bg-sage/45 text-forest' : 'border-border-soft bg-white text-muted'}`}><input type="checkbox" checked={assignmentPermissions.includes(item.value)} onChange={() => togglePermission(item.value, 'assignment')} className="accent-[#123D32]" />{item.label}</label>)}</div></fieldset>
          <div className="flex justify-end gap-2 border-t border-border-soft pt-5"><button type="button" onClick={() => setModalMode(null)} className="btn btn-secondary">Batal</button><button type="submit" className="btn btn-primary">Simpan Penugasan</button></div>
        </form>
      </PrototypeModal>

      <PrototypeModal open={modalMode === 'reset-password'} onClose={() => setModalMode(null)} title="Reset password Humas" description="Atur kata sandi baru tanpa menghapus riwayat akun.">
        <form onSubmit={submitResetPassword} className="space-y-5">
          <div className="border border-border-soft bg-warmwhite p-4 text-sm"><p className="font-extrabold text-charcoal">{humasAccounts.find((item) => item.id === resetUserId)?.fullName ?? 'Humas'}</p><p className="mt-1 text-xs text-muted">@{humasAccounts.find((item) => item.id === resetUserId)?.username ?? '-'}</p></div>
          <label className="block"><span className="text-xs font-extrabold uppercase tracking-[0.08em] text-muted">Password baru</span><input required type="password" minLength={6} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} className="mt-2 h-11 w-full border border-border-soft bg-white px-3 text-sm outline-none focus:border-forest" /></label>
          <button type="submit" disabled={accountBusy} className="btn btn-primary w-full justify-center disabled:opacity-50">{accountBusy ? 'Memproses…' : 'Reset Password'}</button>
        </form>
      </PrototypeModal>


      <PrototypeModal open={modalMode === 'manage-targets'} onClose={() => setModalMode(null)} title="Kelola Daftar Warga Iuran" description="Admin menentukan daftar warga/keluarga per kegiatan dan Humas. Iuran bersifat sukarela, jadi tidak ada target nominal per Humas maupun per warga.">
        {selectedTargetAssignment && (
          <div className="space-y-6">
            <div className="border border-border-soft bg-white p-4">
              <p className="text-sm font-extrabold text-charcoal">{selectedTargetAssignment.humas}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted">{selectedTargetAssignment.activity} · {selectedTargetAssignment.area}</p>
              <div className="mt-4 grid grid-cols-2 gap-px bg-border-soft sm:grid-cols-4">
                <div className="bg-offwhite p-3"><p className="text-[0.62rem] font-bold uppercase tracking-[0.08em] text-muted">Warga Ditugaskan</p><p className="mt-1 text-sm font-extrabold text-charcoal">{managedTargets.length}</p></div>
                <div className="bg-offwhite p-3"><p className="text-[0.62rem] font-bold uppercase tracking-[0.08em] text-muted">Sudah Berkontribusi</p><p className="mt-1 text-sm font-extrabold text-forest">{contributedCount}</p></div>
                <div className="bg-offwhite p-3"><p className="text-[0.62rem] font-bold uppercase tracking-[0.08em] text-muted">Belum Berkontribusi</p><p className="mt-1 text-sm font-extrabold text-[#7A5B21]">{Math.max(0, managedTargets.length - contributedCount)}</p></div>
                <div className="bg-offwhite p-3"><p className="text-[0.62rem] font-bold uppercase tracking-[0.08em] text-muted">Total Iuran</p><p className="mt-1 text-sm font-extrabold text-forest">Rp {new Intl.NumberFormat('id-ID').format(contributionTotal)}</p></div>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-muted">Progress penarikan dihitung dari jumlah warga yang sudah berkontribusi, bukan dari target rupiah.</p>
            </div>

            <form onSubmit={submitTarget} className="border border-border-soft bg-warmwhite p-4">
              <div className="flex items-center justify-between gap-3"><div><p className="text-sm font-extrabold text-charcoal">Tambah warga satu per satu</p><p className="mt-1 text-xs text-muted">Warga langsung muncul pada akun Humas yang ditugaskan. Nominal iuran diisi saat warga berkontribusi.</p></div><Plus size={18} className="text-forest" /></div>
              <div className="mt-4">
                <label className="block"><span className="text-[0.62rem] font-extrabold uppercase tracking-[0.08em] text-muted">Nama warga / keluarga</span><input required list="community-target-names" value={targetName} onChange={(event) => setTargetName(event.target.value)} placeholder="Keluarga Bapak Ahmad" className="mt-2 h-11 w-full border border-border-soft bg-white px-3 text-sm outline-none focus:border-forest" /><datalist id="community-target-names">{communityMembers.map((member) => <option key={member.id} value={member.name}>{member.area}</option>)}</datalist><p className="mt-1 text-[0.68rem] text-muted">Pilih nama yang pernah terdaftar atau ketik nama baru. Tidak ada nominal target per warga. Nama baru akan otomatis ditambahkan ke daftar warga.</p></label>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end"><label className="block"><span className="text-[0.62rem] font-extrabold uppercase tracking-[0.08em] text-muted">Wilayah / RT</span><input value={targetArea} onChange={(event) => setTargetArea(event.target.value)} placeholder={selectedTargetAssignment.area} className="mt-2 h-11 w-full border border-border-soft bg-white px-3 text-sm outline-none focus:border-forest" /></label><button type="submit" className="btn btn-primary h-11 justify-center"><Plus size={15} /> Tambah Warga</button></div>
            </form>

            <div className="border border-border-soft bg-white p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-extrabold text-charcoal">Tambah banyak / Import Excel & CSV</p><p className="mt-1 text-xs leading-relaxed text-muted">Kolom yang dibaca: Nama dan Wilayah. File .xlsx dan .csv didukung pada browser modern Android/desktop.</p></div><button type="button" onClick={downloadTargetCsvTemplate} className="inline-flex items-center gap-2 border border-border-soft px-3 py-2 text-xs font-extrabold text-forest"><Download size={14} /> Template CSV</button></div>
              <label className={`mt-4 flex min-h-24 cursor-pointer items-center justify-center border border-dashed px-4 text-center ${importBusy ? 'border-muted/30 bg-warmwhite text-muted' : 'border-forest/35 bg-sage/20 text-forest'}`}><input type="file" accept=".xlsx,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={importTargets} disabled={importBusy} className="sr-only" /><span><FileSpreadsheet size={20} className="mx-auto" /><span className="mt-2 block text-xs font-extrabold">{importBusy ? 'Membaca file…' : 'Pilih file .XLSX atau .CSV'}</span><span className="mt-1 block text-[0.68rem] font-medium text-muted">Duplikat nama pada kegiatan yang sama otomatis dilewati.</span></span></label>
            </div>

            <div className="border border-border-soft bg-white">
              <div className="flex flex-col gap-3 border-b border-border-soft p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-extrabold text-charcoal">Daftar warga aktif</p><p className="mt-1 text-xs text-muted">{managedTargets.length} warga/keluarga · {selectedTargetAccount?.fullName ?? selectedTargetAssignment.humas}</p></div><label className="flex h-10 items-center border border-border-soft bg-offwhite px-3 sm:w-64"><Search size={15} className="mr-2 text-muted" /><input value={targetQuery} onChange={(event) => setTargetQuery(event.target.value)} placeholder="Cari warga" className="min-w-0 flex-1 bg-transparent text-sm outline-none" /></label></div>
              <div className="max-h-72 divide-y divide-border-soft overflow-y-auto">
                {filteredManagedTargets.length ? filteredManagedTargets.map((item) => {
                  const state = targetState(item.id)
                  const statusClass = state.status === 'Sudah Berkontribusi' ? 'bg-sage/65 text-forest' : 'bg-warmwhite text-muted'
                  return <div key={item.id} className="grid gap-3 px-4 py-4 sm:grid-cols-[1fr_150px_auto] sm:items-center"><div><p className="text-sm font-extrabold text-charcoal">{item.name}</p><p className="mt-1 text-xs text-muted">{item.area} · Iuran diterima Rp {new Intl.NumberFormat('id-ID').format(state.received)}</p></div><span className={`w-fit px-2.5 py-1 text-[0.62rem] font-extrabold uppercase tracking-[0.08em] ${statusClass}`}>{state.status}</span><button type="button" onClick={() => deleteTarget(item.id)} disabled={state.hasHistory} title={state.hasHistory ? 'Warga dengan histori transaksi tidak dapat dihapus' : 'Hapus warga'} className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#93483F] disabled:cursor-not-allowed disabled:text-muted/35"><Trash2 size={14} /> Hapus</button></div>
                }) : <p className="px-4 py-8 text-sm text-muted">Belum ada warga yang cocok.</p>}
              </div>
            </div>
          </div>
        )}
      </PrototypeModal>

      <div className="mt-6"><AdminPageIntro eyebrow="HUMAS & WARGA" title="Fokus pada petugas lapangan dan warga yang menjadi tanggung jawabnya." description="Panitia kegiatan dikelola dari menu Kegiatan. Di sini Admin mengelola akun Humas, penugasan, wilayah, hak tugas, dan daftar warga iuran." actions={<div className="flex flex-wrap gap-2"><button type="button" onClick={() => setModalMode('add-assignment')} className="btn btn-secondary"><UserRoundCog size={16} /> Tambah Penugasan</button><button type="button" onClick={() => setModalMode('create-account')} className="btn btn-primary"><Plus size={16} /> Buat Akun Humas</button></div>} /></div>

      <div className="mt-5 flex gap-1 border-b border-border-soft bg-white px-3 pt-3"><button type="button" onClick={() => setViewTab('akun')} className={`border-b-2 px-4 py-3 text-sm font-extrabold ${viewTab === 'akun' ? 'border-forest text-forest' : 'border-transparent text-muted'}`}>Akun Humas</button><button type="button" onClick={() => setViewTab('penugasan')} className={`border-b-2 px-4 py-3 text-sm font-extrabold ${viewTab === 'penugasan' ? 'border-forest text-forest' : 'border-transparent text-muted'}`}>Penugasan & Warga</button></div>

      <section className="mt-5 grid gap-4 md:grid-cols-3">
        <div className="border border-border-soft bg-white p-5"><Users size={19} className="text-forest" /><p className="mt-4 text-2xl font-extrabold text-charcoal">{humasAccounts.filter((item) => item.isActive).length}</p><p className="mt-1 text-xs text-muted">Akun Humas aktif</p></div>
        <div className="border border-border-soft bg-white p-5"><MapPinned size={19} className="text-forest" /><p className="mt-4 text-2xl font-extrabold text-charcoal">{new Set(assignments.map((item) => item.area)).size}</p><p className="mt-1 text-xs text-muted">Wilayah / jenis tugas</p></div>
        <div className="border border-border-soft bg-white p-5"><ShieldCheck size={19} className="text-forest" /><p className="mt-4 text-2xl font-extrabold text-charcoal">{collectionTargets.length}</p><p className="mt-1 text-xs text-muted">Warga iuran terdaftar</p></div>
      </section>

      {viewTab === 'akun' && <>
      <section className="mt-5 border border-border-soft bg-white">
        <div className="border-b border-border-soft px-5 py-5 sm:px-6"><p className="eyebrow text-forest">AKUN HUMAS</p><h2 className="mt-2 text-xl font-extrabold text-charcoal">Login dibuat dan dikontrol Admin.</h2><p className="mt-2 text-xs leading-relaxed text-muted">Menonaktifkan akun tidak menghapus histori transaksi lama. Riwayat laporan tetap terhubung ke akun yang sama.</p><p className="mt-2 text-xs font-semibold text-forest">{productionAccounts ? 'Akun login aktif' : 'Mode uji akun'}</p></div>
        <div className="divide-y divide-border-soft">
          {accountsLoading && <p className="px-6 py-6 text-sm text-muted">Memuat akun Humas…</p>}
          {!accountsLoading && humasAccounts.length === 0 && <p className="px-6 py-6 text-sm text-muted">Belum ada akun Humas.</p>}
          {humasAccounts.map((account) => (
            <div key={account.id} className="grid gap-4 px-5 py-5 xl:grid-cols-[1fr_180px_1.2fr_auto] xl:items-center sm:px-6">
              <div><div className="flex items-center gap-2"><p className="text-sm font-extrabold text-charcoal">{account.fullName}</p><span className={`px-2 py-0.5 text-[0.6rem] font-extrabold uppercase tracking-[0.08em] ${account.isActive ? 'bg-sage/65 text-forest' : 'bg-[#F3E3E0] text-[#8A473E]'}`}>{account.isActive ? 'Aktif' : 'Nonaktif'}</span></div><p className="mt-1 text-xs text-muted">@{account.username}</p></div>
              <div><p className="text-[0.62rem] font-bold uppercase tracking-[0.08em] text-muted">Penugasan</p><p className="mt-1 text-sm font-extrabold text-charcoal">{account.assignments.length} kegiatan</p></div>
              <div className="flex flex-wrap gap-1.5">{Array.from(new Set(account.assignments.flatMap((assignment) => assignment.permissions))).map((permission) => <span key={permission} className="bg-warmwhite px-2.5 py-1 text-[0.65rem] font-bold text-muted">{permissionOptions.find((item) => item.value === permission)?.label}</span>)}</div>
              <div className="flex flex-wrap gap-2 xl:justify-end"><button type="button" onClick={() => { setResetUserId(account.id); setNewPassword(''); setModalMode('reset-password') }} className="inline-flex items-center gap-1.5 border border-border-soft bg-white px-3 py-2 text-xs font-extrabold text-forest"><KeyRound size={14} /> Reset</button><button type="button" disabled={accountBusy} onClick={() => void toggleHumasAccount(account.id, !account.isActive)} className={`inline-flex items-center gap-1.5 border px-3 py-2 text-xs font-extrabold disabled:opacity-50 ${account.isActive ? 'border-[#D7B4B0] text-[#93483F]' : 'border-forest text-forest'}`}>{account.isActive ? <UserX size={14} /> : <UserCheck size={14} />}{account.isActive ? 'Nonaktifkan' : 'Aktifkan'}</button></div>
            </div>
          ))}
        </div>
      </section>


      </>}

      {viewTab === 'penugasan' && <>
      <section className="mt-5 border border-border-soft bg-white">
        <div className="border-b border-border-soft px-5 py-5 sm:px-6"><p className="eyebrow text-forest">PENUGASAN & DAFTAR WARGA IURAN</p><h2 className="mt-2 text-xl font-extrabold text-charcoal">Kelola siapa menarik iuran dan warga mana yang menjadi tanggung jawabnya.</h2><p className="mt-2 text-xs leading-relaxed text-muted">Untuk penugasan Iuran, Admin menentukan daftar warga/keluarga yang muncul di akun Humas. Iuran tidak dipatok nominalnya.</p></div>
        <div className="grid gap-3 border-b border-border-soft p-4 md:grid-cols-[1fr_320px] sm:p-5"><label className="flex h-11 items-center border border-border-soft bg-offwhite px-3"><Search size={16} className="mr-2 text-muted" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari nama Humas atau wilayah" className="min-w-0 flex-1 bg-transparent text-sm outline-none" /></label><label className="relative flex h-11 items-center border border-border-soft bg-offwhite px-3"><select value={activityId} onChange={(event) => setActivityId(event.target.value)} className="w-full appearance-none bg-transparent pr-7 text-sm font-semibold outline-none"><option value="semua">Semua kegiatan</option>{activities.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><ChevronDown size={15} className="pointer-events-none absolute right-3 text-muted" /></label></div>
        <div className="divide-y divide-border-soft">
          {filtered.map((item) => {
            const hasCollection = item.permissions.includes('Iuran')
            const count = collectionTargets.filter((targetItem) => targetItem.assignmentId === item.id).length
            return <div key={item.id} className="grid gap-4 px-5 py-5 lg:grid-cols-[170px_1fr_110px_210px_130px_auto] lg:items-center sm:px-6">
              <div><p className="text-sm font-extrabold text-charcoal">{item.humas}</p><p className="mt-1 text-xs text-muted">ID: {item.humasUserId}</p></div>
              <p className="text-sm text-charcoal">{item.activity}</p>
              <span className="w-fit bg-sage/55 px-2.5 py-1 text-[0.65rem] font-extrabold uppercase tracking-[0.08em] text-forest">{item.area}</span>
              <p className="text-xs leading-relaxed text-muted">{item.permissions.join(' · ')}</p>
              <div><p className="text-sm font-extrabold text-forest">{hasCollection ? `${count} warga/keluarga` : 'Tanpa daftar iuran'}</p>{hasCollection && <p className="mt-1 text-[0.65rem] text-muted">Tanpa target rupiah</p>}</div>
              {hasCollection ? <button type="button" onClick={() => openTargetManager(item.id)} className="inline-flex items-center justify-center gap-1.5 border border-forest px-3 py-2 text-xs font-extrabold text-forest hover:bg-sage/35"><Users size={14} /> Kelola Warga</button> : <span className="text-xs font-semibold text-muted">Bukan penarik</span>}
            </div>
          })}
        </div>
      </section>
      </>}
    </InternalLayout>
  )
}
