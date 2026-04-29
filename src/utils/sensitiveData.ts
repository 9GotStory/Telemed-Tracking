/**
 * Shared sensitivity masking for display.
 * Used by SettingsPage (user dump table) and AuditLogTable (old_value/new_value).
 */

const SENSITIVE_KEYS = ['password', 'password_hash', 'password_salt', 'token', 'session_token', 'bot_token']

function isSensitiveKey(key: string): boolean {
  return SENSITIVE_KEYS.some((s) => key.toLowerCase().includes(s))
}

/** Mask a single key-value pair for table display */
export function maskField(key: string, val: string): string {
  if (!isSensitiveKey(key) || !val) return val
  if (key === 'session_token') return val.substring(0, 8) + '...'
  return '***'
}

/** Mask sensitive values inside a JSON-like audit log string */
export function maskAuditValue(value: string): string {
  try {
    const parsed = JSON.parse(value)
    if (Array.isArray(parsed)) return value
    if (typeof parsed === 'object' && parsed !== null) {
      const masked = { ...parsed }
      for (const key of Object.keys(masked)) {
        if (isSensitiveKey(key)) {
          masked[key] = masked[key] ? '***' : ''
        }
      }
      return JSON.stringify(masked)
    }
  } catch {
    // Not JSON — fall through to plain string check
  }
  if (/^[A-Za-z0-9-_]{20,}$/.test(value)) {
    return value.substring(0, 8) + '...'
  }
  return value
}
