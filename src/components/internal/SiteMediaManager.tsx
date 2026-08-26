import { useRef, useState } from 'react'
import { ImagePlus, Loader2, RefreshCw, Upload } from 'lucide-react'
import { useAuth } from '../../auth/AuthContext'
import { deleteExternalMedia, uploadExternalMedia } from '../../data/mediaUploadService'
import { upsertSiteMedia, type SiteMediaSlot } from '../../data/siteMediaRepository'
import { useSiteContent } from '../../prototype/SiteContentContext'

const slots: Array<{ slot: SiteMediaSlot; label: string; description: string; ratio: string }> = [
  { slot: 'hero', label: 'Foto utama beranda', description: 'Tampil pada hero homepage.', ratio: 'Disarankan 4:5 atau 5:4' },
  { slot: 'profile', label: 'Foto profil organisasi', description: 'Tampil pada halaman Profil.', ratio: 'Disarankan 4:5' },
  { slot: 'organization', label: 'Foto kepengurusan', description: 'Tampil di bagian pengantar Kepengurusan.', ratio: 'Disarankan 16:9' },
]

export default function SiteMediaManager() {
  const { user } = useAuth()
  const { siteMedia, refreshSiteMedia } = useSiteContent()
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({})
  const [busy, setBusy] = useState<SiteMediaSlot | null>(null)
  const [notice, setNotice] = useState('')

  const replaceImage = async (slot: SiteMediaSlot, file?: File) => {
    if (!file || !user) return
    const current = siteMedia[slot]
    setBusy(slot)
    setNotice('')
    try {
      const uploaded = await uploadExternalMedia({ file, scope: 'site-image', siteSlot: slot })
      await upsertSiteMedia({
        slot,
        title: current.title,
        url: uploaded.url,
        externalFileId: uploaded.externalFileId,
        publicVisible: true,
        updatedByUserId: user.id,
      })
      await refreshSiteMedia()
      if (current.externalFileId && current.externalFileId !== uploaded.externalFileId) {
        await deleteExternalMedia({ externalFileId: current.externalFileId, scope: 'site-image', siteSlot: slot }).catch(() => undefined)
      }
      setNotice(`${current.title} berhasil diganti.`)
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Foto gagal diganti.')
    } finally {
      setBusy(null)
      const input = inputRefs.current[slot]
      if (input) input.value = ''
    }
  }

  return (
    <section className="mt-6 border border-border-soft bg-white">
      <div className="border-b border-border-soft px-5 py-5 sm:px-6">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-10 w-10 items-center justify-center bg-sage text-forest"><ImagePlus size={18}/></span>
          <div>
            <p className="eyebrow text-forest">MEDIA WEBSITE</p>
            <h2 className="mt-2 text-xl font-bold text-charcoal">Ganti foto utama website.</h2>
            <p className="mt-2 text-xs leading-relaxed text-muted">Kelola foto utama yang tampil di website publik. Perubahan berlaku untuk semua pengunjung.</p>
          </div>
        </div>
      </div>

      {notice && <div role="status" className="border-b border-border-soft bg-warmwhite px-5 py-3 text-xs font-semibold text-charcoal sm:px-6">{notice}</div>}

      <div className="grid gap-px bg-border-soft lg:grid-cols-3">
        {slots.map(({ slot, label, description, ratio }) => {
          const media = siteMedia[slot]
          const uploading = busy === slot
          return (
            <article key={slot} className="bg-white p-5 sm:p-6">
              <div className="overflow-hidden bg-warmwhite">
                <img src={media.url} alt={label} className="aspect-[4/3] w-full object-cover" />
              </div>
              <h3 className="mt-4 text-sm font-bold text-charcoal">{label}</h3>
              <p className="mt-1 text-xs leading-5 text-muted">{description}</p>
              <p className="mt-2 text-[11px] font-medium text-muted">{ratio} · JPG/PNG/WebP · maks. 8 MB</p>
              <input
                ref={(node) => { inputRefs.current[slot] = node }}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={(event) => void replaceImage(slot, event.target.files?.[0])}
              />
              <button
                type="button"
                disabled={Boolean(busy)}
                onClick={() => inputRefs.current[slot]?.click()}
                className="btn btn-secondary mt-4 w-full justify-center disabled:opacity-50"
              >
                {uploading ? <><Loader2 size={15} className="animate-spin"/> Mengunggah...</> : <><Upload size={15}/> Ganti Foto</>}
              </button>
            </article>
          )
        })}
      </div>
      <div className="flex items-center justify-between gap-4 border-t border-border-soft px-5 py-4 sm:px-6">
        <p className="text-xs text-muted">Jika foto baru belum terlihat di halaman publik, gunakan refresh browser setelah upload selesai.</p>
        <button type="button" onClick={() => void refreshSiteMedia()} className="text-link shrink-0 text-xs"><RefreshCw size={13}/> Muat Ulang</button>
      </div>
    </section>
  )
}
