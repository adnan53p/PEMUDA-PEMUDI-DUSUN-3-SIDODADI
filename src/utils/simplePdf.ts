export type PdfFont = 'regular' | 'bold' | 'mono'
export type PdfAlign = 'left' | 'center' | 'right'

export interface PdfTextOptions {
  font?: PdfFont
  size?: number
  align?: PdfAlign
}

export interface PdfRectOptions {
  fillGray?: number
  strokeGray?: number
  lineWidth?: number
}

export function sanitizePdfText(value: string) {
  return String(value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[–—−]/g, '-')
    .replace(/→/g, '->')
    .replace(/·/g, '|')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[^\x20-\x7E]/g, '?')
}

function escapePdfText(value: string) {
  return sanitizePdfText(value).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')
}

export function estimatePdfTextWidth(value: string, fontSize: number, font: PdfFont = 'regular') {
  const factor = font === 'mono' ? 0.6 : font === 'bold' ? 0.54 : 0.51
  return sanitizePdfText(value).length * fontSize * factor
}

export function wrapPdfText(value: string, maxWidth: number, fontSize = 9, font: PdfFont = 'regular') {
  const source = sanitizePdfText(value).replace(/\s+/g, ' ').trim()
  if (!source) return ['-']
  const words = source.split(' ')
  const lines: string[] = []
  let current = ''

  const pushLongWord = (word: string) => {
    let chunk = ''
    for (const char of word) {
      const next = `${chunk}${char}`
      if (estimatePdfTextWidth(next, fontSize, font) <= maxWidth || !chunk) chunk = next
      else {
        lines.push(chunk)
        chunk = char
      }
    }
    return chunk
  }

  words.forEach((word) => {
    const candidate = current ? `${current} ${word}` : word
    if (estimatePdfTextWidth(candidate, fontSize, font) <= maxWidth) {
      current = candidate
      return
    }
    if (current) lines.push(current)
    current = estimatePdfTextWidth(word, fontSize, font) <= maxWidth ? word : pushLongWord(word)
  })

  if (current) lines.push(current)
  return lines.length ? lines : ['-']
}

function fontResource(font: PdfFont) {
  if (font === 'bold') return 'F2'
  if (font === 'mono') return 'F3'
  return 'F1'
}

function clampGray(value: number | undefined, fallback: number) {
  if (typeof value !== 'number' || Number.isNaN(value)) return fallback
  return Math.max(0, Math.min(1, value))
}

export class SimplePdfDocument {
  readonly pageWidth: number
  readonly pageHeight: number
  private readonly pages: string[][] = []

  constructor(orientation: 'portrait' | 'landscape' = 'portrait') {
    this.pageWidth = orientation === 'landscape' ? 842 : 595
    this.pageHeight = orientation === 'landscape' ? 595 : 842
  }

  addPage() {
    this.pages.push([])
    return this.pages.length - 1
  }

  get pageCount() {
    return this.pages.length
  }

  text(pageIndex: number, x: number, y: number, value: string, options: PdfTextOptions = {}) {
    const page = this.pages[pageIndex]
    if (!page) return
    const font = options.font ?? 'regular'
    const size = options.size ?? 9
    const align = options.align ?? 'left'
    let drawX = x
    const width = estimatePdfTextWidth(value, size, font)
    if (align === 'right') drawX = x - width
    else if (align === 'center') drawX = x - width / 2
    page.push('BT')
    page.push(`/${fontResource(font)} ${size} Tf`)
    page.push(`1 0 0 1 ${drawX.toFixed(2)} ${y.toFixed(2)} Tm`)
    page.push(`(${escapePdfText(value)}) Tj`)
    page.push('ET')
  }

  line(pageIndex: number, x1: number, y1: number, x2: number, y2: number, gray = 0.82, width = 0.5) {
    const page = this.pages[pageIndex]
    if (!page) return
    page.push('q')
    page.push(`${clampGray(gray, 0.82)} G`)
    page.push(`${width} w`)
    page.push(`${x1.toFixed(2)} ${y1.toFixed(2)} m ${x2.toFixed(2)} ${y2.toFixed(2)} l S`)
    page.push('Q')
  }

  rect(pageIndex: number, x: number, y: number, width: number, height: number, options: PdfRectOptions = {}) {
    const page = this.pages[pageIndex]
    if (!page) return
    const fillGray = options.fillGray
    const strokeGray = options.strokeGray
    const hasFill = typeof fillGray === 'number'
    const hasStroke = typeof strokeGray === 'number'
    page.push('q')
    if (hasFill) page.push(`${clampGray(fillGray, 0.95)} g`)
    if (hasStroke) page.push(`${clampGray(strokeGray, 0.8)} G`)
    page.push(`${options.lineWidth ?? 0.5} w`)
    const operator = hasFill && hasStroke ? 'B' : hasFill ? 'f' : 'S'
    page.push(`${x.toFixed(2)} ${y.toFixed(2)} ${width.toFixed(2)} ${height.toFixed(2)} re ${operator}`)
    page.push('Q')
  }

  buildBlob() {
    if (this.pages.length === 0) this.addPage()
    const objects: string[] = [
      '<< /Type /Catalog /Pages 2 0 R >>',
      '',
      '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
      '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>',
      '<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>',
    ]
    const pageIds: number[] = []

    this.pages.forEach((commands) => {
      const stream = commands.join('\n')
      const pageId = objects.length + 1
      const contentId = pageId + 1
      pageIds.push(pageId)
      objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${this.pageWidth} ${this.pageHeight}] /Resources << /Font << /F1 3 0 R /F2 4 0 R /F3 5 0 R >> >> /Contents ${contentId} 0 R >>`)
      objects.push(`<< /Length ${new TextEncoder().encode(stream).length} >>\nstream\n${stream}\nendstream`)
    })

    objects[1] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`

    let pdf = '%PDF-1.4\n'
    const offsets: number[] = [0]
    const encoder = new TextEncoder()
    objects.forEach((object, index) => {
      offsets[index + 1] = encoder.encode(pdf).length
      pdf += `${index + 1} 0 obj\n${object}\nendobj\n`
    })
    const xrefOffset = encoder.encode(pdf).length
    pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
    for (let index = 1; index <= objects.length; index += 1) {
      pdf += `${String(offsets[index]).padStart(10, '0')} 00000 n \n`
    }
    pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`
    return new Blob([pdf], { type: 'application/pdf' })
  }
}
