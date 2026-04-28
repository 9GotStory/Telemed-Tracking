import { create } from 'zustand'
import type { AuthUser } from '@/types/user'

interface AuthState {
  token: string | null
  user: AuthUser | null
  isAuthenticated: boolean
  forceChange: boolean

  setAuth: (token: string, user: AuthUser, forceChange?: boolean) => void
  clearAuth: () => void
  hydrate: () => void
}

const TOKEN_KEY = 'session_token'
const USER_KEY = 'session_user'

/** Read sessionStorage synchronously at store creation time */
function getInitialAuth(): { token: string | null; user: AuthUser | null; isAuthenticated: boolean; forceChange: boolean } {
  const token = sessionStorage.getItem(TOKEN_KEY)
  const userJson = sessionStorage.getItem(USER_KEY)
  const forceChange = sessionStorage.getItem('force_change') === '1'

  if (token && userJson) {
    try {
      const user = JSON.parse(userJson) as AuthUser
      return { token, user, isAuthenticated: true, forceChange }
    } catch {
      sessionStorage.removeItem(TOKEN_KEY)
      sessionStorage.removeItem(USER_KEY)
      sessionStorage.removeItem('force_change')
    }
  }
  return { token: null, user: null, isAuthenticated: false, forceChange: false }
}

export const useAuthStore = create<AuthState>()((set) => ({
  ...getInitialAuth(),

  setAuth: (token: string, user: AuthUser, forceChange = false) => {
    sessionStorage.setItem(TOKEN_KEY, token)
    sessionStorage.setItem(USER_KEY, JSON.stringify(user))
    if (forceChange) sessionStorage.setItem('force_change', '1')
    set({ token, user, isAuthenticated: true, forceChange })
  },

  clearAuth: () => {
    sessionStorage.removeItem(TOKEN_KEY)
    sessionStorage.removeItem(USER_KEY)
    sessionStorage.removeItem('force_change')
    set({ token: null, user: null, isAuthenticated: false, forceChange: false })
  },

  hydrate: () => {
    // Kept as no-op for backward compatibility — hydration now happens
    // synchronously at store creation via getInitialAuth()
  },
}))
