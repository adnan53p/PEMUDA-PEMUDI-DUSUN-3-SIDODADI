import { useMemo, useState, type FormEvent } from 'react'
import { ChevronDown, ChevronUp, Eye, EyeOff, ImagePlus, LoaderCircle, PlaySquare, Star, Trash2, UploadCloud } from 'lucide-react'
import { useAuth } from '../../auth/AuthContext'
import { useOperations } from '../../prototype/OperationsContext'
import { getActivityVideoThumbnail, type ActivityMediaProvider, type ActivityMediaType } from '../../prototype/activityMedia'
import { deleteExternalMedia, MEDIA_UPLOAD_CONFIGURED, uploadExternalMedia } from '../../data/mediaUploadService'

interface Props {
  activityId: string
  onNotify: (message: string) => void
}

function providerLabel(provider: ActivityMediaProvider) {
  if (provider === 'imagekit') return 'Foto'
  if (provider === 'cloudflare-r2') return 'Cloudflare R2 (legacy)'
  if (provider === 'google-drive') return 'Google Drive'
  return 'YouTube'
}

export default function ActivityMediaManager({ activityId, onNotify }: Props) {
  const { user } = useAuth()
  const {
    activityMedia,
    addActivityMedia,
    removeActivityMedia,
    setActivityMediaVisibility,
    setActivityCover,
    moveActivityMedia,
  } = useOperations()
  const actor = user ? { userId: user.id, name: user.fullName, role: user.role } : undefined
  const [type, setType] = useState<ActivityMediaType>('photo')
  const [provider, setProvider] = useState<ActivityMediaProvider>('imagekit')
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [isCover, setIsCover] = useState(false)
  const [publicVisible, setPublicVisible] = useState(true)
  const [busy, setBusy] = useState(false)

  const items = useMemo(
    () => activityMedia.filter((item) => item.activityId === activityId).sort((a, b) => a.type.localeCompare(b.type) || a.sortOrder - b.sortOrder),
    [activityId, activityMedia],
  )
  const photoCount = items.filter((item) => item.type === 'photo').length
  const videoCount = items.filter((item) => item.type === 'video').length

  const changeType = (next: ActivityMediaType) => {
    setType(next)
    setProvider(next === 'photo' ? 'imagekit' : 'youtube')
    setPhotoFile(null)
    setUrl('')
    setIsCover(false)
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (busy) return
    setBusy(true)
    let uploadedFileId = ''
    try {
      let mediaUrl = url.trim()
      if (type === 'photo') {
        if (!photoFile) {
          onNotify('Pilih foto yang akan diunggah.')
          return
        }
        const uploaded = await uploadExternalMedia({ file: photoFile, scope: 'activity-photo', activityId })
        mediaUrl = uploaded.url
        uploadedFileId = uploaded.externalFileId
      }
      if (!mediaUrl) {
        onNotify('URL video wajib diisi.')
        return
      }

      const result = await addActivityMedia({ activityId, type, provider, title, url: mediaUrl, externalFileId: uploadedFileId || undefined, isCover, publicVisible }, actor)
      if (!result.ok && uploadedFileId) {
        try { await deleteExternalMedia({ externalFileId: uploadedFileId, scope: 'activity-photo', activityId }) } catch { /* orphan cleanup is best effort */ }
      }
      onNotify(result.message)
      if (!result.ok) return
      setTitle('')
      setUrl('')
      setPhotoFile(null)
      setIsCover(false)
      setPublicVisible(true)
    } catch (error) {
      onNotify(error instanceof Error ? error.message : 'Upload media gagal.')
    } finally {
      setBusy(false)
    }
  }

  const removeMedia = async (item: (typeof items)[number]) => {
    const result = await removeActivityMedia(item.id, actor)
    if (!result.ok) {
      onNotify(result.message)
      return
    }
    if (item.provider === 'imagekit' && item.externalFileId) {
      try {
        await deleteExternalMedia({ externalFileId: item.externalFileId, scope: 'activity-photo', activityId: item.activityId })
        onNotify('Media berhasil dihapus.')
      } catch {
        onNotify('Data media berhasil dihapus, tetapi file sumber belum dapat dihapus otomatis. Hubungi pengelola jika file perlu dibersihkan.')
      }
      return
    }
    if (item.provider === 'imagekit' && !item.externalFileId) {
      onNotify('Data media berhasil dihapus. File lama perlu dibersihkan secara manual oleh pengelola.')
      return
    }
    onNotify(result.message)
  }

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="eyebrow text-forest">MEDIA KEGIATAN</p>
          <h3 className="mt-2 text-lg font-extrabold text-charcoal">Cover, galeri foto, dan video per kegiatan</h3>
          <p className="mt-2 max-w-2xl text-xs leading-relaxed text-muted">Tambahkan foto kegiatan atau tautan video. Foto dapat dijadikan sampul dan ditampilkan ke publik.</p>
        </div>
        <div className="flex gap-2 text-xs font-bold text-muted"><span className="border border-border-soft bg-white px-3 py-2">{photoCount} foto</span><span className="border border-border-soft bg-white px-3 py-2">{videoCount} video</span></div>
      </div>

      <form onSubmit={submit} className="mt-5 border border-border-soft bg-white p-4 sm:p-5">
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => changeType('photo')} className={`inline-flex items-center gap-2 px-3 py-2 text-xs font-extrabold ${type === 'photo' ? 'bg-forest text-white' : 'bg-offwhite text-charcoal'}`}><ImagePlus size={15} /> Foto</button>
          <button type="button" onClick={() => changeType('video')} className={`inline-flex items-center gap-2 px-3 py-2 text-xs font-extrabold ${type === 'video' ? 'bg-forest text-white' : 'bg-offwhite text-charcoal'}`}><PlaySquare size={15} /> Video</button>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="block"><span className="text-xs font-extrabold uppercase tracking-[0.08em] text-muted">Judul</span><input required value={title} onChange={(event) => setTitle(event.target.value)} placeholder={type === 'photo' ? 'Contoh: Persiapan panggung' : 'Contoh: Video malam puncak'} className="mt-2 h-11 w-full border border-border-soft bg-offwhite px-3 text-sm outline-none focus:border-forest" /></label>
          <label className="block"><span className="text-xs font-extrabold uppercase tracking-[0.08em] text-muted">Sumber</span>{type === 'photo' ? <div className="mt-2 flex h-11 items-center border border-border-soft bg-offwhite px-3 text-sm font-bold text-charcoal">Foto</div> : <select value={provider} onChange={(event) => setProvider(event.target.value as ActivityMediaProvider)} className="mt-2 h-11 w-full border border-border-soft bg-offwhite px-3 text-sm font-bold outline-none focus:border-forest"><option value="youtube">YouTube</option><option value="google-drive">Google Drive</option></select>}</label>
        </div>

        {type === 'photo' ? <div className="mt-4">
          <label className="block"><span className="text-xs font-extrabold uppercase tracking-[0.08em] text-muted">Unggah foto</span><div className="mt-2 flex min-h-12 items-center gap-3 border border-dashed border-border-soft bg-offwhite px-3 py-2"><UploadCloud size={18} className="text-forest" /><input required type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setPhotoFile(event.target.files?.[0] ?? null)} className="min-w-0 flex-1 text-xs text-muted" /></div><p className="mt-1 text-[0.68rem] text-muted">JPG/PNG/WebP, maksimal 8 MB. {MEDIA_UPLOAD_CONFIGURED ? 'Foto siap diunggah.' : 'Layanan unggah foto belum tersedia.'}</p></label>
        </div> : <label className="mt-4 block"><span className="text-xs font-extrabold uppercase tracking-[0.08em] text-muted">URL video</span><input required type="url" value={url} onChange={(event) => setUrl(event.target.value)} placeholder={provider === 'youtube' ? 'https://youtu.be/...' : 'https://drive.google.com/file/d/.../view'} className="mt-2 h-11 w-full border border-border-soft bg-offwhite px-3 text-sm outline-none focus:border-forest" /></label>}

        <div className="mt-4 flex flex-col gap-3 border-t border-border-soft pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-4">
            {type === 'photo' && <label className="inline-flex items-center gap-2 text-xs font-semibold text-charcoal"><input type="checkbox" checked={isCover} onChange={(event) => setIsCover(event.target.checked)} /> Jadikan foto cover</label>}
            <label className="inline-flex items-center gap-2 text-xs font-semibold text-charcoal"><input type="checkbox" checked={publicVisible} onChange={(event) => setPublicVisible(event.target.checked)} /> Tampilkan di halaman publik</label>
          </div>
          <button type="submit" disabled={busy} className="btn btn-primary disabled:opacity-50">{busy ? <><LoaderCircle size={15} className="animate-spin" /> Mengunggah...</> : <>+ Tambah {type === 'photo' ? 'Foto' : 'Video'}</>}</button>
        </div>
      </form>

      <div className="mt-5 space-y-3">
        {items.length === 0 && <div className="border border-dashed border-border-soft bg-white px-5 py-8 text-center text-sm text-muted">Belum ada media yang dikelola Admin. Halaman publik masih memakai dokumentasi contoh bawaan sampai media kegiatan ditambahkan.</div>}
        {items.map((item) => {
          const thumbnail = item.type === 'video' ? getActivityVideoThumbnail(item.provider, item.url) : item.url
          return (
            <article key={item.id} className="grid gap-4 border border-border-soft bg-white p-4 md:grid-cols-[120px_1fr_auto] md:items-center">
              <div className="h-20 overflow-hidden bg-offwhite">
                {thumbnail ? <img src={thumbnail} alt="" loading="lazy" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-muted">{item.type === 'photo' ? <ImagePlus size={22} /> : <PlaySquare size={22} />}</div>}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2"><p className="font-extrabold text-charcoal">{item.title}</p>{item.isCover && <span className="inline-flex items-center gap-1 bg-sage/70 px-2 py-1 text-[0.62rem] font-extrabold uppercase tracking-[0.08em] text-forest"><Star size={11} /> Cover</span>}<span className="bg-offwhite px-2 py-1 text-[0.62rem] font-bold uppercase tracking-[0.08em] text-muted">{providerLabel(item.provider)}</span></div>
                <p className="mt-1 truncate text-xs text-muted">{item.url}</p>
                <p className="mt-2 text-[0.68rem] font-bold uppercase tracking-[0.08em] text-muted">{item.publicVisible ? 'Tampil di publik' : 'Disembunyikan'} · Urutan {item.sortOrder}</p>
              </div>
              <div className="flex flex-wrap gap-2 md:max-w-[240px] md:justify-end">
                <button type="button" title="Naikkan urutan" onClick={async () => onNotify((await moveActivityMedia(item.id, 'up', actor)).message)} className="inline-flex h-9 w-9 items-center justify-center border border-border-soft text-muted hover:text-forest"><ChevronUp size={16} /></button>
                <button type="button" title="Turunkan urutan" onClick={async () => onNotify((await moveActivityMedia(item.id, 'down', actor)).message)} className="inline-flex h-9 w-9 items-center justify-center border border-border-soft text-muted hover:text-forest"><ChevronDown size={16} /></button>
                {item.type === 'photo' && !item.isCover && <button type="button" onClick={async () => onNotify((await setActivityCover(item.id, actor)).message)} className="inline-flex items-center gap-1.5 border border-border-soft px-3 py-2 text-xs font-extrabold text-forest"><Star size={14} /> Cover</button>}
                <button type="button" onClick={async () => onNotify((await setActivityMediaVisibility(item.id, !item.publicVisible, actor)).message)} className="inline-flex items-center gap-1.5 border border-border-soft px-3 py-2 text-xs font-extrabold text-forest">{item.publicVisible ? <EyeOff size={14} /> : <Eye size={14} />}{item.publicVisible ? 'Sembunyikan' : 'Tampilkan'}</button>
                <button type="button" title="Hapus media" onClick={() => void removeMedia(item)} className="inline-flex h-9 w-9 items-center justify-center border border-[#E8CBC3] text-[#9A4A38]"><Trash2 size={15} /></button>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
