export const CLINIC_TYPES = [
  { value: 'PCU-DM', label: 'เบาหวาน' },
  { value: 'PCU-HT', label: 'ความดัน' },
  { value: 'PCU-COPD', label: 'ปอดอุดกั้นเรื้อรัง' },
  { value: 'ANC-nutrition', label: 'ครรภ์-โภชนาการ' },
  { value: 'ANC-parent', label: 'ครรภ์-ผู้ปกครอง' },
  { value: 'postpartum-EPI', label: 'หลังคลอด-ภูมิคุ้มกัน' },
  { value: 'postpartum-dev', label: 'หลังคลอด-พัฒนาการ' },
] as const

export type ClinicTypeValue = (typeof CLINIC_TYPES)[number]['value']

// Also export as ClinicType for backward compatibility with visit.ts
export type ClinicType = ClinicTypeValue

// ---------------------------------------------------------------------------
// Placeholder VN — pre-registered patients before HosXP import
// ---------------------------------------------------------------------------

export const PLACEHOLDER_VN_PREFIX = 'REG-'

/** Check if a VN is a placeholder (pre-registered, not yet from HosXP). */
export function isPlaceholderVN(vn: string): boolean {
  return vn.startsWith(PLACEHOLDER_VN_PREFIX)
}

/** Generate a unique placeholder VN: REG-YYYYMMDD-HHmmss-XXXX */
export function generatePlaceholderVN(): string {
  const now = new Date()
  const date = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('')
  const time = [
    String(now.getHours()).padStart(2, '0'),
    String(now.getMinutes()).padStart(2, '0'),
    String(now.getSeconds()).padStart(2, '0'),
  ].join('')
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `${PLACEHOLDER_VN_PREFIX}${date}-${time}-${rand}`
}

// ---------------------------------------------------------------------------
// Comma-separated clinic_type helpers
// ---------------------------------------------------------------------------

const CLINIC_MAP = new Map<string, string>(CLINIC_TYPES.map((ct) => [ct.value, ct.label]))

/** Parse comma-separated clinic_type string into array. */
export function parseClinicTypes(raw: string): string[] {
  if (!raw) return []
  return raw.split(',').map((s) => s.trim()).filter(Boolean)
}

/** Join clinic type values back into comma-separated string. */
export function joinClinicTypes(types: string[]): string {
  return types.join(',')
}

/** Get display labels for a comma-separated clinic_type string. */
export function getClinicLabels(raw: string): string[] {
  return parseClinicTypes(raw).map((ct) => CLINIC_MAP.get(ct) ?? ct)
}
