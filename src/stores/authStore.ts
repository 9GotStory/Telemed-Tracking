import { create } from 'zustand'
import type { AuthUser } from '@/types/user'

interface AuthState {
  token: string | null
  user: AuthUser | null
  isAuthenticated: boolean

  setAuth: (token: string, user: AuthUser) => void
  clearAuth: () => void
  hydrate: () => void
}

const TOKEN_KEY = 'session_token'
const USER_KEY = 'session_user'

export const useAuthStore = create<AuthState>()((set) => ({
  token: null,
  user: null,
  isAuthenticated: false,

  setAuth: (token: string, user: AuthUser) => {
    sessionStorage.setItem(TOKEN_KEY, token)
    sessionStorage.setItem(USER_KEY, JSON.stringify(user))
    set({ token, user, isAuthenticated: true })
  },

  clearAuth: () => {
    sessionStorage.removeItem(TOKEN_KEY)
    sessionStorage.removeItem(USER_KEY)
    set({ token: null, user: null, isAuthenticated: false })
  },

  hydrate: () => {
    const token = sessionStorage.getItem(TOKEN_KEY)
    const userJson = sessionStorage.getItem(USER_KEY)
    if (token && userJson) {
      try {
        const user = JSON.parse(userJson) as AuthUser
        set({ token, user, isAuthenticated: true })
      } catch {
        // Corrupted data — clear and start fresh
        sessionStorage.removeItem(TOKEN_KEY)
        sessionStorage.removeItem(USER_KEY)
      }
    }
  },
}))
