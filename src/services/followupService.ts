import { z } from 'zod'
import { gasGet, gasPost } from '@/services/api'

// ---------------------------------------------------------------------------
// Zod Schemas (T094)
// ---------------------------------------------------------------------------

/** A single followup record */
const followupRecordSchema = z.object({
  followup_id: z.string(),
  followup_date: z.string(),
  general_condition: z.string(),
  side_effect: z.string(),
  drug_adherence: z.string(),
  other_note: z.string(),
  recorded_by: z.string(),
  recorded_by_name: z.string().default(''),
  recorded_at: z.string(),
})

/** A single med item included in followup list response */
const followupMedSchema = z.object({
  med_id: z.string(),
  drug_name: z.string(),
  strength: z.string(),
  qty: z.number(),
  unit: z.string(),
  sig: z.string(),
  source: z.string(),
  is_changed: z.string(),
  status: z.string(),
})

/** A visit with followup data — includes sensitive fields (tel, hn) */
const followupItemSchema = z.object({
  vn: z.string(),
  patient_name: z.string(),
  dob: z.string().default(''),
  tel: z.string(),
  hn: z.string(),
  hosp_code: z.string(),
  hosp_name: z.string(),
  clinic_type: z.string(),
  service_date: z.string(),
  has_drug_change: z.string(),
  drug_source_pending: z.string(),
  dispensing_confirmed: z.string(),
  followup_status: z.enum(['pending', 'followed']),
  followup_records: z.array(followupRecordSchema),
  meds: z.array(followupMedSchema),
  drug_sent_date: z.string(),
  drug_received_date: z.string(),
  drug_delivered_date: z.string(),
})

const followupListSchema = z.array(followupItemSchema)

const followupSaveResponseSchema = z.object({
  followup_id: z.string(),
})

const followupDeleteResponseSchema = z.object({
  success: z.boolean(),
})

// Save form schema
export const followupSchema = z.object({
  vn: z.string().min(1, 'กรุณาระบุ VN'),
  followup_date: z.string().min(1, 'กรุณาเลือกวันที่'),
  general_condition: z.string(),
  side_effect: z.string(),
  drug_adherence: z.string(),
  other_note: z.string(),
})

export type FollowupFormValues = z.infer<typeof followupSchema>

// Update form schema (includes followup_id for editing)
const followupUpdateSchema = followupSchema.extend({
  followup_id: z.string().min(1, 'กรุณาระบุ followup_id'),
})

export type FollowupUpdateValues = z.infer<typeof followupUpdateSchema>

// ---------------------------------------------------------------------------
// Exported Types
// ---------------------------------------------------------------------------

export type FollowupItem = z.infer<typeof followupItemSchema>
export type FollowupRecord = z.infer<typeof followupRecordSchema>
export type FollowupMed = z.infer<typeof followupMedSchema>

// ---------------------------------------------------------------------------
// Filters
// ---------------------------------------------------------------------------

export interface FollowupFilters {
  status?: 'pending' | 'followed'
  hosp_code?: string
  service_date?: string
  patient_name?: string
  clinic_type?: string
}

// ---------------------------------------------------------------------------
// GAS Actions (T095)
// ---------------------------------------------------------------------------

export const followupService = {
  /** List visits with followup data — includes tel/hn (Module 6 only) */
  async list(filters: FollowupFilters = {}): Promise<FollowupItem[]> {
    const params: Record<string, string> = {}
    if (filters.status) params.status = filters.status
    if (filters.hosp_code) params.hosp_code = filters.hosp_code
    if (filters.service_date) params.service_date = filters.service_date
    if (filters.patient_name) params.patient_name = filters.patient_name
    if (filters.clinic_type) params.clinic_type = filters.clinic_type
    const raw = await gasGet<unknown>('followup.list', params)
    return followupListSchema.parse(raw)
  },

  /** Save a new followup record for a VN */
  async save(data: FollowupFormValues): Promise<{ followup_id: string }> {
    const raw = await gasPost<unknown>('followup.save', data)
    return followupSaveResponseSchema.parse(raw)
  },

  /** Update an existing followup record */
  async update(data: FollowupUpdateValues): Promise<{ followup_id: string }> {
    const raw = await gasPost<unknown>('followup.update', data)
    return followupSaveResponseSchema.parse(raw)
  },

  /** Delete a followup record */
  async delete(followupId: string): Promise<{ success: boolean }> {
    const raw = await gasPost<unknown>('followup.delete', { followup_id: followupId })
    return followupDeleteResponseSchema.parse(raw)
  },
}
