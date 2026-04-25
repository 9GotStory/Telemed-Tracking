import { z } from 'zod'
import { gasPost } from '@/services/api'

// ---------------------------------------------------------------------------
// Zod Schemas (T078)
// ---------------------------------------------------------------------------

/** A single drug row parsed from the Excel upload */
const visitDrugSchema = z.object({
  drug_name: z.string().min(1),
  strength: z.string(),
  qty: z.coerce.number().min(0),
  unit: z.string(),
  sig: z.string(),
})

/** A single visit (one VN) with its drug list */
const visitRowSchema = z.object({
  vn: z.string().regex(/^\d{12}$/, 'VN ต้องเป็นตัวเลข 12 หลัก (YYMMDDHHmmSS)'),
  hn: z.string().regex(/^\d{6}$/, 'HN ต้องเป็นตัวเลข 6 หลัก'),
  patient_name: z.string().min(1),
  dob: z.string(),
  tel: z.string(),
  drugs: z.array(visitDrugSchema).min(1, 'ต้องมียาอย่างน้อย 1 รายการ'),
})

// ---------------------------------------------------------------------------
// Request / Response types
// ---------------------------------------------------------------------------

export interface ImportPreviewRequest {
  round: 1 | 2
  hosp_code: string
  service_date: string
  clinic_type: string
  visits: z.infer<typeof visitRowSchema>[]
}

export interface ImportConfirmRequest {
  round: 1 | 2
  hosp_code: string
  service_date: string
  clinic_type: string
  visits: z.infer<typeof visitRowSchema>[]
}

const previewValidSchema = z.object({
  vn: z.string(),
  patient_name: z.string(),
  drug_count: z.number(),
})

const previewErrorSchema = z.object({
  vn: z.string(),
  error: z.string(),
})

const previewSummarySchema = z.object({
  total_rows: z.number(),
  unique_vns: z.number(),
  valid_vns: z.number(),
  error_vns: z.number(),
})

export const importPreviewResponseSchema = z.object({
  valid: z.array(previewValidSchema),
  errors: z.array(previewErrorSchema),
  unknown_drugs: z.array(z.string()),
  summary: previewSummarySchema,
})

export type ImportPreviewResponse = z.infer<typeof importPreviewResponseSchema>

const importConfirmResponseSchema = z.object({
  imported_visits: z.number(),
  imported_meds: z.number(),
  import_round1_at: z.string().nullable().optional(),
})

export type ImportConfirmResponse = z.infer<typeof importConfirmResponseSchema>

// ---------------------------------------------------------------------------
// GAS Actions (T079)
// ---------------------------------------------------------------------------

export const importService = {
  /** Preview import — validates VN uniqueness + drug_name existence */
  async preview(data: ImportPreviewRequest): Promise<ImportPreviewResponse> {
    const raw = await gasPost<unknown>('import.preview', data)
    return importPreviewResponseSchema.parse(raw)
  },

  /** Confirm import — inserts VISIT_SUMMARY + VISIT_MEDS with defaults */
  async confirm(data: ImportConfirmRequest): Promise<ImportConfirmResponse> {
    const raw = await gasPost<unknown>('import.confirm', data)
    return importConfirmResponseSchema.parse(raw)
  },
}
