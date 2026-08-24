import type {
  ActivityPhaseCode,
  ActivityPermissionCode,
  FinancialTransactionRow,
  FundingSourceCode,
  ReportStatusCode,
  TransactionStatusCode,
} from './productionTypes'

export const ACTIVITY_PHASE_LABELS: Record<ActivityPhaseCode, string> = {
  planning: 'Perencanaan',
  fundraising: 'Penggalangan/Iuran',
  active: 'Berlangsung',
  settlement: 'Penyelesaian',
  lpj: 'LPJ',
  completed: 'Selesai',
}

export const TRANSACTION_STATUS_LABELS: Record<TransactionStatusCode, string> = {
  received_by_humas: 'Diterima Humas',
  pending_verification: 'Menunggu Verifikasi',
  verified: 'Terverifikasi',
  rejected: 'Ditolak',
  cancelled: 'Dibatalkan',
}

export const REPORT_STATUS_LABELS: Record<ReportStatusCode, string> = {
  draft: 'Draft',
  ready: 'Siap Diajukan',
  approved: 'Disahkan',
}

export const FUNDING_SOURCE_LABELS: Record<FundingSourceCode, string> = {
  activity_cash: 'Kas Kegiatan',
  humas_cash: 'Kas Humas',
  personal_reimburse: 'Uang Pribadi/Reimburse',
  advance: 'Uang Muka',
  other: 'Lainnya',
}

export const PERMISSION_LABELS: Record<ActivityPermissionCode, string> = {
  collect_dues: 'Iuran',
  record_purchases: 'Belanja',
  handover_cash: 'Serah Kas',
}

export function isPositiveRupiah(value: number) {
  return Number.isSafeInteger(value) && value > 0
}

export function isRecognizedProductionTransaction(transaction: FinancialTransactionRow) {
  if (transaction.kind === 'income') {
    return transaction.status === 'received_by_humas' || transaction.status === 'verified'
  }
  return transaction.status === 'verified'
}

export function isActivityCashExpense(transaction: FinancialTransactionRow) {
  if (transaction.kind !== 'expense' || transaction.status !== 'verified') return false
  return transaction.fundingSource !== 'humas_cash' && transaction.fundingSource !== 'personal_reimburse'
}

export function validateTransactionInvariant(transaction: FinancialTransactionRow): string[] {
  const errors: string[] = []

  if (!isPositiveRupiah(transaction.amount)) errors.push('Nominal transaksi harus bilangan Rupiah positif.')
  if (!transaction.activityId) errors.push('Transaksi wajib terkait ke kegiatan.')
  if (!transaction.createdByUserId) errors.push('Transaksi wajib memiliki actor permanen.')

  if (transaction.kind === 'income' && transaction.category.toLowerCase() === 'iuran') {
    if (!transaction.assignmentId) errors.push('Iuran Humas wajib terkait assignment.')
    if (!transaction.collectionTargetId) errors.push('Iuran Humas wajib terkait warga/target kegiatan.')
    if (transaction.status === 'pending_verification') errors.push('Iuran tidak boleh menunggu verifikasi Admin per warga.')
  }

  if (transaction.kind === 'expense') {
    if (!transaction.fundingSource) errors.push('Pembelanjaan wajib memiliki sumber dana.')
    if (transaction.status === 'received_by_humas') errors.push('Status Diterima Humas hanya untuk pemasukan/iuran.')
  }

  if (transaction.kind === 'handover') {
    if (!transaction.assignmentId) errors.push('Serah kas wajib terkait assignment Humas.')
    if (transaction.status === 'received_by_humas') errors.push('Serah kas tidak menggunakan status Diterima Humas.')
  }

  if (transaction.status === 'cancelled' && !transaction.cancellationReason?.trim()) {
    errors.push('Transaksi dibatalkan wajib memiliki alasan.')
  }

  return errors
}
