export type EquipSetType = 'A' | 'B'
export type EquipDeviceType = 'computer' | 'notebook' | 'camera' | 'mic'
export type EquipStatus = 'ready' | 'maintenance' | 'broken' | 'inactive'

export interface Equipment {
  equip_id: string
  hosp_code: string
  set_type: EquipSetType
  device_type: EquipDeviceType
  os: string
  status: EquipStatus
  is_backup: 'Y' | 'N'
  software: string
  internet_mbps: number | null
  responsible_person: string
  responsible_tel: string
  note: string
  updated_at: string
  updated_by: string
}

export interface EquipmentWithHospName extends Equipment {
  hosp_name: string
}
