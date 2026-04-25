export type OverallStatus = 'ready' | 'not_ready' | 'need_fix'

export interface ReadinessLog {
  log_id: string
  hosp_code: string
  check_date: string
  cam_ok: 'Y' | 'N'
  mic_ok: 'Y' | 'N'
  pc_ok: 'Y' | 'N'
  internet_ok: 'Y' | 'N'
  software_ok: 'Y' | 'N'
  overall_status: OverallStatus
  note: string
  checked_by: string
  checked_at: string
}

export interface ReadinessLogWithHospName extends ReadinessLog {
  hosp_name: string
}

export const READINESS_STATUS_VARIANT: Record<OverallStatus, 'active' | 'pending' | 'inactive'> = {
  ready: 'active',
  need_fix: 'pending',
  not_ready: 'inactive',
}

export const READINESS_STATUS_LABEL: Record<OverallStatus, string> = {
  ready: 'พร้อม',
  need_fix: 'ต้องแก้ไข',
  not_ready: 'ไม่พร้อม',
}
