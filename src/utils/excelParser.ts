/** VN format: 12 digits (YYMMDDHHmmSS) */
const VN_REGEX = /^\d{12}$/
/** HN format: 6 digits */
const HN_REGEX = /^\d{6}$/
/** Excel serial date cutoff — numbers above this are likely serial dates, not years */
const SERIAL_DATE_THRESHOLD = 10000

/** Expected column headers in HosXP Excel export */
const REQUIRED_COLUMNS = ['vn', 'hn', 'patient_name', 'dob', 'tel', 'drug_name', 'strength', 'qty', 'unit', 'sig'] as const

/** Header row mapping — Thai headers from HosXP mapped to our field names */
const HEADER_MAP: Record<string, string> = {
  'vn': 'vn',
  'VN': 'vn',
  'hn': 'HN',
  'HN': 'hn',
  'ชื่อ-สกุล': 'patient_name',
  'ชื่อ สกุล': 'patient_name',
  'ชื่อ-นามสกุล': 'patient_name',
  'patient_name': 'patient_name',
  'วันเกิด': 'dob',
  'dob': 'dob',
  'DOB': 'dob',
  'เบอร์โทร': 'tel',
  'tel': 'tel',
  'Tel': 'tel',
  'ชื่อยา': 'drug_name',
  'drug_name': 'drug_name',
  'Drug': 'drug_name',
  'ความแรง': 'strength',
  'strength': 'strength',
  'จำนวน': 'qty',
  'qty': 'qty',
  'หน่วย': 'unit',
  'unit': 'unit',
  'วิธีใช้': 'sig',
  'sig': 'sig',
}

export interface ParsedRow {
  vn: string
  hn: string
  patient_name: string
  dob: string
  tel: string
  drug_name: string
  strength: string
  qty: number
  unit: string
  sig: string
}

export interface ParseResult {
  rows: ParsedRow[]
  groupedByVN: Record<string, ParsedRow[]>
  errors: string[]
  totalRows: number
  uniqueVNs: number
  /** Rows that failed VN/HN format validation, keyed by row index */
  invalidRows: Record<number, string[]>
}

/**
 * Parse HosXP Excel export using SheetJS.
 * Validates column headers, normalizes field names, groups by VN.
 *
 * Uses dynamic import to keep xlsx (500KB+) out of the main bundle.
 */
export async function parseHosXPExport(arrayBuffer: ArrayBuffer): Promise<ParseResult> {
  const errors: string[] = []
  const invalidRows: Record<number, string[]> = {}

  const XLSX = await import('xlsx')
  const workbook = XLSX.read(arrayBuffer, { type: 'array' })
  const sheetName = workbook.SheetNames[0]
  if (!sheetName) {
    return { rows: [], groupedByVN: {}, errors: ['ไม่พบ sheet ในไฟล์ Excel'], totalRows: 0, uniqueVNs: 0, invalidRows }
  }

  const sheet = workbook.Sheets[sheetName]
  const rawData: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet, { defval: '' })

  if (rawData.length === 0) {
    return { rows: [], groupedByVN: {}, errors: ['ไม่พบข้อมูลใน sheet'], totalRows: 0, uniqueVNs: 0, invalidRows }
  }

  // Normalize headers
  const firstRow = rawData[0]
  const headerMapping = buildHeaderMapping(Object.keys(firstRow))

  // Check for required columns
  for (const col of REQUIRED_COLUMNS) {
    if (!Object.values(headerMapping).includes(col)) {
      errors.push(`ไม่พบคอลัมน์ที่จำเป็น: ${col}`)
    }
  }

  if (errors.length > 0) {
    return { rows: [], groupedByVN: {}, errors, totalRows: rawData.length, uniqueVNs: 0, invalidRows }
  }

  // Parse rows with required field + format validation
  const rows: ParsedRow[] = []
  for (let i = 0; i < rawData.length; i++) {
    const mapped = mapRow(rawData[i], headerMapping)
    if (!mapped) continue

    const rowErrors: string[] = []

    // Required field checks
    if (!mapped.vn) {
      rowErrors.push('VN ว่าง')
    } else if (!VN_REGEX.test(mapped.vn)) {
      rowErrors.push(`VN "${mapped.vn}" ไม่ตรงตามรูปแบบ 12 หลัก (YYMMDDHHmmSS)`)
    }
    if (!mapped.hn) {
      rowErrors.push('HN ว่าง')
    } else if (!HN_REGEX.test(mapped.hn)) {
      rowErrors.push(`HN "${mapped.hn}" ไม่ตรงตามรูปแบบ 6 หลัก`)
    }
    if (!mapped.patient_name) rowErrors.push('ชื่อ-สกุล ว่าง')
    if (!mapped.drug_name) rowErrors.push('ชื่อยา ว่าง')
    if (!mapped.qty || mapped.qty <= 0) rowErrors.push('จำนวนต้องมากกว่า 0')

    if (rowErrors.length > 0) {
      invalidRows[i] = rowErrors
    }
    // Only include valid rows in the output
    if (rowErrors.length === 0) {
      rows.push(mapped)
    }
  }

  // Group by VN
  const groupedByVN: Record<string, ParsedRow[]> = {}
  for (const row of rows) {
    if (!groupedByVN[row.vn]) {
      groupedByVN[row.vn] = []
    }
    groupedByVN[row.vn].push(row)
  }

  return {
    rows,
    groupedByVN,
    errors,
    totalRows: rows.length,
    uniqueVNs: Object.keys(groupedByVN).length,
    invalidRows,
  }
}

function buildHeaderMapping(headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {}
  for (const header of headers) {
    const normalized = header.trim()
    const mapped = HEADER_MAP[normalized]
    if (mapped) {
      mapping[header] = mapped
    }
  }
  return mapping
}

/**
 * Convert a possible Excel serial date number to YYYY-MM-DD string.
 * SheetJS without cellDates returns date cells as numeric serials (e.g. 44196).
 */
function serialToDateStr(val: unknown): string {
  if (typeof val === 'number' && val > SERIAL_DATE_THRESHOLD) {
    // Excel serial date: days since 1899-12-30
    const epoch = new Date(1899, 11, 30)
    epoch.setDate(epoch.getDate() + val)
    const y = epoch.getFullYear()
    const m = String(epoch.getMonth() + 1).padStart(2, '0')
    const d = String(epoch.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }
  return String(val ?? '').trim()
}

function mapRow(raw: Record<string, unknown>, headerMapping: Record<string, string>): ParsedRow | null {
  const mapped: Record<string, unknown> = {}
  for (const [header, field] of Object.entries(headerMapping)) {
    mapped[field] = raw[header]
  }

  const vn = String(mapped.vn ?? '').trim()
  if (!vn) return null

  const qtyRaw = mapped.qty
  const qty = typeof qtyRaw === 'number' ? qtyRaw : parseInt(String(qtyRaw), 10)

  return {
    vn,
    hn: String(mapped.hn ?? '').trim(),
    patient_name: String(mapped.patient_name ?? '').trim(),
    dob: serialToDateStr(mapped.dob),
    tel: String(mapped.tel ?? '').trim(),
    drug_name: String(mapped.drug_name ?? '').trim(),
    strength: String(mapped.strength ?? '').trim(),
    qty: isNaN(qty) ? 0 : qty,
    unit: String(mapped.unit ?? '').trim(),
    sig: String(mapped.sig ?? '').trim(),
  }
}
