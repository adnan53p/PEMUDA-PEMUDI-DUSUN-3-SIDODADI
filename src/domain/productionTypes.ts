/**
 * Production-ready domain model for PEMUDA DUSUN 3 SIDODADI.
 *
 * This file is intentionally framework/backend agnostic. It does NOT connect
 * to Supabase and contains no credentials, API calls, RLS, or storage logic.
 * It is the canonical shape we can map to PostgreSQL/Supabase later.
 */

export type UUID = string
export type ISODate = string
export type ISODateTime = string
export type Rupiah = number

export type UserRoleCode = 'superadmin' | 'admin' | 'humas'
export type ActivityPermissionCode = 'collect_dues' | 'record_purchases' | 'handover_cash'

export type ActivityPhaseCode =
  | 'planning'
  | 'fundraising'
  | 'active'
  | 'settlement'
  | 'lpj'
  | 'completed'

export type TransactionKindCode = 'income' | 'expense' | 'handover'
export type TransactionStatusCode =
  | 'received_by_humas'
  | 'pending_verification'
  | 'verified'
  | 'rejected'
  | 'cancelled'

export type FundingSourceCode =
  | 'activity_cash'
  | 'humas_cash'
  | 'personal_reimburse'
  | 'advance'
  | 'other'

export type ReportStatusCode = 'draft' | 'ready' | 'approved'
export type MediaTypeCode = 'photo' | 'video'
export type MediaProviderCode = 'imagekit' | 'cloudflare_r2' | 'youtube' | 'google_drive'

export interface OrganizationPeriodRow {
  id: UUID
  name: string
  startsOn: ISODate
  endsOn: ISODate
  isActive: boolean
}

export interface UserProfileRow {
  id: UUID
  username: string
  fullName: string
  role: UserRoleCode
  phone: string | null
  isActive: boolean
  createdAt: ISODateTime
  updatedAt: ISODateTime
}

export interface ActivityRow {
  id: UUID
  periodId: UUID | null
  slug: string
  name: string
  category: string
  phase: ActivityPhaseCode
  eventDate: ISODate
  location: string
  summary: string
  publicVisible: boolean
  financialLocked: boolean
  lockedAt: ISODateTime | null
  lockedByUserId: UUID | null
  createdAt: ISODateTime
  updatedAt: ISODateTime
}

export interface ActivityCommitteeMemberRow {
  id: UUID
  activityId: UUID
  userId: UUID | null
  name: string
  roleTitle: string
  phone: string | null
  sortOrder: number
  createdAt: ISODateTime
  updatedAt: ISODateTime
}

export interface HumasAssignmentRow {
  id: UUID
  activityId: UUID
  humasUserId: UUID
  areaLabel: string
  isActive: boolean
  createdAt: ISODateTime
  updatedAt: ISODateTime
}

export interface HumasAssignmentPermissionRow {
  assignmentId: UUID
  permission: ActivityPermissionCode
}

export interface CommunityMemberRow {
  id: UUID
  fullName: string
  areaLabel: string
  phone: string | null
  isActive: boolean
  createdAt: ISODateTime
  updatedAt: ISODateTime
}

/**
 * A resident/family assigned to one Humas for one activity.
 * There is intentionally NO target amount because dues are voluntary.
 */
export interface ActivityCollectionTargetRow {
  id: UUID
  activityId: UUID
  assignmentId: UUID
  memberId: UUID
  createdAt: ISODateTime
}

export interface BudgetItemRow {
  id: UUID
  activityId: UUID
  category: string
  plannedAmount: Rupiah
  createdAt: ISODateTime
  updatedAt: ISODateTime
}

/**
 * One transaction is the single source of truth. Realized RAB, Humas cash,
 * activity cash, reports, and public transparency are derived from this row.
 */
export interface FinancialTransactionRow {
  id: UUID
  activityId: UUID
  kind: TransactionKindCode
  status: TransactionStatusCode
  label: string
  category: string
  amount: Rupiah
  createdByUserId: UUID
  assignmentId: UUID | null
  collectionTargetId: UUID | null
  areaLabelSnapshot: string | null
  fundingSource: FundingSourceCode | null
  vendor: string | null
  quantity: number | null
  unitPrice: Rupiah | null
  paymentMethod: string | null
  note: string | null
  transactionDate: ISODate
  verifiedByUserId: UUID | null
  verifiedAt: ISODateTime | null
  handoverRecipientUserId: UUID | null
  cancellationReason: string | null
  correctionOfTransactionId: UUID | null
  correctedByTransactionId: UUID | null
  createdAt: ISODateTime
  updatedAt: ISODateTime
}

export interface TransactionEvidenceRow {
  id: UUID
  transactionId: UUID
  title: string
  provider: 'imagekit' | 'cloudflare_r2' | 'external_url' | 'metadata_only'
  url: string
  mimeType: string | null
  externalFileId?: string | null
  createdAt: ISODateTime
}

export interface CashReconciliationRow {
  id: UUID
  activityId: UUID
  assignmentId: UUID
  humasUserId: UUID
  expectedAmount: Rupiah
  physicalAmount: Rupiah
  difference: Rupiah
  note: string | null
  reconciledAt: ISODateTime
  createdByUserId: UUID
}

export interface ActivityReportRow {
  id: UUID
  activityId: UUID
  title: string
  reportType: string
  periodLabel: string
  status: ReportStatusCode
  approvedByUserId: UUID | null
  approvedAt: ISODateTime | null
  createdAt: ISODateTime
  updatedAt: ISODateTime
}

export interface ActivityMediaRow {
  id: UUID
  activityId: UUID
  type: MediaTypeCode
  provider: MediaProviderCode
  title: string
  publicUrl: string
  externalFileId: string | null
  thumbnailUrl: string | null
  sortOrder: number
  isCover: boolean
  publicVisible: boolean
  createdByUserId: UUID | null
  createdAt: ISODateTime
  updatedAt: ISODateTime
}

export interface AuditLogRow {
  id: UUID
  actorUserId: UUID | null
  action: string
  entityType: string | null
  entityId: UUID | null
  reason: string | null
  detail: string
  beforeData: Record<string, unknown> | null
  afterData: Record<string, unknown> | null
  createdAt: ISODateTime
}

export interface ProductionDataSnapshot {
  organizationPeriods: OrganizationPeriodRow[]
  profiles: UserProfileRow[]
  activities: ActivityRow[]
  committeeMembers: ActivityCommitteeMemberRow[]
  assignments: HumasAssignmentRow[]
  assignmentPermissions: HumasAssignmentPermissionRow[]
  communityMembers: CommunityMemberRow[]
  collectionTargets: ActivityCollectionTargetRow[]
  budgetItems: BudgetItemRow[]
  transactions: FinancialTransactionRow[]
  transactionEvidence: TransactionEvidenceRow[]
  cashReconciliations: CashReconciliationRow[]
  reports: ActivityReportRow[]
  activityMedia: ActivityMediaRow[]
  auditLogs: AuditLogRow[]
}
