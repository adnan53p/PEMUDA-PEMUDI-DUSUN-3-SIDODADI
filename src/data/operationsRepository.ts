import type { UserRole } from '../auth/types'
import { supabase } from '../lib/supabaseClient'
import type {
  ActionResult,
  AuditItem,
  BudgetItem,
  CashReconciliation,
  CollectionTarget,
  CommitteeMember,
  CommunityMember,
  FundingSource,
  OperationActivity,
  OperationAssignment,
  OperationTransaction,
  ReportItem,
  ReportStatus,
  TransactionKind,
} from '../prototype/OperationsContext'
import type { ActivityMedia, AddActivityMediaInput } from '../prototype/activityMedia'

export interface OperationsSnapshot {
  activities: OperationActivity[]
  assignments: OperationAssignment[]
  collectionTargets: CollectionTarget[]
  communityMembers: CommunityMember[]
  transactions: OperationTransaction[]
  budgetPlans: Array<Omit<BudgetItem, 'realized'>>
  reports: ReportItem[]
  auditLogs: AuditItem[]
  committeeMembers: CommitteeMember[]
  activityMedia: ActivityMedia[]
  cashReconciliations: CashReconciliation[]
}

export interface RepositoryActor {
  id: string
  fullName: string
  role: UserRole
}

const phaseToUi: Record<string, string> = {
  planning: 'Perencanaan',
  fundraising: 'Penggalangan/Iuran',
  active: 'Berlangsung',
  settlement: 'Penyelesaian',
  lpj: 'LPJ',
  completed: 'Selesai',
}
const phaseToDb: Record<string, string> = Object.fromEntries(Object.entries(phaseToUi).map(([db, ui]) => [ui, db]))

const statusToUi: Record<string, OperationTransaction['status']> = {
  received_by_humas: 'Diterima Humas',
  pending_verification: 'Menunggu Verifikasi',
  verified: 'Terverifikasi',
  rejected: 'Ditolak',
  cancelled: 'Dibatalkan',
}
const reportToUi: Record<string, ReportStatus> = { draft: 'Draft', ready: 'Siap Diajukan', approved: 'Disahkan' }
const reportToDb: Record<ReportStatus, string> = { Draft: 'draft', 'Siap Diajukan': 'ready', Disahkan: 'approved' }
const fundingToUi: Record<string, FundingSource> = {
  activity_cash: 'Kas Kegiatan',
  humas_cash: 'Kas Humas',
  personal_reimburse: 'Uang Pribadi/Reimburse',
  advance: 'Uang Muka',
  other: 'Lainnya',
}
const fundingToDb: Record<FundingSource, string> = Object.fromEntries(Object.entries(fundingToUi).map(([db, ui]) => [ui, db])) as Record<FundingSource, string>
const permissionToUi: Record<string, string> = { collect_dues: 'Iuran', record_purchases: 'Belanja', handover_cash: 'Serah Kas' }
const permissionToDb: Record<string, string> = Object.fromEntries(Object.entries(permissionToUi).map(([db, ui]) => [ui, db]))
const mediaProviderToUi: Record<string, ActivityMedia['provider']> = { imagekit: 'imagekit', cloudflare_r2: 'cloudflare-r2', youtube: 'youtube', google_drive: 'google-drive' }
const mediaProviderToDb: Record<ActivityMedia['provider'], string> = { imagekit: 'imagekit', 'cloudflare-r2': 'cloudflare_r2', youtube: 'youtube', 'google-drive': 'google_drive' }

function client() {
  if (!supabase) throw new Error('Layanan data belum tersedia.')
  return supabase
}

function dateLabel(value: string) {
  if (!value) return '-'
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(`${value}T00:00:00`))
}

function transactionDateLabel(date: string, createdAt?: string | null) {
  const base = new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(`${date}T00:00:00`))
  if (!createdAt) return base
  const time = new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit' }).format(new Date(createdAt))
  return `${base} · ${time}`
}

function periodLabel(value: string) {
  if (!value) return '-'
  try {
    return new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(new Date(`${value}T00:00:00`))
  } catch {
    return value
  }
}

function progressForPhase(phase: string) {
  return ({ Perencanaan: 15, 'Penggalangan/Iuran': 35, Berlangsung: 60, Penyelesaian: 78, LPJ: 90, Selesai: 100 } as Record<string, number>)[phase] ?? 0
}

function reportProgress(status: ReportStatus) {
  if (status === 'Disahkan') return 100
  if (status === 'Siap Diajukan') return 95
  return 10
}

function messageFromError(error: unknown, fallback: string) {
  const raw = typeof error === 'object' && error && 'message' in error ? String((error as { message?: unknown }).message ?? '') : String(error ?? '')
  const code = raw.toUpperCase()
  const mappings: Array<[string, string]> = [
    ['ACTIVITY_LOCKED', 'Kegiatan sudah dikunci setelah LPJ disahkan.'],
    ['ACTIVITY_LOCKED_MUTATION_BLOCKED', 'Kegiatan sudah dikunci setelah LPJ disahkan.'],
    ['DUPLICATE_COLLECTION_TARGET', 'Warga/keluarga sudah terdaftar pada kegiatan ini.'],
    ['COLLECTION_TARGET_HAS_HISTORY', 'Warga sudah memiliki histori transaksi dan tidak boleh dihapus.'],
    ['BUDGET_ITEM_HAS_TRANSACTION_HISTORY', 'Kategori RAB sudah memiliki transaksi dan tidak boleh dihapus.'],
    ['INSUFFICIENT_HUMAS_CASH', 'Kas Humas tidak cukup untuk transaksi ini.'],
    ['INSUFFICIENT_ACTIVITY_CASH', 'Kas Kegiatan tidak cukup untuk transaksi ini.'],
    ['TRANSACTION_ALREADY_RECORDED', 'Warga/keluarga ini sudah memiliki iuran tercatat. Gunakan Koreksi jika nominal sebelumnya salah.'],
    ['PERMISSION_DENIED', 'Akun tidak memiliki izin untuk tindakan ini.'],
    ['ASSIGNMENT_NOT_FOUND', 'Penugasan Humas tidak ditemukan atau tidak aktif.'],
    ['INVALID_STATUS_TRANSITION', 'Perubahan status transaksi tidak diizinkan.'],
    ['REPORT_ALREADY_APPROVED', 'Laporan yang sudah disahkan terkunci.'],
    ['INVALID_EVIDENCE_INPUT', 'Data bukti transaksi belum lengkap.'],
    ['INVALID_EVIDENCE_URL', 'URL bukti transaksi tidak valid.'],
    ['INVALID_EVIDENCE_TYPE', 'Jenis file bukti tidak didukung.'],
    ['TRANSACTION_NOT_FOUND', 'Transaksi tidak ditemukan.'],
    ['23505', 'Data dengan nilai yang sama sudah tersimpan.'],
  ]
  const found = mappings.find(([needle]) => code.includes(needle))
  return found?.[1] ?? fallback
}

function success(message: string, id?: string): ActionResult { return { ok: true, message, id } }
function failure(error: unknown, fallback: string): ActionResult { return { ok: false, message: messageFromError(error, fallback) } }

function normalizeSnapshot(raw: {
  activities?: any[]
  assignments?: any[]
  permissions?: any[]
  communityMembers?: any[]
  collectionTargets?: any[]
  budgetItems?: any[]
  transactions?: any[]
  evidences?: any[]
  profiles?: any[]
  reports?: any[]
  committeeMembers?: any[]
  activityMedia?: any[]
  cashReconciliations?: any[]
  auditLogs?: any[]
}): OperationsSnapshot {
  const activitiesRaw = raw.activities ?? []
  const assignmentsRaw = raw.assignments ?? []
  const permissionsRaw = raw.permissions ?? []
  const budgetRaw = raw.budgetItems ?? []
  const profilesRaw = raw.profiles ?? []
  const evidenceRaw = raw.evidences ?? []
  const reportsRaw = raw.reports ?? []

  const profileMap = new Map<string, any>(profilesRaw.map((item) => [item.id, item]))
  const activityNameMap = new Map<string, string>(activitiesRaw.map((item) => [item.id, item.name]))
  const permissionsByAssignment = new Map<string, string[]>()
  permissionsRaw.forEach((item) => {
    const items = permissionsByAssignment.get(item.assignment_id) ?? []
    const label = permissionToUi[item.permission]
    if (label) items.push(label)
    permissionsByAssignment.set(item.assignment_id, items)
  })
  const assignmentCount = new Map<string, number>()
  assignmentsRaw.forEach((item) => assignmentCount.set(item.activity_id, (assignmentCount.get(item.activity_id) ?? 0) + 1))
  const budgetTotal = new Map<string, number>()
  budgetRaw.forEach((item) => budgetTotal.set(item.activity_id, (budgetTotal.get(item.activity_id) ?? 0) + Number(item.planned_amount ?? 0)))
  const evidenceByTransaction = new Map<string, any>()
  evidenceRaw.forEach((item) => { if (!evidenceByTransaction.has(item.transaction_id)) evidenceByTransaction.set(item.transaction_id, item) })

  const activities: OperationActivity[] = activitiesRaw.map((item) => {
    const phase = phaseToUi[item.phase] ?? item.phase ?? 'Perencanaan'
    return {
      id: item.id,
      name: item.name,
      phase,
      progress: progressForPhase(phase),
      humas: assignmentCount.get(item.id) ?? 0,
      date: dateLabel(item.event_date),
      dateISO: item.event_date,
      location: item.location,
      budgetTarget: budgetTotal.get(item.id) ?? 0,
      category: item.category,
      summary: item.summary ?? '',
      publicVisible: Boolean(item.public_visible),
      financialLocked: Boolean(item.financial_locked),
    }
  })

  const assignments: OperationAssignment[] = assignmentsRaw.map((item) => {
    const profile = profileMap.get(item.humas_user_id)
    return {
      id: item.id,
      humasUserId: item.humas_user_id,
      humas: item.humas_public_label ?? profile?.full_name ?? 'Humas',
      activityId: item.activity_id,
      activity: activityNameMap.get(item.activity_id) ?? 'Kegiatan',
      area: item.area_label,
      permissions: permissionsByAssignment.get(item.id) ?? [],
    }
  })

  const communityMembers: CommunityMember[] = (raw.communityMembers ?? []).map((item) => ({ id: item.id, name: item.full_name ?? item.name ?? 'Warga', area: item.area_label ?? item.area ?? '-' }))
  const memberMap = new Map(communityMembers.map((item) => [item.id, item]))
  const collectionTargets: CollectionTarget[] = (raw.collectionTargets ?? []).map((item) => {
    const member = memberMap.get(item.member_id)
    return {
      id: item.id,
      activityId: item.activity_id,
      assignmentId: item.assignment_id,
      name: item.public_name ?? member?.name ?? 'Warga',
      area: item.area_label ?? member?.area ?? '-',
    }
  })

  const budgetPlans = budgetRaw.map((item) => ({ id: item.id, activityId: item.activity_id, category: item.category, plan: Number(item.planned_amount ?? 0) }))

  const transactions: OperationTransaction[] = (raw.transactions ?? []).map((item) => {
    const creator = profileMap.get(item.created_by_user_id)
    const verifier = profileMap.get(item.verified_by_user_id)
    const recipient = profileMap.get(item.handover_recipient_user_id)
    const evidence = evidenceByTransaction.get(item.id)
    const funding = item.funding_source ? fundingToUi[item.funding_source] : undefined
    const role = (item.created_by_role ?? creator?.role ?? 'humas') as UserRole
    return {
      id: item.id,
      activityId: item.activity_id,
      activityName: activityNameMap.get(item.activity_id) ?? 'Kegiatan',
      kind: item.kind as TransactionKind,
      label: item.public_label ?? item.label,
      category: item.category,
      amount: Number(item.amount ?? 0),
      createdByUserId: item.actor_scope_id ?? item.created_by_user_id ?? 'public',
      createdByName: item.actor_public_label ?? creator?.full_name ?? 'Petugas kegiatan',
      createdByRole: role,
      assignmentId: item.assignment_id ?? undefined,
      targetId: item.collection_target_id ?? undefined,
      areaLabel: item.area_label_snapshot ?? undefined,
      owner: item.actor_public_label ?? creator?.full_name ?? 'Petugas kegiatan',
      date: transactionDateLabel(item.transaction_date, item.created_at),
      dateISO: item.transaction_date,
      status: statusToUi[item.status] ?? 'Dibatalkan',
      evidenceName: item.evidence_present ? (evidence?.title ?? 'Bukti tersedia') : evidence?.title ?? undefined,
      evidenceType: evidence?.mime_type ?? undefined,
      evidenceUrl: evidence?.url ?? undefined,
      note: item.note ?? undefined,
      vendor: item.vendor ?? undefined,
      quantity: item.quantity == null ? undefined : Number(item.quantity),
      unitPrice: item.unit_price == null ? undefined : Number(item.unit_price),
      paymentMethod: item.payment_method ?? undefined,
      fundingSource: funding,
      verifiedByUserId: item.verified_by_user_id ?? undefined,
      verifiedByName: verifier?.full_name ?? undefined,
      verifiedAt: item.verified_at ?? undefined,
      handoverRecipientUserId: item.handover_recipient_user_id ?? undefined,
      handoverRecipientName: recipient?.full_name ?? undefined,
      cancellationReason: item.cancellation_reason ?? undefined,
      correctionOfId: item.correction_of_transaction_id ?? undefined,
      correctedByTransactionId: item.corrected_by_transaction_id ?? undefined,
    }
  })

  const reports: ReportItem[] = reportsRaw.map((item) => {
    const status = reportToUi[item.status] ?? 'Draft'
    return {
      id: item.id,
      activityId: item.activity_id,
      activityName: activityNameMap.get(item.activity_id) ?? 'Kegiatan',
      title: item.title,
      type: item.report_type,
      period: item.period_label || periodLabel(activitiesRaw.find((a) => a.id === item.activity_id)?.event_date ?? ''),
      progress: reportProgress(status),
      status,
    }
  })

  const committeeMembers: CommitteeMember[] = (raw.committeeMembers ?? []).map((item) => ({ id: item.id, activityId: item.activity_id, name: item.name, role: item.role_title, phone: item.phone ?? undefined }))
  const activityMedia: ActivityMedia[] = (raw.activityMedia ?? []).map((item) => ({
    id: item.id,
    activityId: item.activity_id,
    type: item.type,
    provider: mediaProviderToUi[item.provider] ?? 'imagekit',
    title: item.title,
    url: item.public_url,
    sortOrder: Number(item.sort_order ?? 0),
    isCover: Boolean(item.is_cover),
    publicVisible: item.public_visible !== false,
    externalFileId: item.external_file_id ?? undefined,
  }))

  const cashReconciliations: CashReconciliation[] = (raw.cashReconciliations ?? []).map((item) => ({
    id: item.id,
    activityId: item.activity_id,
    assignmentId: item.assignment_id,
    humasUserId: item.humas_user_id,
    humasName: profileMap.get(item.humas_user_id)?.full_name ?? 'Humas',
    expectedAmount: Number(item.expected_amount ?? 0),
    physicalAmount: Number(item.physical_amount ?? 0),
    difference: Number(item.difference ?? 0),
    dateISO: String(item.reconciled_at ?? item.created_at ?? '').slice(0, 10),
    createdAt: item.reconciled_at ?? item.created_at,
    note: item.note ?? undefined,
  }))

  const auditLogs: AuditItem[] = (raw.auditLogs ?? []).map((item) => ({
    id: item.id,
    time: item.created_at ? new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit' }).format(new Date(item.created_at)) : '-',
    timestampISO: item.created_at,
    actorUserId: item.actor_user_id ?? undefined,
    actor: profileMap.get(item.actor_user_id)?.full_name ?? 'Sistem',
    action: item.action,
    detail: item.detail,
    entityType: item.entity_type ?? undefined,
    entityId: item.entity_id ?? undefined,
    reason: item.reason ?? undefined,
  }))

  return { activities, assignments, collectionTargets, communityMembers, transactions, budgetPlans, reports, auditLogs, committeeMembers, activityMedia, cashReconciliations }
}

async function q<T = any>(promise: PromiseLike<{ data: T | null; error: any }>, fallback: T): Promise<T> {
  const { data, error } = await promise
  if (error) throw error
  return (data ?? fallback) as T
}

export async function loadInternalOperationsSnapshot(actor: RepositoryActor): Promise<OperationsSnapshot> {
  const sb = client()
  const [
    activities, assignments, permissions, communityMembers, collectionTargets, budgetItems,
    transactions, evidences, reports, committeeMembers, activityMedia, cashReconciliations, profiles,
    auditLogs,
  ] = await Promise.all([
    q(sb.from('activities').select('id, name, category, phase, event_date, location, summary, public_visible, financial_locked').order('event_date', { ascending: false }), []),
    q(sb.from('humas_assignments').select('id, activity_id, humas_user_id, area_label, is_active').eq('is_active', true), []),
    q(sb.from('humas_assignment_permissions').select('assignment_id, permission'), []),
    q(sb.from('community_members').select('id, full_name, area_label, is_active').eq('is_active', true).order('full_name'), []),
    q(sb.from('activity_collection_targets').select('id, activity_id, assignment_id, member_id'), []),
    q(sb.from('budget_items').select('id, activity_id, category, planned_amount'), []),
    q(sb.from('financial_transactions').select('*').order('created_at', { ascending: false }), []),
    q(sb.from('transaction_evidence').select('id, transaction_id, title, mime_type, provider, url, external_file_id'), []),
    q(sb.from('activity_reports').select('id, activity_id, title, report_type, period_label, status, approved_by_user_id, approved_at').order('created_at'), []),
    q(sb.from('activity_committee_members').select('id, activity_id, name, role_title, phone, sort_order').order('sort_order'), []),
    q(sb.from('activity_media').select('id, activity_id, type, provider, title, public_url, external_file_id, sort_order, is_cover, public_visible').order('sort_order'), []),
    q(sb.from('cash_reconciliations').select('*').order('reconciled_at', { ascending: false }), []),
    q(sb.from('profiles').select('id, full_name, role'), []),
    actor.role === 'admin' || actor.role === 'superadmin'
      ? q(sb.from('audit_logs').select('id, actor_user_id, action, entity_type, entity_id, reason, detail, created_at').order('created_at', { ascending: false }).limit(500), [])
      : Promise.resolve([]),
  ])

  return normalizeSnapshot({ activities, assignments, permissions, communityMembers, collectionTargets, budgetItems, transactions, evidences, profiles, reports, committeeMembers, activityMedia, cashReconciliations, auditLogs })
}

export async function loadPublicOperationsSnapshot(): Promise<OperationsSnapshot> {
  const sb = client()
  const { data, error } = await sb.rpc('get_public_operations_snapshot')
  if (error) throw error
  const payload = (data ?? {}) as any
  return normalizeSnapshot({
    activities: payload.activities ?? [],
    assignments: payload.assignments ?? [],
    permissions: payload.permissions ?? [],
    communityMembers: payload.community_members ?? [],
    collectionTargets: payload.collection_targets ?? [],
    budgetItems: payload.budget_items ?? [],
    transactions: payload.transactions ?? [],
    evidences: [],
    profiles: [],
    reports: payload.reports ?? [],
    committeeMembers: [],
    activityMedia: payload.activity_media ?? [],
    cashReconciliations: [],
    auditLogs: [],
  })
}

export async function createActivity(input: { name: string; dateISO: string; location: string; budgetTarget: number; category: string; summary: string; publicVisible: boolean }): Promise<ActionResult> {
  try {
    const slug = `${input.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'kegiatan'}-${Date.now().toString(36)}`
    const { data, error } = await client().rpc('rpc_create_activity', {
      p_name: input.name.trim(), p_slug: slug, p_event_date: input.dateISO, p_location: input.location.trim(),
      p_category: input.category.trim() || 'Kegiatan', p_summary: input.summary.trim(), p_public_visible: input.publicVisible,
      p_initial_budget: Math.max(0, Math.trunc(input.budgetTarget || 0)),
    })
    if (error) throw error
    return success(input.publicVisible ? 'Kegiatan dibuat dan dipublikasikan.' : 'Kegiatan dibuat sebagai kegiatan internal.', String(data))
  } catch (error) { return failure(error, 'Kegiatan gagal dibuat.') }
}

export async function updateActivityPhase(id: string, phase: string): Promise<ActionResult> {
  try {
    const dbPhase = phaseToDb[phase]
    if (!dbPhase) return { ok: false, message: 'Fase kegiatan tidak valid.' }
    const { error } = await client().from('activities').update({ phase: dbPhase }).eq('id', id)
    if (error) throw error
    return success(`Fase kegiatan diperbarui menjadi ${phase}.`)
  } catch (error) { return failure(error, 'Fase kegiatan gagal diperbarui.') }
}

export async function updateActivityPublication(id: string, publicVisible: boolean): Promise<ActionResult> {
  try {
    const { error } = await client().from('activities').update({ public_visible: publicVisible }).eq('id', id)
    if (error) throw error
    return success(publicVisible ? 'Kegiatan dipublikasikan ke website.' : 'Kegiatan disembunyikan dari website.')
  } catch (error) { return failure(error, 'Status publikasi gagal diperbarui.') }
}

export async function createHumasAssignment(input: { humasUserId: string; activityId: string; area: string; permissions: string[] }): Promise<ActionResult> {
  try {
    const dbPermissions = input.permissions.map((item) => permissionToDb[item]).filter(Boolean)
    const { data, error } = await client().rpc('rpc_create_humas_assignment', {
      p_activity_id: input.activityId, p_humas_user_id: input.humasUserId, p_area_label: input.area.trim() || 'Tanpa wilayah', p_permissions: dbPermissions,
    })
    if (error) throw error
    return success('Penugasan Humas berhasil disimpan.', String(data))
  } catch (error) { return failure(error, 'Penugasan Humas gagal disimpan.') }
}

export async function addCollectionTarget(input: { activityId: string; assignmentId: string; name: string; area: string }): Promise<ActionResult> {
  try {
    const { data, error } = await client().rpc('rpc_add_collection_target', {
      p_activity_id: input.activityId, p_assignment_id: input.assignmentId, p_full_name: input.name.trim(), p_area_label: input.area.trim(),
    })
    if (error) throw error
    return success('Warga/keluarga berhasil ditambahkan ke daftar iuran.', String(data))
  } catch (error) { return failure(error, 'Warga/keluarga gagal ditambahkan.') }
}

export async function addCollectionTargetsBulk(inputs: Array<{ activityId: string; assignmentId: string; name: string; area: string }>): Promise<ActionResult> {
  if (!inputs.length) return { ok: false, message: 'Tidak ada data warga yang dapat diimpor.' }
  try {
    const first = inputs[0]
    const rows = inputs.map((item) => ({ name: item.name.trim(), area: item.area.trim() })).filter((item) => item.name)
    const { data, error } = await client().rpc('rpc_add_collection_targets_bulk', {
      p_activity_id: first.activityId, p_assignment_id: first.assignmentId, p_rows: rows,
    })
    if (error) throw error
    const result = (data ?? {}) as any
    return success(`${Number(result.inserted ?? 0)} warga berhasil ditambahkan${Number(result.skipped ?? 0) ? `, ${Number(result.skipped)} baris dilewati` : ''}.`)
  } catch (error) { return failure(error, 'Impor daftar warga gagal.') }
}

export async function removeCollectionTarget(id: string): Promise<ActionResult> {
  try {
    const { error } = await client().from('activity_collection_targets').delete().eq('id', id)
    if (error) throw error
    return success('Warga dihapus dari daftar iuran.')
  } catch (error) { return failure(error, 'Warga gagal dihapus dari daftar iuran.') }
}

export async function addBudgetItem(input: { activityId: string; category: string; plan: number }): Promise<ActionResult> {
  try {
    const { data, error } = await client().from('budget_items').insert({ activity_id: input.activityId, category: input.category.trim(), planned_amount: Math.trunc(input.plan) }).select('id').single()
    if (error) throw error
    return success('Kategori RAB ditambahkan.', data?.id)
  } catch (error) { return failure(error, 'Kategori RAB gagal ditambahkan.') }
}

export async function updateBudgetItem(id: string, plan: number): Promise<ActionResult> {
  try {
    const { error } = await client().from('budget_items').update({ planned_amount: Math.trunc(plan) }).eq('id', id)
    if (error) throw error
    return success('Nilai RAB diperbarui.')
  } catch (error) { return failure(error, 'Nilai RAB gagal diperbarui.') }
}

export async function removeBudgetItem(id: string): Promise<ActionResult> {
  try {
    const { error } = await client().from('budget_items').delete().eq('id', id)
    if (error) throw error
    return success('Kategori RAB dihapus.')
  } catch (error) { return failure(error, 'Kategori RAB gagal dihapus.') }
}

export async function addCommitteeMember(input: { activityId: string; name: string; role: string; phone?: string }): Promise<ActionResult> {
  try {
    const { data, error } = await client().from('activity_committee_members').insert({ activity_id: input.activityId, name: input.name.trim(), role_title: input.role.trim(), phone: input.phone?.trim() || null }).select('id').single()
    if (error) throw error
    return success('Anggota panitia ditambahkan.', data?.id)
  } catch (error) { return failure(error, 'Anggota panitia gagal ditambahkan.') }
}

export async function updateCommitteeMember(id: string, input: { name?: string; role?: string; phone?: string }): Promise<ActionResult> {
  try {
    const payload: Record<string, unknown> = {}
    if (input.name != null) payload.name = input.name.trim()
    if (input.role != null) payload.role_title = input.role.trim()
    if (input.phone != null) payload.phone = input.phone.trim() || null
    const { error } = await client().from('activity_committee_members').update(payload).eq('id', id)
    if (error) throw error
    return success('Data panitia diperbarui.')
  } catch (error) { return failure(error, 'Data panitia gagal diperbarui.') }
}

export async function removeCommitteeMember(id: string): Promise<ActionResult> {
  try {
    const { error } = await client().from('activity_committee_members').delete().eq('id', id)
    if (error) throw error
    return success('Anggota panitia dihapus.')
  } catch (error) { return failure(error, 'Anggota panitia gagal dihapus.') }
}

export async function addActivityMedia(input: AddActivityMediaInput): Promise<ActionResult> {
  try {
    const { data, error } = await client().rpc('rpc_add_activity_media', {
      p_activity_id: input.activityId, p_type: input.type, p_provider: mediaProviderToDb[input.provider], p_title: input.title.trim(), p_public_url: input.url.trim(),
      p_external_file_id: input.externalFileId?.trim() || null, p_is_cover: Boolean(input.isCover), p_public_visible: input.publicVisible !== false,
    })
    if (error) throw error
    return success(input.type === 'photo' ? 'Foto kegiatan ditambahkan.' : 'Video kegiatan ditambahkan.', String(data))
  } catch (error) { return failure(error, 'Media kegiatan gagal ditambahkan.') }
}

export async function removeActivityMedia(id: string): Promise<ActionResult> {
  try {
    const { error } = await client().from('activity_media').delete().eq('id', id)
    if (error) throw error
    return success('Media kegiatan dihapus.')
  } catch (error) { return failure(error, 'Media kegiatan gagal dihapus.') }
}

export async function setActivityMediaVisibility(id: string, publicVisible: boolean): Promise<ActionResult> {
  try {
    const { error } = await client().from('activity_media').update({ public_visible: publicVisible }).eq('id', id)
    if (error) throw error
    return success(publicVisible ? 'Media ditampilkan di halaman kegiatan.' : 'Media disembunyikan dari halaman publik.')
  } catch (error) { return failure(error, 'Visibilitas media gagal diperbarui.') }
}

export async function setActivityCover(id: string): Promise<ActionResult> {
  try {
    const { error } = await client().rpc('rpc_set_activity_cover', { p_media_id: id })
    if (error) throw error
    return success('Foto cover kegiatan diperbarui.')
  } catch (error) { return failure(error, 'Foto cover gagal diperbarui.') }
}

export async function moveActivityMedia(id: string, direction: 'up' | 'down'): Promise<ActionResult> {
  try {
    const { error } = await client().rpc('rpc_move_activity_media', { p_media_id: id, p_direction: direction })
    if (error) throw error
    return success('Urutan media diperbarui.')
  } catch (error) { return failure(error, 'Urutan media gagal diperbarui.') }
}

export async function attachTransactionEvidence(transactionId: string, input: { title: string; url: string; mimeType?: string; externalFileId?: string }): Promise<ActionResult> {
  try {
    const { error } = await client().rpc('rpc_attach_transaction_evidence', {
      p_transaction_id: transactionId,
      p_title: input.title.trim() || 'Bukti transaksi',
      p_url: input.url.trim(),
      p_mime_type: input.mimeType ?? null,
      p_external_file_id: input.externalFileId?.trim() || null,
    })
    if (error) throw error
    return success('Bukti transaksi berhasil dilampirkan.')
  } catch (error) { return failure(error, 'Bukti transaksi gagal disimpan.') }
}

export async function addFinancialTransaction(input: {
  activityId: string; kind: TransactionKind; label: string; category: string; amount: number; assignmentId?: string; targetId?: string; areaLabel?: string;
  evidenceName?: string; evidenceType?: string; note?: string; vendor?: string; quantity?: number; unitPrice?: number; paymentMethod?: string; fundingSource?: FundingSource;
}): Promise<ActionResult> {
  try {
    const { data, error } = await client().rpc('rpc_create_financial_transaction', {
      p_activity_id: input.activityId,
      p_kind: input.kind,
      p_label: input.label.trim(),
      p_category: input.category.trim(),
      p_amount: Math.trunc(input.amount),
      p_assignment_id: input.assignmentId ?? null,
      p_collection_target_id: input.targetId ?? null,
      p_area_label: input.areaLabel ?? null,
      p_funding_source: input.fundingSource ? fundingToDb[input.fundingSource] : null,
      p_vendor: input.vendor ?? null,
      p_quantity: input.quantity ?? null,
      p_unit_price: input.unitPrice == null ? null : Math.trunc(input.unitPrice),
      p_payment_method: input.paymentMethod ?? null,
      p_note: input.note ?? null,
      p_evidence_name: input.evidenceName ?? null,
      p_evidence_type: input.evidenceType ?? null,
    })
    if (error) throw error
    const message = input.kind === 'income' ? (input.category.toLowerCase() === 'iuran' ? 'Iuran diterima Humas dan berhasil disimpan.' : 'Pemasukan kegiatan tersimpan sebagai transaksi sah.') : input.kind === 'handover' ? 'Serah kas diajukan dan menunggu konfirmasi Admin.' : 'Pembelanjaan tersimpan dan menunggu verifikasi Admin.'
    return success(message, String(data))
  } catch (error) { return failure(error, 'Transaksi gagal disimpan.') }
}

export async function setFinancialTransactionStatus(id: string, status: 'verified' | 'rejected', reason?: string): Promise<ActionResult> {
  try {
    const { error } = await client().rpc('rpc_set_financial_transaction_status', { p_transaction_id: id, p_status: status, p_reason: reason ?? null })
    if (error) throw error
    return success(status === 'verified' ? 'Transaksi berhasil diverifikasi.' : 'Transaksi ditolak.')
  } catch (error) { return failure(error, 'Status transaksi gagal diperbarui.') }
}

export async function cancelFinancialTransaction(id: string, reason: string): Promise<ActionResult> {
  try {
    const { error } = await client().rpc('rpc_cancel_financial_transaction', { p_transaction_id: id, p_reason: reason.trim() })
    if (error) throw error
    return success('Transaksi dibatalkan dan histori tetap tersimpan.')
  } catch (error) { return failure(error, 'Transaksi gagal dibatalkan.') }
}

export async function correctIncomeTransaction(id: string, amount: number, reason: string): Promise<ActionResult> {
  try {
    const { data, error } = await client().rpc('rpc_correct_income_transaction', { p_transaction_id: id, p_amount: Math.trunc(amount), p_reason: reason.trim() })
    if (error) throw error
    return success('Iuran dikoreksi. Transaksi lama tetap tersimpan sebagai Dibatalkan untuk audit trail.', String(data))
  } catch (error) { return failure(error, 'Koreksi iuran gagal disimpan.') }
}

export async function recordCashReconciliation(input: { assignmentId: string; physicalAmount: number; note?: string }): Promise<ActionResult> {
  try {
    const { data, error } = await client().rpc('rpc_record_cash_reconciliation', { p_assignment_id: input.assignmentId, p_physical_amount: Math.trunc(input.physicalAmount), p_note: input.note?.trim() || null })
    if (error) throw error
    const result = (data ?? {}) as any
    const difference = Number(result.difference ?? 0)
    return success(difference === 0 ? 'Tutup kas tersimpan. Uang fisik sesuai dengan sistem.' : `Tutup kas tersimpan dengan selisih Rp ${Math.abs(difference).toLocaleString('id-ID')}.`, result.id)
  } catch (error) { return failure(error, 'Tutup kas gagal disimpan.') }
}

export async function updateReportStatus(id: string, status: ReportStatus): Promise<ActionResult> {
  try {
    const { error } = await client().rpc('rpc_update_activity_report_status', { p_report_id: id, p_status: reportToDb[status] })
    if (error) throw error
    return success(status === 'Disahkan' ? 'LPJ disahkan. Kegiatan menjadi Selesai dan keuangan dikunci.' : `Status laporan menjadi ${status}.`)
  } catch (error) { return failure(error, 'Status laporan gagal diperbarui.') }
}

export async function unlockActivity(id: string, reason: string): Promise<ActionResult> {
  try {
    const { error } = await client().rpc('rpc_unlock_activity', { p_activity_id: id, p_reason: reason.trim() })
    if (error) throw error
    return success('Kegiatan dibuka kembali untuk koreksi dan tindakan tercatat di audit log.')
  } catch (error) { return failure(error, 'Kegiatan gagal dibuka untuk koreksi.') }
}
