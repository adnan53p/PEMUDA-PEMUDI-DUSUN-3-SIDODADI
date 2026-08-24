export type ActivityMediaType = 'photo' | 'video'
export type ActivityMediaProvider = 'imagekit' | 'cloudflare-r2' | 'youtube' | 'google-drive'

export interface ActivityMedia {
  id: string
  activityId: string
  type: ActivityMediaType
  provider: ActivityMediaProvider
  title: string
  url: string
  sortOrder: number
  isCover: boolean
  publicVisible: boolean
  externalFileId?: string
}

export interface AddActivityMediaInput {
  activityId: string
  type: ActivityMediaType
  provider: ActivityMediaProvider
  title: string
  url: string
  isCover?: boolean
  publicVisible?: boolean
  externalFileId?: string
}

export function getYouTubeVideoId(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return ''

  try {
    const url = new URL(trimmed)
    const host = url.hostname.replace(/^www\./, '')

    if (host === 'youtu.be') return url.pathname.split('/').filter(Boolean)[0] ?? ''
    if (host.endsWith('youtube.com')) {
      if (url.pathname === '/watch') return url.searchParams.get('v') ?? ''
      const parts = url.pathname.split('/').filter(Boolean)
      const markerIndex = parts.findIndex((part) => ['embed', 'shorts', 'live'].includes(part))
      if (markerIndex >= 0) return parts[markerIndex + 1] ?? ''
    }
  } catch {
    return ''
  }

  return ''
}

export function getGoogleDriveFileId(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return ''

  try {
    const url = new URL(trimmed)
    if (!url.hostname.endsWith('drive.google.com')) return ''

    const parts = url.pathname.split('/').filter(Boolean)
    const dIndex = parts.indexOf('d')
    if (dIndex >= 0 && parts[dIndex + 1]) return parts[dIndex + 1]
    return url.searchParams.get('id') ?? ''
  } catch {
    return ''
  }
}

export function getActivityVideoEmbedUrl(provider: ActivityMediaProvider, url: string) {
  if (provider === 'youtube') {
    const videoId = getYouTubeVideoId(url)
    return videoId ? `https://www.youtube-nocookie.com/embed/${videoId}` : ''
  }

  if (provider === 'google-drive') {
    const fileId = getGoogleDriveFileId(url)
    return fileId ? `https://drive.google.com/file/d/${fileId}/preview` : ''
  }

  return ''
}

export function getActivityVideoThumbnail(provider: ActivityMediaProvider, url: string) {
  if (provider !== 'youtube') return ''
  const videoId = getYouTubeVideoId(url)
  return videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : ''
}

export function validateActivityMediaInput(input: AddActivityMediaInput) {
  if (!input.title.trim()) return 'Judul media wajib diisi.'
  if (!input.url.trim()) return 'URL media wajib diisi.'

  try {
    const parsed = new URL(input.url.trim())
    if (!['http:', 'https:'].includes(parsed.protocol)) return 'URL media harus menggunakan http/https.'
  } catch {
    return 'Format URL media tidak valid.'
  }

  if (input.type === 'photo' && input.provider !== 'imagekit') {
    return 'Foto kegiatan baru menggunakan ImageKit.'
  }

  if (input.type === 'video' && !['youtube', 'google-drive'].includes(input.provider)) {
    return 'Video kegiatan gunakan YouTube atau Google Drive.'
  }

  if (input.provider === 'youtube' && !getYouTubeVideoId(input.url)) {
    return 'Link YouTube tidak dikenali. Gunakan link watch, youtu.be, shorts, live, atau embed.'
  }

  if (input.provider === 'google-drive' && !getGoogleDriveFileId(input.url)) {
    return 'Link Google Drive tidak dikenali. Gunakan link file Drive yang dapat dibagikan.'
  }

  return ''
}
