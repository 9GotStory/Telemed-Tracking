/** Common Thai drug units for dropdown selection */
export const DRUG_UNITS = [
  { value: 'เม็ด', label: 'เม็ด' },
  { value: 'แคปซูล', label: 'แคปซูล' },
  { value: 'มิลลิลิตร', label: 'มิลลิลิตร (ml)' },
  { value: 'ช้อนชา', label: 'ช้อนชา' },
  { value: 'ช้อนโต๊ะ', label: 'ช้อนโต๊ะ' },
  { value: 'ซอง', label: 'ซอง' },
  { value: 'ขวด', label: 'ขวด' },
  { value: 'หลอด', label: 'หลอด' },
  { value: 'แผ่น', label: 'แผ่น' },
  { value: 'มิลลิกรัม', label: 'มิลลิกรัม (mg)' },
  { value: 'กรัม', label: 'กรัม (g)' },
  { value: 'ชิ้น', label: 'ชิ้น' },
  { value: 'ขวดยาหยอด', label: 'ขวดยาหยอด' },
  { value: 'ขวดยาพ่น', label: 'ขวดยาพ่น' },
  { value: 'ห่อ', label: 'ห่อ' },
  { value: 'ครั้ง', label: 'ครั้ง' },
] as const

export type DrugUnitValue = typeof DRUG_UNITS[number]['value']
