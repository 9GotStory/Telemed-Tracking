import type { EquipmentStatus } from '@/services/dashboardService'
import { formatBuddhist } from '@/utils/dateUtils'
import { CircleCheck, CircleAlert, CircleX, CircleHelp } from 'lucide-react'

interface EquipmentStatusGridProps {
  items: EquipmentStatus[]
}

const statusConfig: Record<string, { icon: typeof CircleCheck; label: string; color: string }> = {
  ready: { icon: CircleCheck, label: 'พร้อม', color: 'text-[#0071e3]' },
  need_fix: { icon: CircleAlert, label: 'ต้องแก้ไข', color: 'text-[rgba(0,0,0,0.8)]' },
  not_ready: { icon: CircleX, label: 'ไม่พร้อม', color: 'text-[#1d1d1f]' },
  unknown: { icon: CircleHelp, label: 'ยังไม่ตรวจ', color: 'text-[rgba(0,0,0,0.48)]' },
}

export function EquipmentStatusGrid({ items }: EquipmentStatusGridProps) {
  if (items.length === 0) {
    return <div className="text-center py-10 text-[rgba(0,0,0,0.48)]">ยังไม่มีข้อมูล</div>
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {items.map((item) => {
        const cfg = statusConfig[item.status] ?? statusConfig.unknown
        const Icon = cfg.icon
        return (
          <div
            key={item.hosp_code}
            className="rounded-lg bg-white p-4 shadow-[0_3px_15px_rgba(0,0,0,0.08)]"
          >
            <div className="text-sm font-medium text-[#1d1d1f] truncate mb-2">
              {item.hosp_name}
            </div>
            <div className="flex items-center gap-1.5">
              <Icon className={`h-4 w-4 ${cfg.color}`} />
              <span className={`text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
            </div>
            {item.last_check_date && (
              <div className="text-xs text-[rgba(0,0,0,0.48)] mt-2">
                ตรวจล่าสุด {formatBuddhist(item.last_check_date)}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
