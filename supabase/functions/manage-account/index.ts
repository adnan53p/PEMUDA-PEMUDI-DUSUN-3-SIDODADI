import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

type ManagedRole = 'admin' | 'humas'
type CallerRole = 'superadmin' | 'admin' | 'humas'

interface CreatePayload {
  action: 'create'
  account: {
    email: string
    fullName: string
    username: string
    password: string
    phone?: string
    role: ManagedRole
  }
}

interface ResetPayload {
  action: 'reset_password'
  targetUserId: string
  password: string
  targetRole: ManagedRole
}

interface ActivePayload {
  action: 'set_active'
  targetUserId: string
  active: boolean
  targetRole: ManagedRole
}

type Payload = CreatePayload | ResetPayload | ActivePayload

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function canManage(callerRole: CallerRole, targetRole: ManagedRole) {
  return (callerRole === 'superadmin' && targetRole === 'admin')
    || (callerRole === 'admin' && targetRole === 'humas')
}

function normalizeUsername(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, '.')
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json(405, { ok: false, message: 'Method tidak diizinkan.' })

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const authorization = req.headers.get('Authorization')

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return json(500, { ok: false, message: 'Konfigurasi server Supabase belum lengkap.' })
  }
  if (!authorization) return json(401, { ok: false, message: 'Sesi login tidak ditemukan.' })

  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const accessToken = authorization.replace(/^Bearer\s+/i, '').trim()
  if (!accessToken) return json(401, { ok: false, message: 'Token sesi tidak ditemukan.' })

  const { data: callerData, error: callerError } = await callerClient.auth.getUser(accessToken)
  if (callerError || !callerData.user) return json(401, { ok: false, message: 'Sesi login tidak valid.' })

  const { data: callerProfile, error: profileError } = await serviceClient
    .from('profiles')
    .select('role, is_active')
    .eq('id', callerData.user.id)
    .maybeSingle()

  if (profileError || !callerProfile || callerProfile.is_active !== true) {
    return json(403, { ok: false, message: 'Akun pengelola tidak aktif atau profil tidak ditemukan.' })
  }

  const callerRole = callerProfile.role as CallerRole
  if (!['superadmin', 'admin'].includes(callerRole)) {
    return json(403, { ok: false, message: 'Role ini tidak diizinkan mengelola akun.' })
  }

  let payload: Payload
  try {
    payload = await req.json() as Payload
  } catch {
    return json(400, { ok: false, message: 'Payload tidak valid.' })
  }

  if (payload.action === 'create') {
    const email = payload.account?.email?.trim().toLowerCase()
    const fullName = payload.account?.fullName?.trim()
    const username = normalizeUsername(payload.account?.username ?? '')
    const password = payload.account?.password ?? ''
    const phone = payload.account?.phone?.trim() || null
    const targetRole = payload.account?.role

    if (!email || !email.includes('@') || !fullName || !username || password.length < 6 || !['admin', 'humas'].includes(targetRole)) {
      return json(400, { ok: false, message: 'Email, nama, username, role, dan password minimal 6 karakter wajib valid.' })
    }
    if (!canManage(callerRole, targetRole)) {
      return json(403, { ok: false, message: `Akun ${callerRole} tidak boleh membuat role ${targetRole}.` })
    }

    const { data: usernameOwner } = await serviceClient
      .from('profiles')
      .select('id')
      .ilike('username', username)
      .limit(1)
      .maybeSingle()
    if (usernameOwner) return json(409, { ok: false, message: 'Username sudah digunakan.' })

    const { data: created, error: createError } = await serviceClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      app_metadata: {
        role: targetRole,
        username,
        full_name: fullName,
      },
      user_metadata: {
        full_name: fullName,
      },
    })

    if (createError || !created.user) {
      const message = createError?.message?.toLowerCase().includes('already')
        ? 'Email sudah digunakan oleh akun lain.'
        : 'Akun Supabase gagal dibuat.'
      return json(400, { ok: false, message })
    }

    const { error: updateProfileError } = await serviceClient
      .from('profiles')
      .update({
        username,
        full_name: fullName,
        phone,
        role: targetRole,
        is_active: true,
      })
      .eq('id', created.user.id)

    if (updateProfileError) {
      await serviceClient.auth.admin.deleteUser(created.user.id).catch(() => undefined)
      return json(500, { ok: false, message: 'Profil akun gagal dibuat; akun Auth telah dibatalkan.' })
    }

    return json(200, {
      ok: true,
      userId: created.user.id,
      message: `Akun ${targetRole === 'admin' ? 'Admin' : 'Humas'} berhasil dibuat di Supabase Auth.`,
    })
  }

  if (payload.action === 'reset_password') {
    const targetRole = payload.targetRole
    if (!payload.targetUserId || !targetRole || payload.password.length < 6) {
      return json(400, { ok: false, message: 'Target akun dan password minimal 6 karakter wajib diisi.' })
    }
    if (!canManage(callerRole, targetRole)) return json(403, { ok: false, message: 'Anda tidak berhak mereset password akun ini.' })

    const { data: target } = await serviceClient
      .from('profiles')
      .select('role')
      .eq('id', payload.targetUserId)
      .maybeSingle()
    if (!target || target.role !== targetRole) return json(404, { ok: false, message: 'Akun target tidak ditemukan atau role tidak sesuai.' })

    const { error } = await serviceClient.auth.admin.updateUserById(payload.targetUserId, { password: payload.password })
    if (error) return json(400, { ok: false, message: 'Password gagal direset.' })
    return json(200, { ok: true, message: 'Password akun berhasil direset.' })
  }

  if (payload.action === 'set_active') {
    const targetRole = payload.targetRole
    if (!payload.targetUserId || !targetRole || typeof payload.active !== 'boolean') {
      return json(400, { ok: false, message: 'Target akun dan status wajib valid.' })
    }
    if (!canManage(callerRole, targetRole)) return json(403, { ok: false, message: 'Anda tidak berhak mengubah status akun ini.' })

    const { data: target } = await serviceClient
      .from('profiles')
      .select('role')
      .eq('id', payload.targetUserId)
      .maybeSingle()
    if (!target || target.role !== targetRole) return json(404, { ok: false, message: 'Akun target tidak ditemukan atau role tidak sesuai.' })

    const { error } = await serviceClient
      .from('profiles')
      .update({ is_active: payload.active })
      .eq('id', payload.targetUserId)
    if (error) return json(400, { ok: false, message: 'Status akun gagal diperbarui.' })

    return json(200, { ok: true, message: payload.active ? 'Akun berhasil diaktifkan.' : 'Akun berhasil dinonaktifkan.' })
  }

  return json(400, { ok: false, message: 'Action tidak dikenali.' })
})
