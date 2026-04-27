import { z } from 'zod'
import { gasGet, gasPost } from '@/services/api'
import type { ClinicScheduleWithActual } from '@/types/schedule'
import type { ClinicType } from '@/constants/clinicTypes'

// ---------------------------------------------------------------------------
// Zod Schemas (T063)
// ---------------------------------------------------------------------------

export const scheduleSchema = z.object({
  schedule_id: z.string().optional(), // empty = new, present = update
  service_date: z.string().min(1, 'กรุณาเลือกวันที่'),
  hosp_code: z.string().min(1, 'กรุณาเลือกสถานพยาบาล'),
  clinic_type: z.string().min(1, 'กรุณาเลือกประเภทคลินิก'),
  service_time: z.string().min(1, 'กรุณาระบุเวลา'),
  appoint_count: z.coerce.number().min(0, 'จำนวนไม่ถูกต้อง'),
  drug_delivery_date: z.string().optional(),
})

export type ScheduleFormValues = z.infer<typeof scheduleSchema>

// Response schemas
const scheduleItemSchema = z.object({
  schedule_id: z.string(),
  service_date: z.string(),
  hosp_code: z.string(),
  hosp_name: z.string(),
  clinic_type: z.string(),
  service_time: z.string(),
  appoint_count: z.number(),
  telemed_link: z.string(),
  link_added_by: z.string().nullable(),
  incident_note: z.string(),
  updated_at: z.string(),
  drug_delivery_date: z.string().default(''),
  actual_count: z.number(),
})

const scheduleListSchema = z.array(scheduleItemSchema)

const scheduleSaveResponseSchema = z.object({
  schedule_id: z.string(),
})

const messageResponseSchema = z.object({
  message: z.string(),
})

// ---------------------------------------------------------------------------
// Filters
// ---------------------------------------------------------------------------

export interface ScheduleFilters {
  month?: string   // YYYY-MM
  hosp_code?: string
  clinic_type?: ClinicType
}

// ---------------------------------------------------------------------------
// GAS Actions (T064)
// ---------------------------------------------------------------------------

export const scheduleService = {
  /** List schedules — GET, filtered by month/hosp_code/clinic_type, actual_count computed by GAS */
  async list(filters: ScheduleFilters = {}): Promise<ClinicScheduleWithActual[]> {
    const params: Record<string, string> = {}
    if (filters.month) params.month = filters.month
    if (filters.hosp_code) params.hosp_code = filters.hosp_code
    if (filters.clinic_type) params.clinic_type = filters.clinic_type
    const raw = await gasGet<unknown>('schedule.list', params)
    return scheduleListSchema.parse(raw) as ClinicScheduleWithActual[]
  },

  /** Save (create or update) schedule — POST */
  async save(data: ScheduleFormValues): Promise<{ schedule_id: string }> {
    const raw = await gasPost<unknown>('schedule.save', data)
    return scheduleSaveResponseSchema.parse(raw)
  },

  /** Set telemed link for a schedule — POST */
  async setLink(scheduleId: string, telemedLink: string): Promise<{ message: string }> {
    const raw = await gasPost<unknown>('schedule.setLink', { schedule_id: scheduleId, telemed_link: telemedLink })
    return messageResponseSchema.parse(raw)
  },

  /** Record incident note for a schedule — POST */
  async recordIncident(scheduleId: string, incidentNote: string): Promise<{ message: string }> {
    const raw = await gasPost<unknown>('schedule.recordIncident', { schedule_id: scheduleId, incident_note: incidentNote })
    return messageResponseSchema.parse(raw)
  },
}
