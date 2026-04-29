import { z } from 'zod'
import { gasGet } from '@/services/api'

const auditLogItemSchema = z.object({
  log_id: z.string(),
  user_id: z.string(),
  action: z.string(),
  module: z.string(),
  target_id: z.string().nullable().default(''),
  old_value: z.string().nullable().default(''),
  new_value: z.string().nullable().default(''),
  created_at: z.string(),
})

const auditLogListSchema = z.array(auditLogItemSchema)

export type AuditLogItem = z.infer<typeof auditLogItemSchema>

export const auditLogService = {
  async list(limit = 100): Promise<AuditLogItem[]> {
    const raw = await gasGet<unknown>('auditLog.list', { limit: String(limit) })
    return auditLogListSchema.parse(raw)
  },
}
