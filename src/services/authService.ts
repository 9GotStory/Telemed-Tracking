import { z } from 'zod'
import { gasPost } from '@/services/api'
import type { LoginResponse, RegisterResponse } from '@/types/api'

// ---------------------------------------------------------------------------
// Zod Schemas (T041)
// ---------------------------------------------------------------------------

export const loginSchema = z.object({
  hosp_code: z
    .string()
    .regex(/^\d{5}$/, 'รหัสสถานพยาบาลต้องเป็นตัวเลข 5 หลัก'),
  password: z
    .string()
    .min(1, 'กรุณากรอกรหัสผ่าน'),
})

export const registerSchema = z.object({
  hosp_code: z
    .string()
    .regex(/^\d{5}$/, 'รหัสสถานพยาบาลต้องเป็นตัวเลข 5 หลัก'),
  password: z
    .string()
    .min(8, 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร'),
  first_name: z
    .string()
    .min(1, 'กรุณากรอกชื่อ'),
  last_name: z
    .string()
    .min(1, 'กรุณากรอกนามสกุล'),
  tel: z
    .string()
    .regex(/^[0-9]{9,10}$/, 'เบอร์โทรต้องเป็นตัวเลข 9-10 หลัก'),
})

export type LoginFormValues = z.infer<typeof loginSchema>
export type RegisterFormValues = z.infer<typeof registerSchema>

// ---------------------------------------------------------------------------
// Zod response schemas — validate GAS responses before consumption
// ---------------------------------------------------------------------------

const loginResponseSchema = z.object({
  token: z.string(),
  user_id: z.string(),
  hosp_code: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  role: z.enum(['super_admin', 'admin_hosp', 'staff_hosp', 'staff_hsc']),
  hosp_name: z.string(),
})

const registerResponseSchema = z.object({
  message: z.string(),
})

// ---------------------------------------------------------------------------
// GAS Actions (T042)
// ---------------------------------------------------------------------------

export const authService = {
  /** Login — POST, no token required */
  async login(payload: LoginFormValues): Promise<LoginResponse> {
    const raw = await gasPost<unknown>('auth.login', payload)
    return loginResponseSchema.parse(raw)
  },

  /** Register — POST, no token required */
  async register(payload: RegisterFormValues): Promise<RegisterResponse> {
    const raw = await gasPost<unknown>('auth.register', payload)
    return registerResponseSchema.parse(raw)
  },

  /** Logout — POST, token sent in body */
  async logout(): Promise<void> {
    await gasPost('auth.logout')
  },
}
