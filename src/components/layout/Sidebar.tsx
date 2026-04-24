import { NavLink } from 'react-router-dom'
import {
  Monitor, ClipboardCheck, Calendar, FileUp, Pill, Phone,
  Package, LayoutDashboard, Users, Settings, LogOut, ExternalLink,
} from 'lucide-react'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/authStore'
import { useUIStore } from '@/stores/uiStore'
import { isModuleAllowed } from '@/utils/roleGuard'
import { cn } from '@/lib/utils'

interface NavItem {
  to: string
  label: string
  icon: React.ReactNode
  module: string
  external?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { to: '/module1', label: 'ทะเบียนอุปกรณ์', icon: <Monitor className="h-4 w-4" />, module: 'module1' },
  { to: '/module2', label: 'ตรวจสอบความพร้อม', icon: <ClipboardCheck className="h-4 w-4" />, module: 'module2' },
  { to: '/module3', label: 'ตารางคลินิก', icon: <Calendar className="h-4 w-4" />, module: 'module3' },
  { to: '/module4', label: 'Import ข้อมูล', icon: <FileUp className="h-4 w-4" />, module: 'module4' },
  { to: '/module5', label: 'ยืนยันรายการยา', icon: <Pill className="h-4 w-4" />, module: 'module5' },
  { to: '/module6', label: 'ติดตาม Case', icon: <Phone className="h-4 w-4" />, module: 'module6' },
  { to: '/master-drugs', label: 'คลังชื่อยา', icon: <Package className="h-4 w-4" />, module: 'master-drugs' },
  { to: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" />, module: 'dashboard', external: true },
  { to: '/users', label: 'จัดการผู้ใช้', icon: <Users className="h-4 w-4" />, module: 'users' },
  { to: '/settings', label: 'ตั้งค่าระบบ', icon: <Settings className="h-4 w-4" />, module: 'settings' },
]

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const { user } = useAuthStore()

  const visibleItems = NAV_ITEMS.filter(
    (item) => !user || isModuleAllowed(item.module, user.role)
  )

  return (
    <nav className="flex flex-col gap-1 p-2">
      {visibleItems.map((item) => (
        item.external ? (
          <a
            key={item.to}
            href={item.to}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onNavigate}
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors text-white/80 hover:text-white hover:bg-white/10"
          >
            {item.icon}
            <span>{item.label}</span>
            <ExternalLink className="h-3 w-3 ml-auto opacity-50" />
          </a>
        ) : (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                'text-white/80 hover:text-white hover:bg-white/10',
                isActive && 'text-white bg-white/10 border-l-2 border-apple-blue'
              )
            }
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        )
      ))}
    </nav>
  )
}

export function Sidebar() {
  const { user, clearAuth } = useAuthStore()
  const { sidebarOpen, setSidebarOpen } = useUIStore()

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-60 lg:fixed lg:inset-y-0 bg-black/80 backdrop-blur-xl border-r border-white/10">
        <div className="flex h-14 items-center px-4 border-b border-white/10">
          <span className="text-white font-semibold text-sm tracking-tight">
            Telemed Tracking
          </span>
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          <SidebarNav />
        </div>
        {user && (
          <div className="p-4 border-t border-white/10">
            <p className="text-white/80 text-xs truncate">{user.first_name} {user.last_name}</p>
            <p className="text-white/48 text-xs truncate">{user.hosp_name}</p>
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 text-white/60 hover:text-white hover:bg-white/10 w-full justify-start"
              onClick={clearAuth}
            >
              <LogOut className="h-4 w-4 mr-2" />
              ออกจากระบบ
            </Button>
          </div>
        )}
      </aside>

      {/* Mobile sidebar (Sheet drawer) */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-64 bg-black/95 backdrop-blur-xl border-white/10 p-0">
          <div className="flex h-14 items-center px-4 border-b border-white/10 justify-between">
            <span className="text-white font-semibold text-sm">Telemed Tracking</span>
          </div>
          <div className="flex-1 overflow-y-auto py-2">
            <SidebarNav onNavigate={() => setSidebarOpen(false)} />
          </div>
          {user && (
            <div className="p-4 border-t border-white/10">
              <p className="text-white/80 text-xs">{user.first_name} {user.last_name}</p>
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 text-white/60 hover:text-white hover:bg-white/10 w-full justify-start"
                onClick={() => { clearAuth(); setSidebarOpen(false) }}
              >
                <LogOut className="h-4 w-4 mr-2" />
                ออกจากระบบ
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  )
}
