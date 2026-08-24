import { useEffect, useState } from 'react'
import { FileImage, LoaderCircle } from 'lucide-react'
import { fetchExternalMediaBlob } from '../../data/mediaUploadService'

interface Props {
  transactionId?: string
  url?: string
  title?: string
  mimeType?: string
}

export default function SecureEvidencePreview({ transactionId, url, title, mimeType }: Props) {
  const [objectUrl, setObjectUrl] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(Boolean(url && transactionId))

  useEffect(() => {
    let active = true
    let localUrl = ''
    setObjectUrl('')
    setError('')
    setLoading(Boolean(url && transactionId))

    if (!url || !transactionId) return () => { active = false }

    void fetchExternalMediaBlob(transactionId)
      .then((blob) => {
        if (!active) return
        localUrl = URL.createObjectURL(blob)
        setObjectUrl(localUrl)
      })
      .catch((reason) => {
        if (!active) return
        setError(reason instanceof Error ? reason.message : 'Bukti tidak dapat dibuka.')
      })
      .finally(() => { if (active) setLoading(false) })

    return () => {
      active = false
      if (localUrl) URL.revokeObjectURL(localUrl)
    }
  }, [transactionId, url])

  if (!url) {
    return <div className="flex min-h-64 items-center justify-center border border-dashed border-border-soft bg-warmwhite"><div className="text-center"><FileImage size={42} className="mx-auto text-forest/45" /><p className="mt-4 text-sm font-extrabold text-charcoal">{title ?? 'Belum ada file bukti'}</p><p className="mt-1 text-xs text-muted">{mimeType ?? 'Tidak ada jenis bukti'}</p></div></div>
  }

  if (!transactionId) {
    return <div className="flex min-h-64 items-center justify-center border border-[#E8CBC3] bg-[#FFF6F3] p-6 text-center text-sm font-semibold text-[#93483F]">Relasi transaksi untuk bukti privat tidak ditemukan.</div>
  }

  if (loading) {
    return <div className="flex min-h-64 items-center justify-center border border-border-soft bg-warmwhite text-sm font-bold text-muted"><LoaderCircle size={20} className="mr-2 animate-spin text-forest" /> Membuka bukti privat ImageKit...</div>
  }

  if (error || !objectUrl) {
    return <div className="flex min-h-64 items-center justify-center border border-[#E8CBC3] bg-[#FFF6F3] p-6 text-center text-sm font-semibold text-[#93483F]">{error || 'Bukti privat ImageKit tidak dapat dibuka.'}</div>
  }

  if (mimeType === 'application/pdf') {
    return <iframe src={objectUrl} title={title ?? 'Bukti transaksi'} className="h-[420px] w-full border border-border-soft bg-white" />
  }

  return <div className="flex min-h-64 items-center justify-center overflow-hidden border border-border-soft bg-warmwhite"><img src={objectUrl} alt={title ?? 'Bukti transaksi'} className="max-h-[520px] w-full object-contain" /></div>
}
