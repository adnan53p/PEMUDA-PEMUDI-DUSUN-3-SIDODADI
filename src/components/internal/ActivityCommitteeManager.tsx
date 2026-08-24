import { useState, type FormEvent } from 'react'
import { Pencil, Plus, Trash2, Users } from 'lucide-react'
import { useAuth } from '../../auth/AuthContext'
import { useOperations } from '../../prototype/OperationsContext'
import PrototypeModal from './PrototypeModal'

const committeeRoles = ['Ketua Panitia', 'Wakil Ketua', 'Sekretaris', 'Bendahara', 'Koordinator Acara', 'Koordinator Perlengkapan', 'Koordinator Konsumsi', 'Koordinator Humas', 'Koordinator Keamanan', 'Koordinator Dokumentasi', 'Seksi Acara', 'Seksi Perlengkapan', 'Seksi Konsumsi', 'Seksi Humas', 'Seksi Keamanan', 'Seksi Dokumentasi']

export default function ActivityCommitteeManager({ activityId, onNotify }: { activityId: string; onNotify: (message: string) => void }) {
  const { user } = useAuth()
  const { activities, committeeMembers, addCommitteeMember, updateCommitteeMember, removeCommitteeMember } = useOperations()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [role, setRole] = useState(committeeRoles[0])
  const [phone, setPhone] = useState('')
  const activity = activities.find((item) => item.id === activityId)
  const members = committeeMembers.filter((item) => item.activityId === activityId)
  const locked = Boolean(activity?.financialLocked)
  const actor = user ? { userId: user.id, name: user.fullName, role: user.role } : undefined

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const result = await addCommitteeMember({ activityId, name, role, phone }, actor)
    onNotify(result.message)
    if (result.ok) {
      setName('')
      setPhone('')
      setOpen(false)
    }
  }

  return (
    <section className="border border-border-soft bg-white">
      <PrototypeModal open={open} onClose={() => setOpen(false)} title="Tambah panitia kegiatan" description={`Panitia disimpan langsung pada ${activity?.name ?? 'kegiatan'} dan menjadi sumber yang sama untuk LPJ.`}>
        <form onSubmit={submit} className="space-y-4">
          <label className="block"><span className="text-xs font-extrabold uppercase tracking-[0.08em] text-muted">Nama</span><input required value={name} onChange={(event) => setName(event.target.value)} className="mt-2 h-11 w-full border border-border-soft bg-white px-3 text-sm outline-none focus:border-forest" /></label>
          <label className="block"><span className="text-xs font-extrabold uppercase tracking-[0.08em] text-muted">Jabatan / Bidang</span><input required list={`committee-role-suggestions-${activityId}`} value={role} onChange={(event) => setRole(event.target.value)} placeholder="Contoh: Koordinator Lomba Anak" className="mt-2 h-11 w-full border border-border-soft bg-white px-3 text-sm font-semibold outline-none focus:border-forest" /><datalist id={`committee-role-suggestions-${activityId}`}>{committeeRoles.map((item) => <option key={item} value={item} />)}</datalist><span className="mt-1.5 block text-[0.7rem] leading-relaxed text-muted">Boleh pilih saran atau ketik jabatan sendiri. Struktur setiap kegiatan dapat berbeda.</span></label>
          <label className="block"><span className="text-xs font-extrabold uppercase tracking-[0.08em] text-muted">WhatsApp opsional</span><input value={phone} onChange={(event) => setPhone(event.target.value)} className="mt-2 h-11 w-full border border-border-soft bg-white px-3 text-sm outline-none focus:border-forest" /></label>
          <button type="submit" disabled={locked} className="btn btn-primary w-full justify-center disabled:cursor-not-allowed disabled:opacity-50"><Plus size={15} /> Tambah Panitia</button>
        </form>
      </PrototypeModal>

      <div className="flex flex-col gap-4 border-b border-border-soft px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <p className="eyebrow text-forest">STRUKTUR KEPANITIAAN</p>
          <h3 className="mt-2 text-lg font-extrabold text-charcoal">{activity?.name ?? 'Kegiatan'}</h3>
          <p className="mt-1 text-xs text-muted">{members.length} anggota · Struktur ini khusus untuk kegiatan ini dan tidak digunakan otomatis pada kegiatan lain.</p>
        </div>
        <button type="button" disabled={locked} onClick={() => setOpen(true)} className="btn btn-secondary disabled:cursor-not-allowed disabled:opacity-50"><Users size={16} /> Tambah Panitia</button>
      </div>
      {locked && <div className="border-b border-border-soft bg-[#F8F2EF] px-5 py-3 text-xs font-semibold leading-relaxed text-[#8A4A39]">Struktur panitia dikunci karena LPJ kegiatan sudah disahkan. Buka kunci kegiatan terlebih dahulu jika perlu koreksi.</div>}
      <div className="grid gap-px bg-border-soft sm:grid-cols-2 xl:grid-cols-3">
        {members.length > 0 ? members.map((member) => (
          <div key={member.id} className="bg-white p-5">
            <div className="flex items-start justify-between gap-3">
              <div><p className="text-[0.65rem] font-extrabold uppercase tracking-[0.1em] text-forest">{member.role}</p><p className="mt-3 text-sm font-bold text-charcoal">{member.name}</p>{member.phone && <p className="mt-1 text-xs text-muted">{member.phone}</p>}</div>
              <div className="flex gap-2">
                <button type="button" disabled={locked} onClick={async () => { const nextName = window.prompt('Nama panitia', member.name); if (nextName === null) return; const nextRole = window.prompt('Jabatan panitia', member.role); if (nextRole === null) return; const result = await updateCommitteeMember(member.id, { name: nextName.trim() || member.name, role: nextRole.trim() || member.role }, actor); onNotify(result.message) }} className="text-forest disabled:cursor-not-allowed disabled:opacity-35" aria-label={`Ubah ${member.name}`}><Pencil size={15} /></button>
                <button type="button" disabled={locked} onClick={async () => { const result = await removeCommitteeMember(member.id, actor); onNotify(result.message) }} className="text-[#93483F] disabled:cursor-not-allowed disabled:opacity-35" aria-label={`Hapus ${member.name}`}><Trash2 size={15} /></button>
              </div>
            </div>
          </div>
        )) : <div className="bg-white p-6 text-sm text-muted sm:col-span-2 xl:col-span-3">Belum ada susunan panitia pada kegiatan ini.</div>}
      </div>
    </section>
  )
}
