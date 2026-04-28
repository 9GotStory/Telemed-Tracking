import { z } from 'zod'
import { gasGet, gasPost } from '@/services/api'

// ---------------------------------------------------------------------------
// Zod Schemas (T112)
// ---------------------------------------------------------------------------

const userItemSchema = z.object({
  user_id: z.string(),
  username: z.string(),
  hosp_code: z.string(),
  hosp_name: z.string().optional().default(''),
  first_name: z.string(),
  last_name: z.string(),
  tel: z.string(),
  role: z.string(),
  status: z.string(),
  created_at: z.string(),
})

const userListSchema = z.array(userItemSchema)

const messageResponseSchema = z.object({
  message: z.string(),
})

const passwordResetResponseSchema = z.object({
  message: z.string(),
  temp_password: z.string().optional(),
})

// Approve form schema
export const userApproveSchema = z.object({
  user_id: z.string().min(1, 'กรุณาระบุ user_id'),
  role: z.string().min(1, 'กรุณาเลือกบทบาท'),
})

// Update form schema
export const userUpdateSchema = z.object({
  user_id: z.string().min(1, 'กรุณาระบุ user_id'),
  role: z.string().optional(),
  status: z.string().optional(),
})

// Password reset schema — new_password optional; GAS generates if omitted
export const passwordResetSchema = z.object({
  user_id: z.string().min(1, 'กรุณาระบุ user_id'),
  new_password: z.string().min(8, 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร').optional(),
})

// ---------------------------------------------------------------------------
// Exported Types
// ---------------------------------------------------------------------------

export type UserItem = z.infer<typeof userItemSchema>
export type UserApproveValues = z.infer<typeof userApproveSchema>
export type UserUpdateValues = z.infer<typeof userUpdateSchema>
export type PasswordResetValues = z.infer<typeof passwordResetSchema>

// ---------------------------------------------------------------------------
// Filters
// ---------------------------------------------------------------------------

export interface UserFilters {
  status?: string
  role?: string
  hosp_code?: string
}

// ---------------------------------------------------------------------------
// GAS Actions (T113)
// ---------------------------------------------------------------------------

export const usersService = {
  /** List users — filtered by role permissions on GAS side */
  async list(filters: UserFilters = {}): Promise<UserItem[]> {
    const params: Record<string, string> = {}
    if (filters.status) params.status = filters.status
    if (filters.role) params.role = filters.role
    if (filters.hosp_code) params.hosp_code = filters.hosp_code
    const raw = await gasGet<unknown>('users.list', params)
    return userListSchema.parse(raw)
  },

  /** Approve a pending user with assigned role */
  async approve(data: UserApproveValues): Promise<{ message: string }> {
    const raw = await gasPost<unknown>('users.approve', data)
    return messageResponseSchema.parse(raw)
  },

  /** Update user role or status */
  async update(data: UserUpdateValues): Promise<{ message: string }> {
    const raw = await gasPost<unknown>('users.update', data)
    return messageResponseSchema.parse(raw)
  },

  /** Reset user password — returns temp password for admin to communicate */
  async resetPassword(data: PasswordResetValues): Promise<{ message: string; temp_password?: string }> {
    const raw = await gasPost<unknown>('users.resetPassword', data)
    return passwordResetResponseSchema.parse(raw)
  },
}
