import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { UserRole } from '../auth/types'
import { type ActivityMedia, type AddActivityMediaInput, validateActivityMediaInput } from './activityMedia'
import { useAuth } from '../auth/AuthContext'
import { SUPABASE_CONFIGURED } from '../lib/supabaseClient'
import * as operationsRepository from '../data/operationsRepository'

export type TransactionStatus = 'Diterima Humas' | 'Menunggu Verifikasi' | 'Terverifikasi' | 'Ditolak' | 'Dibatalkan'
export type TransactionKind = 'income' | 'expense' | 'handover'
export type ReportStatus = 'Draft' | 'Siap Diajukan' | 'Disahkan'
export type FundingSource = 'Kas Kegiatan' | 'Kas Humas' | 'Uang Pribadi/Reimburse' | 'Uang Muka' | 'Lainnya'

export interface OperationActor {
  userId: string
  name: string
  role: UserRole
}

export interface OperationActivity {
  id: string
  name: string
  phase: string
  progress: number
  humas: number
  date: string
  dateISO: string
  location: string
  budgetTarget: number
  category: string
  summary: string
  publicVisible: boolean
  financialLocked: boolean
}

export interface OperationAssignment {
  id: string
  humasUserId: string
  humas: string
  activityId: string
  activity: string
  area: string
  permissions: string[]
}

export interface CommunityMember {
  id: string
  name: string
  area: string
}

export interface CollectionTarget {
  id: string
  activityId: string
  assignmentId: string
  name: string
  area: string
}

export interface OperationTransaction {
  id: string
  activityId: string
  activityName: string
  kind: TransactionKind
  label: string
  category: string
  amount: number
  createdByUserId: string
  createdByName: string
  createdByRole: UserRole
  assignmentId?: string
  targetId?: string
  areaLabel?: string
  owner: string
  date: string
  dateISO: string
  status: TransactionStatus
  evidenceName?: string
  evidenceType?: string
  evidenceUrl?: string
  note?: string
  vendor?: string
  quantity?: number
  unitPrice?: number
  paymentMethod?: string
  prototypeCreated?: boolean
  fundingSource?: FundingSource
  verifiedByUserId?: string
  verifiedByName?: string
  verifiedAt?: string
  handoverRecipientUserId?: string
  handoverRecipientName?: string
  cancellationReason?: string
  correctionOfId?: string
  correctedByTransactionId?: string
}


export function isRecordedIncome(transaction: OperationTransaction) {
  return transaction.kind === 'income' && (transaction.status === 'Diterima Humas' || transaction.status === 'Terverifikasi')
}

export function isRecognizedTransaction(transaction: OperationTransaction) {
  return transaction.kind === 'income' ? isRecordedIncome(transaction) : transaction.status === 'Terverifikasi'
}

export function isActivityFundedExpense(transaction: OperationTransaction) {
  if (transaction.kind !== 'expense') return false
  return transaction.fundingSource !== 'Kas Humas' && transaction.fundingSource !== 'Uang Pribadi/Reimburse'
}

export function needsAdminVerification(transaction: OperationTransaction) {
  return transaction.kind !== 'income' && transaction.status === 'Menunggu Verifikasi'
}

export function transactionStatusLabel(transaction: OperationTransaction) {
  if (transaction.kind === 'handover' && transaction.status === 'Menunggu Verifikasi') return 'Menunggu Konfirmasi Admin'
  return transaction.status
}

function normalizeCategoryKey(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
}

function isOneEditApart(left: string, right: string) {
  if (left === right) return true
  if (Math.abs(left.length - right.length) > 1) return false

  const shorter = left.length <= right.length ? left : right
  const longer = left.length <= right.length ? right : left
  let shortIndex = 0
  let longIndex = 0
  let edits = 0

  while (shortIndex < shorter.length && longIndex < longer.length) {
    if (shorter[shortIndex] === longer[longIndex]) {
      shortIndex += 1
      longIndex += 1
      continue
    }

    edits += 1
    if (edits > 1) return false
    if (shorter.length === longer.length) shortIndex += 1
    longIndex += 1
  }

  if (longIndex < longer.length || shortIndex < shorter.length) edits += 1
  return edits <= 1
}

export function categoriesMatch(left: string, right: string) {
  const normalizedLeft = normalizeCategoryKey(left)
  const normalizedRight = normalizeCategoryKey(right)
  if (!normalizedLeft || !normalizedRight) return false
  if (normalizedLeft === normalizedRight) return true

  // Tolerate a single typo only for meaningful category names. This handles
  // entries such as "kosumsi" versus "Konsumsi" without broadly merging
  // unrelated short labels.
  if (Math.min(normalizedLeft.length, normalizedRight.length) < 5) return false
  return isOneEditApart(normalizedLeft, normalizedRight)
}

export interface BudgetItem {
  id: string
  activityId: string
  category: string
  plan: number
  realized: number
}

export interface CommitteeMember {
  id: string
  activityId: string
  name: string
  role: string
  phone?: string
}

export interface CashReconciliation {
  id: string
  activityId: string
  assignmentId: string
  humasUserId: string
  humasName: string
  expectedAmount: number
  physicalAmount: number
  difference: number
  dateISO: string
  createdAt: string
  note?: string
}

export interface ReportItem {
  id: string
  activityId: string
  activityName: string
  title: string
  type: string
  period: string
  progress: number
  status: ReportStatus
}

export interface AuditItem {
  id: string
  time: string
  timestampISO?: string
  actorUserId?: string
  actor: string
  action: string
  detail: string
  entityType?: string
  entityId?: string
  reason?: string
}

interface AuditMeta {
  entityType?: string
  entityId?: string
  reason?: string
}

interface AddTransactionInput {
  activityId: string
  activityName: string
  kind: TransactionKind
  label: string
  category: string
  amount: number
  createdBy: OperationActor
  assignmentId?: string
  targetId?: string
  areaLabel?: string
  evidenceName?: string
  evidenceType?: string
  note?: string
  vendor?: string
  quantity?: number
  unitPrice?: number
  paymentMethod?: string
  fundingSource?: FundingSource
}

interface AddActivityInput {
  name: string
  phase: string
  date: string
  dateISO?: string
  location: string
  budgetTarget: number
  category?: string
  summary?: string
  publicVisible?: boolean
}

interface AddCollectionTargetInput {
  activityId: string
  assignmentId: string
  name: string
  area: string
}

interface AddBudgetItemInput {
  activityId: string
  category: string
  plan: number
}

interface AddCommitteeMemberInput {
  activityId: string
  name: string
  role: string
  phone?: string
}

interface AddAssignmentInput {
  assignmentId?: string
  humasUserId: string
  humas: string
  activityId: string
  activity: string
  area: string
  permissions: string[]
}

export interface ActionResult {
  ok: boolean
  message: string
  id?: string
}

type MutationResult = ActionResult | Promise<ActionResult>

interface OperationsContextValue {
  loading: boolean
  syncError: string | null
  refresh: () => Promise<void>
  activities: OperationActivity[]
  assignments: OperationAssignment[]
  collectionTargets: CollectionTarget[]
  communityMembers: CommunityMember[]
  transactions: OperationTransaction[]
  budgets: BudgetItem[]
  reports: ReportItem[]
  auditLogs: AuditItem[]
  committeeMembers: CommitteeMember[]
  activityMedia: ActivityMedia[]
  cashReconciliations: CashReconciliation[]
  addActivity: (input: AddActivityInput, actor?: OperationActor) => MutationResult
  addTransaction: (input: AddTransactionInput) => MutationResult
  verifyTransaction: (id: string, actor?: OperationActor) => MutationResult
  rejectTransaction: (id: string, actor?: OperationActor) => MutationResult
  cancelTransaction: (id: string, actor?: OperationActor) => MutationResult
  cancelTransactionWithReason: (id: string, reason: string, actor?: OperationActor) => MutationResult
  correctIncomeTransaction: (id: string, amount: number, reason: string, actor: OperationActor) => MutationResult
  addAssignment: (input: AddAssignmentInput, actor?: OperationActor) => MutationResult
  addCollectionTarget: (input: AddCollectionTargetInput, actor?: OperationActor) => MutationResult
  addCollectionTargetsBulk: (inputs: AddCollectionTargetInput[], actor?: OperationActor) => MutationResult
  removeCollectionTarget: (id: string, actor?: OperationActor) => MutationResult
  addBudgetItem: (input: AddBudgetItemInput, actor?: OperationActor) => MutationResult
  updateBudgetItem: (id: string, plan: number, actor?: OperationActor) => MutationResult
  removeBudgetItem: (id: string, actor?: OperationActor) => MutationResult
  addCommitteeMember: (input: AddCommitteeMemberInput, actor?: OperationActor) => MutationResult
  updateCommitteeMember: (id: string, input: Partial<Pick<CommitteeMember, 'name' | 'role' | 'phone'>>, actor?: OperationActor) => MutationResult
  removeCommitteeMember: (id: string, actor?: OperationActor) => MutationResult
  addActivityMedia: (input: AddActivityMediaInput, actor?: OperationActor) => MutationResult
  removeActivityMedia: (id: string, actor?: OperationActor) => MutationResult
  setActivityMediaVisibility: (id: string, publicVisible: boolean, actor?: OperationActor) => MutationResult
  setActivityCover: (id: string, actor?: OperationActor) => MutationResult
  moveActivityMedia: (id: string, direction: 'up' | 'down', actor?: OperationActor) => MutationResult
  attachTransactionEvidence: (transactionId: string, input: { title: string; url: string; mimeType?: string; externalFileId?: string }, actor?: OperationActor) => MutationResult
  updateActivityPhase: (id: string, phase: string, actor?: OperationActor) => MutationResult
  updateActivityPublication: (id: string, publicVisible: boolean, actor?: OperationActor) => MutationResult
  updateReportStatus: (id: string, status: ReportStatus, actor?: OperationActor) => MutationResult
  unlockActivity: (id: string, reason: string, actor?: OperationActor) => MutationResult
  recordCashReconciliation: (input: Omit<CashReconciliation, 'id' | 'difference' | 'dateISO' | 'createdAt'>, actor?: OperationActor) => MutationResult
}

const adminActor: OperationActor = { userId: 'usr-admin-001', name: 'Admin Organisasi', role: 'admin' }

const initialActivities: OperationActivity[] = [
  {
    id: 'festival-kemerdekaan-2026', name: 'Festival Kemerdekaan Dusun 3 Sidodadi 2026', phase: 'LPJ', progress: 90, humas: 3,
    date: '17 Agustus 2026', dateISO: '2026-08-17', location: 'Lapangan Dusun 3 Sidodadi', budgetTarget: 12_000_000,
    category: 'Budaya', summary: 'Rangkaian perayaan kemerdekaan yang mempertemukan pemuda dan warga melalui lomba, pentas, dan kerja bersama.', publicVisible: true, financialLocked: false,
  },
  {
    id: 'turnamen-futsal-antar-rt', name: 'Turnamen Futsal Antar RT', phase: 'Selesai', progress: 100, humas: 0,
    date: '12 Juli 2026', dateISO: '2026-07-12', location: 'Lapangan Dusun 3 Sidodadi', budgetTarget: 6_000_000,
    category: 'Olahraga', summary: 'Kompetisi olahraga antar-RT yang menjadi ruang pertemuan, sportivitas, dan kebersamaan pemuda.', publicVisible: true, financialLocked: true,
  },
  {
    id: 'bakti-sosial-desa', name: 'Bakti Sosial Warga Dusun 3', phase: 'Selesai', progress: 100, humas: 0,
    date: '9 Juni 2026', dateISO: '2026-06-09', location: 'Dusun 3 Sidodadi', budgetTarget: 8_000_000,
    category: 'Sosial', summary: 'Kegiatan sosial bersama warga untuk menyalurkan bantuan dan memperkuat kepedulian lingkungan.', publicVisible: true, financialLocked: true,
  },
  {
    id: 'kerja-bakti-lingkungan', name: 'Kerja Bakti Lingkungan Dusun 3', phase: 'Penggalangan/Iuran', progress: 35, humas: 0,
    date: '6 September 2026', dateISO: '2026-09-06', location: 'Wilayah Dusun 3 Sidodadi', budgetTarget: 2_500_000,
    category: 'Lingkungan', summary: 'Gerakan bersama membersihkan fasilitas umum dan menyiapkan kebutuhan lingkungan warga.', publicVisible: true, financialLocked: false,
  },
  {
    id: 'pelatihan-umkm-pemuda', name: 'Pelatihan UMKM & Promosi Digital Pemuda', phase: 'Perencanaan', progress: 20, humas: 0,
    date: '20 September 2026', dateISO: '2026-09-20', location: 'Balai Pertemuan Dusun 3', budgetTarget: 4_500_000,
    category: 'UMKM', summary: 'Pelatihan praktis untuk membantu pemuda dan warga memperkuat usaha, kemasan, dan pemasaran digital.', publicVisible: true, financialLocked: false,
  },
]

const initialAssignments: OperationAssignment[] = [
  { id: 'assign-budi-festival', humasUserId: 'usr-humas-budi', humas: 'Budi Santoso', activityId: 'festival-kemerdekaan-2026', activity: 'Festival Kemerdekaan Dusun 3 Sidodadi 2026', area: 'RT 01', permissions: ['Iuran', 'Serah Kas'] },
  { id: 'assign-andi-festival', humasUserId: 'usr-humas-andi', humas: 'Andi Saputra', activityId: 'festival-kemerdekaan-2026', activity: 'Festival Kemerdekaan Dusun 3 Sidodadi 2026', area: 'Tim Pembelanjaan', permissions: ['Belanja'] },
  { id: 'assign-rian-festival', humasUserId: 'usr-humas-rian', humas: 'Rian Pratama', activityId: 'festival-kemerdekaan-2026', activity: 'Festival Kemerdekaan Dusun 3 Sidodadi 2026', area: 'RT 02', permissions: ['Iuran', 'Serah Kas'] },
]

const initialCollectionTargets: CollectionTarget[] = [
  { id: 'target-001', activityId: 'festival-kemerdekaan-2026', assignmentId: 'assign-budi-festival', name: 'Keluarga Bapak Ahmad', area: 'RT 01' },
  { id: 'target-002', activityId: 'festival-kemerdekaan-2026', assignmentId: 'assign-budi-festival', name: 'Keluarga Ibu Siti', area: 'RT 01' },
  { id: 'target-003', activityId: 'festival-kemerdekaan-2026', assignmentId: 'assign-budi-festival', name: 'Keluarga Bapak Rahmat', area: 'RT 01' },
  { id: 'target-004', activityId: 'festival-kemerdekaan-2026', assignmentId: 'assign-budi-festival', name: 'Keluarga Ibu Rina', area: 'RT 01' },
  { id: 'target-005', activityId: 'festival-kemerdekaan-2026', assignmentId: 'assign-rian-festival', name: 'Keluarga Bapak Yusuf', area: 'RT 02' },
  { id: 'target-006', activityId: 'festival-kemerdekaan-2026', assignmentId: 'assign-rian-festival', name: 'Keluarga Ibu Wati', area: 'RT 02' },
  { id: 'target-007', activityId: 'festival-kemerdekaan-2026', assignmentId: 'assign-rian-festival', name: 'Keluarga Bapak Joko', area: 'RT 02' },
]

const initialCommunityMembers: CommunityMember[] = Array.from(new Map(initialCollectionTargets.map((item) => [item.name.toLowerCase(), { id: `member-${item.id}`, name: item.name, area: item.area }])).values())

const initialTransactions: OperationTransaction[] = [
  {
    id: 'trx-001', activityId: 'festival-kemerdekaan-2026', activityName: 'Festival Kemerdekaan Dusun 3 Sidodadi 2026', kind: 'income', label: 'Iuran Keluarga Bapak Ahmad', category: 'Iuran', amount: 100_000,
    createdByUserId: 'usr-humas-budi', createdByName: 'Budi Santoso', createdByRole: 'humas', assignmentId: 'assign-budi-festival', targetId: 'target-001', areaLabel: 'RT 01', owner: 'Budi Santoso', date: '23 Agu 2026 · 08:42', dateISO: '2026-08-23', status: 'Diterima Humas', evidenceName: 'bukti-iuran-ahmad.jpg', evidenceType: 'Foto bukti',
  },
  {
    id: 'trx-002', activityId: 'festival-kemerdekaan-2026', activityName: 'Festival Kemerdekaan Dusun 3 Sidodadi 2026', kind: 'expense', label: 'Pembelian konsumsi panitia', category: 'Konsumsi', amount: 350_000,
    createdByUserId: 'usr-humas-andi', createdByName: 'Andi Saputra', createdByRole: 'humas', assignmentId: 'assign-andi-festival', areaLabel: 'Tim Pembelanjaan', owner: 'Andi Saputra', date: '23 Agu 2026 · 08:25', dateISO: '2026-08-23', status: 'Menunggu Verifikasi', evidenceName: 'nota-konsumsi.jpg', evidenceType: 'Foto nota', vendor: 'Warung Bu Sri', quantity: 35, unitPrice: 10_000, paymentMethod: 'Tunai',
  },
  {
    id: 'trx-003', activityId: 'festival-kemerdekaan-2026', activityName: 'Festival Kemerdekaan Dusun 3 Sidodadi 2026', kind: 'handover', label: 'Serah terima kas RT 02', category: 'Serah Terima Kas', amount: 750_000,
    createdByUserId: 'usr-humas-rian', createdByName: 'Rian Pratama', createdByRole: 'humas', assignmentId: 'assign-rian-festival', areaLabel: 'RT 02', owner: 'Rian Pratama', date: '23 Agu 2026 · 08:10', dateISO: '2026-08-23', status: 'Menunggu Verifikasi', evidenceName: 'serah-kas-rt02.jpg', evidenceType: 'Foto serah terima',
  },
  {
    id: 'trx-004', activityId: 'festival-kemerdekaan-2026', activityName: 'Festival Kemerdekaan Dusun 3 Sidodadi 2026', kind: 'expense', label: 'Perlengkapan lomba tambahan', category: 'Perlengkapan', amount: 125_000,
    createdByUserId: 'usr-admin-001', createdByName: 'Admin Organisasi', createdByRole: 'admin', owner: 'Admin Organisasi', date: '22 Agu 2026 · 19:40', dateISO: '2026-08-22', status: 'Menunggu Verifikasi', evidenceName: 'nota-perlengkapan.jpg', evidenceType: 'Foto nota', vendor: 'Toko Sejahtera', paymentMethod: 'Tunai',
  },
  {
    id: 'trx-005', activityId: 'festival-kemerdekaan-2026', activityName: 'Festival Kemerdekaan Dusun 3 Sidodadi 2026', kind: 'income', label: 'Sponsor Toko Maju Jaya', category: 'Sponsor', amount: 1_500_000,
    createdByUserId: 'usr-admin-001', createdByName: 'Admin Organisasi', createdByRole: 'admin', owner: 'Admin Organisasi', date: '21 Agu 2026 · 17:10', dateISO: '2026-08-21', status: 'Terverifikasi', evidenceName: 'transfer-sponsor.pdf', evidenceType: 'Bukti transfer',
  },
  {
    id: 'trx-006', activityId: 'festival-kemerdekaan-2026', activityName: 'Festival Kemerdekaan Dusun 3 Sidodadi 2026', kind: 'income', label: 'Iuran Keluarga Ibu Siti', category: 'Iuran', amount: 100_000,
    createdByUserId: 'usr-humas-budi', createdByName: 'Budi Santoso', createdByRole: 'humas', assignmentId: 'assign-budi-festival', targetId: 'target-002', areaLabel: 'RT 01', owner: 'Budi Santoso', date: '21 Agu 2026 · 09:30', dateISO: '2026-08-21', status: 'Diterima Humas', evidenceName: 'bukti-iuran-siti.jpg', evidenceType: 'Foto bukti',
  },
  {
    id: 'trx-007', activityId: 'festival-kemerdekaan-2026', activityName: 'Festival Kemerdekaan Dusun 3 Sidodadi 2026', kind: 'expense', label: 'Sewa sound system', category: 'Perlengkapan', amount: 1_850_000,
    createdByUserId: 'usr-admin-001', createdByName: 'Admin Organisasi', createdByRole: 'admin', owner: 'Admin Organisasi', date: '20 Agu 2026 · 14:30', dateISO: '2026-08-20', status: 'Terverifikasi', evidenceName: 'invoice-sound.pdf', evidenceType: 'Invoice', vendor: 'Mitra Sound Lokal', paymentMethod: 'Transfer',
  },
  {
    id: 'trx-008', activityId: 'festival-kemerdekaan-2026', activityName: 'Festival Kemerdekaan Dusun 3 Sidodadi 2026', kind: 'expense', label: 'Dokumentasi kegiatan', category: 'Dokumentasi', amount: 450_000,
    createdByUserId: 'usr-humas-andi', createdByName: 'Andi Saputra', createdByRole: 'humas', assignmentId: 'assign-andi-festival', areaLabel: 'Tim Pembelanjaan', owner: 'Andi Saputra', date: '19 Agu 2026 · 16:15', dateISO: '2026-08-19', status: 'Terverifikasi', evidenceName: 'nota-dokumentasi.jpg', evidenceType: 'Foto nota', vendor: 'Jasa Dokumentasi Lokal', paymentMethod: 'Tunai',
  },
  {
    id: 'trx-009', activityId: 'festival-kemerdekaan-2026', activityName: 'Festival Kemerdekaan Dusun 3 Sidodadi 2026', kind: 'income', label: 'Iuran Keluarga Ibu Rina', category: 'Iuran', amount: 50_000,
    createdByUserId: 'usr-humas-budi', createdByName: 'Budi Santoso', createdByRole: 'humas', assignmentId: 'assign-budi-festival', targetId: 'target-004', areaLabel: 'RT 01', owner: 'Budi Santoso', date: '18 Agu 2026 · 18:20', dateISO: '2026-08-18', status: 'Diterima Humas', evidenceName: 'bukti-iuran-rina.jpg', evidenceType: 'Foto bukti',
  },
  // Riwayat publik lama dimigrasikan ke sumber transaksi yang sama supaya halaman keuangan tidak lagi punya salinan data kedua.
  {
    id: 'trx-hist-0817-konsumsi', activityId: 'festival-kemerdekaan-2026', activityName: 'Festival Kemerdekaan Dusun 3 Sidodadi 2026', kind: 'expense', label: 'Konsumsi panitia dan peserta kegiatan', category: 'Konsumsi', amount: 2_850_000,
    createdByUserId: 'usr-admin-001', createdByName: 'Admin Organisasi', createdByRole: 'admin', owner: 'Admin Organisasi', date: '17 Agu 2026 · 18:00', dateISO: '2026-08-17', status: 'Terverifikasi', evidenceName: 'nota-konsumsi-festival.pdf', evidenceType: 'Nota', vendor: 'Mitra Konsumsi Lokal', paymentMethod: 'Transfer',
  },
  {
    id: 'trx-hist-0816-hadiah', activityId: 'festival-kemerdekaan-2026', activityName: 'Festival Kemerdekaan Dusun 3 Sidodadi 2026', kind: 'expense', label: 'Hadiah perlombaan Festival Kemerdekaan', category: 'Hadiah', amount: 3_950_000,
    createdByUserId: 'usr-admin-001', createdByName: 'Admin Organisasi', createdByRole: 'admin', owner: 'Admin Organisasi', date: '16 Agu 2026 · 19:00', dateISO: '2026-08-16', status: 'Terverifikasi', evidenceName: 'nota-hadiah-festival.pdf', evidenceType: 'Nota', vendor: 'Mitra Kegiatan', paymentMethod: 'Transfer',
  },
  {
    id: 'trx-hist-0815-perlengkapan', activityId: 'festival-kemerdekaan-2026', activityName: 'Festival Kemerdekaan Dusun 3 Sidodadi 2026', kind: 'expense', label: 'Perlengkapan lomba dan kebutuhan lapangan', category: 'Perlengkapan', amount: 2_150_000,
    createdByUserId: 'usr-admin-001', createdByName: 'Admin Organisasi', createdByRole: 'admin', owner: 'Admin Organisasi', date: '15 Agu 2026 · 16:00', dateISO: '2026-08-15', status: 'Terverifikasi', evidenceName: 'nota-perlengkapan-festival.pdf', evidenceType: 'Nota', vendor: 'Toko Lokal', paymentMethod: 'Tunai',
  },
  {
    id: 'trx-hist-0812-sponsor', activityId: 'festival-kemerdekaan-2026', activityName: 'Festival Kemerdekaan Dusun 3 Sidodadi 2026', kind: 'income', label: 'Dukungan sponsor kegiatan kemerdekaan', category: 'Sponsor', amount: 4_000_000,
    createdByUserId: 'usr-admin-001', createdByName: 'Admin Organisasi', createdByRole: 'admin', owner: 'Admin Organisasi', date: '12 Agu 2026 · 10:00', dateISO: '2026-08-12', status: 'Terverifikasi', evidenceName: 'sponsor-kemerdekaan.pdf', evidenceType: 'Bukti transfer',
  },
  {
    id: 'trx-hist-0810-iuran', activityId: 'festival-kemerdekaan-2026', activityName: 'Festival Kemerdekaan Dusun 3 Sidodadi 2026', kind: 'income', label: 'Iuran kolektif warga (arsip)', category: 'Iuran', amount: 6_000_000,
    createdByUserId: 'usr-admin-001', createdByName: 'Admin Organisasi', createdByRole: 'admin', owner: 'Admin Organisasi', date: '10 Agu 2026 · 18:00', dateISO: '2026-08-10', status: 'Terverifikasi', note: 'Data arsip sebelum pencatatan per Humas pada prototype.',
  },
  {
    id: 'trx-hist-0712-hadiah', activityId: 'turnamen-futsal-antar-rt', activityName: 'Turnamen Futsal Antar RT', kind: 'expense', label: 'Hadiah Turnamen Futsal Antar RT', category: 'Hadiah', amount: 3_000_000,
    createdByUserId: 'usr-admin-001', createdByName: 'Admin Organisasi', createdByRole: 'admin', owner: 'Admin Organisasi', date: '12 Jul 2026 · 19:00', dateISO: '2026-07-12', status: 'Terverifikasi', evidenceName: 'nota-hadiah-futsal.pdf', evidenceType: 'Nota',
  },
  {
    id: 'trx-hist-0710-sponsor', activityId: 'turnamen-futsal-antar-rt', activityName: 'Turnamen Futsal Antar RT', kind: 'income', label: 'Sponsor kegiatan olahraga antar RT', category: 'Sponsor', amount: 3_500_000,
    createdByUserId: 'usr-admin-001', createdByName: 'Admin Organisasi', createdByRole: 'admin', owner: 'Admin Organisasi', date: '10 Jul 2026 · 15:00', dateISO: '2026-07-10', status: 'Terverifikasi', evidenceName: 'sponsor-futsal.pdf', evidenceType: 'Bukti transfer',
  },
  {
    id: 'trx-hist-0609-belanja', activityId: 'bakti-sosial-desa', activityName: 'Bakti Sosial Warga Dusun 3', kind: 'expense', label: 'Paket bantuan Bakti Sosial Warga', category: 'Paket bantuan', amount: 7_200_000,
    createdByUserId: 'usr-admin-001', createdByName: 'Admin Organisasi', createdByRole: 'admin', owner: 'Admin Organisasi', date: '9 Jun 2026 · 17:30', dateISO: '2026-06-09', status: 'Terverifikasi', evidenceName: 'nota-bakti-sosial.pdf', evidenceType: 'Nota',
  },
  {
    id: 'trx-hist-0608-donasi', activityId: 'bakti-sosial-desa', activityName: 'Bakti Sosial Warga Dusun 3', kind: 'income', label: 'Donasi Bakti Sosial Warga', category: 'Donasi', amount: 8_600_000,
    createdByUserId: 'usr-admin-001', createdByName: 'Admin Organisasi', createdByRole: 'admin', owner: 'Admin Organisasi', date: '8 Jun 2026 · 17:30', dateISO: '2026-06-08', status: 'Terverifikasi', evidenceName: 'rekap-donasi-bakti.pdf', evidenceType: 'Rekap',
  },
]

const initialBudgetPlans: Array<Omit<BudgetItem, 'realized'>> = [
  { id: 'rab-001', activityId: 'festival-kemerdekaan-2026', category: 'Konsumsi', plan: 3_000_000 },
  { id: 'rab-002', activityId: 'festival-kemerdekaan-2026', category: 'Perlengkapan', plan: 2_000_000 },
  { id: 'rab-003', activityId: 'festival-kemerdekaan-2026', category: 'Dokumentasi', plan: 1_000_000 },
  { id: 'rab-004', activityId: 'festival-kemerdekaan-2026', category: 'Hadiah', plan: 4_000_000 },
  { id: 'rab-005', activityId: 'festival-kemerdekaan-2026', category: 'Operasional', plan: 2_000_000 },
  { id: 'rab-006', activityId: 'turnamen-futsal-antar-rt', category: 'Hadiah', plan: 3_000_000 },
  { id: 'rab-007', activityId: 'turnamen-futsal-antar-rt', category: 'Perlengkapan', plan: 1_500_000 },
  { id: 'rab-008', activityId: 'turnamen-futsal-antar-rt', category: 'Konsumsi', plan: 1_500_000 },
  { id: 'rab-009', activityId: 'bakti-sosial-desa', category: 'Paket bantuan', plan: 7_000_000 },
  { id: 'rab-010', activityId: 'bakti-sosial-desa', category: 'Transportasi', plan: 500_000 },
  { id: 'rab-011', activityId: 'bakti-sosial-desa', category: 'Operasional', plan: 500_000 },
  { id: 'rab-012', activityId: 'kerja-bakti-lingkungan', category: 'Perlengkapan', plan: 1_250_000 },
  { id: 'rab-013', activityId: 'kerja-bakti-lingkungan', category: 'Konsumsi', plan: 1_000_000 },
  { id: 'rab-014', activityId: 'kerja-bakti-lingkungan', category: 'Operasional', plan: 250_000 },
  { id: 'rab-015', activityId: 'pelatihan-umkm-pemuda', category: 'Narasumber', plan: 2_000_000 },
  { id: 'rab-016', activityId: 'pelatihan-umkm-pemuda', category: 'Konsumsi', plan: 1_500_000 },
  { id: 'rab-017', activityId: 'pelatihan-umkm-pemuda', category: 'Perlengkapan', plan: 1_000_000 },
]

const initialCommitteeMembers: CommitteeMember[] = [
  { id: 'committee-001', activityId: 'festival-kemerdekaan-2026', name: 'Nama Ketua Panitia', role: 'Ketua Panitia' },
  { id: 'committee-002', activityId: 'festival-kemerdekaan-2026', name: 'Nama Sekretaris', role: 'Sekretaris' },
  { id: 'committee-003', activityId: 'festival-kemerdekaan-2026', name: 'Nama Bendahara', role: 'Bendahara' },
]

const initialReports: ReportItem[] = [
  { id: 'rep-001', activityId: 'festival-kemerdekaan-2026', activityName: 'Festival Kemerdekaan Dusun 3 Sidodadi 2026', title: 'LPJ Festival Kemerdekaan 2026', type: 'LPJ Kegiatan', period: 'Agustus 2026', progress: 82, status: 'Draft' },
  { id: 'rep-002', activityId: 'festival-kemerdekaan-2026', activityName: 'Festival Kemerdekaan Dusun 3 Sidodadi 2026', title: 'Laporan Keuangan Festival Kemerdekaan', type: 'Laporan Keuangan', period: 'Agustus 2026', progress: 94, status: 'Siap Diajukan' },
  { id: 'rep-003', activityId: 'kerja-bakti-lingkungan', activityName: 'Kerja Bakti Lingkungan Dusun 3', title: 'Rencana Laporan Kerja Bakti', type: 'Laporan Kegiatan', period: 'September 2026', progress: 30, status: 'Draft' },
  { id: 'rep-004', activityId: 'turnamen-futsal-antar-rt', activityName: 'Turnamen Futsal Antar RT', title: 'LPJ Turnamen Futsal Antar RT', type: 'LPJ Kegiatan', period: 'Juli 2026', progress: 100, status: 'Disahkan' },
  { id: 'rep-005', activityId: 'bakti-sosial-desa', activityName: 'Bakti Sosial Warga Dusun 3', title: 'LPJ Bakti Sosial Warga Dusun 3', type: 'LPJ Kegiatan', period: 'Juni 2026', progress: 100, status: 'Disahkan' },
]

const initialAudit: AuditItem[] = [
  { id: 'log-001', time: '08:42', actorUserId: 'usr-humas-budi', actor: 'Budi Santoso', action: 'mencatat iuran', detail: 'Rp100.000 · Festival Kemerdekaan · RT 01' },
  { id: 'log-002', time: '08:27', actorUserId: 'usr-admin-001', actor: 'Admin Organisasi', action: 'memverifikasi transaksi', detail: 'Pembelian konsumsi Rp350.000 · oleh Andi Saputra' },
  { id: 'log-003', time: '07:55', actorUserId: 'usr-admin-001', actor: 'Admin Organisasi', action: 'memperbarui penugasan Humas', detail: 'Budi Santoso · RT 01 · Festival Kemerdekaan' },
  { id: 'log-004', time: 'Kemarin', actorUserId: 'usr-humas-rian', actor: 'Rian Pratama', action: 'mengajukan serah terima kas', detail: 'Rp750.000 · Festival Kemerdekaan · RT 02' },
  { id: 'log-005', time: 'Kemarin', actorUserId: 'usr-humas-andi', actor: 'Andi Saputra', action: 'mencatat pembelanjaan', detail: 'Dokumentasi kegiatan Rp450.000' },
]

const OperationsContext = createContext<OperationsContextValue | null>(null)

function nowLabel() {
  return new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit' }).format(new Date())
}

function money(value: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value)
}

function resolveActor(actor?: OperationActor) {
  return actor ?? adminActor
}

function safeDateISO(value?: string) {
  if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value
  return new Date().toISOString().slice(0, 10)
}

function PrototypeOperationsProvider({ children }: { children: ReactNode }) {
  const [activities, setActivities] = useState(initialActivities)
  const [assignments, setAssignments] = useState(initialAssignments)
  const [collectionTargets, setCollectionTargets] = useState(initialCollectionTargets)
  const [communityMembers, setCommunityMembers] = useState(initialCommunityMembers)
  const [transactions, setTransactions] = useState(initialTransactions)
  const [budgetPlans, setBudgetPlans] = useState(initialBudgetPlans)
  const [committeeMembers, setCommitteeMembers] = useState(initialCommitteeMembers)
  const [activityMedia, setActivityMedia] = useState<ActivityMedia[]>([])
  const [reports, setReports] = useState(initialReports)
  const [auditLogs, setAuditLogs] = useState(initialAudit)
  const [cashReconciliations, setCashReconciliations] = useState<CashReconciliation[]>([])

  const appendAudit = (actor: OperationActor, action: string, detail: string, meta: AuditMeta = {}) => {
    setAuditLogs((items) => [
      {
        id: `log-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        time: nowLabel(),
        timestampISO: new Date().toISOString(),
        actorUserId: actor.userId,
        actor: actor.name,
        action,
        detail,
        ...meta,
      },
      ...items,
    ])
  }

  const addActivity = (input: AddActivityInput, actor?: OperationActor) => {
    const slugBase = input.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    const activity: OperationActivity = {
      ...input,
      id: `${slugBase || 'kegiatan'}-${Date.now()}`,
      progress: input.phase === 'Perencanaan' ? 15 : 25,
      humas: 0,
      dateISO: safeDateISO(input.dateISO),
      category: input.category?.trim() || 'Kegiatan',
      summary: input.summary?.trim() || 'Kegiatan Pemuda Dusun 3 Sidodadi yang sedang dipersiapkan oleh pengurus dan panitia.',
      publicVisible: Boolean(input.publicVisible),
      financialLocked: false,
    }
    setActivities((items) => [activity, ...items])
    const period = new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(new Date(`${activity.dateISO}T00:00:00`))
    setReports((items) => [
      { id: `rep-lpj-${activity.id}`, activityId: activity.id, activityName: activity.name, title: `LPJ ${activity.name}`, type: 'LPJ Kegiatan', period, progress: 10, status: 'Draft' },
      { id: `rep-fin-${activity.id}`, activityId: activity.id, activityName: activity.name, title: `Laporan Keuangan ${activity.name}`, type: 'Laporan Keuangan', period, progress: 10, status: 'Draft' },
      ...items,
    ])
    appendAudit(resolveActor(actor), 'membuat kegiatan', `${input.name}${activity.publicVisible ? ' · dipublikasikan' : ' · internal'}`, { entityType: 'activity', entityId: activity.id })
    return { ok: true, message: activity.publicVisible ? 'Kegiatan dibuat dan dipublikasikan.' : 'Kegiatan dibuat sebagai kegiatan internal.', id: activity.id }
  }

  const addTransaction = (input: AddTransactionInput): ActionResult => {
    if (input.amount <= 0) return { ok: false, message: 'Nominal transaksi harus lebih dari 0.' }
    const activity = activities.find((item) => item.id === input.activityId)
    if (!activity) return { ok: false, message: 'Kegiatan tidak ditemukan.' }
    if (activity.financialLocked) return { ok: false, message: 'Keuangan kegiatan sudah dikunci setelah LPJ disahkan. Buka kunci melalui prosedur koreksi terlebih dahulu.' }

    if (input.targetId) {
      const target = collectionTargets.find((item) => item.id === input.targetId)
      if (!target) return { ok: false, message: 'Data warga iuran tidak ditemukan.' }
      if (target.activityId !== input.activityId) return { ok: false, message: 'Data warga iuran tidak sesuai dengan kegiatan aktif.' }
      if (input.assignmentId && target.assignmentId !== input.assignmentId) return { ok: false, message: 'Warga ini bukan bagian dari penugasan Humas tersebut.' }
      const alreadyRecorded = transactions.some((item) => item.targetId === input.targetId && item.kind === 'income' && isRecordedIncome(item))
      if (alreadyRecorded) return { ok: false, message: 'Warga/keluarga ini sudah memiliki iuran tercatat. Gunakan fitur Koreksi jika nominal sebelumnya salah.' }
    }

    if (input.kind === 'handover' && input.assignmentId) {
      const collected = transactions
        .filter((item) => item.assignmentId === input.assignmentId && item.kind === 'income' && isRecordedIncome(item))
        .reduce((sum, item) => sum + item.amount, 0)
      const handedOverOrPending = transactions
        .filter((item) => item.assignmentId === input.assignmentId && item.kind === 'handover' && item.status !== 'Ditolak' && item.status !== 'Dibatalkan')
        .reduce((sum, item) => sum + item.amount, 0)
      const spentFromHumasCash = transactions
        .filter((item) => item.assignmentId === input.assignmentId && item.kind === 'expense' && item.status === 'Terverifikasi' && item.fundingSource === 'Kas Humas')
        .reduce((sum, item) => sum + item.amount, 0)
      const available = Math.max(0, collected - handedOverOrPending - spentFromHumasCash)
      if (input.amount > available) return { ok: false, message: `Nominal serah kas melebihi kas Humas yang tersedia (${money(available)}).` }
    }

    const id = `trx-${Date.now()}-${Math.random().toString(16).slice(2)}`
    const directAdminIncome = input.kind === 'income' && input.createdBy.role === 'admin' && input.category !== 'Iuran'
    const transaction: OperationTransaction = {
      activityId: input.activityId,
      activityName: input.activityName,
      kind: input.kind,
      label: input.label,
      category: input.category,
      amount: input.amount,
      createdByUserId: input.createdBy.userId,
      createdByName: input.createdBy.name,
      createdByRole: input.createdBy.role,
      assignmentId: input.assignmentId,
      targetId: input.targetId,
      areaLabel: input.areaLabel,
      owner: input.createdBy.name,
      evidenceName: input.evidenceName,
      evidenceType: input.evidenceType,
      note: input.note,
      vendor: input.vendor,
      quantity: input.quantity,
      unitPrice: input.unitPrice,
      paymentMethod: input.paymentMethod,
      fundingSource: input.fundingSource ?? (input.kind === 'expense' ? 'Kas Kegiatan' : undefined),
      id,
      date: `${new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date())} · ${nowLabel()}`,
      dateISO: new Date().toISOString().slice(0, 10),
      status: input.kind === 'income' ? (directAdminIncome ? 'Terverifikasi' : 'Diterima Humas') : 'Menunggu Verifikasi',
      verifiedByUserId: directAdminIncome ? input.createdBy.userId : undefined,
      verifiedByName: directAdminIncome ? input.createdBy.name : undefined,
      verifiedAt: directAdminIncome ? new Date().toISOString() : undefined,
      prototypeCreated: true,
    }
    setTransactions((items) => [transaction, ...items])
    appendAudit(input.createdBy, input.kind === 'income' ? (directAdminIncome ? 'mencatat pemasukan lain' : 'menerima iuran') : input.kind === 'expense' ? 'mencatat pembelanjaan' : 'mengajukan serah terima kas', `${input.label} · ${money(input.amount)}`, { entityType: 'transaction', entityId: id })
    return { ok: true, message: input.kind === 'income' ? (directAdminIncome ? 'Pemasukan kegiatan langsung tercatat sebagai transaksi sah.' : 'Iuran diterima Humas dan langsung masuk Kas di Tangan Humas.') : 'Transaksi berhasil dicatat.', id }
  }

  const setTransactionStatus = (id: string, status: TransactionStatus, action: string, actor?: OperationActor, reason?: string) => {
    const target = transactions.find((item) => item.id === id)
    if (!target) return { ok: false, message: 'Transaksi tidak ditemukan.' } as ActionResult
    const activity = activities.find((item) => item.id === target.activityId)
    if (activity?.financialLocked) return { ok: false, message: 'Keuangan kegiatan sudah dikunci setelah LPJ disahkan.' } as ActionResult
    if (target.kind === 'income' && action === 'memverifikasi transaksi') return { ok: false, message: 'Iuran Humas tidak memerlukan verifikasi transaksi satu per satu.' } as ActionResult
    if (status === 'Terverifikasi' && target.kind === 'handover' && target.assignmentId) {
      const collected = transactions
        .filter((item) => item.assignmentId === target.assignmentId && item.kind === 'income' && isRecordedIncome(item))
        .reduce((sum, item) => sum + item.amount, 0)
      const otherHandovers = transactions
        .filter((item) => item.id !== target.id && item.assignmentId === target.assignmentId && item.kind === 'handover' && item.status !== 'Ditolak' && item.status !== 'Dibatalkan')
        .reduce((sum, item) => sum + item.amount, 0)
      const spentFromHumasCash = transactions
        .filter((item) => item.assignmentId === target.assignmentId && item.kind === 'expense' && item.status === 'Terverifikasi' && item.fundingSource === 'Kas Humas')
        .reduce((sum, item) => sum + item.amount, 0)
      const available = Math.max(0, collected - otherHandovers - spentFromHumasCash)
      if (target.amount > available) return { ok: false, message: `Kas Humas berubah sejak pengajuan. Maksimal yang dapat dikonfirmasi sekarang ${money(available)}.` } as ActionResult
    }
    if (status === 'Terverifikasi' && target.kind === 'expense' && target.fundingSource === 'Kas Humas' && target.assignmentId) {
      const collected = transactions.filter((item) => item.assignmentId === target.assignmentId && item.kind === 'income' && isRecordedIncome(item)).reduce((sum, item) => sum + item.amount, 0)
      const handed = transactions.filter((item) => item.assignmentId === target.assignmentId && item.kind === 'handover' && item.status !== 'Ditolak' && item.status !== 'Dibatalkan').reduce((sum, item) => sum + item.amount, 0)
      const spent = transactions.filter((item) => item.id !== target.id && item.assignmentId === target.assignmentId && item.kind === 'expense' && item.status === 'Terverifikasi' && item.fundingSource === 'Kas Humas').reduce((sum, item) => sum + item.amount, 0)
      const available = Math.max(0, collected - handed - spent)
      if (target.amount > available) return { ok: false, message: `Kas Humas tidak cukup. Tersedia ${money(available)}.` } as ActionResult
    }
    if (status === 'Terverifikasi' && isActivityFundedExpense(target)) {
      const directIncome = transactions.filter((item) => item.activityId === target.activityId && item.kind === 'income' && item.createdByRole === 'admin' && item.status === 'Terverifikasi').reduce((sum, item) => sum + item.amount, 0)
      const handed = transactions.filter((item) => item.activityId === target.activityId && item.kind === 'handover' && item.status === 'Terverifikasi').reduce((sum, item) => sum + item.amount, 0)
      const spent = transactions.filter((item) => item.id !== target.id && item.activityId === target.activityId && item.status === 'Terverifikasi' && isActivityFundedExpense(item)).reduce((sum, item) => sum + item.amount, 0)
      const available = Math.max(0, directIncome + handed - spent)
      if (target.amount > available) return { ok: false, message: `Kas Kegiatan tidak cukup. Tersedia ${money(available)}. Pilih sumber dana yang benar atau lakukan serah kas/pemasukan terlebih dahulu.` } as ActionResult
    }
    const resolved = resolveActor(actor)
    setTransactions((items) => items.map((item) => item.id === id ? {
      ...item,
      status,
      verifiedByUserId: status === 'Terverifikasi' ? resolved.userId : item.verifiedByUserId,
      verifiedByName: status === 'Terverifikasi' ? resolved.name : item.verifiedByName,
      verifiedAt: status === 'Terverifikasi' ? new Date().toISOString() : item.verifiedAt,
      handoverRecipientUserId: item.kind === 'handover' && status === 'Terverifikasi' ? resolved.userId : item.handoverRecipientUserId,
      handoverRecipientName: item.kind === 'handover' && status === 'Terverifikasi' ? resolved.name : item.handoverRecipientName,
      cancellationReason: status === 'Dibatalkan' || status === 'Ditolak' ? reason || item.cancellationReason : item.cancellationReason,
    } : item))
    appendAudit(resolved, action, `${target.label} · ${money(target.amount)} · dicatat oleh ${target.createdByName}`, { entityType: 'transaction', entityId: target.id, reason })
    return { ok: true, message: 'Status transaksi diperbarui.' } as ActionResult
  }

  const verifyTransaction = (id: string, actor?: OperationActor) => setTransactionStatus(id, 'Terverifikasi', 'memverifikasi transaksi', actor)
  const rejectTransaction = (id: string, actor?: OperationActor) => setTransactionStatus(id, 'Ditolak', 'menolak transaksi', actor, 'Ditolak saat verifikasi Admin')
  const cancelTransaction = (id: string, actor?: OperationActor) => setTransactionStatus(id, 'Dibatalkan', 'membatalkan transaksi', actor, 'Dibatalkan')

  const cancelTransactionWithReason = (id: string, reason: string, actor?: OperationActor): ActionResult => {
    if (!reason.trim()) return { ok: false, message: 'Alasan pembatalan wajib diisi.' }
    const target = transactions.find((item) => item.id === id)
    if (!target) return { ok: false, message: 'Transaksi tidak ditemukan.' }
    const activity = activities.find((item) => item.id === target.activityId)
    if (activity?.financialLocked) return { ok: false, message: 'Kegiatan sudah dikunci. Buka kunci melalui prosedur koreksi terlebih dahulu.' }

    if (target.kind === 'income' && target.assignmentId && isRecordedIncome(target)) {
      const otherCollected = transactions
        .filter((item) => item.id !== target.id && item.assignmentId === target.assignmentId && item.kind === 'income' && isRecordedIncome(item))
        .reduce((sum, item) => sum + item.amount, 0)
      const committedHandovers = transactions
        .filter((item) => item.assignmentId === target.assignmentId && item.kind === 'handover' && item.status !== 'Ditolak' && item.status !== 'Dibatalkan')
        .reduce((sum, item) => sum + item.amount, 0)
      const humasExpenses = transactions
        .filter((item) => item.assignmentId === target.assignmentId && item.kind === 'expense' && item.status === 'Terverifikasi' && item.fundingSource === 'Kas Humas')
        .reduce((sum, item) => sum + item.amount, 0)
      if (otherCollected < committedHandovers + humasExpenses) {
        return { ok: false, message: 'Iuran tidak dapat dibatalkan karena dananya sudah terikat pada serah kas atau pembelanjaan dari Kas Humas. Koreksi arus kas terkait terlebih dahulu.' }
      }
    }

    if (target.kind === 'income' && target.createdByRole === 'admin' && target.status === 'Terverifikasi') {
      const directIncomeAfterCancel = transactions
        .filter((item) => item.id !== target.id && item.activityId === target.activityId && item.kind === 'income' && item.createdByRole === 'admin' && item.status === 'Terverifikasi')
        .reduce((sum, item) => sum + item.amount, 0)
      const handed = transactions
        .filter((item) => item.activityId === target.activityId && item.kind === 'handover' && item.status === 'Terverifikasi')
        .reduce((sum, item) => sum + item.amount, 0)
      const spent = transactions
        .filter((item) => item.activityId === target.activityId && item.status === 'Terverifikasi' && isActivityFundedExpense(item))
        .reduce((sum, item) => sum + item.amount, 0)
      if (directIncomeAfterCancel + handed < spent) return { ok: false, message: 'Pemasukan ini tidak dapat dibatalkan karena Kas Kegiatan sudah digunakan. Koreksi pengeluaran/arus kas terkait terlebih dahulu.' }
    }

    if (target.kind === 'handover' && target.status === 'Terverifikasi') {
      const directIncome = transactions
        .filter((item) => item.activityId === target.activityId && item.kind === 'income' && item.createdByRole === 'admin' && item.status === 'Terverifikasi')
        .reduce((sum, item) => sum + item.amount, 0)
      const otherHandovers = transactions
        .filter((item) => item.id !== target.id && item.activityId === target.activityId && item.kind === 'handover' && item.status === 'Terverifikasi')
        .reduce((sum, item) => sum + item.amount, 0)
      const spent = transactions
        .filter((item) => item.activityId === target.activityId && item.status === 'Terverifikasi' && isActivityFundedExpense(item))
        .reduce((sum, item) => sum + item.amount, 0)
      if (directIncome + otherHandovers < spent) return { ok: false, message: 'Serah kas ini tidak dapat dibatalkan karena dananya sudah digunakan oleh Kas Kegiatan.' }
    }

    return setTransactionStatus(id, 'Dibatalkan', 'membatalkan transaksi dengan alasan', actor, reason)
  }

  const correctIncomeTransaction = (id: string, amount: number, reason: string, actor: OperationActor): ActionResult => {
    const original = transactions.find((item) => item.id === id)
    if (!original || original.kind !== 'income') return { ok: false, message: 'Transaksi iuran tidak ditemukan.' }
    if (original.status === 'Dibatalkan' || original.status === 'Ditolak') return { ok: false, message: 'Transaksi yang sudah dibatalkan/ditolak tidak dapat dikoreksi.' }
    if (amount <= 0) return { ok: false, message: 'Nominal koreksi harus lebih dari 0.' }
    if (!reason.trim()) return { ok: false, message: 'Alasan koreksi wajib diisi.' }
    const activity = activities.find((item) => item.id === original.activityId)
    if (activity?.financialLocked) return { ok: false, message: 'Kegiatan sudah dikunci. Buka kunci melalui prosedur koreksi terlebih dahulu.' }
    if (original.assignmentId) {
      const otherCollected = transactions
        .filter((item) => item.id !== original.id && item.assignmentId === original.assignmentId && item.kind === 'income' && isRecordedIncome(item))
        .reduce((sum, item) => sum + item.amount, 0)
      const committedHandovers = transactions
        .filter((item) => item.assignmentId === original.assignmentId && item.kind === 'handover' && item.status !== 'Ditolak' && item.status !== 'Dibatalkan')
        .reduce((sum, item) => sum + item.amount, 0)
      const humasExpenses = transactions
        .filter((item) => item.assignmentId === original.assignmentId && item.kind === 'expense' && item.status === 'Terverifikasi' && item.fundingSource === 'Kas Humas')
        .reduce((sum, item) => sum + item.amount, 0)
      if (otherCollected + amount < committedHandovers + humasExpenses) return { ok: false, message: 'Nominal koreksi terlalu kecil karena sebagian dana sudah diserahkan atau dibelanjakan dari Kas Humas.' }
    }
    const replacementId = `trx-${Date.now()}-${Math.random().toString(16).slice(2)}`
    const replacement: OperationTransaction = {
      ...original,
      id: replacementId,
      amount,
      status: 'Diterima Humas',
      date: `${new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date())} · ${nowLabel()}`,
      dateISO: new Date().toISOString().slice(0, 10),
      cancellationReason: undefined,
      correctionOfId: original.id,
      correctedByTransactionId: undefined,
      createdByUserId: actor.userId,
      createdByName: actor.name,
      createdByRole: actor.role,
      owner: actor.name,
      note: `${original.note ? `${original.note} · ` : ''}Koreksi: ${reason}`,
      prototypeCreated: true,
    }
    setTransactions((items) => [replacement, ...items.map((item) => item.id === original.id ? { ...item, status: 'Dibatalkan' as TransactionStatus, cancellationReason: `Dikoreksi: ${reason}`, correctedByTransactionId: replacementId } : item)])
    appendAudit(actor, 'mengoreksi iuran', `${original.label} · ${money(original.amount)} → ${money(amount)}`, { entityType: 'transaction', entityId: original.id, reason })
    return { ok: true, message: 'Iuran dikoreksi. Transaksi lama tetap disimpan sebagai Dibatalkan untuk audit trail.', id: replacementId }
  }

  const addCollectionTarget = (input: AddCollectionTargetInput, actor?: OperationActor): ActionResult => {
    const name = input.name.trim()
    const area = input.area.trim()
    if (!name) return { ok: false, message: 'Nama warga/keluarga wajib diisi.' }
    const assignment = assignments.find((item) => item.id === input.assignmentId && item.activityId === input.activityId)
    if (!assignment) return { ok: false, message: 'Penugasan Humas tidak ditemukan.' }
    if (!assignment.permissions.includes('Iuran')) return { ok: false, message: 'Penugasan ini tidak memiliki izin Penarikan Iuran.' }
    const duplicate = collectionTargets.some((item) => item.activityId === input.activityId && item.name.trim().toLowerCase() === name.toLowerCase())
    if (duplicate) return { ok: false, message: 'Nama warga/keluarga sudah terdaftar pada kegiatan ini, termasuk bila ditugaskan ke Humas lain.' }

    const id = `target-${Date.now()}-${Math.random().toString(16).slice(2)}`
    const target: CollectionTarget = { id, activityId: input.activityId, assignmentId: input.assignmentId, name, area: area || assignment.area }
    setCollectionTargets((items) => [...items, target])
    setCommunityMembers((items) => items.some((item) => item.name.trim().toLowerCase() === name.toLowerCase()) ? items : [...items, { id: `member-${Date.now()}-${Math.random().toString(16).slice(2)}`, name, area: target.area }])
    appendAudit(resolveActor(actor), 'menambahkan warga iuran', `${name} · ${target.area} · ${assignment.humas}`, { entityType: 'collection_target', entityId: id })
    return { ok: true, message: 'Warga/keluarga berhasil ditambahkan ke daftar iuran.', id }
  }

  const addCollectionTargetsBulk = (inputs: AddCollectionTargetInput[], actor?: OperationActor): ActionResult => {
    if (inputs.length === 0) return { ok: false, message: 'Tidak ada data warga yang dapat diimpor.' }
    const first = inputs[0]
    const assignment = assignments.find((item) => item.id === first.assignmentId && item.activityId === first.activityId)
    if (!assignment) return { ok: false, message: 'Penugasan Humas tidak ditemukan.' }
    if (!assignment.permissions.includes('Iuran')) return { ok: false, message: 'Penugasan ini tidak memiliki izin Penarikan Iuran.' }

    const existingNames = new Set(collectionTargets.filter((item) => item.activityId === first.activityId).map((item) => item.name.trim().toLowerCase()))
    const seen = new Set<string>()
    const valid: CollectionTarget[] = []
    let skipped = 0
    const stamp = Date.now()
    inputs.forEach((input, index) => {
      const name = input.name.trim()
      const normalized = name.toLowerCase()
      if (!name || input.assignmentId !== first.assignmentId || input.activityId !== first.activityId || existingNames.has(normalized) || seen.has(normalized)) {
        skipped += 1
        return
      }
      seen.add(normalized)
      valid.push({
        id: `target-${stamp}-${index}-${Math.random().toString(16).slice(2)}`,
        activityId: first.activityId,
        assignmentId: first.assignmentId,
        name,
        area: input.area.trim() || assignment.area,
      })
    })
    if (valid.length === 0) return { ok: false, message: skipped > 0 ? 'Semua data dilewati karena kosong, tidak valid, atau duplikat pada kegiatan yang sama.' : 'Tidak ada data valid.' }
    setCollectionTargets((items) => [...items, ...valid])
    setCommunityMembers((items) => {
      const names = new Set(items.map((item) => item.name.trim().toLowerCase()))
      const additions = valid.filter((item) => !names.has(item.name.trim().toLowerCase())).map((item) => ({ id: `member-${item.id}`, name: item.name, area: item.area }))
      return [...items, ...additions]
    })
    appendAudit(resolveActor(actor), 'mengimpor daftar warga iuran', `${valid.length} warga · ${assignment.humas} · ${assignment.activity}`)
    return { ok: true, message: `${valid.length} warga berhasil ditambahkan${skipped ? `, ${skipped} baris dilewati` : ''}.` }
  }

  const removeCollectionTarget = (id: string, actor?: OperationActor): ActionResult => {
    const target = collectionTargets.find((item) => item.id === id)
    if (!target) return { ok: false, message: 'Data warga iuran tidak ditemukan.' }
    const hasHistory = transactions.some((item) => item.targetId === id)
    if (hasHistory) return { ok: false, message: 'Warga sudah memiliki histori transaksi dan tidak boleh dihapus.' }
    setCollectionTargets((items) => items.filter((item) => item.id !== id))
    appendAudit(resolveActor(actor), 'menghapus warga dari daftar iuran', `${target.name} · ${target.area}`, { entityType: 'collection_target', entityId: target.id })
    return { ok: true, message: 'Warga dihapus dari daftar iuran.' }
  }

  const addBudgetItem = (input: AddBudgetItemInput, actor?: OperationActor): ActionResult => {
    const category = input.category.trim()
    if (!category) return { ok: false, message: 'Kategori RAB wajib diisi.' }
    if (input.plan <= 0) return { ok: false, message: 'Nilai RAB harus lebih dari 0.' }
    const activity = activities.find((item) => item.id === input.activityId)
    if (!activity) return { ok: false, message: 'Kegiatan tidak ditemukan.' }
    if (activity.financialLocked) return { ok: false, message: 'Kegiatan sudah dikunci setelah LPJ disahkan.' }
    if (budgetPlans.some((item) => item.activityId === input.activityId && item.category.toLowerCase() === category.toLowerCase())) return { ok: false, message: 'Kategori RAB sudah ada pada kegiatan ini.' }
    const item = { id: `rab-${Date.now()}-${Math.random().toString(16).slice(2)}`, activityId: input.activityId, category, plan: input.plan }
    setBudgetPlans((items) => [...items, item])
    appendAudit(resolveActor(actor), 'menambahkan RAB', `${activity.name} · ${category} · ${money(input.plan)}`, { entityType: 'budget_item', entityId: item.id })
    return { ok: true, message: 'Kategori RAB ditambahkan.', id: item.id }
  }

  const updateBudgetItem = (id: string, plan: number, actor?: OperationActor): ActionResult => {
    const item = budgetPlans.find((entry) => entry.id === id)
    if (!item) return { ok: false, message: 'Item RAB tidak ditemukan.' }
    const activity = activities.find((entry) => entry.id === item.activityId)
    if (activity?.financialLocked) return { ok: false, message: 'Kegiatan sudah dikunci setelah LPJ disahkan.' }
    if (plan <= 0) return { ok: false, message: 'Nilai RAB harus lebih dari 0.' }
    setBudgetPlans((items) => items.map((entry) => entry.id === id ? { ...entry, plan } : entry))
    appendAudit(resolveActor(actor), 'mengubah RAB', `${item.category} · ${money(item.plan)} → ${money(plan)}`, { entityType: 'budget_item', entityId: item.id })
    return { ok: true, message: 'Nilai RAB diperbarui.' }
  }

  const removeBudgetItem = (id: string, actor?: OperationActor): ActionResult => {
    const item = budgetPlans.find((entry) => entry.id === id)
    if (!item) return { ok: false, message: 'Item RAB tidak ditemukan.' }
    const activity = activities.find((entry) => entry.id === item.activityId)
    if (activity?.financialLocked) return { ok: false, message: 'Kegiatan sudah dikunci setelah LPJ disahkan.' }
    const hasExpense = transactions.some((entry) => entry.activityId === item.activityId && entry.kind === 'expense' && categoriesMatch(entry.category, item.category) && entry.status !== 'Ditolak' && entry.status !== 'Dibatalkan')
    if (hasExpense) return { ok: false, message: 'Kategori RAB sudah memiliki transaksi pengeluaran dan tidak boleh dihapus.' }
    setBudgetPlans((items) => items.filter((entry) => entry.id !== id))
    appendAudit(resolveActor(actor), 'menghapus RAB', `${item.category} · ${money(item.plan)}`, { entityType: 'budget_item', entityId: item.id })
    return { ok: true, message: 'Kategori RAB dihapus.' }
  }

  const addCommitteeMember = (input: AddCommitteeMemberInput, actor?: OperationActor): ActionResult => {
    if (!input.name.trim() || !input.role.trim()) return { ok: false, message: 'Nama dan jabatan panitia wajib diisi.' }
    const activity = activities.find((item) => item.id === input.activityId)
    if (!activity) return { ok: false, message: 'Kegiatan tidak ditemukan.' }
    if (activity.financialLocked) return { ok: false, message: 'Kegiatan sudah dikunci setelah LPJ disahkan.' }
    const member: CommitteeMember = { id: `committee-${Date.now()}-${Math.random().toString(16).slice(2)}`, activityId: input.activityId, name: input.name.trim(), role: input.role.trim(), phone: input.phone?.trim() || undefined }
    setCommitteeMembers((items) => [...items, member])
    appendAudit(resolveActor(actor), 'menambahkan panitia', `${member.name} · ${member.role}`, { entityType: 'committee_member', entityId: member.id })
    return { ok: true, message: 'Anggota panitia ditambahkan.', id: member.id }
  }

  const updateCommitteeMember = (id: string, input: Partial<Pick<CommitteeMember, 'name' | 'role' | 'phone'>>, actor?: OperationActor): ActionResult => {
    const member = committeeMembers.find((item) => item.id === id)
    if (!member) return { ok: false, message: 'Data panitia tidak ditemukan.' }
    if (activities.find((item) => item.id === member.activityId)?.financialLocked) return { ok: false, message: 'Kegiatan sudah dikunci setelah LPJ disahkan.' }
    setCommitteeMembers((items) => items.map((item) => item.id === id ? { ...item, ...input } : item))
    appendAudit(resolveActor(actor), 'memperbarui panitia', `${member.name} · ${member.role}`, { entityType: 'committee_member', entityId: member.id })
    return { ok: true, message: 'Data panitia diperbarui.' }
  }

  const removeCommitteeMember = (id: string, actor?: OperationActor): ActionResult => {
    const member = committeeMembers.find((item) => item.id === id)
    if (!member) return { ok: false, message: 'Data panitia tidak ditemukan.' }
    if (activities.find((item) => item.id === member.activityId)?.financialLocked) return { ok: false, message: 'Kegiatan sudah dikunci setelah LPJ disahkan.' }
    setCommitteeMembers((items) => items.filter((item) => item.id !== id))
    appendAudit(resolveActor(actor), 'menghapus panitia', `${member.name} · ${member.role}`, { entityType: 'committee_member', entityId: member.id })
    return { ok: true, message: 'Anggota panitia dihapus.' }
  }

  const addAssignment = (input: AddAssignmentInput, actor?: OperationActor) => {
    const { assignmentId, ...rest } = input
    const assignment: OperationAssignment = { ...rest, id: assignmentId ?? `assign-${Date.now()}-${Math.random().toString(16).slice(2)}` }
    setAssignments((items) => [assignment, ...items])
    setActivities((items) => items.map((item) => item.id === input.activityId ? { ...item, humas: item.humas + 1 } : item))
    appendAudit(resolveActor(actor), 'menambahkan penugasan Humas', `${input.humas} · ${input.area} · ${input.activity} · ${input.permissions.join(', ')}`, { entityType: 'assignment', entityId: assignment.id })
    return { ok: true, message: 'Penugasan Humas berhasil ditambahkan.', id: assignment.id }
  }

  const addActivityMedia = (input: AddActivityMediaInput, actor?: OperationActor): ActionResult => {
    const activity = activities.find((item) => item.id === input.activityId)
    if (!activity) return { ok: false, message: 'Kegiatan tidak ditemukan.' }

    const validationMessage = validateActivityMediaInput(input)
    if (validationMessage) return { ok: false, message: validationMessage }

    const existingForActivity = activityMedia.filter((item) => item.activityId === input.activityId)
    const shouldBeCover = input.type === 'photo' && (Boolean(input.isCover) || !existingForActivity.some((item) => item.type === 'photo' && item.isCover))
    const media: ActivityMedia = {
      id: `media-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      activityId: input.activityId,
      type: input.type,
      provider: input.provider,
      title: input.title.trim(),
      url: input.url.trim(),
      sortOrder: existingForActivity.length + 1,
      isCover: shouldBeCover,
      publicVisible: input.publicVisible !== false,
      externalFileId: input.externalFileId,
    }

    setActivityMedia((items) => {
      const normalized = shouldBeCover
        ? items.map((item) => item.activityId === input.activityId && item.type === 'photo' ? { ...item, isCover: false } : item)
        : items
      return [...normalized, media]
    })
    appendAudit(resolveActor(actor), 'menambahkan media kegiatan', `${activity.name} · ${media.type === 'photo' ? 'Foto' : 'Video'} · ${media.title}`, { entityType: 'activity_media', entityId: media.id })
    return { ok: true, message: media.type === 'photo' ? 'Foto kegiatan ditambahkan.' : 'Video kegiatan ditambahkan.', id: media.id }
  }

  const removeActivityMedia = (id: string, actor?: OperationActor): ActionResult => {
    const media = activityMedia.find((item) => item.id === id)
    if (!media) return { ok: false, message: 'Media tidak ditemukan.' }
    const activity = activities.find((item) => item.id === media.activityId)

    setActivityMedia((items) => {
      const remaining = items.filter((item) => item.id !== id)
      if (!media.isCover) return remaining
      const nextCover = remaining
        .filter((item) => item.activityId === media.activityId && item.type === 'photo')
        .sort((a, b) => a.sortOrder - b.sortOrder)[0]
      return nextCover ? remaining.map((item) => item.id === nextCover.id ? { ...item, isCover: true } : item) : remaining
    })
    appendAudit(resolveActor(actor), 'menghapus media kegiatan', `${activity?.name ?? media.activityId} · ${media.title}`, { entityType: 'activity_media', entityId: media.id })
    return { ok: true, message: 'Media kegiatan dihapus dari daftar prototype.' }
  }

  const setActivityMediaVisibility = (id: string, publicVisible: boolean, actor?: OperationActor): ActionResult => {
    const media = activityMedia.find((item) => item.id === id)
    if (!media) return { ok: false, message: 'Media tidak ditemukan.' }
    setActivityMedia((items) => items.map((item) => item.id === id ? { ...item, publicVisible } : item))
    appendAudit(resolveActor(actor), publicVisible ? 'mempublikasikan media kegiatan' : 'menyembunyikan media kegiatan', media.title, { entityType: 'activity_media', entityId: media.id })
    return { ok: true, message: publicVisible ? 'Media ditampilkan di halaman kegiatan.' : 'Media disembunyikan dari halaman publik.' }
  }

  const setActivityCover = (id: string, actor?: OperationActor): ActionResult => {
    const media = activityMedia.find((item) => item.id === id)
    if (!media || media.type !== 'photo') return { ok: false, message: 'Foto tidak ditemukan.' }
    setActivityMedia((items) => items.map((item) => {
      if (item.activityId !== media.activityId || item.type !== 'photo') return item
      return { ...item, isCover: item.id === id }
    }))
    appendAudit(resolveActor(actor), 'mengubah foto cover kegiatan', media.title, { entityType: 'activity_media', entityId: media.id })
    return { ok: true, message: 'Foto cover kegiatan diperbarui.' }
  }

  const moveActivityMedia = (id: string, direction: 'up' | 'down', actor?: OperationActor): ActionResult => {
    const media = activityMedia.find((item) => item.id === id)
    if (!media) return { ok: false, message: 'Media tidak ditemukan.' }
    const siblings = activityMedia
      .filter((item) => item.activityId === media.activityId && item.type === media.type)
      .sort((a, b) => a.sortOrder - b.sortOrder)
    const index = siblings.findIndex((item) => item.id === id)
    const swapIndex = direction === 'up' ? index - 1 : index + 1
    if (index < 0 || swapIndex < 0 || swapIndex >= siblings.length) return { ok: false, message: 'Posisi media sudah paling ujung.' }
    const other = siblings[swapIndex]
    setActivityMedia((items) => items.map((item) => {
      if (item.id === media.id) return { ...item, sortOrder: other.sortOrder }
      if (item.id === other.id) return { ...item, sortOrder: media.sortOrder }
      return item
    }))
    appendAudit(resolveActor(actor), 'mengubah urutan media kegiatan', media.title, { entityType: 'activity_media', entityId: media.id })
    return { ok: true, message: 'Urutan media diperbarui.' }
  }

  const attachTransactionEvidence = (transactionId: string, input: { title: string; url: string; mimeType?: string; externalFileId?: string }, actor?: OperationActor): ActionResult => {
    const transaction = transactions.find((item) => item.id === transactionId)
    if (!transaction) return { ok: false, message: 'Transaksi tidak ditemukan.' }
    setTransactions((items) => items.map((item) => item.id === transactionId ? {
      ...item, evidenceName: input.title.trim() || 'Bukti transaksi', evidenceType: input.mimeType, evidenceUrl: input.url,
    } : item))
    appendAudit(resolveActor(actor), 'menambahkan bukti transaksi', `${transaction.label} · ${input.title}`, { entityType: 'transaction_evidence', entityId: transactionId })
    return { ok: true, message: 'Bukti transaksi berhasil dilampirkan.' }
  }

  const updateActivityPhase = (id: string, phase: string, actor?: OperationActor): ActionResult => {
    const target = activities.find((item) => item.id === id)
    if (!target) return { ok: false, message: 'Kegiatan tidak ditemukan.' }
    if (target.financialLocked && phase !== 'Selesai') return { ok: false, message: 'Kegiatan sudah dikunci setelah LPJ disahkan.' }
    if (phase === 'Selesai') {
      const approvedLpj = reports.some((item) => item.activityId === id && item.type.toLowerCase().includes('lpj') && item.status === 'Disahkan')
      if (!approvedLpj) return { ok: false, message: 'Kegiatan hanya dapat menjadi Selesai setelah LPJ disahkan.' }
    }
    const progressMap: Record<string, number> = { Perencanaan: 15, 'Penggalangan/Iuran': 35, Berlangsung: 60, Penyelesaian: 78, LPJ: 90, Selesai: 100 }
    setActivities((items) => items.map((item) => item.id === id ? { ...item, phase, progress: progressMap[phase] ?? item.progress } : item))
    appendAudit(resolveActor(actor), 'memperbarui fase kegiatan', `${target.name} → ${phase}`, { entityType: 'activity', entityId: target.id })
    return { ok: true, message: `Fase kegiatan diperbarui menjadi ${phase}.` }
  }

  const updateActivityPublication = (id: string, publicVisible: boolean, actor?: OperationActor): ActionResult => {
    const target = activities.find((item) => item.id === id)
    if (!target) return { ok: false, message: 'Kegiatan tidak ditemukan.' }
    setActivities((items) => items.map((item) => item.id === id ? { ...item, publicVisible } : item))
    appendAudit(resolveActor(actor), publicVisible ? 'mempublikasikan kegiatan' : 'menyembunyikan kegiatan dari publik', target.name, { entityType: 'activity', entityId: target.id })
    return { ok: true, message: publicVisible ? 'Kegiatan dipublikasikan ke website.' : 'Kegiatan disembunyikan dari website.' }
  }

  const updateReportStatus = (id: string, status: ReportStatus, actor?: OperationActor): ActionResult => {
    const target = reports.find((item) => item.id === id)
    if (!target) return { ok: false, message: 'Laporan tidak ditemukan.' }
    if (target.status === 'Disahkan') return { ok: false, message: 'Laporan yang sudah disahkan terkunci.' }
    setReports((items) => items.map((item) => item.id === id ? { ...item, status, progress: status === 'Disahkan' ? 100 : item.progress } : item))
    appendAudit(resolveActor(actor), 'memperbarui status laporan', `${target.title} → ${status}`, { entityType: 'report', entityId: target.id })
    if (status === 'Disahkan' && target.type.toLowerCase().includes('lpj')) {
      setActivities((items) => items.map((item) => item.id === target.activityId ? { ...item, phase: 'Selesai', progress: 100, financialLocked: true } : item))
      appendAudit(resolveActor(actor), 'mengunci kegiatan setelah LPJ disahkan', target.activityName, { entityType: 'activity', entityId: target.activityId })
      return { ok: true, message: 'LPJ disahkan. Kegiatan menjadi Selesai dan transaksi keuangan dikunci.' }
    }
    return { ok: true, message: `Status laporan menjadi ${status}.` }
  }

  const unlockActivity = (id: string, reason: string, actor?: OperationActor): ActionResult => {
    const activity = activities.find((item) => item.id === id)
    if (!activity) return { ok: false, message: 'Kegiatan tidak ditemukan.' }
    if (!activity.financialLocked) return { ok: false, message: 'Kegiatan belum dikunci.' }
    if (!reason.trim()) return { ok: false, message: 'Alasan membuka kunci wajib diisi.' }
    setActivities((items) => items.map((item) => item.id === id ? { ...item, financialLocked: false, phase: 'LPJ', progress: 95 } : item))
    setReports((items) => items.map((item) => item.activityId === id && item.type.toLowerCase().includes('lpj') && item.status === 'Disahkan' ? { ...item, status: 'Siap Diajukan', progress: 95 } : item))
    appendAudit(resolveActor(actor), 'membuka kembali kegiatan terkunci', activity.name, { entityType: 'activity', entityId: activity.id, reason })
    return { ok: true, message: 'Kegiatan dibuka kembali untuk koreksi dan seluruh tindakan tercatat di audit log.' }
  }

  const recordCashReconciliation = (input: Omit<CashReconciliation, 'id' | 'difference' | 'dateISO' | 'createdAt'>, actor?: OperationActor): ActionResult => {
    const assignment = assignments.find((item) => item.id === input.assignmentId && item.activityId === input.activityId && item.humasUserId === input.humasUserId)
    if (!assignment) return { ok: false, message: 'Penugasan Humas tidak ditemukan.' }
    if (input.physicalAmount < 0 || input.expectedAmount < 0) return { ok: false, message: 'Nominal kas tidak valid.' }
    const difference = input.physicalAmount - input.expectedAmount
    const record: CashReconciliation = {
      ...input,
      id: `recon-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      difference,
      dateISO: new Date().toISOString().slice(0, 10),
      createdAt: new Date().toISOString(),
      note: input.note?.trim() || undefined,
    }
    setCashReconciliations((items) => [record, ...items])
    appendAudit(resolveActor(actor), 'melakukan rekonsiliasi kas Humas', `${input.humasName} · Sistem ${money(input.expectedAmount)} · Fisik ${money(input.physicalAmount)} · Selisih ${money(difference)}`, { entityType: 'cash_reconciliation', entityId: record.id, reason: input.note?.trim() || undefined })
    return { ok: true, message: difference === 0 ? 'Tutup kas tercatat. Uang fisik sesuai dengan sistem.' : `Tutup kas tercatat dengan selisih ${money(difference)}.` , id: record.id }
  }

  const budgets = useMemo<BudgetItem[]>(() => budgetPlans.map((plan) => {
    const realized = transactions
      .filter((item) => item.activityId === plan.activityId && item.kind === 'expense' && item.status === 'Terverifikasi' && categoriesMatch(item.category, plan.category))
      .reduce((sum, item) => sum + item.amount, 0)
    return { ...plan, realized }
  }), [budgetPlans, transactions])

  const value = useMemo<OperationsContextValue>(() => ({
    loading: false,
    syncError: null,
    refresh: async () => undefined,
    activities,
    assignments,
    collectionTargets,
    communityMembers,
    transactions,
    budgets,
    reports,
    auditLogs,
    committeeMembers,
    activityMedia,
    cashReconciliations,
    addActivity,
    addTransaction,
    verifyTransaction,
    rejectTransaction,
    cancelTransaction,
    cancelTransactionWithReason,
    correctIncomeTransaction,
    addAssignment,
    addCollectionTarget,
    addCollectionTargetsBulk,
    removeCollectionTarget,
    addBudgetItem,
    updateBudgetItem,
    removeBudgetItem,
    addCommitteeMember,
    updateCommitteeMember,
    removeCommitteeMember,
    addActivityMedia,
    removeActivityMedia,
    setActivityMediaVisibility,
    setActivityCover,
    moveActivityMedia,
    attachTransactionEvidence,
    updateActivityPhase,
    updateActivityPublication,
    updateReportStatus,
    unlockActivity,
    recordCashReconciliation,
  }), [activities, assignments, collectionTargets, communityMembers, transactions, budgets, reports, auditLogs, committeeMembers, activityMedia, cashReconciliations])

  return <OperationsContext.Provider value={value}>{children}</OperationsContext.Provider>
}

export function useOperations() {
  const context = useContext(OperationsContext)
  if (!context) throw new Error('useOperations must be used inside OperationsProvider')
  return context
}

const OPERATIONS_SYNC_CHANNEL = 'pemuda-dusun3-operations-sync'
const OPERATIONS_SYNC_STORAGE_KEY = 'pemuda-dusun3-operations-changed-at'

function notifyOperationsChanged() {
  if (typeof window === 'undefined') return

  try {
    if ('BroadcastChannel' in window) {
      const channel = new BroadcastChannel(OPERATIONS_SYNC_CHANNEL)
      channel.postMessage({ type: 'operations-changed', at: Date.now() })
      channel.close()
    }
  } catch {
    // BroadcastChannel is an optimization. Storage event below remains the fallback.
  }

  try {
    window.localStorage.setItem(OPERATIONS_SYNC_STORAGE_KEY, String(Date.now()))
  } catch {
    // Private browsing/storage restrictions must not block a successful mutation.
  }
}

function ProductionOperationsProvider({ children, snapshotMode = 'session' }: { children: ReactNode; snapshotMode?: 'session' | 'public' }) {
  const { user, loading: authLoading } = useAuth()
  const [activities, setActivities] = useState<OperationActivity[]>([])
  const [assignments, setAssignments] = useState<OperationAssignment[]>([])
  const [collectionTargets, setCollectionTargets] = useState<CollectionTarget[]>([])
  const [communityMembers, setCommunityMembers] = useState<CommunityMember[]>([])
  const [transactions, setTransactions] = useState<OperationTransaction[]>([])
  const [budgetPlans, setBudgetPlans] = useState<Array<Omit<BudgetItem, 'realized'>>>([])
  const [reports, setReports] = useState<ReportItem[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditItem[]>([])
  const [committeeMembers, setCommitteeMembers] = useState<CommitteeMember[]>([])
  const [activityMedia, setActivityMedia] = useState<ActivityMedia[]>([])
  const [cashReconciliations, setCashReconciliations] = useState<CashReconciliation[]>([])
  const [loading, setLoading] = useState(true)
  const [syncError, setSyncError] = useState<string | null>(null)

  const applySnapshot = useCallback((snapshot: operationsRepository.OperationsSnapshot) => {
    setActivities(snapshot.activities)
    setAssignments(snapshot.assignments)
    setCollectionTargets(snapshot.collectionTargets)
    setCommunityMembers(snapshot.communityMembers)
    setTransactions(snapshot.transactions)
    setBudgetPlans(snapshot.budgetPlans)
    setReports(snapshot.reports)
    setAuditLogs(snapshot.auditLogs)
    setCommitteeMembers(snapshot.committeeMembers)
    setActivityMedia(snapshot.activityMedia)
    setCashReconciliations(snapshot.cashReconciliations)
  }, [])

  const snapshotReady = snapshotMode === 'public' || !authLoading
  const loadCurrentSnapshot = useCallback(async () => {
    if (snapshotMode === 'public') return operationsRepository.loadPublicOperationsSnapshot()
    return user
      ? operationsRepository.loadInternalOperationsSnapshot({ id: user.id, fullName: user.fullName, role: user.role })
      : operationsRepository.loadPublicOperationsSnapshot()
  }, [snapshotMode, user])

  const refresh = useCallback(async () => {
    if (!snapshotReady) return
    setLoading(true)
    setSyncError(null)
    try {
      applySnapshot(await loadCurrentSnapshot())
    } catch (error) {
      setSyncError(error instanceof Error ? error.message : 'Data Supabase tidak dapat dimuat.')
      applySnapshot({ activities: [], assignments: [], collectionTargets: [], communityMembers: [], transactions: [], budgetPlans: [], reports: [], auditLogs: [], committeeMembers: [], activityMedia: [], cashReconciliations: [] })
    } finally {
      setLoading(false)
    }
  }, [applySnapshot, loadCurrentSnapshot, snapshotReady])

  const refreshSilently = useCallback(async () => {
    if (!snapshotReady) return
    try {
      const snapshot = await loadCurrentSnapshot()
      applySnapshot(snapshot)
      setSyncError(null)
    } catch (error) {
      // Keep the last known-good public/internal snapshot on background refresh failures.
      setSyncError(error instanceof Error ? error.message : 'Data Supabase tidak dapat diperbarui.')
    }
  }, [applySnapshot, loadCurrentSnapshot, snapshotReady])

  useEffect(() => { void refresh() }, [refresh])

  useEffect(() => {
    if (!snapshotReady || typeof window === 'undefined') return

    let lastRequestedAt = 0
    const requestSilentRefresh = () => {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return
      const now = Date.now()
      if (now - lastRequestedAt < 500) return
      lastRequestedAt = now
      void refreshSilently()
    }

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') requestSilentRefresh()
    }
    const handleStorage = (event: StorageEvent) => {
      if (event.key === OPERATIONS_SYNC_STORAGE_KEY) requestSilentRefresh()
    }

    window.addEventListener('focus', requestSilentRefresh)
    window.addEventListener('storage', handleStorage)
    document.addEventListener('visibilitychange', handleVisibility)

    let channel: BroadcastChannel | null = null
    try {
      if ('BroadcastChannel' in window) {
        channel = new BroadcastChannel(OPERATIONS_SYNC_CHANNEL)
        channel.onmessage = (event) => {
          if (event.data?.type === 'operations-changed') requestSilentRefresh()
        }
      }
    } catch {
      channel = null
    }

    const timer = window.setInterval(requestSilentRefresh, 15_000)
    return () => {
      window.removeEventListener('focus', requestSilentRefresh)
      window.removeEventListener('storage', handleStorage)
      document.removeEventListener('visibilitychange', handleVisibility)
      window.clearInterval(timer)
      channel?.close()
    }
  }, [refreshSilently, snapshotReady])

  const runMutation = useCallback(async (operation: () => Promise<ActionResult>) => {
    const result = await operation()
    if (result.ok) {
      await refresh()
      notifyOperationsChanged()
    }
    return result
  }, [refresh])

  const addActivity = (input: AddActivityInput) => runMutation(() => operationsRepository.createActivity({
    name: input.name, dateISO: safeDateISO(input.dateISO), location: input.location, budgetTarget: input.budgetTarget,
    category: input.category?.trim() || 'Kegiatan', summary: input.summary?.trim() || '', publicVisible: Boolean(input.publicVisible),
  }))

  const addTransaction = (input: AddTransactionInput) => runMutation(() => operationsRepository.addFinancialTransaction({
    activityId: input.activityId, kind: input.kind, label: input.label, category: input.category, amount: input.amount,
    assignmentId: input.assignmentId, targetId: input.targetId, areaLabel: input.areaLabel, evidenceName: input.evidenceName,
    evidenceType: input.evidenceType, note: input.note, vendor: input.vendor, quantity: input.quantity, unitPrice: input.unitPrice,
    paymentMethod: input.paymentMethod, fundingSource: input.fundingSource ?? (input.kind === 'expense' ? 'Kas Kegiatan' : undefined),
  }))
  const verifyTransaction = (id: string) => runMutation(() => operationsRepository.setFinancialTransactionStatus(id, 'verified'))
  const rejectTransaction = (id: string) => runMutation(() => operationsRepository.setFinancialTransactionStatus(id, 'rejected', 'Ditolak saat verifikasi Admin'))
  const cancelTransaction = (id: string) => runMutation(() => operationsRepository.cancelFinancialTransaction(id, 'Dibatalkan'))
  const cancelTransactionWithReason = (id: string, reason: string) => {
    if (!reason.trim()) return Promise.resolve({ ok: false, message: 'Alasan pembatalan wajib diisi.' })
    return runMutation(() => operationsRepository.cancelFinancialTransaction(id, reason))
  }
  const correctIncomeTransaction = (id: string, amount: number, reason: string) => {
    if (amount <= 0) return Promise.resolve({ ok: false, message: 'Nominal koreksi harus lebih dari 0.' })
    if (!reason.trim()) return Promise.resolve({ ok: false, message: 'Alasan koreksi wajib diisi.' })
    return runMutation(() => operationsRepository.correctIncomeTransaction(id, amount, reason))
  }
  const addAssignment = (input: AddAssignmentInput) => runMutation(() => operationsRepository.createHumasAssignment({
    humasUserId: input.humasUserId, activityId: input.activityId, area: input.area, permissions: input.permissions,
  }))
  const addCollectionTarget = (input: AddCollectionTargetInput) => runMutation(() => operationsRepository.addCollectionTarget(input))
  const addCollectionTargetsBulk = (inputs: AddCollectionTargetInput[]) => runMutation(() => operationsRepository.addCollectionTargetsBulk(inputs))
  const removeCollectionTarget = (id: string) => runMutation(() => operationsRepository.removeCollectionTarget(id))
  const addBudgetItem = (input: AddBudgetItemInput) => {
    if (!input.category.trim()) return Promise.resolve({ ok: false, message: 'Kategori RAB wajib diisi.' })
    if (input.plan <= 0) return Promise.resolve({ ok: false, message: 'Nilai RAB harus lebih dari 0.' })
    return runMutation(() => operationsRepository.addBudgetItem(input))
  }
  const updateBudgetItem = (id: string, plan: number) => plan <= 0
    ? Promise.resolve({ ok: false, message: 'Nilai RAB harus lebih dari 0.' })
    : runMutation(() => operationsRepository.updateBudgetItem(id, plan))
  const removeBudgetItem = (id: string) => runMutation(() => operationsRepository.removeBudgetItem(id))
  const addCommitteeMember = (input: AddCommitteeMemberInput) => runMutation(() => operationsRepository.addCommitteeMember(input))
  const updateCommitteeMember = (id: string, input: Partial<Pick<CommitteeMember, 'name' | 'role' | 'phone'>>) => runMutation(() => operationsRepository.updateCommitteeMember(id, input))
  const removeCommitteeMember = (id: string) => runMutation(() => operationsRepository.removeCommitteeMember(id))
  const addActivityMedia = (input: AddActivityMediaInput) => {
    const validationMessage = validateActivityMediaInput(input)
    if (validationMessage) return Promise.resolve({ ok: false, message: validationMessage })
    return runMutation(() => operationsRepository.addActivityMedia(input))
  }
  const removeActivityMedia = (id: string) => runMutation(() => operationsRepository.removeActivityMedia(id))
  const setActivityMediaVisibility = (id: string, publicVisible: boolean) => runMutation(() => operationsRepository.setActivityMediaVisibility(id, publicVisible))
  const setActivityCover = (id: string) => runMutation(() => operationsRepository.setActivityCover(id))
  const moveActivityMedia = (id: string, direction: 'up' | 'down') => runMutation(() => operationsRepository.moveActivityMedia(id, direction))
  const attachTransactionEvidence = (transactionId: string, input: { title: string; url: string; mimeType?: string; externalFileId?: string }) => runMutation(() => operationsRepository.attachTransactionEvidence(transactionId, input))
  const updateActivityPhase = (id: string, phase: string) => runMutation(() => operationsRepository.updateActivityPhase(id, phase))
  const updateActivityPublication = (id: string, publicVisible: boolean) => runMutation(() => operationsRepository.updateActivityPublication(id, publicVisible))
  const updateReportStatus = (id: string, status: ReportStatus) => runMutation(() => operationsRepository.updateReportStatus(id, status))
  const unlockActivity = (id: string, reason: string) => {
    if (!reason.trim()) return Promise.resolve({ ok: false, message: 'Alasan membuka kunci wajib diisi.' })
    return runMutation(() => operationsRepository.unlockActivity(id, reason))
  }
  const recordCashReconciliation = (input: Omit<CashReconciliation, 'id' | 'difference' | 'dateISO' | 'createdAt'>) => runMutation(() => operationsRepository.recordCashReconciliation({
    assignmentId: input.assignmentId, physicalAmount: input.physicalAmount, note: input.note,
  }))

  const budgets = useMemo<BudgetItem[]>(() => budgetPlans.map((plan) => {
    const realized = transactions
      .filter((item) => item.activityId === plan.activityId && item.kind === 'expense' && item.status === 'Terverifikasi' && categoriesMatch(item.category, plan.category))
      .reduce((sum, item) => sum + item.amount, 0)
    return { ...plan, realized }
  }), [budgetPlans, transactions])

  const value = useMemo<OperationsContextValue>(() => ({
    loading, syncError, refresh, activities, assignments, collectionTargets, communityMembers, transactions, budgets, reports,
    auditLogs, committeeMembers, activityMedia, cashReconciliations, addActivity, addTransaction, verifyTransaction, rejectTransaction,
    cancelTransaction, cancelTransactionWithReason, correctIncomeTransaction, addAssignment, addCollectionTarget, addCollectionTargetsBulk,
    removeCollectionTarget, addBudgetItem, updateBudgetItem, removeBudgetItem, addCommitteeMember, updateCommitteeMember, removeCommitteeMember,
    addActivityMedia, removeActivityMedia, setActivityMediaVisibility, setActivityCover, moveActivityMedia, attachTransactionEvidence, updateActivityPhase,
    updateActivityPublication, updateReportStatus, unlockActivity, recordCashReconciliation,
  }), [loading, syncError, refresh, activities, assignments, collectionTargets, communityMembers, transactions, budgets, reports, auditLogs, committeeMembers, activityMedia, cashReconciliations])

  return <OperationsContext.Provider value={value}>{children}</OperationsContext.Provider>
}

export function OperationsProvider({ children }: { children: ReactNode }) {
  return SUPABASE_CONFIGURED
    ? <ProductionOperationsProvider snapshotMode="session">{children}</ProductionOperationsProvider>
    : <PrototypeOperationsProvider>{children}</PrototypeOperationsProvider>
}

export function PublicOperationsProvider({ children }: { children: ReactNode }) {
  return SUPABASE_CONFIGURED
    ? <ProductionOperationsProvider snapshotMode="public">{children}</ProductionOperationsProvider>
    : <PrototypeOperationsProvider>{children}</PrototypeOperationsProvider>
}
