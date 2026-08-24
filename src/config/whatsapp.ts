/**
 * WhatsApp publik — satu sumber konfigurasi.
 *
 * Isi VITE_PUBLIC_WHATSAPP_NUMBER di .env dengan format internasional tanpa
 * tanda +, spasi, atau tanda baca. Contoh format: 6281234567890.
 * Jika kosong/tidak valid, seluruh CTA WhatsApp otomatis dinonaktifkan agar
 * tidak pernah mengarah ke nomor placeholder.
 */
const rawWhatsAppNumber = (import.meta.env.VITE_PUBLIC_WHATSAPP_NUMBER ?? '').trim()

export const PUBLIC_WHATSAPP_NUMBER = rawWhatsAppNumber.replace(/\D/g, '')

export const HAS_PUBLIC_WHATSAPP = /^62\d{8,13}$/.test(PUBLIC_WHATSAPP_NUMBER)

export type WhatsAppIntent =
  | 'gabung'
  | 'relawan'
  | 'tanya-panitia'
  | 'bagikan-agenda'
  | 'umum'

const INTENT_MESSAGES: Record<WhatsAppIntent, string> = {
  gabung: 'Halo, saya ingin bergabung dengan Pemuda Dusun 3 Sidodadi.',
  relawan: 'Halo, saya ingin mendaftar sebagai relawan kegiatan.',
  'tanya-panitia': 'Halo, saya ingin bertanya seputar kegiatan yang akan datang.',
  'bagikan-agenda': 'Halo, saya ingin tahu lebih lanjut tentang agenda kegiatan.',
  umum: 'Halo, saya ingin menghubungi pengurus Pemuda Dusun 3 Sidodadi.',
}

/** Menghasilkan URL WhatsApp hanya jika nomor publik sudah valid. */
export function buildWhatsAppLink(
  intent: WhatsAppIntent = 'umum',
  customMessage?: string,
): string | null {
  if (!HAS_PUBLIC_WHATSAPP) return null

  const message = customMessage ?? INTENT_MESSAGES[intent]
  return `https://wa.me/${PUBLIC_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`
}

/** Membuat link berbagi WhatsApp tanpa membutuhkan nomor organisasi. */
export function buildWhatsAppShareLink(message: string): string {
  return `https://wa.me/?text=${encodeURIComponent(message)}`
}
