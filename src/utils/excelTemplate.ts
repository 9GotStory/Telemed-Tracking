/**
 * Excel import template generation (write path).
 *
 * The headers below MUST be keys recognized by HEADER_MAP in excelParser.ts
 * so the generated template round-trips through the parser without errors.
 *
 * VN/HN/dob/tel are emitted as JS strings → SheetJS stores them as text cells
 * (t: 's'), preserving leading zeros (e.g. HN "000001") that would be lost if
 * coerced to numbers. qty is emitted as a number for usability.
 */
const TEMPLATE_COLUMNS = [
  { header: 'VN', width: 14 },
  { header: 'HN', width: 9 },
  { header: 'ชื่อ-สกุล', width: 19 },
  { header: 'วันเกิด', width: 13 },
  { header: 'เบอร์โทร', width: 13 },
  { header: 'ชื่อยา', width: 15 },
  { header: 'ความแรง', width: 11 },
  { header: 'จำนวน', width: 7 },
  { header: 'หน่วย', width: 9 },
  { header: 'วิธีใช้', width: 19 },
] as const

// One patient (same VN) with two drugs — demonstrates multi-row-per-VN grouping.
const SAMPLE_ROWS: (string | number)[][] = [
  ['690425091500', '000001', 'สมชาย ใจดี', '2523-01-15', '0812345678', 'Paracetamol', '500 mg', 10, 'เม็ด', '1x3 หลังอาหาร'],
  ['690425091500', '000001', 'สมชาย ใจดี', '2523-01-15', '0812345678', 'Amoxicillin', '250 mg', 21, 'แคปซูล', '1x3 หลังอาหาร'],
]

/**
 * Build the import template workbook in memory and trigger a browser download.
 * Uses dynamic import so the xlsx library (~500KB) is only loaded on demand.
 */
export async function downloadImportTemplate(filename = 'sample-import.xlsx'): Promise<void> {
  const XLSX = await import('xlsx')
  const headerRow = TEMPLATE_COLUMNS.map((c) => c.header)
  const ws = XLSX.utils.aoa_to_sheet([headerRow, ...SAMPLE_ROWS])
  ws['!cols'] = TEMPLATE_COLUMNS.map((c) => ({ wch: c.width }))
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')
  XLSX.writeFile(wb, filename)
}
