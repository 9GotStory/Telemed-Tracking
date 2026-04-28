import { z } from 'zod'
import { gasPost } from '@/services/api'
import type { LoginResponse, RegisterResponse } from '@/types/api'

// ---------------------------------------------------------------------------
// Zod Schemas (T041)
// ---------------------------------------------------------------------------

/** Reserved usernames that cannot be used */
const RESERVED_USERNAMES = new Set([
  'admin', 'root', 'system', 'moderator', 'superadmin',
  'administrator', 'support', 'help', 'test', 'guest',
  'null', 'undefined', 'delete', 'remove', 'reset',
])

export const loginSchema = z.object({
  username: z
    .string()
    .min(1, 'กรุณากรอกชื่อผู้ใช้'),
  password: z
    .string()
    .min(1, 'กรุณากรอกรหัสผ่าน'),
})

export const usernameSchema = z
  .string()
  .min(4, 'ชื่อผู้ใช้ต้องมีอย่างน้อย 4 ตัวอักษร')
  .max(20, 'ชื่อผู้ใช้ต้องไม่เกิน 20 ตัวอักษร')
  .regex(/^[a-z0-9_]+$/, 'ชื่อผู้ใช้ใช้ได้เฉพาะ a-z, 0-9 และ _')
  .refine((val) => !RESERVED_USERNAMES.has(val), {
    message: 'ชื่อผู้ใช้นี้ไม่อนุญาตให้ใช้งาน',
  })

export const registerSchema = z.object({
  username: usernameSchema,
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

export const passwordChangeSchema = z.object({
  current_password: z
    .string()
    .min(1, 'กรุณากรอกรหัสผ่านปัจจุบัน'),
  new_password: z
    .string()
    .min(8, 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร'),
  confirm_password: z
    .string()
    .min(8, 'กรุณายืนยันรหัสผ่าน'),
}).refine((d) => d.new_password === d.confirm_password, {
  message: 'รหัสผ่านไม่ตรงกัน',
  path: ['confirm_password'],
}).refine((d) => d.new_password !== d.current_password, {
  message: 'รหัสผ่านใหม่ต้องไม่เหมือนรหัสผ่านปัจจุบัน',
  path: ['new_password'],
})

export type LoginFormValues = z.infer<typeof loginSchema>
export type RegisterFormValues = z.infer<typeof registerSchema>
export type PasswordChangeValues = z.infer<typeof passwordChangeSchema>

// ---------------------------------------------------------------------------
// Zod response schemas — validate GAS responses before consumption
// ---------------------------------------------------------------------------

const loginResponseSchema = z.object({
  token: z.string(),
  user_id: z.string(),
  username: z.string(),
  hosp_code: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  role: z.enum(['super_admin', 'admin_hosp', 'staff_hosp', 'staff_hsc']),
  hosp_name: z.string(),
  force_change: z.boolean().optional().default(false),
})

const registerResponseSchema = z.object({
  message: z.string(),
  auto_approved: z.boolean().optional().default(false),
})

const messageResponseSchema = z.object({
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

  /** Change own password — POST */
  async changePassword(data: { current_password: string; new_password: string }): Promise<{ message: string }> {
    const raw = await gasPost<unknown>('auth.changePassword', data)
    return messageResponseSchema.parse(raw)
  },
}
