import { transactionStatusLabel, type OperationTransaction } from '../prototype/OperationsContext'
import { SimplePdfDocument, sanitizePdfText, wrapPdfText } from './simplePdf'

const ORGANIZATION_NAME = 'PEMUDA DUSUN 3 SIDODADI'
const MARGIN = 46
const CONTENT_WIDTH = 595 - (MARGIN * 2)

function formatRupiah(amount: number) {
  return `Rp ${Math.round(amount).toLocaleString('id-ID')}`
}

function transactionKindLabel(transaction: OperationTransaction) {
  if (transaction.kind === 'income') return 'IURAN / PEMASUKAN'
  if (transaction.kind === 'expense') return 'PEMBELANJAAN / PENGELUARAN'
  return 'SERAH TERIMA KAS'
}

function safeFilePart(value: string) {
  return sanitizePdfText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50)
}

export function buildTransactionPdfBlob(transaction: OperationTransaction) {
  const doc = new SimplePdfDocument('portrait')
  const generatedAt = new Date().toLocaleString('id-ID')
  let page = doc.addPage()
  let y = 740

  const drawHeader = () => {
    doc.text(page, MARGIN, 802, ORGANIZATION_NAME, { font: 'bold', size: 15 })
    doc.text(page, MARGIN, 782, 'BUKTI / CATATAN TRANSAKSI', { font: 'bold', size: 11 })
    doc.text(page, MARGIN, 765, transactionKindLabel(transaction), { size: 8.5 })
    doc.line(page, MARGIN, 754, 595 - MARGIN, 754, 0.3, 1.1)
  }

  const newPage = () => {
    page = doc.addPage()
    drawHeader()
    y = 735
  }

  const ensure = (height: number) => {
    if (y - height < 58) newPage()
  }

  const infoRow = (label: string, value: string) => {
    const lines = wrapPdfText(value, CONTENT_WIDTH - 135, 8)
    const rowHeight = Math.max(23, (lines.length * 10.5) + 8)
    ensure(rowHeight)
    doc.rect(page, MARGIN, y - rowHeight, 128, rowHeight, { fillGray: 0.955, strokeGray: 0.84, lineWidth: 0.4 })
    doc.rect(page, MARGIN + 128, y - rowHeight, CONTENT_WIDTH - 128, rowHeight, { strokeGray: 0.84, lineWidth: 0.4 })
    doc.text(page, MARGIN + 7, y - 15, label, { font: 'bold', size: 7.2 })
    lines.forEach((line, index) => doc.text(page, MARGIN + 136, y - 15 - (index * 10.5), line, { size: 8 }))
    y -= rowHeight
  }

  drawHeader()

  doc.rect(page, MARGIN, y - 56, CONTENT_WIDTH, 56, { fillGray: 0.97, strokeGray: 0.78, lineWidth: 0.55 })
  doc.text(page, MARGIN + 10, y - 17, transactionStatusLabel(transaction), { font: 'bold', size: 8 })
  doc.text(page, MARGIN + 10, y - 40, transaction.label, { font: 'bold', size: 11 })
  doc.text(page, 595 - MARGIN - 10, y - 39, formatRupiah(transaction.amount), { font: 'bold', size: 12, align: 'right' })
  y -= 70

  const rows: Array<[string, string]> = [
    ['ID Transaksi', transaction.id],
    ['Jenis', transactionKindLabel(transaction)],
    ['Status', transactionStatusLabel(transaction)],
    ['Kegiatan', transaction.activityName],
    ['Kategori', transaction.category],
    ['Penginput', transaction.createdByName],
    ['Wilayah / Tugas', transaction.areaLabel ?? '-'],
    ['Tanggal / Waktu', transaction.date],
  ]

  if (transaction.kind === 'expense') {
    rows.push(
      ['Vendor / Toko', transaction.vendor ?? '-'],
      ['Jumlah', String(transaction.quantity ?? '-')],
      ['Harga Satuan', transaction.unitPrice ? formatRupiah(transaction.unitPrice) : '-'],
      ['Metode Pembayaran', transaction.paymentMethod ?? '-'],
      ['Sumber Dana', transaction.fundingSource ?? 'Kas Kegiatan'],
    )
  }

  if (transaction.kind === 'handover') {
    rows.push(
      ['Diterima Oleh', transaction.handoverRecipientName ?? 'Menunggu konfirmasi Admin'],
      ['Waktu Konfirmasi', transaction.verifiedAt ? new Date(transaction.verifiedAt).toLocaleString('id-ID') : '-'],
    )
  }

  if (transaction.verifiedByName) rows.push(['Diverifikasi Oleh', transaction.verifiedByName])
  if (transaction.correctionOfId) rows.push(['Koreksi Dari', transaction.correctionOfId])
  if (transaction.cancellationReason) rows.push(['Alasan Koreksi / Batal', transaction.cancellationReason])

  rows.forEach(([label, value]) => infoRow(label, value))
  y -= 12

  ensure(72)
  doc.rect(page, MARGIN, y - 62, CONTENT_WIDTH, 62, { fillGray: 0.975, strokeGray: 0.82, lineWidth: 0.45 })
  doc.text(page, MARGIN + 9, y - 16, 'BUKTI TRANSAKSI', { font: 'bold', size: 7.5 })
  doc.text(page, MARGIN + 9, y - 34, transaction.evidenceName ?? 'Belum ada file bukti', { font: 'bold', size: 8.5 })
  doc.text(page, MARGIN + 9, y - 49, transaction.evidenceType ?? 'Bukti belum dilampirkan', { size: 7.2 })
  y -= 76

  if (transaction.note) {
    const noteLines = wrapPdfText(transaction.note, CONTENT_WIDTH - 16, 7.6)
    ensure((noteLines.length * 10) + 35)
    doc.text(page, MARGIN, y, 'CATATAN TAMBAHAN', { font: 'bold', size: 7.5 })
    y -= 16
    noteLines.forEach((line, index) => doc.text(page, MARGIN + 6, y - (index * 10), line, { size: 7.6 }))
    y -= (noteLines.length * 10) + 12
  }

  ensure(64)
  doc.rect(page, MARGIN, y - 54, CONTENT_WIDTH, 54, { strokeGray: 0.82, lineWidth: 0.45 })
  doc.text(page, MARGIN + 9, y - 16, 'VALIDASI DOKUMEN', { font: 'bold', size: 7.4 })
  doc.text(page, MARGIN + 9, y - 32, 'Dokumen ini dibuat dari transaksi yang sama pada sistem. Simpan ID transaksi untuk pencocokan audit trail.', { size: 7 })
  doc.text(page, MARGIN + 9, y - 46, `Dibuat: ${generatedAt}`, { size: 7 })

  for (let index = 0; index < doc.pageCount; index += 1) {
    doc.line(index, MARGIN, 42, 595 - MARGIN, 42, 0.82, 0.45)
    doc.text(index, MARGIN, 28, `ID: ${transaction.id}`, { size: 6.5 })
    doc.text(index, 595 - MARGIN, 28, `Halaman ${index + 1} / ${doc.pageCount}`, { size: 6.5, align: 'right' })
  }

  return doc.buildBlob()
}

export function transactionPdfFilename(transaction: OperationTransaction) {
  const kind = transaction.kind === 'income' ? 'iuran' : transaction.kind === 'expense' ? 'pengeluaran' : 'serah-kas'
  const owner = safeFilePart(transaction.createdByName) || 'transaksi'
  return `${kind}-${owner}-${safeFilePart(transaction.id)}.pdf`
}

export function downloadTransactionPdf(transaction: OperationTransaction) {
  const blob = buildTransactionPdfBlob(transaction)
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = transactionPdfFilename(transaction)
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export type SharePdfResult = 'shared' | 'downloaded' | 'cancelled'

export async function shareTransactionPdf(transaction: OperationTransaction): Promise<SharePdfResult> {
  const blob = buildTransactionPdfBlob(transaction)
  const file = new File([blob], transactionPdfFilename(transaction), { type: 'application/pdf' })
  const shareData: ShareData = {
    title: `${ORGANIZATION_NAME} - ${transactionKindLabel(transaction)}`,
    text: `${transaction.label} | ${formatRupiah(transaction.amount)} | ${transaction.status}`,
    files: [file],
  }

  let canShareFiles = false
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      canShareFiles = typeof navigator.canShare !== 'function' || navigator.canShare({ files: [file] })
    } catch {
      canShareFiles = false
    }
  }

  if (canShareFiles) {
    try {
      await navigator.share(shareData)
      return 'shared'
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return 'cancelled'
    }
  }

  downloadTransactionPdf(transaction)
  return 'downloaded'
}
