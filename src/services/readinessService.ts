import { z } from 'zod'
import { gasGet, gasPost } from '@/services/api'
import type { ReadinessLogWithHospName } from '@/types/readiness'

// ---------------------------------------------------------------------------
// Zod Schemas (T071)
// ---------------------------------------------------------------------------

export const readinessSchema = z.object({
  log_id: z.string().optional(), // present on update, empty on create
  hosp_code: z.string().min(1, 'กรุณาเลือกสถานพยาบาล'),
  check_date: z.string().min(1, 'กรุณาเลือกวันที่ตรวจสอบ'),
  cam_ok: z.enum(['Y', 'N']),
  mic_ok: z.enum(['Y', 'N']),
  pc_ok: z.enum(['Y', 'N']),
  internet_ok: z.enum(['Y', 'N']),
  software_ok: z.enum(['Y', 'N']),
  note: z.string().optional().default(''),
})

export type ReadinessFormValues = z.infer<typeof readinessSchema>

// Response schemas
const readinessItemSchema = z.object({
  log_id: z.string(),
  hosp_code: z.string(),
  hosp_name: z.string(),
  check_date: z.string(),
  cam_ok: z.enum(['Y', 'N']),
  mic_ok: z.enum(['Y', 'N']),
  pc_ok: z.enum(['Y', 'N']),
  internet_ok: z.enum(['Y', 'N']),
  software_ok: z.enum(['Y', 'N']),
  overall_status: z.enum(['ready', 'not_ready', 'need_fix']),
  note: z.string(),
  checked_by: z.string(),
  checked_at: z.string(),
})

const readinessListSchema = z.array(readinessItemSchema)

const readinessSaveResponseSchema = z.object({
  log_id: z.string(),
})

// ---------------------------------------------------------------------------
// Filters
// ---------------------------------------------------------------------------

export interface ReadinessFilters {
  hosp_code?: string
  check_date?: string // YYYY-MM-DD
}

// ---------------------------------------------------------------------------
// GAS Actions (T072)
// ---------------------------------------------------------------------------

export const readinessService = {
  /** List readiness logs — GET, filtered by hosp_code and/or check_date */
  async list(filters: ReadinessFilters = {}): Promise<ReadinessLogWithHospName[]> {
    const params: Record<string, string> = {}
    if (filters.hosp_code) params.hosp_code = filters.hosp_code
    if (filters.check_date) params.check_date = filters.check_date
    const raw = await gasGet<unknown>('readiness.list', params)
    return readinessListSchema.parse(raw) as ReadinessLogWithHospName[]
  },

  /** Save readiness check (upsert by hosp_code + check_date) — POST */
  async save(data: ReadinessFormValues): Promise<{ log_id: string }> {
    const raw = await gasPost<unknown>('readiness.save', data)
    return readinessSaveResponseSchema.parse(raw)
  },
}
