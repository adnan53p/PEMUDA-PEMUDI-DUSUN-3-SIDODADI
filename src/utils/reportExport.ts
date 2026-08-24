import { isRecognizedTransaction, transactionStatusLabel, type OperationTransaction, type TransactionKind } from '../prototype/OperationsContext'
import { SimplePdfDocument, sanitizePdfText, wrapPdfText } from './simplePdf'

const ORGANIZATION_NAME = 'PEMUDA DUSUN 3 SIDODADI'

export interface ReportFilterItem {
  label: string
  value: string
}

export interface TransactionReportOptions {
  title: string
  filters: ReportFilterItem[]
}

function formatRupiah(amount: number) {
  return `Rp ${Math.round(amount).toLocaleString('id-ID')}`
}

function kindLabel(kind: TransactionKind) {
  if (kind === 'income') return 'Iuran/Pemasukan'
  if (kind === 'expense') return 'Pembelanjaan'
  return 'Serah Kas'
}

function safeFilePart(value: string) {
  return sanitizePdfText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

function summary(transactions: OperationTransaction[]) {
  const valid = transactions.filter(isRecognizedTransaction)
  return {
    income: valid.filter((item) => item.kind === 'income').reduce((sum, item) => sum + item.amount, 0),
    expense: valid.filter((item) => item.kind === 'expense').reduce((sum, item) => sum + item.amount, 0),
    handover: valid.filter((item) => item.kind === 'handover').reduce((sum, item) => sum + item.amount, 0),
    count: transactions.length,
    validCount: valid.length,
    excludedCount: transactions.length - valid.length,
  }
}

function reportFilename(options: TransactionReportOptions, extension: string) {
  const today = new Date().toISOString().slice(0, 10)
  return `${safeFilePart(options.title) || 'laporan-transaksi'}-${today}.${extension}`
}

export function buildTransactionsReportPdfBlob(transactions: OperationTransaction[], options: TransactionReportOptions) {
  const doc = new SimplePdfDocument('landscape')
  const sorted = [...transactions].sort((a, b) => b.dateISO.localeCompare(a.dateISO) || b.date.localeCompare(a.date))
  const generatedAt = new Date().toLocaleString('id-ID')
  const margin = 30
  const tableWidth = 842 - (margin * 2)
  const columnWidths = [24, 52, 88, 74, 72, 96, 82, 122, 172]
  const headers = ['No', 'Tanggal', 'Penginput', 'Jenis', 'Wilayah', 'Status', 'Nominal', 'Kegiatan', 'Uraian / Kategori']
  let page = doc.addPage()
  let y = 548
  let rowIndex = 0
  let tableStarted = false

  const drawHeader = (isFirstPage: boolean) => {
    doc.text(page, margin, 562, ORGANIZATION_NAME, { font: 'bold', size: 13 })
    doc.text(page, margin, 544, options.title.toUpperCase(), { font: 'bold', size: 11 })
    doc.line(page, margin, 535, 842 - margin, 535, 0.3, 1)
    y = 516

    if (isFirstPage) {
      const filterText = options.filters.length > 0
        ? options.filters.map((item) => `${item.label}: ${item.value}`).join(' | ')
        : 'Semua data'
      const filterLines = wrapPdfText(`Filter: ${filterText}`, tableWidth, 7.2)
      filterLines.forEach((line, index) => doc.text(page, margin, y - (index * 10), line, { size: 7.2 }))
      y -= (filterLines.length * 10) + 8

      const total = summary(sorted)
      const gap = 8
      const boxWidth = (tableWidth - (gap * 3)) / 4
      const cards = [
        ['Pemasukan Sah', formatRupiah(total.income)],
        ['Pembelanjaan Sah', formatRupiah(total.expense)],
        ['Serah Kas Sah', formatRupiah(total.handover)],
        ['Transaksi', `${total.validCount} sah / ${total.count} total`],
      ]
      cards.forEach(([label, value], index) => {
        const x = margin + (index * (boxWidth + gap))
        doc.rect(page, x, y - 38, boxWidth, 38, { fillGray: 0.965, strokeGray: 0.82, lineWidth: 0.45 })
        doc.text(page, x + 8, y - 13, label, { size: 6.7 })
        doc.text(page, x + 8, y - 29, value, { font: 'bold', size: 8.2 })
      })
      y -= 49
      if (total.excludedCount > 0) {
        doc.text(page, margin, y, `${total.excludedCount} transaksi pending/ditolak/dibatalkan tidak masuk total sah.`, { size: 6.8 })
        y -= 14
      }
    }
  }

  const drawTableHeader = () => {
    let x = margin
    headers.forEach((header, index) => {
      doc.rect(page, x, y - 22, columnWidths[index], 22, { fillGray: 0.92, strokeGray: 0.75, lineWidth: 0.45 })
      doc.text(page, x + 4, y - 14, header, { font: 'bold', size: 6.5 })
      x += columnWidths[index]
    })
    y -= 22
    tableStarted = true
  }

  const newPage = () => {
    page = doc.addPage()
    tableStarted = false
    drawHeader(false)
    drawTableHeader()
  }

  drawHeader(true)
  drawTableHeader()

  if (sorted.length === 0) {
    doc.rect(page, margin, y - 30, tableWidth, 30, { strokeGray: 0.84, lineWidth: 0.4 })
    doc.text(page, margin + 7, y - 19, 'Tidak ada transaksi yang sesuai dengan filter laporan.', { size: 7.6 })
  } else {
    sorted.forEach((item) => {
      const values = [
        String(rowIndex + 1),
        item.dateISO || item.date,
        item.createdByName,
        kindLabel(item.kind),
        item.areaLabel ?? '-',
        transactionStatusLabel(item),
        formatRupiah(item.amount),
        item.activityName,
        `${item.category} - ${item.label}`,
      ]
      const wrapped = values.map((value, index) => wrapPdfText(value, columnWidths[index] - 8, 6.3))
      const lines = Math.max(...wrapped.map((entry) => entry.length))
      const rowHeight = Math.max(22, (lines * 8.4) + 7)
      if (y - rowHeight < 48) newPage()
      if (!tableStarted) drawTableHeader()
      let x = margin
      wrapped.forEach((cellLines, index) => {
        doc.rect(page, x, y - rowHeight, columnWidths[index], rowHeight, { strokeGray: 0.87, lineWidth: 0.35 })
        cellLines.forEach((line, lineIndex) => doc.text(page, x + 4, y - 13 - (lineIndex * 8.4), line, { size: 6.3 }))
        x += columnWidths[index]
      })
      y -= rowHeight
      rowIndex += 1
    })
  }

  for (let index = 0; index < doc.pageCount; index += 1) {
    doc.line(index, margin, 34, 842 - margin, 34, 0.82, 0.45)
    doc.text(index, margin, 21, `Dibuat ${generatedAt} | Sumber: transaksi operasional sistem`, { size: 6.6 })
    doc.text(index, 842 - margin, 21, `Halaman ${index + 1} / ${doc.pageCount}`, { size: 6.6, align: 'right' })
  }

  return doc.buildBlob()
}

export function downloadTransactionsReportPdf(transactions: OperationTransaction[], options: TransactionReportOptions) {
  const blob = buildTransactionsReportPdfBlob(transactions, options)
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = reportFilename(options, 'pdf')
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export type ShareReportResult = 'shared' | 'downloaded' | 'cancelled'

export async function shareTransactionsReportPdf(transactions: OperationTransaction[], options: TransactionReportOptions): Promise<ShareReportResult> {
  const blob = buildTransactionsReportPdfBlob(transactions, options)
  const file = new File([blob], reportFilename(options, 'pdf'), { type: 'application/pdf' })
  const shareData: ShareData = {
    title: `${ORGANIZATION_NAME} - ${options.title}`,
    text: `${options.title} | ${transactions.length} catatan`,
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

  downloadTransactionsReportPdf(transactions, options)
  return 'downloaded'
}

function xmlEscape(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')
}

function crc32(bytes: Uint8Array) {
  let crc = 0xffffffff
  for (const byte of bytes) {
    crc ^= byte
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1))
  }
  return (crc ^ 0xffffffff) >>> 0
}

function zipStore(files: Array<{ name: string; content: string }>) {
  const encoder = new TextEncoder()
  const localChunks: Uint8Array[] = []
  const centralChunks: Uint8Array[] = []
  let offset = 0
  const u16 = (view: DataView, pos: number, value: number) => view.setUint16(pos, value, true)
  const u32 = (view: DataView, pos: number, value: number) => view.setUint32(pos, value >>> 0, true)
  for (const file of files) {
    const name = encoder.encode(file.name)
    const data = encoder.encode(file.content)
    const crc = crc32(data)
    const local = new Uint8Array(30 + name.length + data.length)
    const lv = new DataView(local.buffer)
    u32(lv, 0, 0x04034b50); u16(lv, 4, 20); u16(lv, 6, 0); u16(lv, 8, 0); u16(lv, 10, 0); u16(lv, 12, 0); u32(lv, 14, crc); u32(lv, 18, data.length); u32(lv, 22, data.length); u16(lv, 26, name.length); u16(lv, 28, 0)
    local.set(name, 30); local.set(data, 30 + name.length); localChunks.push(local)
    const central = new Uint8Array(46 + name.length)
    const cv = new DataView(central.buffer)
    u32(cv, 0, 0x02014b50); u16(cv, 4, 20); u16(cv, 6, 20); u16(cv, 8, 0); u16(cv, 10, 0); u16(cv, 12, 0); u16(cv, 14, 0); u32(cv, 16, crc); u32(cv, 20, data.length); u32(cv, 24, data.length); u16(cv, 28, name.length); u16(cv, 30, 0); u16(cv, 32, 0); u16(cv, 34, 0); u16(cv, 36, 0); u32(cv, 38, 0); u32(cv, 42, offset); central.set(name, 46); centralChunks.push(central)
    offset += local.length
  }
  const centralSize = centralChunks.reduce((sum, chunk) => sum + chunk.length, 0)
  const end = new Uint8Array(22)
  const ev = new DataView(end.buffer)
  u32(ev, 0, 0x06054b50); u16(ev, 4, 0); u16(ev, 6, 0); u16(ev, 8, files.length); u16(ev, 10, files.length); u32(ev, 12, centralSize); u32(ev, 16, offset); u16(ev, 20, 0)
  const blobParts: BlobPart[] = [...localChunks, ...centralChunks, end].map((chunk) => {
    const copy = new Uint8Array(chunk.byteLength)
    copy.set(chunk)
    return copy.buffer
  })
  return new Blob(blobParts, { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
}

function columnName(index: number) {
  let name = ''
  let value = index + 1
  while (value > 0) { const rem = (value - 1) % 26; name = String.fromCharCode(65 + rem) + name; value = Math.floor((value - 1) / 26) }
  return name
}

export function downloadTransactionsXlsx(transactions: OperationTransaction[], options: TransactionReportOptions) {
  const header = ['ID Transaksi','Tanggal','Humas/Penginput','Jenis','Kategori','Wilayah/Tugas','Kegiatan','Catatan','Nominal','Status','Sumber Dana','Vendor/Toko','Jumlah','Harga Satuan','Metode Pembayaran','Bukti']
  const rows: Array<Array<string | number>> = [
    [ORGANIZATION_NAME], [options.title], ...options.filters.map((item) => [`${item.label}: ${item.value}`]), [], header,
    ...transactions.map((item) => [item.id,item.date,item.createdByName,kindLabel(item.kind),item.category,item.areaLabel ?? '',item.activityName,item.label,item.amount,transactionStatusLabel(item),item.fundingSource ?? '',item.vendor ?? '',item.quantity ?? '',item.unitPrice ?? '',item.paymentMethod ?? '',item.evidenceName ?? '']),
  ]
  const sheetRows = rows.map((row, r) => `<row r="${r+1}">${row.map((cell, c) => { const ref = `${columnName(c)}${r+1}`; return typeof cell === 'number' ? `<c r="${ref}"><v>${cell}</v></c>` : `<c r="${ref}" t="inlineStr"><is><t>${xmlEscape(String(cell))}</t></is></c>` }).join('')}</row>`).join('')
  const sheet = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${sheetRows}</sheetData></worksheet>`
  const files = [
    { name: '[Content_Types].xml', content: `<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>` },
    { name: '_rels/.rels', content: `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>` },
    { name: 'xl/workbook.xml', content: `<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Laporan" sheetId="1" r:id="rId1"/></sheets></workbook>` },
    { name: 'xl/_rels/workbook.xml.rels', content: `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>` },
    { name: 'xl/worksheets/sheet1.xml', content: sheet },
  ]
  const blob = zipStore(files)
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = reportFilename(options, 'xlsx')
  document.body.appendChild(anchor); anchor.click(); anchor.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function csvEscape(value: string | number | undefined) {
  let text = String(value ?? '')
  if (/^[=+\-@]/.test(text)) text = `'${text}`
  return `"${text.replace(/"/g, '""')}"`
}

export function downloadTransactionsExcelCsv(transactions: OperationTransaction[], options: TransactionReportOptions) {
  const header = [
    'ID Transaksi', 'Tanggal', 'Humas/Penginput', 'Jenis', 'Kategori', 'Wilayah/Tugas', 'Kegiatan', 'Catatan', 'Nominal', 'Status',
    'Vendor/Toko', 'Jumlah', 'Harga Satuan', 'Metode Pembayaran', 'Bukti',
  ]
  const rows = transactions.map((item) => [
    item.id, item.date, item.createdByName, kindLabel(item.kind), item.category, item.areaLabel ?? '', item.activityName, item.label, item.amount, transactionStatusLabel(item),
    item.vendor ?? '', item.quantity ?? '', item.unitPrice ?? '', item.paymentMethod ?? '', item.evidenceName ?? '',
  ])
  const meta = options.filters.map((item) => [item.label, item.value])
  const lines = [
    [ORGANIZATION_NAME],
    [options.title],
    ...meta,
    [],
    header,
    ...rows,
  ].map((row) => row.map(csvEscape).join(';')).join('\r\n')
  const blob = new Blob([`\uFEFF${lines}`], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = reportFilename(options, 'csv')
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}
