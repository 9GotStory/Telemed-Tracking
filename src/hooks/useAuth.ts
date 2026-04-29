import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/authStore'
import { authService } from '@/services/authService'
import type { LoginFormValues, RegisterFormValues } from '@/services/authService'
import type { AuthUser } from '@/types/user'

/** Redirect path based on user role after login */
export function getRoleHomePath(role: string): string {
  switch (role) {
    case 'super_admin':
    case 'admin_hosp':
      return '/module3' // Schedule overview
    case 'staff_hosp':
      return '/module4' // Import
    case 'staff_hsc':
      return '/module5' // Drug confirm
    default:
      return '/module1' // Fallback
  }
}

/**
 * Login mutation — calls authService.login, stores session.
 * Redirects to role-appropriate home page after success.
 */
export function useLogin() {
  const setAuth = useAuthStore((s) => s.setAuth)
  const navigate = useNavigate()

  return useMutation({
    mutationFn: (credentials: LoginFormValues) => authService.login(credentials),
    onSuccess: (data) => {
      const user: AuthUser = {
        user_id: data.user_id,
        username: data.username,
        hosp_code: data.hosp_code,
        first_name: data.first_name,
        last_name: data.last_name,
        role: data.role,
        hosp_name: data.hosp_name,
      }
      setAuth(data.token, user, data.force_change)
      navigate(getRoleHomePath(data.role), { replace: true })
    },
  })
}

/**
 * Register mutation — calls authService.register.
 * Use `mutate(payload)` to trigger. Check `isSuccess` for "awaiting approval" state.
 */
export function useRegister() {
  return useMutation({
    mutationFn: (payload: RegisterFormValues) => authService.register(payload),
  })
}

/**
 * Logout mutation — calls authService.logout, clears session, redirects to dashboard.
 * Always clears local state even if the API call fails.
 */
export function useLogout() {
  const clearAuth = useAuthStore((s) => s.clearAuth)
  const navigate = useNavigate()

  return useMutation({
    mutationFn: () => authService.logout(),
    onSettled: () => {
      clearAuth()
      toast.success('ออกจากระบบสำเร็จ')
      navigate('/', { replace: true })
    },
  })
}

export type { LoginFormValues, RegisterFormValues }
