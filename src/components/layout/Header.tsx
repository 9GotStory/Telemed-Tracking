import { Menu, LogOut, ChevronRight } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/authStore'
import { useUIStore } from '@/stores/uiStore'

const ROUTE_LABELS: Record<string, string> = {
  '/module1': 'ทะเบียนอุปกรณ์',
  '/module2': 'ตรวจสอบความพร้อม',
  '/module3': 'ตารางคลินิก',
  '/module4': 'Import ข้อมูลผู้ป่วย',
  '/module5': 'ยืนยันรายการยา',
  '/module6': 'ติดตาม Case',
  '/master-drugs': 'คลังชื่อยา',
  '/users': 'จัดการผู้ใช้',
  '/settings': 'ตั้งค่าระบบ',
}

export function Header() {
  const { user, clearAuth } = useAuthStore()
  const { toggleSidebar } = useUIStore()
  const location = useLocation()

  const currentLabel = ROUTE_LABELS[location.pathname] ?? ''

  return (
    <header className="sticky top-0 z-30 h-14 flex items-center justify-between px-4 bg-white/80 backdrop-blur-lg border-b border-border">
      <div className="flex items-center gap-3">
        {/* Mobile hamburger */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={toggleSidebar}
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1 text-sm text-muted-foreground">
          <span className="hidden sm:inline">Telemed Tracking</span>
          {currentLabel && (
            <>
              <ChevronRight className="h-3 w-3 hidden sm:inline" />
              <span className="text-foreground font-medium">{currentLabel}</span>
            </>
          )}
        </nav>
      </div>

      <div className="flex items-center gap-2">
        {user && (
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium leading-none">{user.first_name} {user.last_name}</p>
              <p className="text-xs text-muted-foreground">{user.hosp_name}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={clearAuth}
              title="ออกจากระบบ"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </header>
  )
}
