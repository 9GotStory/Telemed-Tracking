import { z } from 'zod'
import { gasGet, gasPost } from '@/services/api'
import type { EquipmentWithHospName } from '@/types/equipment'
import type { EquipStatus } from '@/types/equipment'

// ---------------------------------------------------------------------------
// Zod Schemas (T048)
// ---------------------------------------------------------------------------

export const equipmentSchema = z.object({
  equip_id: z.string().optional(), // empty = new, present = update
  hosp_code: z.string().min(1, 'กรุณาเลือกสถานพยาบาล'),
  set_type: z.enum(['A', 'B'], { required_error: 'กรุณาเลือกชุดอุปกรณ์' }),
  device_type: z.enum(['computer', 'notebook', 'camera', 'mic'], {
    required_error: 'กรุณาเลือกประเภทอุปกรณ์',
  }),
  os: z.string().optional().default(''),
  status: z.enum(['ready', 'maintenance', 'broken'], {
    required_error: 'กรุณาเลือกสถานะ',
  }),
  is_backup: z.enum(['Y', 'N']).default('N'),
  software: z.string().optional().default(''),
  internet_mbps: z.coerce.number().min(0).nullable().optional(),
  responsible_person: z.string().min(1, 'กรุณาระบุผู้รับผิดชอบ'),
  responsible_tel: z.string().optional().default(''),
  note: z.string().optional().default(''),
})

export type EquipmentFormValues = z.infer<typeof equipmentSchema>

// Response schemas
const equipmentItemSchema = z.object({
  equip_id: z.string(),
  hosp_code: z.string(),
  set_type: z.enum(['A', 'B']),
  device_type: z.enum(['computer', 'notebook', 'camera', 'mic']),
  os: z.string(),
  status: z.enum(['ready', 'maintenance', 'broken', 'inactive']),
  is_backup: z.enum(['Y', 'N']),
  software: z.string(),
  internet_mbps: z.union([z.number(), z.null()]),
  responsible_person: z.string(),
  responsible_tel: z.string(),
  note: z.string(),
  updated_at: z.string(),
  updated_by: z.string(),
  hosp_name: z.string(),
})

const equipmentListSchema = z.array(equipmentItemSchema)

const equipmentSaveResponseSchema = z.object({
  equip_id: z.string(),
})

const equipmentDeleteResponseSchema = z.object({
  message: z.string(),
})

// ---------------------------------------------------------------------------
// Filters
// ---------------------------------------------------------------------------

export interface EquipmentFilters {
  hosp_code?: string
  status?: EquipStatus
}

// ---------------------------------------------------------------------------
// GAS Actions (T049)
// ---------------------------------------------------------------------------

export const equipmentService = {
  /** List equipment — GET, filtered by role */
  async list(filters: EquipmentFilters = {}): Promise<EquipmentWithHospName[]> {
    const params: Record<string, string> = {}
    if (filters.hosp_code) params.hosp_code = filters.hosp_code
    if (filters.status) params.status = filters.status
    const raw = await gasGet<unknown>('equipment.list', params)
    return equipmentListSchema.parse(raw) as EquipmentWithHospName[]
  },

  /** Save (create or update) equipment — POST */
  async save(data: EquipmentFormValues): Promise<{ equip_id: string }> {
    const raw = await gasPost<unknown>('equipment.save', data)
    return equipmentSaveResponseSchema.parse(raw)
  },

  /** Soft-delete equipment (set status=inactive) — POST */
  async delete(equipId: string): Promise<{ message: string }> {
    const raw = await gasPost<unknown>('equipment.delete', { equip_id: equipId })
    return equipmentDeleteResponseSchema.parse(raw)
  },
}
