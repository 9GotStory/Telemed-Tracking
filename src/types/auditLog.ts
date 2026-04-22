export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'IMPORT' | 'APPROVE'

export interface AuditLog {
  log_id: string
  user_id: string
  action: AuditAction
  module: string
  target_id: string
  old_value: string
  new_value: string
  created_at: string
}
