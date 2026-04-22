/**
 * GAS API fetch wrapper — all GAS communication MUST go through these functions.
 *
 * Constitution Principle I: GAS CORS Simple Request pattern.
 * - GET: token + params in query string, no headers
 * - POST: token in body, no Content-Type header (defaults to text/plain)
 * - NEVER use Content-Type: application/json or custom headers
 */

import { useAuthStore } from '@/stores/authStore'

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
 * Handle unauthorized response — clear auth state and redirect to login.
 * Called when GAS returns "Unauthorized" error or session expired.
 */
function handleUnauthorized(): void {
  const store = useAuthStore.getState()
  if (store.isAuthenticated) {
    store.clearAuth()
    // Intentional full-page reload: clears all React state, TanStack Query cache,
    // and Zustand store to guarantee no stale data from the expired session persists.
    // This differs from useLogout which uses SPA navigation for intentional logouts.
    window.location.href = '/login'
  }
}

/** Check if an error indicates unauthorized access and handle accordingly */
function checkAndHandleUnauthorized(errorMsg: string): void {
  const unauthorizedMessages = ['Unauthorized', 'Session expired', 'Invalid token']
  if (unauthorizedMessages.some((msg) => errorMsg.includes(msg))) {
    handleUnauthorized()
  }
}

/**
 * GET request — token and all params as query string.
 * Return type is unknown — caller MUST validate with Zod before use.
 */
export async function gasGet<T>(action: string, params: Record<string, string> = {}): Promise<T> {
  const query = new URLSearchParams({ action, token: getToken(), ...params })
  const res = await fetch(`${GAS_URL}?${query}`)

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`)
  }

  const json: unknown = await res.json()
  if (typeof json === 'object' && json !== null && 'success' in json) {
    const response = json as { success: boolean; data?: unknown; error?: string }
    if (!response.success) {
      const errMsg = response.error ?? 'GAS error'
      checkAndHandleUnauthorized(errMsg)
      throw new Error(errMsg)
    }
    return response.data as T
  }

  throw new Error(extractError(json))
}

/**
 * POST request — token in body, no Content-Type header.
 * Return type is unknown — caller MUST validate with Zod before use.
 */
export async function gasPost<T>(action: string, data: unknown = {}): Promise<T> {
  const res = await fetch(GAS_URL, {
    method: 'POST',
    body: JSON.stringify({ action, token: getToken(), data }),
    // Intentionally NO headers — GAS requires text/plain (browser default)
  })

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`)
  }

  const json: unknown = await res.json()
  if (typeof json === 'object' && json !== null && 'success' in json) {
    const response = json as { success: boolean; data?: unknown; error?: string }
    if (!response.success) {
      const errMsg = response.error ?? 'GAS error'
      // Don't auto-redirect on auth.login / auth.register failures
      if (action !== 'auth.login' && action !== 'auth.register') {
        checkAndHandleUnauthorized(errMsg)
      }
      throw new Error(errMsg)
    }
    return response.data as T
  }

  throw new Error(extractError(json))
}
