import { z } from 'zod'
import { gasPost } from '@/services/api'

// ---------------------------------------------------------------------------
// Zod Schemas
// ---------------------------------------------------------------------------

const appointmentSchema = z.object({
  hn: z.string().regex(/^\d{6}$/, 'HN ต้องเป็นตัวเลข 6 หลัก'),
  patient_name: z.string().min(1, 'กรุณาระบุชื่อ-สกุล'),
  clinic_types: z.array(z.string().min(1)).min(1, 'ต้องเลือกอย่างน้อย 1 คลินิก'),
})

export const appointmentRegisterSchema = z.object({
  hosp_code: z.string().min(1, 'กรุณาเลือก รพ.สต.'),
  service_date: z.string().min(1, 'กรุณาเลือกวันที่'),
  appointments: z.array(appointmentSchema).min(1, 'ต้องมีรายการอย่างน้อย 1 รายการ'),
})

export type AppointmentRegisterRequest = z.infer<typeof appointmentRegisterSchema>

// ---------------------------------------------------------------------------
// Response types
// ---------------------------------------------------------------------------

const appointmentRegisterResponseSchema = z.object({
  registered: z.number(),
  duplicates: z.array(z.string()),
  errors: z.array(z.object({
    hn: z.string(),
    error: z.string(),
  })),
})

export type AppointmentRegisterResponse = z.infer<typeof appointmentRegisterResponseSchema>

// ---------------------------------------------------------------------------
// GAS Actions
// ---------------------------------------------------------------------------

export const appointmentService = {
  /** Register pre-appointment patients (Phase 1 before HosXP import) */
  async register(data: AppointmentRegisterRequest): Promise<AppointmentRegisterResponse> {
    const raw = await gasPost<unknown>('appointment.register', data)
    return appointmentRegisterResponseSchema.parse(raw)
  },
}
