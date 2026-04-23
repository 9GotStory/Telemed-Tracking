import { StatusBadge } from '@/components/common/StatusBadge'
import type { EquipmentStatus } from '@/services/dashboardService'
import { formatBuddhist } from '@/utils/dateUtils'

interface EquipmentStatusGridProps {
  items: EquipmentStatus[]
}

const statusConfig: Record<string, { variant: 'active' | 'pending' | 'error'; label: string }> = {
  ready: { variant: 'active', label: 'พร้อม' },
  need_fix: { variant: 'pending', label: 'ต้องแก้ไข' },
  not_ready: { variant: 'error', label: 'ไม่พร้อม' },
}

export function EquipmentStatusGrid({ items }: EquipmentStatusGridProps) {
  if (items.length === 0) {
    return <div className="text-center py-8 text-[rgba(0,0,0,0.48)]">ยังไม่มีข้อมูล</div>
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {items.map((item) => {
        const cfg = statusConfig[item.status] ?? statusConfig.not_ready
        return (
          <div
            key={item.hosp_code}
            className="rounded-lg bg-white p-4 shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
          >
            <div className="text-sm font-medium text-[#1d1d1f] truncate mb-2">
              {item.hosp_name}
            </div>
            <StatusBadge variant={cfg.variant}>{cfg.label}</StatusBadge>
            {item.last_check_date && (
              <div className="text-xs text-[rgba(0,0,0,0.48)] mt-2">
                ตรวจล่าสุด: {formatBuddhist(item.last_check_date)}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
