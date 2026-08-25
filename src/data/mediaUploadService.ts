import { supabase } from '../lib/supabaseClient'

export type MediaUploadScope = 'activity-photo' | 'transaction-evidence' | 'site-image'

export interface UploadedExternalMedia {
  url: string
  externalFileId: string
  filePath: string
  fileName: string
  mimeType: string
  size: number
}

export const MEDIA_UPLOAD_CONFIGURED = Boolean(supabase)

const IMAGEKIT_FUNCTION = 'imagekit-media'
const ACTIVITY_PHOTO_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
const EVIDENCE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
const MAX_ACTIVITY_PHOTO_BYTES = 8 * 1024 * 1024
const MAX_EVIDENCE_BYTES = 8 * 1024 * 1024

function validateFile(file: File, scope: MediaUploadScope) {
  if (!file.size) return 'File kosong tidak dapat diunggah.'
  const allowed = scope === 'transaction-evidence' ? EVIDENCE_TYPES : ACTIVITY_PHOTO_TYPES
  const maxBytes = scope === 'transaction-evidence' ? MAX_EVIDENCE_BYTES : MAX_ACTIVITY_PHOTO_BYTES
  if (!allowed.has(file.type)) {
    return scope === 'transaction-evidence'
      ? 'Bukti harus JPG, PNG, WebP, atau PDF.'
      : 'Foto harus JPG, PNG, atau WebP.'
  }
  if (file.size > maxBytes) return `Ukuran file maksimal ${Math.round(maxBytes / 1024 / 1024)} MB.`
  return ''
}

async function functionErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === 'object' && 'context' in error) {
    const context = (error as { context?: unknown }).context
    if (context instanceof Response) {
      try {
        const data = await context.clone().json() as { message?: string; error?: string }
        if (data.message || data.error) return data.message || data.error || fallback
      } catch {
        try {
          const text = await context.clone().text()
          if (text) return text
        } catch { /* ignore */ }
      }
    }
  }
  if (error instanceof Error && error.message) return error.message
  return fallback
}

async function invokeImageKit(body: FormData | Record<string, unknown>) {
  if (!supabase) throw new Error('Supabase belum dikonfigurasi.')
  const { data, error } = await supabase.functions.invoke(IMAGEKIT_FUNCTION, { body })
  if (error) throw new Error(await functionErrorMessage(error, 'Layanan media ImageKit gagal dihubungi.'))
  return data as Record<string, unknown> | null
}

export async function uploadExternalMedia(input: {
  file: File
  scope: MediaUploadScope
  activityId?: string
  transactionId?: string
  siteSlot?: 'hero' | 'profile' | 'organization'
}): Promise<UploadedExternalMedia> {
  if (!MEDIA_UPLOAD_CONFIGURED) throw new Error('Supabase belum dikonfigurasi sehingga upload ImageKit belum dapat digunakan.')

  const validation = validateFile(input.file, input.scope)
  if (validation) throw new Error(validation)
  if (input.scope !== 'site-image' && !input.activityId) throw new Error('Kegiatan tidak ditemukan.')
  if (input.scope === 'site-image' && !input.siteSlot) throw new Error('Slot foto website tidak ditemukan.')
  if (input.scope === 'transaction-evidence' && !input.transactionId) {
    throw new Error('ID transaksi wajib tersedia sebelum mengunggah bukti.')
  }

  const form = new FormData()
  form.set('action', 'upload')
  form.set('scope', input.scope)
  if (input.activityId) form.set('activityId', input.activityId)
  if (input.siteSlot) form.set('siteSlot', input.siteSlot)
  if (input.transactionId) form.set('transactionId', input.transactionId)
  form.set('file', input.file)

  const data = await invokeImageKit(form) as Partial<UploadedExternalMedia> | null
  if (!data?.url || !data.externalFileId || !data.filePath) {
    throw new Error('Respons upload ImageKit tidak lengkap.')
  }

  return {
    url: data.url,
    externalFileId: data.externalFileId,
    filePath: data.filePath,
    fileName: data.fileName || input.file.name,
    mimeType: data.mimeType || input.file.type,
    size: Number(data.size ?? input.file.size),
  }
}

export async function deleteExternalMedia(input: {
  externalFileId?: string
  scope: MediaUploadScope
  activityId?: string
  transactionId?: string
  siteSlot?: 'hero' | 'profile' | 'organization'
}) {
  if (!input.externalFileId || !MEDIA_UPLOAD_CONFIGURED) return
  await invokeImageKit({
    action: 'delete',
    externalFileId: input.externalFileId,
    scope: input.scope,
    activityId: input.activityId,
    transactionId: input.transactionId,
    siteSlot: input.siteSlot,
  })
}

export async function fetchExternalMediaBlob(transactionId: string) {
  if (!transactionId) throw new Error('ID transaksi bukti tidak tersedia.')
  const data = await invokeImageKit({ action: 'signed-url', transactionId }) as { signedUrl?: string } | null
  if (!data?.signedUrl) throw new Error('URL bukti privat ImageKit tidak tersedia.')

  const response = await fetch(data.signedUrl, { cache: 'no-store' })
  if (!response.ok) throw new Error('Bukti privat ImageKit tidak dapat dibuka.')
  return response.blob()
}
