import { isRecognizedTransaction, transactionStatusLabel, type BudgetItem, type CommitteeMember, type OperationActivity, type OperationTransaction } from '../prototype/OperationsContext'
import { SimplePdfDocument, sanitizePdfText, wrapPdfText } from './simplePdf'

const ORGANIZATION = 'PEMUDA DUSUN 3 SIDODADI'
const MARGIN = 42
const CONTENT_WIDTH = 595 - (MARGIN * 2)
const FOOTER_Y = 28

function money(value: number) {
  return `Rp ${Math.round(value).toLocaleString('id-ID')}`
}

function safeFilePart(value: string) {
  return sanitizePdfText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 55)
}

function transactionKindLabel(item: OperationTransaction) {
  if (item.kind === 'income') return item.category === 'Iuran' ? 'Iuran' : 'Pemasukan'
  if (item.kind === 'expense') return 'Pengeluaran'
  return 'Serah Kas'
}

function drawHeader(doc: SimplePdfDocument, page: number, activityName: string) {
  doc.text(page, MARGIN, 802, ORGANIZATION, { font: 'bold', size: 15 })
  doc.text(page, MARGIN, 783, 'LAPORAN PERTANGGUNGJAWABAN (LPJ)', { font: 'bold', size: 11 })
  doc.text(page, MARGIN, 767, activityName, { size: 8.5 })
  doc.line(page, MARGIN, 756, 595 - MARGIN, 756, 0.3, 1.1)
}

function drawFooter(doc: SimplePdfDocument, page: number, pageNumber: number, pageCount: number, generatedAt: string) {
  doc.line(page, MARGIN, 42, 595 - MARGIN, 42, 0.82, 0.5)
  doc.text(page, MARGIN, FOOTER_Y, `Dibuat otomatis dari data operasional | ${generatedAt}`, { size: 6.8 })
  doc.text(page, 595 - MARGIN, FOOTER_Y, `Halaman ${pageNumber} / ${pageCount}`, { size: 6.8, align: 'right' })
}

export function buildLpjDraftPdfBlob(activity: OperationActivity, committee: CommitteeMember[], budgets: BudgetItem[], transactions: OperationTransaction[]) {
  const doc = new SimplePdfDocument('portrait')
  const generatedAt = new Date().toLocaleString('id-ID')
  const validTransactions = transactions
    .filter((item) => item.activityId === activity.id && isRecognizedTransaction(item))
    .sort((a, b) => a.dateISO.localeCompare(b.dateISO) || a.date.localeCompare(b.date))
  const income = validTransactions.filter((item) => item.kind === 'income').reduce((sum, item) => sum + item.amount, 0)
  const expense = validTransactions.filter((item) => item.kind === 'expense').reduce((sum, item) => sum + item.amount, 0)
  const handover = validTransactions.filter((item) => item.kind === 'handover').reduce((sum, item) => sum + item.amount, 0)
  const balance = income - expense

  let page = doc.addPage()
  drawHeader(doc, page, activity.name)
  let y = 735

  const newPage = () => {
    page = doc.addPage()
    drawHeader(doc, page, activity.name)
    y = 735
  }

  const ensure = (height: number) => {
    if (y - height < 58) newPage()
  }

  const section = (title: string) => {
    ensure(34)
    doc.rect(page, MARGIN, y - 22, CONTENT_WIDTH, 25, { fillGray: 0.94, strokeGray: 0.82, lineWidth: 0.5 })
    doc.text(page, MARGIN + 10, y - 14, title, { font: 'bold', size: 9 })
    y -= 34
  }

  const metaRow = (label: string, value: string) => {
    const lines = wrapPdfText(value, CONTENT_WIDTH - 115, 8.5)
    const height = Math.max(20, lines.length * 11 + 7)
    ensure(height)
    doc.text(page, MARGIN + 4, y - 10, label, { font: 'bold', size: 7.5 })
    lines.forEach((line, index) => doc.text(page, MARGIN + 112, y - 10 - (index * 11), line, { size: 8.5 }))
    doc.line(page, MARGIN, y - height + 3, MARGIN + CONTENT_WIDTH, y - height + 3, 0.9, 0.35)
    y -= height
  }

  section('A. IDENTITAS KEGIATAN')
  metaRow('Nama Kegiatan', activity.name)
  metaRow('Tanggal', activity.date)
  metaRow('Lokasi', activity.location)
  metaRow('Kategori / Fase', `${activity.category} / ${activity.phase}`)
  metaRow('Ringkasan', activity.summary || '-')
  y -= 6

  section('B. RINGKASAN KEUANGAN')
  ensure(84)
  const cardGap = 8
  const cardWidth = (CONTENT_WIDTH - cardGap) / 2
  const cards = [
    ['Pemasukan Tercatat', money(income)],
    ['Pengeluaran Terverifikasi', money(expense)],
    ['Serah Kas Terverifikasi', money(handover)],
    ['Saldo Pemasukan - Pengeluaran', money(balance)],
  ]
  cards.forEach(([label, value], index) => {
    const column = index % 2
    const row = Math.floor(index / 2)
    const x = MARGIN + (column * (cardWidth + cardGap))
    const top = y - (row * 39)
    doc.rect(page, x, top - 32, cardWidth, 32, { fillGray: 0.975, strokeGray: 0.84, lineWidth: 0.5 })
    doc.text(page, x + 8, top - 11, label, { size: 6.7 })
    doc.text(page, x + 8, top - 25, value, { font: 'bold', size: 9 })
  })
  y -= 84

  section('C. SUSUNAN PANITIA')
  const committeeRows = committee.length ? committee : [{ id: '-', activityId: activity.id, role: '-', name: 'Belum ada data panitia', phone: '-' }]
  const committeeWidths = [28, 125, 205, 153]
  const committeeHeaders = ['No', 'Jabatan', 'Nama', 'Kontak']
  const drawCommitteeHeader = () => {
    ensure(24)
    let x = MARGIN
    committeeHeaders.forEach((header, index) => {
      doc.rect(page, x, y - 20, committeeWidths[index], 20, { fillGray: 0.93, strokeGray: 0.78, lineWidth: 0.45 })
      doc.text(page, x + 5, y - 13, header, { font: 'bold', size: 7 })
      x += committeeWidths[index]
    })
    y -= 20
  }
  drawCommitteeHeader()
  committeeRows.forEach((item, index) => {
    const cells = [String(index + 1), item.role, item.name, item.phone || '-']
    const wrapped = cells.map((value, cellIndex) => wrapPdfText(value, committeeWidths[cellIndex] - 10, 7.4))
    const rowHeight = Math.max(21, Math.max(...wrapped.map((lines) => lines.length)) * 10 + 7)
    if (y - rowHeight < 58) {
      newPage()
      section('C. SUSUNAN PANITIA (LANJUTAN)')
      drawCommitteeHeader()
    }
    let x = MARGIN
    wrapped.forEach((lines, cellIndex) => {
      doc.rect(page, x, y - rowHeight, committeeWidths[cellIndex], rowHeight, { strokeGray: 0.86, lineWidth: 0.4 })
      lines.forEach((line, lineIndex) => doc.text(page, x + 5, y - 13 - (lineIndex * 10), line, { size: 7.4 }))
      x += committeeWidths[cellIndex]
    })
    y -= rowHeight
  })
  y -= 8

  section('D. RAB DAN REALISASI')
  const budgetRows = budgets.length ? budgets : [{ id: '-', activityId: activity.id, category: 'Belum ada RAB', plan: 0, realized: 0 }]
  const budgetWidths = [205, 102, 102, 102]
  const budgetHeaders = ['Kategori', 'Rencana', 'Realisasi', 'Selisih']
  const drawBudgetHeader = () => {
    let x = MARGIN
    budgetHeaders.forEach((header, index) => {
      doc.rect(page, x, y - 20, budgetWidths[index], 20, { fillGray: 0.93, strokeGray: 0.78, lineWidth: 0.45 })
      doc.text(page, x + 5, y - 13, header, { font: 'bold', size: 7 })
      x += budgetWidths[index]
    })
    y -= 20
  }
  drawBudgetHeader()
  budgetRows.forEach((item) => {
    const values = [item.category, money(item.plan), money(item.realized), money(item.plan - item.realized)]
    const wrapped = values.map((value, index) => wrapPdfText(value, budgetWidths[index] - 10, 7.2))
    const rowHeight = Math.max(21, Math.max(...wrapped.map((lines) => lines.length)) * 10 + 7)
    if (y - rowHeight < 58) {
      newPage()
      section('D. RAB DAN REALISASI (LANJUTAN)')
      drawBudgetHeader()
    }
    let x = MARGIN
    wrapped.forEach((lines, index) => {
      doc.rect(page, x, y - rowHeight, budgetWidths[index], rowHeight, { strokeGray: 0.86, lineWidth: 0.4 })
      lines.forEach((line, lineIndex) => doc.text(page, x + 5, y - 13 - (lineIndex * 10), line, { size: 7.2 }))
      x += budgetWidths[index]
    })
    y -= rowHeight
  })
  const planTotal = budgets.reduce((sum, item) => sum + item.plan, 0)
  const realizedTotal = budgets.reduce((sum, item) => sum + item.realized, 0)
  ensure(23)
  doc.rect(page, MARGIN, y - 22, CONTENT_WIDTH, 22, { fillGray: 0.965, strokeGray: 0.8, lineWidth: 0.45 })
  doc.text(page, MARGIN + 6, y - 14, 'TOTAL', { font: 'bold', size: 7.4 })
  doc.text(page, MARGIN + 205 + 6, y - 14, money(planTotal), { font: 'bold', size: 7.4 })
  doc.text(page, MARGIN + 307 + 6, y - 14, money(realizedTotal), { font: 'bold', size: 7.4 })
  doc.text(page, MARGIN + 409 + 6, y - 14, money(planTotal - realizedTotal), { font: 'bold', size: 7.4 })
  y -= 31

  section('E. TRANSAKSI TERAKUI')
  const txWidths = [25, 63, 70, 155, 92, 106]
  const txHeaders = ['No', 'Tanggal', 'Jenis', 'Uraian', 'Nominal', 'Status / Penginput']
  const drawTxHeader = () => {
    let x = MARGIN
    txHeaders.forEach((header, index) => {
      doc.rect(page, x, y - 21, txWidths[index], 21, { fillGray: 0.93, strokeGray: 0.78, lineWidth: 0.45 })
      doc.text(page, x + 4, y - 13, header, { font: 'bold', size: 6.6 })
      x += txWidths[index]
    })
    y -= 21
  }
  drawTxHeader()
  if (validTransactions.length === 0) {
    ensure(28)
    doc.rect(page, MARGIN, y - 27, CONTENT_WIDTH, 27, { strokeGray: 0.86, lineWidth: 0.4 })
    doc.text(page, MARGIN + 6, y - 17, 'Belum ada transaksi terverifikasi / terakui untuk kegiatan ini.', { size: 7.5 })
    y -= 27
  } else {
    validTransactions.forEach((item, index) => {
      const values = [
        String(index + 1),
        item.dateISO || item.date,
        transactionKindLabel(item),
        `${item.category} - ${item.label}`,
        money(item.amount),
        `${transactionStatusLabel(item)} / ${item.createdByName}`,
      ]
      const wrapped = values.map((value, cellIndex) => wrapPdfText(value, txWidths[cellIndex] - 8, 6.7))
      const rowHeight = Math.max(22, Math.max(...wrapped.map((lines) => lines.length)) * 9 + 7)
      if (y - rowHeight < 58) {
        newPage()
        section('E. TRANSAKSI TERAKUI (LANJUTAN)')
        drawTxHeader()
      }
      let x = MARGIN
      wrapped.forEach((lines, cellIndex) => {
        doc.rect(page, x, y - rowHeight, txWidths[cellIndex], rowHeight, { strokeGray: 0.87, lineWidth: 0.35 })
        lines.forEach((line, lineIndex) => doc.text(page, x + 4, y - 13 - (lineIndex * 9), line, { size: 6.7 }))
        x += txWidths[cellIndex]
      })
      y -= rowHeight
    })
  }
  y -= 9

  section('F. HASIL, EVALUASI, DAN CATATAN')
  const narrative = [
    'Hasil kegiatan, kendala, evaluasi, rekomendasi, serta dokumentasi pendukung dapat dilengkapi pengurus sebelum LPJ diajukan untuk pengesahan.',
    'Seluruh angka pada bagian keuangan dan transaksi diambil langsung dari data operasional sistem sehingga tidak perlu diketik ulang.',
  ]
  narrative.forEach((paragraph) => {
    const lines = wrapPdfText(paragraph, CONTENT_WIDTH - 12, 8)
    ensure(lines.length * 11 + 9)
    lines.forEach((line, index) => doc.text(page, MARGIN + 6, y - 10 - (index * 11), line, { size: 8 }))
    y -= (lines.length * 11) + 9
  })

  ensure(108)
  y -= 7
  doc.text(page, MARGIN, y, 'PENGESAHAN', { font: 'bold', size: 8 })
  y -= 15
  const signWidth = (CONTENT_WIDTH - 16) / 3
  const signLabels = ['Ketua Panitia', 'Bendahara / Keuangan', 'Admin / Pengurus']
  signLabels.forEach((label, index) => {
    const x = MARGIN + (index * (signWidth + 8))
    doc.rect(page, x, y - 75, signWidth, 75, { strokeGray: 0.82, lineWidth: 0.45 })
    doc.text(page, x + (signWidth / 2), y - 14, label, { font: 'bold', size: 7, align: 'center' })
    doc.text(page, x + (signWidth / 2), y - 61, '(................................)', { size: 7, align: 'center' })
  })

  for (let index = 0; index < doc.pageCount; index += 1) {
    drawFooter(doc, index, index + 1, doc.pageCount, generatedAt)
  }

  return doc.buildBlob()
}

export function downloadLpjDraftPdf(activity: OperationActivity, committee: CommitteeMember[], budgets: BudgetItem[], transactions: OperationTransaction[]) {
  const blob = buildLpjDraftPdfBlob(activity, committee, budgets, transactions)
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `lpj-${safeFilePart(activity.name) || activity.id}.pdf`
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}
