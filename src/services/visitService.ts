import { z } from 'zod'
import { gasGet, gasPost } from '@/services/api'

// ---------------------------------------------------------------------------
// Zod Schemas (T086)
// ---------------------------------------------------------------------------

/** VisitSummary row from GAS — includes tel for contact verification (Module 5+6) */
const visitSummaryItemSchema = z.object({
  vn: z.string(),
  patient_name: z.string(),
  tel: z.string().default(''),
  clinic_type: z.string(),
  hosp_code: z.string(),
  hosp_name: z.string(),
  service_date: z.string(),
  attended: z.string(),
  has_drug_change: z.string(),
  drug_source_pending: z.string(),
  dispensing_confirmed: z.string(),
  diff_status: z.string(),
  drug_sent_date: z.string(),
  drug_received_date: z.string(),
  drug_delivered_date: z.string(),
})

const visitSummaryListSchema = z.array(visitSummaryItemSchema)

/** Single VisitMed row */
const visitMedItemSchema = z.object({
  med_id: z.string(),
  vn: z.string(),
  drug_name: z.string(),
  strength: z.string(),
  qty: z.number(),
  unit: z.string(),
  sig: z.string(),
  source: z.string(),
  is_changed: z.string(),
  round: z.number(),
  status: z.string(),
  note: z.string(),
  updated_by: z.string(),
  updated_at: z.string(),
})

const visitMedListSchema = z.array(visitMedItemSchema)

const messageResponseSchema = z.object({
  message: z.string(),
})

// ---------------------------------------------------------------------------
// Exported Types
// ---------------------------------------------------------------------------

export type VisitSummaryItem = z.infer<typeof visitSummaryItemSchema>
export type VisitMedItem = z.infer<typeof visitMedItemSchema>

// ---------------------------------------------------------------------------
// Filters
// ---------------------------------------------------------------------------

export interface VisitSummaryFilters {
  service_date?: string
  hosp_code?: string
}

// ---------------------------------------------------------------------------
// visitMeds.save request shapes
// ---------------------------------------------------------------------------

export interface MedSaveItem {
  med_id: string
  drug_name: string
  strength: string
  qty: number
  unit: string
  sig: string
  source: string
  note: string
  status?: string
}

export type MedActionType = 'confirm_all' | 'edit' | 'absent' | 'undo_absent' | 'undo_confirm'

export interface BatchConfirmPayload {
  action: 'confirm' | 'absent'
  vns: string[]
}

export type DeliveryField = 'drug_sent_date' | 'drug_received_date' | 'drug_delivered_date'

export interface UpdateTelPayload {
  vn: string
  tel: string
}

export interface TrackDeliveryPayload {
  vn: string
  field: DeliveryField
  date: string
}

export interface VisitMedsSavePayload {
  vn: string
  action_type: MedActionType
  meds: MedSaveItem[]
}

// ---------------------------------------------------------------------------
// GAS Actions (T086 + T087)
// ---------------------------------------------------------------------------

export const visitService = {
  /** List visit summaries — includes tel for contact verification, role-filtered by GAS */
  async listSummary(filters: VisitSummaryFilters = {}): Promise<VisitSummaryItem[]> {
    const params: Record<string, string> = {}
    if (filters.service_date) params.service_date = filters.service_date
    if (filters.hosp_code) params.hosp_code = filters.hosp_code
    const raw = await gasGet<unknown>('visitSummary.list', params)
    return visitSummaryListSchema.parse(raw)
  },

  /** List meds for a specific VN */
  async listMeds(vn: string): Promise<VisitMedItem[]> {
    const raw = await gasGet<unknown>('visitMeds.list', { vn })
    return visitMedListSchema.parse(raw)
  },

  /** Save meds — handles confirm_all, edit, and absent action types */
  async saveMeds(payload: VisitMedsSavePayload): Promise<{ message: string }> {
    const raw = await gasPost<unknown>('visitMeds.save', payload)
    return messageResponseSchema.parse(raw)
  },

  /** Batch confirm or absent multiple VNs at once */
  async batchConfirm(payload: BatchConfirmPayload): Promise<{ message: string; updated: number }> {
    const raw = await gasPost<unknown>('visitMeds.batchConfirm', payload)
    return z.object({ message: z.string(), updated: z.number() }).parse(raw)
  },

  /** Update patient phone number */
  async updateTel(payload: UpdateTelPayload): Promise<{ message: string; vn: string; tel: string }> {
    const raw = await gasPost<unknown>('visitSummary.updateTel', payload)
    return z.object({ message: z.string(), vn: z.string(), tel: z.string() }).parse(raw)
  },

  /** Track drug delivery — update delivery date fields */
  async trackDelivery(payload: TrackDeliveryPayload): Promise<{ message: string; vn: string; field: string; date: string }> {
    const raw = await gasPost<unknown>('visitMeds.trackDelivery', payload)
    return z.object({ message: z.string(), vn: z.string(), field: z.string(), date: z.string() }).parse(raw)
  },
}
