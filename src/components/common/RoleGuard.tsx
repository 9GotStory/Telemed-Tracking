import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import type { UserRole } from '@/types/user'

interface RoleGuardProps {
  children: ReactNode
  allowedRoles?: UserRole[]
}

/**
 * Route-level role protection.
 * Redirects to /login if not authenticated.
 * Shows nothing if role is insufficient (allowedRoles specified but user role not included).
 */
export function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
  const { isAuthenticated, user } = useAuthStore()

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-muted-foreground">ไม่มีสิทธิ์เข้าถึงหน้านี้</p>
      </div>
    )
  }

  return <>{children}</>
}
