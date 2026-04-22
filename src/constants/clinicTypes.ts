export const CLINIC_TYPES = [
  { value: 'PCU-DM', label: 'PCU-DM (เบาหวาน)' },
  { value: 'PCU-HT', label: 'PCU-HT (ความดัน)' },
  { value: 'ANC-nutrition', label: 'ANC-nutrition (ครรภ์-โภชนาการ)' },
  { value: 'ANC-parent', label: 'ANC-parent (ครรภ์-ผู้ปกครอง)' },
  { value: 'postpartum-EPI', label: 'postpartum-EPI (หลังคลอด-ภูมิคุ้มกัน)' },
  { value: 'postpartum-dev', label: 'postpartum-dev (หลังคลอด-พัฒนาการ)' },
] as const

export type ClinicTypeValue = (typeof CLINIC_TYPES)[number]['value']

// Also export as ClinicType for backward compatibility with visit.ts
export type ClinicType = ClinicTypeValue
