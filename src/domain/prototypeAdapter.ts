import type { ActivityPermission } from '../auth/types'
import type {
  AuditItem,
  BudgetItem,
  CashReconciliation,
  CollectionTarget,
  CommitteeMember,
  CommunityMember,
  OperationActivity,
  OperationAssignment,
  OperationTransaction,
  ReportItem,
} from '../prototype/OperationsContext'
import type { ActivityMedia } from '../prototype/activityMedia'
import type {
  ActivityCollectionTargetRow,
  ActivityCommitteeMemberRow,
  ActivityMediaRow,
  ActivityPhaseCode,
  ActivityReportRow,
  ActivityRow,
  AuditLogRow,
  BudgetItemRow,
  CashReconciliationRow,
  CommunityMemberRow,
  FinancialTransactionRow,
  FundingSourceCode,
  HumasAssignmentPermissionRow,
  HumasAssignmentRow,
  MediaProviderCode,
  ReportStatusCode,
  TransactionEvidenceRow,
  TransactionStatusCode,
} from './productionTypes'

const phaseMap: Record<string, ActivityPhaseCode> = {
  Perencanaan: 'planning',
  Penggalangan: 'fundraising',
  'Penggalangan/Iuran': 'fundraising',
  Berlangsung: 'active',
  Penyelesaian: 'settlement',
  LPJ: 'lpj',
  Selesai: 'completed',
}

const statusMap: Record<OperationTransaction['status'], TransactionStatusCode> = {
  'Diterima Humas': 'received_by_humas',
  'Menunggu Verifikasi': 'pending_verification',
  Terverifikasi: 'verified',
  Ditolak: 'rejected',
  Dibatalkan: 'cancelled',
}

const fundingMap: Record<NonNullable<OperationTransaction['fundingSource']>, FundingSourceCode> = {
  'Kas Kegiatan': 'activity_cash',
  'Kas Humas': 'humas_cash',
  'Uang Pribadi/Reimburse': 'personal_reimburse',
  'Uang Muka': 'advance',
  Lainnya: 'other',
}

const reportStatusMap: Record<ReportItem['status'], ReportStatusCode> = {
  Draft: 'draft',
  'Siap Diajukan': 'ready',
  Disahkan: 'approved',
}

const permissionMap: Record<string, ActivityPermission> = {
  Iuran: 'collect_dues',
  Belanja: 'record_purchases',
  'Serah Kas': 'handover_cash',
}

const mediaProviderMap: Record<ActivityMedia['provider'], MediaProviderCode> = {
  imagekit: 'imagekit',
  'cloudflare-r2': 'cloudflare_r2',
  youtube: 'youtube',
  'google-drive': 'google_drive',
}

const placeholderTimestamp = '1970-01-01T00:00:00.000Z'

export function mapPrototypeActivity(item: OperationActivity): ActivityRow {
  return {
    id: item.id,
    periodId: null,
    slug: item.id,
    name: item.name,
    category: item.category,
    phase: phaseMap[item.phase] ?? 'planning',
    eventDate: item.dateISO,
    location: item.location,
    summary: item.summary,
    publicVisible: item.publicVisible,
    financialLocked: item.financialLocked,
    lockedAt: null,
    lockedByUserId: null,
    createdAt: placeholderTimestamp,
    updatedAt: placeholderTimestamp,
  }
}

export function mapPrototypeAssignment(item: OperationAssignment): {
  assignment: HumasAssignmentRow
  permissions: HumasAssignmentPermissionRow[]
} {
  return {
    assignment: {
      id: item.id,
      activityId: item.activityId,
      humasUserId: item.humasUserId,
      areaLabel: item.area,
      isActive: true,
      createdAt: placeholderTimestamp,
      updatedAt: placeholderTimestamp,
    },
    permissions: item.permissions
      .map((permission) => permissionMap[permission])
      .filter((permission): permission is ActivityPermission => Boolean(permission))
      .map((permission) => ({ assignmentId: item.id, permission })),
  }
}

export function mapPrototypeCommunityMember(item: CommunityMember): CommunityMemberRow {
  return {
    id: item.id,
    fullName: item.name,
    areaLabel: item.area,
    phone: null,
    isActive: true,
    createdAt: placeholderTimestamp,
    updatedAt: placeholderTimestamp,
  }
}

function findMemberForTarget(target: CollectionTarget, members: CommunityMember[]) {
  return members.find((member) => member.name.trim().toLowerCase() === target.name.trim().toLowerCase() && member.area.trim().toLowerCase() === target.area.trim().toLowerCase())
}

export function mapPrototypeCollectionTarget(target: CollectionTarget, members: CommunityMember[]): ActivityCollectionTargetRow | null {
  const member = findMemberForTarget(target, members)
  if (!member) return null
  return {
    id: target.id,
    activityId: target.activityId,
    assignmentId: target.assignmentId,
    memberId: member.id,
    createdAt: placeholderTimestamp,
  }
}

export function mapPrototypeBudget(item: BudgetItem): BudgetItemRow {
  return {
    id: item.id,
    activityId: item.activityId,
    category: item.category,
    plannedAmount: item.plan,
    createdAt: placeholderTimestamp,
    updatedAt: placeholderTimestamp,
  }
}

export function mapPrototypeCommittee(item: CommitteeMember, sortOrder = 0): ActivityCommitteeMemberRow {
  return {
    id: item.id,
    activityId: item.activityId,
    userId: null,
    name: item.name,
    roleTitle: item.role,
    phone: item.phone ?? null,
    sortOrder,
    createdAt: placeholderTimestamp,
    updatedAt: placeholderTimestamp,
  }
}

export function mapPrototypeTransaction(item: OperationTransaction): {
  transaction: FinancialTransactionRow
  evidence: TransactionEvidenceRow | null
} {
  const transaction: FinancialTransactionRow = {
    id: item.id,
    activityId: item.activityId,
    kind: item.kind,
    status: statusMap[item.status],
    label: item.label,
    category: item.category,
    amount: item.amount,
    createdByUserId: item.createdByUserId,
    assignmentId: item.assignmentId ?? null,
    collectionTargetId: item.targetId ?? null,
    areaLabelSnapshot: item.areaLabel ?? null,
    fundingSource: item.fundingSource ? fundingMap[item.fundingSource] : null,
    vendor: item.vendor ?? null,
    quantity: item.quantity ?? null,
    unitPrice: item.unitPrice ?? null,
    paymentMethod: item.paymentMethod ?? null,
    note: item.note ?? null,
    transactionDate: item.dateISO,
    verifiedByUserId: item.verifiedByUserId ?? null,
    verifiedAt: item.verifiedAt ?? null,
    handoverRecipientUserId: item.handoverRecipientUserId ?? null,
    cancellationReason: item.cancellationReason ?? null,
    correctionOfTransactionId: item.correctionOfId ?? null,
    correctedByTransactionId: item.correctedByTransactionId ?? null,
    createdAt: placeholderTimestamp,
    updatedAt: placeholderTimestamp,
  }

  const evidence = item.evidenceName
    ? {
        id: `evidence-${item.id}`,
        transactionId: item.id,
        title: item.evidenceName,
        provider: 'external_url' as const,
        // Prototype stores only a filename today. Keep an empty URL instead of inventing a public file location.
        url: '',
        mimeType: item.evidenceType ?? null,
        createdAt: placeholderTimestamp,
      }
    : null

  return { transaction, evidence }
}

export function mapPrototypeReconciliation(item: CashReconciliation): CashReconciliationRow {
  return {
    id: item.id,
    activityId: item.activityId,
    assignmentId: item.assignmentId,
    humasUserId: item.humasUserId,
    expectedAmount: item.expectedAmount,
    physicalAmount: item.physicalAmount,
    difference: item.difference,
    note: item.note ?? null,
    reconciledAt: item.dateISO || item.createdAt,
    createdByUserId: item.humasUserId,
  }
}

export function mapPrototypeReport(item: ReportItem): ActivityReportRow {
  return {
    id: item.id,
    activityId: item.activityId,
    title: item.title,
    reportType: item.type,
    periodLabel: item.period,
    status: reportStatusMap[item.status],
    approvedByUserId: null,
    approvedAt: null,
    createdAt: placeholderTimestamp,
    updatedAt: placeholderTimestamp,
  }
}

export function mapPrototypeMedia(item: ActivityMedia): ActivityMediaRow {
  return {
    id: item.id,
    activityId: item.activityId,
    type: item.type,
    provider: mediaProviderMap[item.provider],
    title: item.title,
    publicUrl: item.url,
    externalFileId: item.externalFileId ?? null,
    thumbnailUrl: null,
    sortOrder: item.sortOrder,
    isCover: item.isCover,
    publicVisible: item.publicVisible,
    createdByUserId: null,
    createdAt: placeholderTimestamp,
    updatedAt: placeholderTimestamp,
  }
}

export function mapPrototypeAudit(item: AuditItem): AuditLogRow {
  return {
    id: item.id,
    actorUserId: item.actorUserId ?? null,
    action: item.action,
    entityType: item.entityType ?? null,
    entityId: item.entityId ?? null,
    reason: item.reason ?? null,
    detail: item.detail,
    beforeData: null,
    afterData: null,
    createdAt: item.timestampISO ?? placeholderTimestamp,
  }
}
