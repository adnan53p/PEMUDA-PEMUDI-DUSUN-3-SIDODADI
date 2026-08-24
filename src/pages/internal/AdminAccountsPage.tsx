import { useState, type FormEvent } from 'react'
import { KeyRound, ShieldCheck, UserPlus, Users } from 'lucide-react'
import InternalLayout from '../../components/internal/InternalLayout'
import InternalNotice from '../../components/internal/InternalNotice'
import PrototypeModal from '../../components/internal/PrototypeModal'
import PrototypeToast from '../../components/internal/PrototypeToast'
import { useAccounts } from '../../prototype/AccountsContext'

export default function AdminAccountsPage() {
  const { adminAccounts, createAdminAccount, resetAdminPassword, setAdminActive, productionAccounts, accountsLoading } = useAccounts()
  const [createOpen, setCreateOpen] = useState(false)
  const [resetId, setResetId] = useState('')
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [resetPassword, setResetPassword] = useState('')
  const [toast, setToast] = useState('')
  const [busy, setBusy] = useState(false)

  const showToast = (message: string) => {
    setToast(message)
    window.setTimeout(() => setToast(''), 3000)
  }

  const submitCreate = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true)
    const result = await createAdminAccount({ email, fullName, username, password, phone })
    setBusy(false)
    showToast(result.message)
    if (!result.ok) return
    setCreateOpen(false)
    setEmail('')
    setFullName('')
    setUsername('')
    setPassword('')
    setPhone('')
  }

  const submitReset = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true)
    const result = await resetAdminPassword(resetId, resetPassword)
    setBusy(false)
    showToast(result.message)
    if (!result.ok) return
    setResetId('')
    setResetPassword('')
  }

  const toggleAdmin = async (id: string, active: boolean) => {
    setBusy(true)
    const result = await setAdminActive(id, active)
    setBusy(false)
    showToast(result.message)
  }

  return (
    <InternalLayout title="Akun Admin" subtitle="Superadmin menentukan siapa yang boleh mengelola operasional organisasi.">
      <InternalNotice />
      <PrototypeToast message={toast} />

      <PrototypeModal open={createOpen} onClose={() => setCreateOpen(false)} title="Tambah akun Admin" description="Akun dibuat di Supabase Auth dan role Admin diverifikasi server-side sebelum dapat login.">
        <form onSubmit={submitCreate} className="space-y-4">
          <label className="block"><span className="text-xs font-extrabold uppercase tracking-[0.08em] text-muted">Email login</span><input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="admin@email.com" className="mt-2 h-11 w-full border border-border-soft bg-white px-3 text-sm outline-none focus:border-forest" /></label>
          <label className="block"><span className="text-xs font-extrabold uppercase tracking-[0.08em] text-muted">Nama lengkap</span><input required value={fullName} onChange={(event) => setFullName(event.target.value)} className="mt-2 h-11 w-full border border-border-soft bg-white px-3 text-sm outline-none focus:border-forest" /></label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block"><span className="text-xs font-extrabold uppercase tracking-[0.08em] text-muted">Username</span><input required autoComplete="off" value={username} onChange={(event) => setUsername(event.target.value)} className="mt-2 h-11 w-full border border-border-soft bg-white px-3 text-sm outline-none focus:border-forest" /></label>
            <label className="block"><span className="text-xs font-extrabold uppercase tracking-[0.08em] text-muted">Password awal</span><input required type="password" minLength={6} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 h-11 w-full border border-border-soft bg-white px-3 text-sm outline-none focus:border-forest" /></label>
          </div>
          <label className="block"><span className="text-xs font-extrabold uppercase tracking-[0.08em] text-muted">WhatsApp / Telepon opsional</span><input value={phone} onChange={(event) => setPhone(event.target.value)} className="mt-2 h-11 w-full border border-border-soft bg-white px-3 text-sm outline-none focus:border-forest" /></label>
          <div className={`border p-4 text-xs leading-relaxed ${productionAccounts ? 'border-[#CEE0D4] bg-[#F4FAF6] text-forest' : 'border-[#E8D8B7] bg-[#FFF9EC] text-[#6F5830]'}`}>{productionAccounts ? 'Mode produksi: pembuatan akun, reset password, dan status aktif diproses melalui Supabase Edge Function yang memverifikasi role Superadmin.' : 'Mode prototype: perubahan akun hanya tersimpan selama sesi browser.'}</div>
          <div className="flex justify-end gap-2 border-t border-border-soft pt-5"><button type="button" className="btn btn-secondary" onClick={() => setCreateOpen(false)}>Batal</button><button type="submit" disabled={busy} className="btn btn-primary disabled:opacity-50">{busy ? 'Memproses…' : 'Buat Admin'}</button></div>
        </form>
      </PrototypeModal>

      <PrototypeModal open={Boolean(resetId)} onClose={() => { setResetId(''); setResetPassword('') }} title="Reset password Admin" description="Histori operasional tidak berubah karena identitas akun tetap memakai user ID yang sama.">
        <form onSubmit={submitReset} className="space-y-4">
          <label className="block"><span className="text-xs font-extrabold uppercase tracking-[0.08em] text-muted">Password baru</span><input required type="password" minLength={6} autoComplete="new-password" value={resetPassword} onChange={(event) => setResetPassword(event.target.value)} className="mt-2 h-11 w-full border border-border-soft bg-white px-3 text-sm outline-none focus:border-forest" /></label>
          <div className="flex justify-end gap-2"><button type="button" className="btn btn-secondary" onClick={() => { setResetId(''); setResetPassword('') }}>Batal</button><button type="submit" disabled={busy} className="btn btn-primary disabled:opacity-50">{busy ? 'Memproses…' : 'Reset Password'}</button></div>
        </form>
      </PrototypeModal>

      <section className="mt-6 border border-border-soft bg-white">
        <div className="flex flex-col gap-4 border-b border-border-soft px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex gap-4"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sage/60 text-forest"><Users size={18} /></span><div><p className="eyebrow text-forest">ADMIN OPERASIONAL</p><h2 className="mt-2 text-xl font-extrabold text-charcoal">Akun yang mengelola kegiatan dan keuangan.</h2></div></div>
          <button type="button" onClick={() => setCreateOpen(true)} className="btn btn-primary"><UserPlus size={16} /> Tambah Admin</button>
        </div>
        <div className="divide-y divide-border-soft">
          {accountsLoading && <p className="px-6 py-6 text-sm text-muted">Memuat akun dari Supabase…</p>}
          {!accountsLoading && adminAccounts.length === 0 && <p className="px-6 py-6 text-sm text-muted">Belum ada akun Admin.</p>}
          {adminAccounts.map((item) => (
            <div key={item.id} className="grid gap-4 px-5 py-5 md:grid-cols-[1fr_0.8fr_auto] md:items-center sm:px-6">
              <div><p className="text-sm font-extrabold text-charcoal">{item.fullName}</p><p className="mt-1 text-xs text-muted">@{item.username} · ID {item.id}</p>{item.phone && <p className="mt-1 text-xs text-muted">{item.phone}</p>}</div>
              <div><span className={`inline-flex px-2.5 py-1 text-[0.65rem] font-extrabold uppercase tracking-[0.08em] ${item.isActive ? 'bg-sage/65 text-forest' : 'bg-warmwhite text-muted'}`}>{item.isActive ? 'Aktif' : 'Nonaktif'}</span><p className="mt-2 text-xs leading-relaxed text-muted">Kegiatan · Panitia · Humas · RAB · Keuangan · Verifikasi · Laporan · LPJ.</p></div>
              <div className="flex flex-wrap gap-2 md:justify-end"><button type="button" disabled={busy} onClick={() => setResetId(item.id)} className="inline-flex h-9 items-center gap-1.5 border border-border-soft bg-white px-3 text-xs font-extrabold text-forest disabled:opacity-50"><KeyRound size={14} /> Reset</button><button type="button" disabled={busy} onClick={() => void toggleAdmin(item.id, !item.isActive)} className="h-9 border border-border-soft bg-white px-3 text-xs font-extrabold text-forest disabled:opacity-50">{item.isActive ? 'Nonaktifkan' : 'Aktifkan'}</button></div>
            </div>
          ))}
        </div>
        <div className="flex gap-3 border-t border-border-soft bg-warmwhite px-5 py-4 text-xs leading-relaxed text-muted sm:px-6"><ShieldCheck size={16} className="shrink-0 text-forest" /> {productionAccounts ? 'Akun Admin menggunakan Supabase Auth. Secret/service-role tidak pernah disimpan di frontend; operasi sensitif dijalankan server-side.' : 'Mode prototype aktif karena Supabase belum dikonfigurasi.'}</div>
      </section>
    </InternalLayout>
  )
}
