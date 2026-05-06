import type { DashboardStats } from '@/services/dashboardService'
import { format } from 'date-fns'
import { CalendarCheck, UserCheck, PhoneForwarded, MonitorCheck } from 'lucide-react'

interface StatsCardsProps {
  stats: DashboardStats
}

export function StatsCards({ stats }: StatsCardsProps) {
  const currentMonth = format(new Date(), 'yyyy-MM')
  const sessionsThisMonth = stats.monthly_sessions[currentMonth] ?? 0

  const attendanceRate = (() => {
    const total = stats.attendance_by_facility.reduce((s, r) => s + r.total_appointed, 0)
    const attended = stats.attendance_by_facility.reduce((s, r) => s + r.total_attended, 0)
    return total > 0 ? Math.round((attended / total) * 100) : 0
  })()

  const followupRate = (() => {
    const { followed, pending } = stats.followup_pipeline
    const total = followed + pending
    return total > 0 ? Math.round((followed / total) * 100) : 0
  })()

  const readinessRate = (() => {
    const items = stats.equipment_status
    if (items.length === 0) return 0
    const ready = items.filter((e) => e.status === 'ready').length
    return Math.round((ready / items.length) * 100)
  })()

  const cards = [
    {
      label: 'นัดหมายเดือนนี้',
      description: 'จำนวนครั้งบริการที่มีนัดหมาย',
      value: sessionsThisMonth,
      unit: 'ครั้ง',
      icon: CalendarCheck,
    },
    {
      label: 'อัตราการมาตามนัด',
      description: 'ผู้ป่วยที่มารับบริการจริง',
      value: attendanceRate,
      unit: '%',
      icon: UserCheck,
    },
    {
      label: 'อัตราการติดตาม',
      description: 'ผู้ป่วยที่ได้รับการติดตามแล้ว',
      value: followupRate,
      unit: '%',
      icon: PhoneForwarded,
    },
    {
      label: 'ความพร้อมอุปกรณ์',
      description: 'สถานพยาบาลที่อุปกรณ์พร้อมใช้',
      value: readinessRate,
      unit: '%',
      icon: MonitorCheck,
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <div
            key={card.label}
            className="rounded-lg bg-white p-5 shadow-[0_3px_15px_rgba(0,0,0,0.08)]"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0071e3]/10">
                <Icon className="h-4 w-4 text-[#0071e3]" />
              </div>
              <span className="text-xs font-medium text-[rgba(0,0,0,0.48)] leading-tight">
                {card.label}
              </span>
            </div>
            <div className="text-3xl font-semibold tracking-tight text-[#1d1d1f]">
              {card.value}
              <span className="text-base font-normal text-[rgba(0,0,0,0.48)] ml-1">
                {card.unit}
              </span>
            </div>
            <p className="text-xs text-[rgba(0,0,0,0.48)] mt-1">
              {card.description}
            </p>
          </div>
        )
      })}
    </div>
  )
}
