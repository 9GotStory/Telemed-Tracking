/**
 * GAS API fetch wrapper — all GAS communication MUST go through these functions.
 *
 * Constitution Principle I: GAS CORS Simple Request pattern.
 * - GET: token + params in query string, no headers
 * - POST: token in body, no Content-Type header (defaults to text/plain)
 * - NEVER use Content-Type: application/json or custom headers
 */

import { useAuthStore } from '@/stores/authStore'
import { debug } from '@/utils/debugLogger'

const GAS_URL = import.meta.env.VITE_GAS_API_URL as string

function getToken(): string {
  return sessionStorage.getItem('session_token') ?? ''
}

/** Extract error message from GAS response */
function extractError(data: unknown): string {
  if (typeof data === 'object' && data !== null && 'error' in data) {
    const error = (data as { error: unknown }).error
    return typeof error === 'string' ? error : 'GAS error'
  }
  return 'GAS error'
}

/**
 * Handle unauthorized response — clear auth state and redirect to dashboard.
 * Called when GAS returns "Unauthorized" error or session expired.
 */
function handleUnauthorized(): void {
  const store = useAuthStore.getState()
  if (store.isAuthenticated) {
    store.clearAuth()
    // Intentional full-page reload: clears all React state, TanStack Query cache,
    // and Zustand store to guarantee no stale data from the expired session persists.
    // This differs from useLogout which uses SPA navigation for intentional logouts.
    window.location.href = import.meta.env.BASE_URL
  }
}

/** Check if an error indicates unauthorized access and handle accordingly */
function checkAndHandleUnauthorized(errorMsg: string): void {
  const unauthorizedMessages = ['Unauthorized', 'Session expired', 'Invalid token']
  if (unauthorizedMessages.some((msg) => errorMsg.includes(msg))) {
    handleUnauthorized()
  }
}

/** Log GAS debug trace if present in response */
function logGasTrace(action: string, json: Record<string, unknown>): void {
  if ('_debug' in json && json._debug) {
    debug.api(`[GAS TRACE] ${action}`, json._debug)
  }
}

/** Summarize response data for debug log (truncates large payloads) */
function summarizeData(data: unknown): unknown {
  if (Array.isArray(data)) return `[${data.length} items]`
  if (data && typeof data === 'object') return data
  return data
}

/**
 * GET request — token and all params as query string.
 * Return type is unknown — caller MUST validate with Zod before use.
 */
export async function gasGet<T>(action: string, params: Record<string, string> = {}): Promise<T> {
  const start = Date.now()

  // Add _debug flag when debug logging is enabled
  const debugParams = debug.isEnabled() ? { ...params, _debug: 'true' } : params
  debug.api(`→ GET ${action}`, { params })

  const query = new URLSearchParams({ action, token: getToken(), ...debugParams })
  const res = await fetch(`${GAS_URL}?${query}`)

  if (!res.ok) {
    debug.error(`← GET ${action} HTTP ${res.status}`)
    throw new Error(`HTTP ${res.status}: ${res.statusText}`)
  }

  const json: unknown = await res.json()
  if (typeof json === 'object' && json !== null && 'success' in json) {
    logGasTrace(action, json as Record<string, unknown>)
    const response = json as { success: boolean; data?: unknown; error?: string }
    if (!response.success) {
      const errMsg = response.error ?? 'GAS error'
      debug.error(`← GET ${action} FAILED (${Date.now() - start}ms)`, { error: errMsg })
      checkAndHandleUnauthorized(errMsg)
      throw new Error(errMsg)
    }
    debug.api(`← GET ${action} OK (${Date.now() - start}ms)`, { response: summarizeData(response.data) })
    return response.data as T
  }

  throw new Error(extractError(json))
}

/**
 * POST request — token in body, no Content-Type header.
 * Return type is unknown — caller MUST validate with Zod before use.
 */
export async function gasPost<T>(action: string, data: unknown = {}): Promise<T> {
  const start = Date.now()
  debug.api(`→ POST ${action}`, { data })

  // Add _debug flag when debug logging is enabled
  const body = debug.isEnabled()
    ? { action, token: getToken(), data, _debug: true }
    : { action, token: getToken(), data }

  const res = await fetch(GAS_URL, {
    method: 'POST',
    body: JSON.stringify(body),
    // Intentionally NO headers — GAS requires text/plain (browser default)
  })

  if (!res.ok) {
    debug.error(`← POST ${action} HTTP ${res.status}`)
    throw new Error(`HTTP ${res.status}: ${res.statusText}`)
  }

  const json: unknown = await res.json()
  if (typeof json === 'object' && json !== null && 'success' in json) {
    logGasTrace(action, json as Record<string, unknown>)
    const response = json as { success: boolean; data?: unknown; error?: string }
    if (!response.success) {
      const errMsg = response.error ?? 'GAS error'
      debug.error(`← POST ${action} FAILED (${Date.now() - start}ms)`, { error: errMsg })
      // Don't auto-redirect on auth.login / auth.register failures
      if (action !== 'auth.login' && action !== 'auth.register') {
        checkAndHandleUnauthorized(errMsg)
      }
      throw new Error(errMsg)
    }
    debug.api(`← POST ${action} OK (${Date.now() - start}ms)`, { response: summarizeData(response.data) })
    return response.data as T
  }

  throw new Error(extractError(json))
}
