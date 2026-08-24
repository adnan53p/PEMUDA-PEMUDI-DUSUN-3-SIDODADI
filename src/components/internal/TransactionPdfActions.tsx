import { useState } from 'react'
import { Download, Share2 } from 'lucide-react'
import type { OperationTransaction } from '../../prototype/OperationsContext'
import { downloadTransactionPdf, shareTransactionPdf } from '../../utils/transactionPdf'

interface TransactionPdfActionsProps {
  transaction: OperationTransaction
  compact?: boolean
}

export default function TransactionPdfActions({ transaction, compact = false }: TransactionPdfActionsProps) {
  const [feedback, setFeedback] = useState('')

  if (transaction.kind !== 'income' && transaction.kind !== 'expense') return null

  const showFeedback = (message: string) => {
    setFeedback(message)
    window.setTimeout(() => setFeedback(''), 2200)
  }

  const handleDownload = () => {
    downloadTransactionPdf(transaction)
    showFeedback('PDF diunduh')
  }

  const handleShare = async () => {
    const result = await shareTransactionPdf(transaction)
    if (result === 'shared') showFeedback('PDF dibagikan')
    if (result === 'downloaded') showFeedback('Share file tidak didukung; PDF diunduh')
  }

  const buttonClass = compact
    ? 'inline-flex h-8 items-center justify-center gap-1.5 border border-border-soft bg-white px-2.5 text-[0.68rem] font-extrabold text-forest transition hover:border-forest'
    : 'inline-flex min-h-10 items-center justify-center gap-2 border border-border-soft bg-white px-3 py-2 text-xs font-extrabold text-forest transition hover:border-forest'

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" onClick={handleDownload} className={buttonClass} title="Download PDF transaksi">
        <Download size={compact ? 13 : 14} />
        <span>{compact ? 'PDF' : 'Download PDF'}</span>
      </button>
      <button type="button" onClick={handleShare} className={buttonClass} title="Bagikan PDF ke WhatsApp atau aplikasi Android lain">
        <Share2 size={compact ? 13 : 14} />
        <span>{compact ? 'Bagikan' : 'Bagikan PDF'}</span>
      </button>
      {feedback && <span className="text-[0.65rem] font-semibold text-muted" role="status" aria-live="polite">{feedback}</span>}
    </div>
  )
}
