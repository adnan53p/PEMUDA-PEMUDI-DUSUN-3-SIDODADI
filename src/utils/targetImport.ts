export interface ImportedTargetRow {
  name: string
  area?: string
}

function normalizeHeader(value: unknown) {
  return String(value ?? '').trim().toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ')
}

function rowsToTargets(rows: Array<Array<string | number>>) {
  const cleanRows = rows.filter((row) => row.some((cell) => String(cell ?? '').trim()))
  if (!cleanRows.length) return []

  const first = cleanRows[0].map(normalizeHeader)
  const headerLike = first.some((cell) => ['nama', 'nama target', 'nama warga', 'keluarga', 'wilayah', 'rt', 'area'].includes(cell))
  const dataRows = headerLike ? cleanRows.slice(1) : cleanRows

  const nameIndex = headerLike ? Math.max(0, first.findIndex((cell) => ['nama', 'nama target', 'nama warga', 'keluarga'].includes(cell))) : 0
  const areaIndex = headerLike ? first.findIndex((cell) => ['wilayah', 'rt', 'area'].includes(cell)) : 1

  return dataRows.map((row) => ({
    name: String(row[nameIndex] ?? '').trim(),
    area: areaIndex >= 0 ? String(row[areaIndex] ?? '').trim() : '',
  })).filter((row) => row.name)
}

function splitDelimitedLine(line: string, delimiter: string) {
  const cells: string[] = []
  let cell = ''
  let quoted = false
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index]
    if (char === '"') {
      if (quoted && line[index + 1] === '"') {
        cell += '"'
        index += 1
      } else {
        quoted = !quoted
      }
    } else if (char === delimiter && !quoted) {
      cells.push(cell.trim())
      cell = ''
    } else {
      cell += char
    }
  }
  cells.push(cell.trim())
  return cells
}

export function parseTargetCsv(text: string): ImportedTargetRow[] {
  const normalized = text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const firstLine = normalized.split('\n').find((line) => line.trim()) ?? ''
  const candidates = [',', ';', '\t']
  const delimiter = candidates.sort((a, b) => (firstLine.split(b).length - firstLine.split(a).length))[0]
  const rows = normalized.split('\n').filter((line) => line.trim()).map((line) => splitDelimitedLine(line, delimiter))
  return rowsToTargets(rows)
}

function columnIndex(reference: string) {
  const letters = reference.match(/^[A-Z]+/i)?.[0]?.toUpperCase() ?? 'A'
  let value = 0
  for (const char of letters) value = value * 26 + char.charCodeAt(0) - 64
  return Math.max(0, value - 1)
}

async function unzipEntries(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer)
  const view = new DataView(buffer)
  let eocd = -1
  for (let offset = Math.max(0, bytes.length - 65557); offset <= bytes.length - 22; offset += 1) {
    if (view.getUint32(offset, true) === 0x06054b50) eocd = offset
  }
  if (eocd < 0) throw new Error('File XLSX tidak valid.')

  const totalEntries = view.getUint16(eocd + 10, true)
  let cursor = view.getUint32(eocd + 16, true)
  const decoder = new TextDecoder('utf-8')
  const entries = new Map<string, { method: number; compressedSize: number; localOffset: number }>()

  for (let index = 0; index < totalEntries; index += 1) {
    if (view.getUint32(cursor, true) !== 0x02014b50) break
    const method = view.getUint16(cursor + 10, true)
    const compressedSize = view.getUint32(cursor + 20, true)
    const fileNameLength = view.getUint16(cursor + 28, true)
    const extraLength = view.getUint16(cursor + 30, true)
    const commentLength = view.getUint16(cursor + 32, true)
    const localOffset = view.getUint32(cursor + 42, true)
    const name = decoder.decode(bytes.slice(cursor + 46, cursor + 46 + fileNameLength))
    entries.set(name, { method, compressedSize, localOffset })
    cursor += 46 + fileNameLength + extraLength + commentLength
  }

  const readEntry = async (name: string) => {
    const entry = entries.get(name)
    if (!entry) return null
    const local = entry.localOffset
    if (view.getUint32(local, true) !== 0x04034b50) throw new Error('Struktur XLSX tidak valid.')
    const fileNameLength = view.getUint16(local + 26, true)
    const extraLength = view.getUint16(local + 28, true)
    const start = local + 30 + fileNameLength + extraLength
    const compressed = bytes.slice(start, start + entry.compressedSize)
    if (entry.method === 0) return compressed
    if (entry.method !== 8) throw new Error('Metode kompresi XLSX tidak didukung.')
    if (typeof DecompressionStream === 'undefined') throw new Error('Browser ini belum mendukung pembacaan XLSX langsung. Gunakan CSV.')
    const stream = new Blob([compressed]).stream().pipeThrough(new DecompressionStream('deflate-raw'))
    return new Uint8Array(await new Response(stream).arrayBuffer())
  }

  return { entries, readEntry, decoder }
}

export async function parseTargetXlsx(file: File): Promise<ImportedTargetRow[]> {
  const { entries, readEntry, decoder } = await unzipEntries(await file.arrayBuffer())
  const sharedBytes = await readEntry('xl/sharedStrings.xml')
  const shared: string[] = []
  if (sharedBytes) {
    const doc = new DOMParser().parseFromString(decoder.decode(sharedBytes), 'application/xml')
    Array.from(doc.getElementsByTagName('si')).forEach((item) => {
      const text = Array.from(item.getElementsByTagName('t')).map((node) => node.textContent ?? '').join('')
      shared.push(text)
    })
  }

  const sheetName = Array.from(entries.keys()).filter((name) => /^xl\/worksheets\/sheet\d+\.xml$/i.test(name)).sort()[0]
  if (!sheetName) throw new Error('Worksheet XLSX tidak ditemukan.')
  const sheetBytes = await readEntry(sheetName)
  if (!sheetBytes) throw new Error('Worksheet XLSX tidak dapat dibaca.')
  const sheet = new DOMParser().parseFromString(decoder.decode(sheetBytes), 'application/xml')
  const rows: Array<Array<string | number>> = []

  Array.from(sheet.getElementsByTagName('row')).forEach((rowNode) => {
    const row: Array<string | number> = []
    Array.from(rowNode.getElementsByTagName('c')).forEach((cell) => {
      const index = columnIndex(cell.getAttribute('r') ?? 'A1')
      const type = cell.getAttribute('t')
      let value = ''
      if (type === 'inlineStr') {
        value = Array.from(cell.getElementsByTagName('t')).map((node) => node.textContent ?? '').join('')
      } else {
        const raw = cell.getElementsByTagName('v')[0]?.textContent ?? ''
        value = type === 's' ? (shared[Number(raw)] ?? '') : raw
      }
      row[index] = value
    })
    rows.push(row)
  })

  return rowsToTargets(rows)
}

export async function parseTargetImportFile(file: File) {
  const extension = file.name.split('.').pop()?.toLowerCase()
  if (extension === 'xlsx') return parseTargetXlsx(file)
  if (extension === 'csv' || extension === 'txt') return parseTargetCsv(await file.text())
  throw new Error('Gunakan file .xlsx atau .csv.')
}

export function downloadTargetCsvTemplate() {
  const content = 'Nama,Wilayah\nKeluarga Bapak Ahmad,RT 01\nKeluarga Ibu Siti,RT 01\n'
  const blob = new Blob(['\uFEFF', content], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = 'template-daftar-warga-iuran.csv'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}
