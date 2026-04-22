export const DRUG_SOURCES = [
  { value: 'hsc_stock', label: 'คลัง รพ.สต.', description: 'ยาจากคลังของ รพ.สต. เอง' },
  { value: 'hosp_stock', label: 'ยา รพ.', description: 'ยาของ รพ.สอง ที่อยู่ใน batch' },
  { value: 'hosp_pending', label: 'รอส่งจาก รพ.', description: 'ยาที่ รพ. จะส่งมาภายหลัง' },
] as const

export type DrugSourceValue = (typeof DRUG_SOURCES)[number]['value']

// Also export as DrugSource for backward compatibility with visit.ts
export type DrugSource = DrugSourceValue
