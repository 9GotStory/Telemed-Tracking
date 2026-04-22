import { z } from 'zod'
import { gasGet, gasPost } from '@/services/api'
import type { MasterDrug } from '@/types/drug'

// ---------------------------------------------------------------------------
// Zod Schemas (T055)
// ---------------------------------------------------------------------------

export const drugSchema = z.object({
  drug_id: z.string().optional(), // empty = new, present = update
  drug_name: z.string().min(1, 'กรุณาระบุชื่อยา'),
  strength: z.string().min(1, 'กรุณาระบุความแรง'),
  unit: z.string().min(1, 'กรุณาระบุหน่วย'),
})

export type DrugFormValues = z.infer<typeof drugSchema>

// Response schemas
const drugItemSchema = z.object({
  drug_id: z.string(),
  drug_name: z.string(),
  strength: z.string(),
  unit: z.string(),
  active: z.enum(['Y', 'N']),
})

const drugListSchema = z.array(drugItemSchema)

const drugSaveResponseSchema = z.object({
  drug_id: z.string(),
})

const drugDeleteResponseSchema = z.object({
  message: z.string(),
})

const drugImportResponseSchema = z.object({
  imported: z.number(),
  skipped: z.number(),
  errors: z.array(z.string()),
})

// ---------------------------------------------------------------------------
// Filters
// ---------------------------------------------------------------------------

export interface DrugFilters {
  active?: 'Y' | 'N'
  search?: string
}

// ---------------------------------------------------------------------------
// GAS Actions (T056)
// ---------------------------------------------------------------------------

export const drugService = {
  /** List drugs — GET, with optional active/search filters */
  async list(filters: DrugFilters = {}): Promise<MasterDrug[]> {
    const params: Record<string, string> = {}
    if (filters.active) params.active = filters.active
    if (filters.search) params.search = filters.search
    const raw = await gasGet<unknown>('masterDrug.list', params)
    return drugListSchema.parse(raw)
  },

  /** Save (create or update) drug — POST */
  async save(data: DrugFormValues): Promise<{ drug_id: string }> {
    const raw = await gasPost<unknown>('masterDrug.save', data)
    return drugSaveResponseSchema.parse(raw)
  },

  /** Soft-delete drug (set active=N) — POST */
  async delete(drugId: string): Promise<{ message: string }> {
    const raw = await gasPost<unknown>('masterDrug.delete', { drug_id: drugId })
    return drugDeleteResponseSchema.parse(raw)
  },

  /** Import batch of drugs — POST */
  async importDrugs(drugs: Array<{ drug_name: string; strength: string; unit: string; active: 'Y' | 'N' }>): Promise<{
    imported: number
    skipped: number
    errors: string[]
  }> {
    const raw = await gasPost<unknown>('masterDrug.import', { drugs })
    return drugImportResponseSchema.parse(raw)
  },
}
