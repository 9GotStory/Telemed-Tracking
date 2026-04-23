export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'LOGIN'
  | 'LOGOUT'
  | 'IMPORT'
  | 'IMPORT_CONFIRM'
  | 'APPROVE'
  | 'REJECT'
  | 'SUSPEND'
  | 'RESET_PASSWORD'
  | 'CHANGE_PASSWORD'
  | 'CONFIRM_ALL'
  | 'EDIT'
  | 'ABSENT'
  | 'SETTING_SAVE'
  | 'TELEGRAM_TEST'
  | 'READINESS_SAVE'
  | 'SET_LINK'
  | 'RECORD_INCIDENT'

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
