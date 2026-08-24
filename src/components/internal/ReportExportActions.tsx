import { useState } from 'react'
import { Download, FileSpreadsheet, Share2 } from 'lucide-react'
import type { OperationTransaction } from '../../prototype/OperationsContext'
import {
  downloadTransactionsXlsx,
  downloadTransactionsReportPdf,
  shareTransactionsReportPdf,
  type TransactionReportOptions,
} from '../../utils/reportExport'

interface ReportExportActionsProps {
  transactions: OperationTransaction[]
  options: TransactionReportOptions
}

export default function ReportExportActions({ transactions, options }: ReportExportActionsProps) {
  const [feedback, setFeedback] = useState('')
  const disabled = transactions.length === 0

  const showFeedback = (message: string) => {
    setFeedback(message)
    window.setTimeout(() => setFeedback(''), 2500)
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" disabled={disabled} onClick={() => { downloadTransactionsReportPdf(transactions, options); showFeedback('Laporan PDF diunduh') }} className="inline-flex min-h-10 items-center gap-2 border border-forest bg-forest px-3 py-2 text-xs font-extrabold text-offwhite disabled:cursor-not-allowed disabled:border-border-soft disabled:bg-warmwhite disabled:text-muted">
        <Download size={14} /> Download Semua PDF
      </button>
      <button type="button" disabled={disabled} onClick={() => { downloadTransactionsXlsx(transactions, options); showFeedback('File Excel .xlsx diunduh') }} className="inline-flex min-h-10 items-center gap-2 border border-border-soft bg-white px-3 py-2 text-xs font-extrabold text-forest disabled:cursor-not-allowed disabled:text-muted/45">
        <FileSpreadsheet size={14} /> Download Excel
      </button>
      <button type="button" disabled={disabled} onClick={async () => {
        const result = await shareTransactionsReportPdf(transactions, options)
        if (result === 'shared') showFeedback('Laporan PDF dibagikan')
        if (result === 'downloaded') showFeedback('Share file tidak didukung; PDF diunduh')
      }} className="inline-flex min-h-10 items-center gap-2 border border-border-soft bg-white px-3 py-2 text-xs font-extrabold text-forest disabled:cursor-not-allowed disabled:text-muted/45">
        <Share2 size={14} /> Bagikan PDF
      </button>
      {feedback && <span role="status" aria-live="polite" className="text-[0.68rem] font-semibold text-muted">{feedback}</span>}
    </div>
  )
}
