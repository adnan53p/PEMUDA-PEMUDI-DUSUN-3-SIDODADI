interface Env {
  MEDIA_BUCKET: R2Bucket
  SUPABASE_URL: string
  SUPABASE_PUBLISHABLE_KEY: string
  MEDIA_PUBLIC_BASE_URL: string
  ALLOWED_ORIGINS: string
}

type Role = 'superadmin' | 'admin' | 'humas'
type UploadScope = 'activity-photo' | 'transaction-evidence'

interface SessionActor {
  id: string
  role: Role
}

const PHOTO_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
const EVIDENCE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
const MAX_PHOTO_BYTES = 8 * 1024 * 1024
const MAX_EVIDENCE_BYTES = 10 * 1024 * 1024
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function json(data: unknown, status = 200, headers?: HeadersInit) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...headers },
  })
}

function allowedOrigin(request: Request, env: Env) {
  const origin = request.headers.get('Origin')
  if (!origin) return ''
  const allowed = env.ALLOWED_ORIGINS.split(',').map((item) => item.trim()).filter(Boolean)
  return allowed.includes(origin) ? origin : ''
}

function corsHeaders(request: Request, env: Env) {
  const origin = allowedOrigin(request, env)
  const headers = new Headers()
  if (origin) headers.set('Access-Control-Allow-Origin', origin)
  headers.set('Vary', 'Origin')
  headers.set('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  headers.set('Access-Control-Allow-Headers', 'Authorization,Content-Type')
  headers.set('Access-Control-Max-Age', '86400')
  return headers
}

function withCors(response: Response, request: Request, env: Env) {
  const headers = new Headers(response.headers)
  for (const [key, value] of corsHeaders(request, env)) headers.set(key, value)
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers })
}

function requireBrowserOrigin(request: Request, env: Env) {
  const origin = request.headers.get('Origin')
  return !origin || Boolean(allowedOrigin(request, env))
}

function bearer(request: Request) {
  const value = request.headers.get('Authorization')?.trim() ?? ''
  return value.startsWith('Bearer ') ? value : ''
}

async function supabaseGet(env: Env, path: string, authorization: string) {
  const base = env.SUPABASE_URL.replace(/\/+$/, '')
  return fetch(`${base}${path}`, {
    headers: {
      Authorization: authorization,
      apikey: env.SUPABASE_PUBLISHABLE_KEY,
      Accept: 'application/json',
    },
  })
}

async function requireActor(request: Request, env: Env): Promise<SessionActor> {
  const authorization = bearer(request)
  if (!authorization) throw new Response('UNAUTHORIZED', { status: 401 })

  const userResponse = await supabaseGet(env, '/auth/v1/user', authorization)
  if (!userResponse.ok) throw new Response('UNAUTHORIZED', { status: 401 })
  const user = await userResponse.json() as { id?: string }
  if (!user.id) throw new Response('UNAUTHORIZED', { status: 401 })

  const profileResponse = await supabaseGet(
    env,
    `/rest/v1/profiles?id=eq.${encodeURIComponent(user.id)}&select=role,is_active&limit=1`,
    authorization,
  )
  if (!profileResponse.ok) throw new Response('PROFILE_LOOKUP_FAILED', { status: 403 })
  const profiles = await profileResponse.json() as Array<{ role?: Role; is_active?: boolean }>
  const profile = profiles[0]
  if (!profile?.is_active || !profile.role) throw new Response('ACCOUNT_INACTIVE', { status: 403 })
  return { id: user.id, role: profile.role }
}

async function assertActivityAccess(env: Env, authorization: string, activityId: string) {
  const response = await supabaseGet(
    env,
    `/rest/v1/activities?id=eq.${encodeURIComponent(activityId)}&select=id&limit=1`,
    authorization,
  )
  if (!response.ok) throw new Response('ACTIVITY_LOOKUP_FAILED', { status: 403 })
  const rows = await response.json() as Array<{ id: string }>
  if (!rows.length) throw new Response('ACTIVITY_NOT_ACCESSIBLE', { status: 403 })
}

async function assertTransactionAccess(env: Env, authorization: string, transactionId: string, activityId?: string) {
  const activityFilter = activityId ? `&activity_id=eq.${encodeURIComponent(activityId)}` : ''
  const response = await supabaseGet(
    env,
    `/rest/v1/financial_transactions?id=eq.${encodeURIComponent(transactionId)}${activityFilter}&select=id,activity_id&limit=1`,
    authorization,
  )
  if (!response.ok) throw new Response('TRANSACTION_LOOKUP_FAILED', { status: 403 })
  const rows = await response.json() as Array<{ id: string; activity_id: string }>
  if (!rows.length) throw new Response('TRANSACTION_NOT_ACCESSIBLE', { status: 403 })
}

function extensionForMime(mimeType: string) {
  if (mimeType === 'image/jpeg') return 'jpg'
  if (mimeType === 'image/png') return 'png'
  if (mimeType === 'image/webp') return 'webp'
  if (mimeType === 'application/pdf') return 'pdf'
  return 'bin'
}

function publicPhotoUrl(env: Env, key: string) {
  const base = env.MEDIA_PUBLIC_BASE_URL.trim().replace(/\/+$/, '')
  if (!base.startsWith('https://')) throw new Response('MEDIA_PUBLIC_BASE_URL_INVALID', { status: 500 })
  return `${base}/${key}`
}

function privateEvidenceUrl(request: Request, key: string) {
  return `${new URL(request.url).origin}/object/${encodeURIComponent(key)}`
}

async function handleUpload(request: Request, env: Env) {
  const authorization = bearer(request)
  const actor = await requireActor(request, env)
  const form = await request.formData()
  const scope = String(form.get('scope') ?? '') as UploadScope
  const activityId = String(form.get('activityId') ?? '')
  const transactionId = String(form.get('transactionId') ?? '')
  const file = form.get('file')

  if (!UUID_RE.test(activityId)) return json({ error: 'INVALID_ACTIVITY_ID' }, 400)
  if (!(file instanceof File)) return json({ error: 'FILE_REQUIRED' }, 400)

  if (scope === 'activity-photo') {
    if (actor.role !== 'admin') return json({ error: 'PERMISSION_DENIED' }, 403)
    if (!PHOTO_TYPES.has(file.type)) return json({ error: 'INVALID_PHOTO_TYPE' }, 400)
    if (!file.size || file.size > MAX_PHOTO_BYTES) return json({ error: 'PHOTO_TOO_LARGE' }, 413)
    await assertActivityAccess(env, authorization, activityId)

    const key = `activities/${activityId}/photos/${crypto.randomUUID()}.${extensionForMime(file.type)}`
    await env.MEDIA_BUCKET.put(key, file.stream(), {
      httpMetadata: {
        contentType: file.type,
        cacheControl: 'public, max-age=31536000, immutable',
        contentDisposition: 'inline',
      },
      customMetadata: { scope, activityId, uploaderId: actor.id },
    })
    return json({ url: publicPhotoUrl(env, key), key, fileName: file.name, mimeType: file.type, size: file.size })
  }

  if (scope === 'transaction-evidence') {
    if (!['admin', 'humas'].includes(actor.role)) return json({ error: 'PERMISSION_DENIED' }, 403)
    if (!UUID_RE.test(transactionId)) return json({ error: 'INVALID_TRANSACTION_ID' }, 400)
    if (!EVIDENCE_TYPES.has(file.type)) return json({ error: 'INVALID_EVIDENCE_TYPE' }, 400)
    if (!file.size || file.size > MAX_EVIDENCE_BYTES) return json({ error: 'EVIDENCE_TOO_LARGE' }, 413)
    await assertTransactionAccess(env, authorization, transactionId, activityId)

    const key = `transactions/${transactionId}/evidence/${crypto.randomUUID()}.${extensionForMime(file.type)}`
    await env.MEDIA_BUCKET.put(key, file.stream(), {
      httpMetadata: {
        contentType: file.type,
        cacheControl: 'private, no-store',
        contentDisposition: 'inline',
      },
      customMetadata: { scope, activityId, transactionId, uploaderId: actor.id },
    })
    return json({ url: privateEvidenceUrl(request, key), key, fileName: file.name, mimeType: file.type, size: file.size })
  }

  return json({ error: 'INVALID_UPLOAD_SCOPE' }, 400)
}

function keyFromStoredUrl(value: string, request: Request, env: Env) {
  let parsed: URL
  try { parsed = new URL(value) } catch { return '' }

  const workerOrigin = new URL(request.url).origin
  if (parsed.origin === workerOrigin && parsed.pathname.startsWith('/object/')) {
    try { return decodeURIComponent(parsed.pathname.slice('/object/'.length)) } catch { return '' }
  }

  const publicBase = env.MEDIA_PUBLIC_BASE_URL.trim().replace(/\/+$/, '')
  if (publicBase && value.startsWith(`${publicBase}/`)) return value.slice(publicBase.length + 1)
  return ''
}

async function authorizeObjectKey(request: Request, env: Env, actor: SessionActor, key: string) {
  const authorization = bearer(request)
  const activityMatch = key.match(/^activities\/([0-9a-f-]{36})\/photos\//i)
  if (activityMatch) {
    if (actor.role !== 'admin') throw new Response('PERMISSION_DENIED', { status: 403 })
    await assertActivityAccess(env, authorization, activityMatch[1])
    return
  }

  const transactionMatch = key.match(/^transactions\/([0-9a-f-]{36})\/evidence\//i)
  if (transactionMatch) {
    await assertTransactionAccess(env, authorization, transactionMatch[1])
    return
  }

  throw new Response('INVALID_OBJECT_KEY', { status: 400 })
}

async function handleDelete(request: Request, env: Env) {
  const actor = await requireActor(request, env)
  const body = await request.json().catch(() => null) as { url?: string } | null
  const key = keyFromStoredUrl(body?.url ?? '', request, env)
  if (!key) return json({ error: 'INVALID_OBJECT_URL' }, 400)
  await authorizeObjectKey(request, env, actor, key)
  await env.MEDIA_BUCKET.delete(key)
  return json({ ok: true })
}

async function handlePrivateObject(request: Request, env: Env, encodedKey: string) {
  const actor = await requireActor(request, env)
  let key = ''
  try { key = decodeURIComponent(encodedKey) } catch { return json({ error: 'INVALID_OBJECT_KEY' }, 400) }
  if (!key.startsWith('transactions/')) return json({ error: 'PRIVATE_OBJECT_NOT_FOUND' }, 404)
  await authorizeObjectKey(request, env, actor, key)

  const object = await env.MEDIA_BUCKET.get(key)
  if (!object) return json({ error: 'OBJECT_NOT_FOUND' }, 404)
  const headers = new Headers()
  object.writeHttpMetadata(headers)
  headers.set('ETag', object.httpEtag)
  headers.set('Cache-Control', 'private, no-store')
  headers.set('Content-Security-Policy', "default-src 'none'; sandbox")
  return new Response(object.body, { headers })
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (!requireBrowserOrigin(request, env)) return withCors(json({ error: 'ORIGIN_NOT_ALLOWED' }, 403), request, env)
    if (request.method === 'OPTIONS') return withCors(new Response(null, { status: 204 }), request, env)

    try {
      const url = new URL(request.url)
      let response: Response
      if (request.method === 'POST' && url.pathname === '/upload') response = await handleUpload(request, env)
      else if (request.method === 'POST' && url.pathname === '/delete') response = await handleDelete(request, env)
      else if (request.method === 'GET' && url.pathname.startsWith('/object/')) response = await handlePrivateObject(request, env, url.pathname.slice('/object/'.length))
      else if (request.method === 'GET' && url.pathname === '/health') response = json({ ok: true, storage: 'cloudflare-r2' })
      else response = json({ error: 'NOT_FOUND' }, 404)
      return withCors(response, request, env)
    } catch (error) {
      if (error instanceof Response) return withCors(error, request, env)
      console.error(error)
      return withCors(json({ error: 'INTERNAL_ERROR' }, 500), request, env)
    }
  },
} satisfies ExportedHandler<Env>
