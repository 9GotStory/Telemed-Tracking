import type { ReactNode } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { ShieldX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/authStore'
import { getRoleHomePath } from '@/hooks/useAuth'
import type { UserRole } from '@/types/user'

interface RoleGuardProps {
  children: ReactNode
  allowedRoles?: UserRole[]
}

/**
 * Route-level role protection.
 * Redirects to /login if not authenticated.
 * Shows access denied card if role is insufficient.
 */
export function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
  const { isAuthenticated, user } = useAuthStore()

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <AccessDenied />
  }

  return <>{children}</>
}

function AccessDenied() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4 rounded-lg border bg-white p-8 shadow-sm max-w-sm text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
          <ShieldX className="h-6 w-6 text-red-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">ไม่มีสิทธิ์เข้าถึง</h2>
          <p className="text-sm text-muted-foreground mt-1">
            คุณไม่มีสิทธิ์ในการเข้าถึงหน้านี้ กรุณาติดต่อผู้ดูแลระบบ
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate(user ? getRoleHomePath(user.role) : '/login')}>
          กลับหน้าหลัก
        </Button>
      </div>
    </div>
  )
}
