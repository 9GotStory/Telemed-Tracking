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
 * Get today's date as ISO string (YYYY-MM-DD).
 */
export function todayISO(): string {
  return format(new Date(), 'yyyy-MM-dd')
}
