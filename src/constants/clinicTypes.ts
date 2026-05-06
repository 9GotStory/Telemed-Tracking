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
