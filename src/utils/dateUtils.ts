import { format, parse, isValid } from 'date-fns'

/**
 * Convert Buddhist Era date string (DD/MM/YYYY พ.ศ.) to ISO 8601 (ค.ศ.).
 * Used when parsing HosXP Excel exports.
 */
export function buddhistToISO(dateStr: string): string {
  if (!dateStr) return ''
  const parsed = parse(dateStr, 'dd/MM/yyyy', new Date())
  if (!isValid(parsed)) return ''
  const gregorianYear = parsed.getFullYear() - 543
  parsed.setFullYear(gregorianYear)
  return format(parsed, 'yyyy-MM-dd')
}

/**
 * Format ISO date for Thai display as Buddhist Era (DD/MM/YYYY พ.ศ.).
 */
export function formatBuddhist(isoDate: string): string {
  if (!isoDate) return ''
  const date = new Date(isoDate)
  if (isNaN(date.getTime())) return ''
  const buddhistYear = date.getFullYear() + 543
  const day = date.getDate().toString().padStart(2, '0')
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  return `${day}/${month}/${buddhistYear}`
}

/**
 * Format ISO date to readable Thai format with full month name.
 */
export function formatDateThai(isoDate: string): string {
  if (!isoDate) return ''
  const date = new Date(isoDate)
  if (isNaN(date.getTime())) return ''
  const buddhistYear = date.getFullYear() + 543
  const thaiMonths = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
  ]
  return `${date.getDate()} ${thaiMonths[date.getMonth()]} ${buddhistYear}`
}

/**
 * Format ISO date to short display (DD/MM/YYYY ค.ศ.).
 */
export function formatShortDate(isoDate: string): string {
  if (!isoDate) return ''
  const date = new Date(isoDate)
  if (isNaN(date.getTime())) return ''
  return format(date, 'dd/MM/yyyy')
}

/**
 * Format current month range in Thai (e.g. "1 – 31 พฤษภาคม 2569").
 */
export function currentMonthRangeThai(): string {
  const now = new Date()
  const buddhistYear = now.getFullYear() + 543
  const thaiMonths = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
  ]
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  return `1 – ${lastDay} ${thaiMonths[now.getMonth()]} ${buddhistYear}`
}

/**
 * Format "YYYY-MM" month key to short Thai display (e.g. "พ.ค. 2569").
 */
export function formatMonthShortThai(monthKey: string): string {
  const parts = monthKey.split('-')
  if (parts.length < 2) return monthKey
  const monthIndex = parseInt(parts[1], 10) - 1
  if (monthIndex < 0 || monthIndex > 11) return monthKey
  const buddhistYear = parseInt(parts[0], 10) + 543
  const thaiMonthsShort = [
    'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
    'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.',
  ]
  return `${thaiMonthsShort[monthIndex]} ${buddhistYear}`
}

/**
 * Get today's date as ISO string (YYYY-MM-DD).
 */
export function todayISO(): string {
  return format(new Date(), 'yyyy-MM-dd')
}
