import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Cache-Control': 'no-store',
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const PHOTO_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
const EVIDENCE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
const MAX_PHOTO_BYTES = 8 * 1024 * 1024
const MAX_EVIDENCE_BYTES = 8 * 1024 * 1024
const ROOT_FOLDER = '/pemuda-dusun3'

type Role = 'superadmin' | 'admin' | 'humas'
type UploadScope = 'activity-photo' | 'transaction-evidence'

interface Actor {
  id: string
  role: Role
  client: ReturnType<typeof createClient>
}

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' },
  })
}

function normalizeEndpoint(value: string) {
  const trimmed = value.trim().replace(/\/+$/, '')
  if (!trimmed.startsWith('https://')) throw new Error('IMAGEKIT_URL_ENDPOINT_INVALID')
  return trimmed
}

function basicAuth(privateKey: string) {
  return `Basic ${btoa(`${privateKey}:`)}`
}

function cleanFileName(value: string) {
  const normalized = value.normalize('NFKD').replace(/[^a-zA-Z0-9._-]+/g, '_').replace(/^_+|_+$/g, '')
  return normalized || `file-${Date.now()}`
}

async function requireActor(req: Request): Promise<Actor> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  const authorization = req.headers.get('Authorization')?.trim() ?? ''
  if (!supabaseUrl || !anonKey) throw new Response('SERVER_CONFIG_INCOMPLETE', { status: 500 })
  if (!authorization.toLowerCase().startsWith('bearer ')) throw new Response('UNAUTHORIZED', { status: 401 })

  const accessToken = authorization.replace(/^Bearer\s+/i, '').trim()
  const client = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data: userData, error: userError } = await client.auth.getUser(accessToken)
  if (userError || !userData.user) throw new Response('UNAUTHORIZED', { status: 401 })

  const { data: profile, error: profileError } = await client
    .from('profiles')
    .select('role,is_active')
    .eq('id', userData.user.id)
    .maybeSingle()
  if (profileError || !profile?.is_active || !profile.role) throw new Response('ACCOUNT_INACTIVE', { status: 403 })

  return { id: userData.user.id, role: profile.role as Role, client }
}

async function assertActivityAdmin(actor: Actor, activityId: string) {
  if (actor.role !== 'admin') throw new Response('PERMISSION_DENIED', { status: 403 })
  const { data, error } = await actor.client.from('activities').select('id').eq('id', activityId).maybeSingle()
  if (error || !data) throw new Response('ACTIVITY_NOT_ACCESSIBLE', { status: 403 })
}

async function assertTransactionOwnerOrAdmin(actor: Actor, transactionId: string, activityId?: string) {
  let query = actor.client
    .from('financial_transactions')
    .select('id,activity_id,created_by_user_id,assignment_id')
    .eq('id', transactionId)
  if (activityId) query = query.eq('activity_id', activityId)
  const { data: tx, error } = await query.maybeSingle()
  if (error || !tx) throw new Response('TRANSACTION_NOT_ACCESSIBLE', { status: 403 })

  if (actor.role === 'admin') return tx
  if (actor.role !== 'humas' || tx.created_by_user_id !== actor.id || !tx.assignment_id) {
    throw new Response('PERMISSION_DENIED', { status: 403 })
  }

  const { data: assignment, error: assignmentError } = await actor.client
    .from('humas_assignments')
    .select('id')
    .eq('id', tx.assignment_id)
    .eq('activity_id', tx.activity_id)
    .eq('humas_user_id', actor.id)
    .eq('is_active', true)
    .maybeSingle()
  if (assignmentError || !assignment) throw new Response('ASSIGNMENT_NOT_FOUND', { status: 403 })
  return tx
}

function imageKitConfig() {
  const privateKey = Deno.env.get('IMAGEKIT_PRIVATE_KEY')?.trim() ?? ''
  const urlEndpoint = normalizeEndpoint(Deno.env.get('IMAGEKIT_URL_ENDPOINT') ?? '')
  if (!privateKey) throw new Error('IMAGEKIT_PRIVATE_KEY_MISSING')
  return { privateKey, urlEndpoint }
}

async function imageKitUpload(file: File, folder: string, isPrivateFile: boolean) {
  const { privateKey, urlEndpoint } = imageKitConfig()
  const body = new FormData()
  body.set('file', file, file.name)
  body.set('fileName', cleanFileName(file.name))
  body.set('folder', folder)
  body.set('useUniqueFileName', 'true')
  body.set('isPrivateFile', isPrivateFile ? 'true' : 'false')
  body.set('tags', 'pemuda-dusun3')

  const response = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
    method: 'POST',
    headers: { Authorization: basicAuth(privateKey) },
    body,
  })
  const payload = await response.json().catch(() => ({})) as {
    fileId?: string
    filePath?: string
    name?: string
    url?: string
    size?: number
    message?: string
    error?: string
  }
  if (!response.ok || !payload.fileId || !payload.filePath) {
    console.error('ImageKit upload failed', response.status, payload)
    throw new Response(payload.message || payload.error || 'IMAGEKIT_UPLOAD_FAILED', { status: 502 })
  }

  const canonicalUrl = `${urlEndpoint}/${payload.filePath.replace(/^\/+/, '')}`
  return {
    url: canonicalUrl,
    externalFileId: payload.fileId,
    filePath: payload.filePath,
    fileName: file.name,
    mimeType: file.type,
    size: Number(payload.size ?? file.size),
  }
}

async function imageKitFileDetails(fileId: string) {
  const { privateKey } = imageKitConfig()
  const response = await fetch(`https://api.imagekit.io/v1/files/${encodeURIComponent(fileId)}/details`, {
    headers: { Authorization: basicAuth(privateKey), Accept: 'application/json' },
  })
  if (response.status === 404) return null
  const payload = await response.json().catch(() => ({})) as { filePath?: string; message?: string; error?: string }
  if (!response.ok) {
    console.error('ImageKit details failed', response.status, payload)
    throw new Response(payload.message || payload.error || 'IMAGEKIT_DETAILS_FAILED', { status: 502 })
  }
  return payload
}

async function imageKitDelete(fileId: string) {
  const { privateKey } = imageKitConfig()
  const response = await fetch(`https://api.imagekit.io/v1/files/${encodeURIComponent(fileId)}`, {
    method: 'DELETE',
    headers: { Authorization: basicAuth(privateKey), Accept: 'application/json' },
  })
  if (!response.ok && response.status !== 404) {
    const payload = await response.json().catch(() => ({})) as { message?: string; error?: string }
    console.error('ImageKit delete failed', response.status, payload)
    throw new Response(payload.message || payload.error || 'IMAGEKIT_DELETE_FAILED', { status: 502 })
  }
}

async function hmacSha1Hex(secret: string, value: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign'],
  )
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value))
  return Array.from(new Uint8Array(signature)).map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

async function signedImageKitUrl(url: string, expiresInSeconds = 300) {
  const { privateKey, urlEndpoint } = imageKitConfig()
  const endpointWithSlash = `${urlEndpoint}/`
  const canonical = url.split('?')[0]
  if (!canonical.startsWith(endpointWithSlash)) throw new Response('INVALID_IMAGEKIT_URL', { status: 400 })
  const path = canonical.slice(endpointWithSlash.length)
  const expiry = Math.floor(Date.now() / 1000) + expiresInSeconds
  const signature = await hmacSha1Hex(privateKey, `${path}${expiry}`)
  return { signedUrl: `${canonical}?ik-t=${expiry}&ik-s=${signature}`, expiresAt: expiry }
}

async function handleUpload(req: Request, actor: Actor) {
  const form = await req.formData()
  const scope = String(form.get('scope') ?? '') as UploadScope
  const activityId = String(form.get('activityId') ?? '')
  const transactionId = String(form.get('transactionId') ?? '')
  const file = form.get('file')

  if (!UUID_RE.test(activityId)) return json(400, { error: 'INVALID_ACTIVITY_ID', message: 'ID kegiatan tidak valid.' })
  if (!(file instanceof File)) return json(400, { error: 'FILE_REQUIRED', message: 'File wajib dipilih.' })

  if (scope === 'activity-photo') {
    await assertActivityAdmin(actor, activityId)
    if (!PHOTO_TYPES.has(file.type)) return json(400, { error: 'INVALID_PHOTO_TYPE', message: 'Foto harus JPG, PNG, atau WebP.' })
    if (!file.size || file.size > MAX_PHOTO_BYTES) return json(413, { error: 'PHOTO_TOO_LARGE', message: 'Foto maksimal 8 MB.' })
    return json(200, await imageKitUpload(file, `${ROOT_FOLDER}/activities/${activityId}/photos`, false))
  }

  if (scope === 'transaction-evidence') {
    if (!UUID_RE.test(transactionId)) return json(400, { error: 'INVALID_TRANSACTION_ID', message: 'ID transaksi tidak valid.' })
    await assertTransactionOwnerOrAdmin(actor, transactionId, activityId)
    if (!EVIDENCE_TYPES.has(file.type)) return json(400, { error: 'INVALID_EVIDENCE_TYPE', message: 'Bukti harus JPG, PNG, WebP, atau PDF.' })
    if (!file.size || file.size > MAX_EVIDENCE_BYTES) return json(413, { error: 'EVIDENCE_TOO_LARGE', message: 'Bukti maksimal 8 MB.' })
    return json(200, await imageKitUpload(file, `${ROOT_FOLDER}/transactions/${transactionId}/evidence`, true))
  }

  return json(400, { error: 'INVALID_UPLOAD_SCOPE', message: 'Jenis upload media tidak dikenali.' })
}

async function handleDelete(req: Request, actor: Actor) {
  const body = await req.json().catch(() => null) as {
    externalFileId?: string
    scope?: UploadScope
    activityId?: string
    transactionId?: string
  } | null
  const fileId = body?.externalFileId?.trim() ?? ''
  const scope = body?.scope
  const activityId = body?.activityId?.trim() ?? ''
  const transactionId = body?.transactionId?.trim() ?? ''
  if (!fileId || !scope || !UUID_RE.test(activityId)) return json(400, { error: 'INVALID_DELETE_INPUT', message: 'Data file yang akan dihapus tidak lengkap.' })

  let expectedPrefix = ''
  if (scope === 'activity-photo') {
    await assertActivityAdmin(actor, activityId)
    expectedPrefix = `${ROOT_FOLDER}/activities/${activityId}/photos/`
  } else if (scope === 'transaction-evidence') {
    if (!UUID_RE.test(transactionId)) return json(400, { error: 'INVALID_TRANSACTION_ID', message: 'ID transaksi tidak valid.' })
    await assertTransactionOwnerOrAdmin(actor, transactionId, activityId)
    expectedPrefix = `${ROOT_FOLDER}/transactions/${transactionId}/evidence/`
  } else {
    return json(400, { error: 'INVALID_UPLOAD_SCOPE', message: 'Jenis media tidak dikenali.' })
  }

  const details = await imageKitFileDetails(fileId)
  if (!details) return json(200, { ok: true, alreadyDeleted: true })
  if (!details.filePath?.startsWith(expectedPrefix)) return json(403, { error: 'FILE_SCOPE_MISMATCH', message: 'File tidak termasuk pada ruang data yang diizinkan.' })
  await imageKitDelete(fileId)
  return json(200, { ok: true })
}

async function handleSignedUrl(req: Request, actor: Actor) {
  const body = await req.json().catch(() => null) as { transactionId?: string } | null
  const transactionId = body?.transactionId?.trim() ?? ''
  if (!UUID_RE.test(transactionId)) return json(400, { error: 'INVALID_TRANSACTION_ID', message: 'ID transaksi tidak valid.' })
  await assertTransactionOwnerOrAdmin(actor, transactionId)

  const { data: evidence, error } = await actor.client
    .from('transaction_evidence')
    .select('provider,url')
    .eq('transaction_id', transactionId)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()
  if (error || !evidence?.url) return json(404, { error: 'EVIDENCE_NOT_FOUND', message: 'Bukti transaksi tidak ditemukan.' })
  if (evidence.provider !== 'imagekit') return json(409, { error: 'LEGACY_EVIDENCE_PROVIDER', message: 'Bukti ini berasal dari provider lama dan perlu diunggah ulang ke ImageKit.' })

  const { urlEndpoint } = imageKitConfig()
  const canonical = String(evidence.url).split('?')[0]
  const expectedPrefix = `${urlEndpoint}${ROOT_FOLDER}/transactions/${transactionId}/evidence/`
  if (!canonical.startsWith(expectedPrefix)) return json(403, { error: 'EVIDENCE_SCOPE_MISMATCH', message: 'URL bukti tidak sesuai ruang transaksi.' })

  return json(200, await signedImageKitUrl(canonical, 300))
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json(405, { error: 'METHOD_NOT_ALLOWED', message: 'Method tidak diizinkan.' })

  try {
    const actor = await requireActor(req)
    const contentType = req.headers.get('content-type') ?? ''
    if (contentType.includes('multipart/form-data')) return await handleUpload(req, actor)

    const body = await req.clone().json().catch(() => null) as { action?: string } | null
    if (body?.action === 'delete') return await handleDelete(req, actor)
    if (body?.action === 'signed-url') return await handleSignedUrl(req, actor)
    return json(400, { error: 'INVALID_ACTION', message: 'Aksi media tidak dikenali.' })
  } catch (error) {
    if (error instanceof Response) {
      const message = await error.text().catch(() => 'REQUEST_FAILED')
      return json(error.status || 500, { error: message || 'REQUEST_FAILED', message: message || 'Permintaan media gagal.' })
    }
    console.error(error)
    return json(500, { error: 'INTERNAL_ERROR', message: 'Layanan media mengalami kesalahan internal.' })
  }
})
