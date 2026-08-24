import {
  isActivityFundedExpense,
  isRecognizedTransaction,
  type OperationTransaction,
} from './OperationsContext'

export interface FinanceSummary {
  recordedIncome: number
  humasIncome: number
  directIncome: number
  handedOver: number
  totalExpense: number
  humasCashExpense: number
  activityFundedExpense: number
  reimbursementOutstanding: number
  cashAtHumas: number
  activityCashReceived: number
  activityCashBalance: number
  netBalance: number
}

export function summarizeFinanceTransactions(source: OperationTransaction[]): FinanceSummary {
  const recognized = source.filter(isRecognizedTransaction)
  const income = recognized.filter((item) => item.kind === 'income')
  const expenses = recognized.filter((item) => item.kind === 'expense')
  const handovers = recognized.filter((item) => item.kind === 'handover')

  const recordedIncome = income.reduce((sum, item) => sum + item.amount, 0)
  const humasIncome = income
    .filter((item) => item.createdByRole === 'humas')
    .reduce((sum, item) => sum + item.amount, 0)
  const directIncome = recordedIncome - humasIncome
  const handedOver = handovers.reduce((sum, item) => sum + item.amount, 0)
  const totalExpense = expenses.reduce((sum, item) => sum + item.amount, 0)
  const humasCashExpense = expenses
    .filter((item) => item.fundingSource === 'Kas Humas')
    .reduce((sum, item) => sum + item.amount, 0)
  const activityFundedExpense = expenses.filter(isActivityFundedExpense).reduce((sum, item) => sum + item.amount, 0)
  const reimbursementOutstanding = expenses
    .filter((item) => item.fundingSource === 'Uang Pribadi/Reimburse')
    .reduce((sum, item) => sum + item.amount, 0)
  const cashAtHumas = Math.max(humasIncome - handedOver - humasCashExpense, 0)
  const activityCashReceived = directIncome + handedOver
  const activityCashBalance = activityCashReceived - activityFundedExpense

  return {
    recordedIncome,
    humasIncome,
    directIncome,
    handedOver,
    totalExpense,
    humasCashExpense,
    activityFundedExpense,
    reimbursementOutstanding,
    cashAtHumas,
    activityCashReceived,
    activityCashBalance,
    // Untuk transparansi publik, "sisa dana" adalah total pemasukan sah dikurangi
    // total pengeluaran sah, tanpa bergantung pada uang sedang berada di Humas atau kas kegiatan.
    netBalance: recordedIncome - totalExpense,
  }
}

export function summarizeActivityFinance(source: OperationTransaction[], activityId: string): FinanceSummary {
  return summarizeFinanceTransactions(source.filter((item) => item.activityId === activityId))
}
