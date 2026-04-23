import type { ClinicType } from '@/constants/clinicTypes'

export interface ClinicSchedule {
  schedule_id: string
  service_date: string
  hosp_code: string
  clinic_type: ClinicType
  service_time: string
  appoint_count: number
  telemed_link: string
  link_added_by: string | null
  incident_note: string
  updated_at: string
}

export interface ClinicScheduleWithActual extends ClinicSchedule {
  actual_count: number // computed by GAS from VISIT_SUMMARY
  hosp_name: string
}
