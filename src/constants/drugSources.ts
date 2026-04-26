/** Sources shown for existing (imported) drugs — always hosp_stock */
export const DRUG_SOURCES_EXISTING = [
  { value: 'hosp_stock', label: 'ยา รพ.', description: 'ยาของ รพ.สอง ที่อยู่ใน batch' },
] as const

/** Sources shown for manually added drugs */
export const DRUG_SOURCES_NEW = [
  { value: 'hosp_stock', label: 'ยา รพ.', description: 'ยาของ รพ.สอง ที่อยู่ใน batch' },
  { value: 'hosp_pending', label: 'รอส่งจาก รพ.', description: 'ยาที่ รพ. จะส่งมาภายหลัง' },
] as const

/** @deprecated Use DRUG_SOURCES_EXISTING or DRUG_SOURCES_NEW instead */
export const DRUG_SOURCES = DRUG_SOURCES_NEW

export type DrugSourceValue = 'hosp_stock' | 'hosp_pending'
export type DrugSource = DrugSourceValue
