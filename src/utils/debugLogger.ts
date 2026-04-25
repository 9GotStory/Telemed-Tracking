/**
 * Debug Logger — centralized console logging for development.
 *
 * Toggle via localStorage key 'telemed_debug_enabled' or
 * Settings page (super_admin only).
 *
 * When OFF: every method is a no-op (single localStorage read guard).
 * When ON: color-coded, timestamped console output with grouped data.
 */

const STORAGE_KEY = 'telemed_debug_enabled'

type DebugCategory = 'api' | 'nav' | 'state' | 'user' | 'error'

const CATEGORY_CONFIG: Record<DebugCategory, { prefix: string; color: string }> = {
  api:   { prefix: 'API',   color: '#3B82F6' },
  nav:   { prefix: 'NAV',   color: '#8B5CF6' },
  state: { prefix: 'STATE', color: '#F59E0B' },
  user:  { prefix: 'USER',  color: '#22C55E' },
  error: { prefix: 'ERR',   color: '#EF4444' },
}

function timestamp(): string {
  const d = new Date()
  return (
    d.toTimeString().slice(0, 8) +
    '.' +
    String(d.getMilliseconds()).padStart(3, '0')
  )
}

function log(category: DebugCategory, message: string, ...data: unknown[]): void {
  const { prefix, color } = CATEGORY_CONFIG[category]
  const ts = timestamp()
  const label = `%c[${ts}] [${prefix}] ${message}`
  const style = `color:${color};font-weight:bold`

  if (data.length > 0) {
    console.groupCollapsed(label, style)
    for (let i = 0; i < data.length; i++) {
      console.log(data[i])
    }
    console.groupEnd()
  } else {
    console.log(label, style)
  }
}

function isOn(): boolean {
  return localStorage.getItem(STORAGE_KEY) === 'true'
}

// Auto-enable debug from URL param: ?debug=true (persists to localStorage)
if (new URLSearchParams(window.location.search).get('debug') === 'true') {
  localStorage.setItem(STORAGE_KEY, 'true')
  console.log('%c[DEBUG] Logging enabled via ?debug=true', 'color:#22C55E;font-weight:bold')
}

export const debug = {
  api:   (msg: string, ...data: unknown[]) => { if (isOn()) log('api',   msg, ...data) },
  nav:   (msg: string, ...data: unknown[]) => { if (isOn()) log('nav',   msg, ...data) },
  state: (msg: string, ...data: unknown[]) => { if (isOn()) log('state', msg, ...data) },
  user:  (msg: string, ...data: unknown[]) => { if (isOn()) log('user',  msg, ...data) },
  error: (msg: string, ...data: unknown[]) => { if (isOn()) log('error', msg, ...data) },

  isEnabled: () => isOn(),
  enable:  () => { localStorage.setItem(STORAGE_KEY, 'true');  console.log('%c[DEBUG] Logging enabled', 'color:#22C55E;font-weight:bold') },
  disable: () => { localStorage.removeItem(STORAGE_KEY);        console.log('%c[DEBUG] Logging disabled', 'color:#EF4444;font-weight:bold') },
}
