import type { DashboardStats } from '@/services/dashboardService'

interface StatsCardsProps {
  stats: DashboardStats
}

export function StatsCards({ stats }: StatsCardsProps) {
  const sessionsThisMonth = (() => {
    const months = Object.keys(stats.monthly_sessions).sort().reverse()
    return months.length > 0 ? stats.monthly_sessions[months[0]] : 0
  })()

  const attendanceRate = (() => {
    const total = stats.attendance_by_clinic.reduce((s, r) => s + r.total_appointed, 0)
    const attended = stats.attendance_by_clinic.reduce((s, r) => s + r.total_attended, 0)
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
    { label: 'เซสชันเดือนนี้', value: sessionsThisMonth, unit: 'ครั้ง' },
    { label: 'อัตราการเข้ารับบริการ', value: attendanceRate, unit: '%' },
    { label: 'อัตราการติดตาม', value: followupRate, unit: '%' },
    { label: 'ความพร้อมอุปกรณ์', value: readinessRate, unit: '%' },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-lg bg-white p-5 shadow-[0_3px_15px_rgba(0,0,0,0.08)]"
        >
          <div className="text-sm text-[rgba(0,0,0,0.48)] mb-1">{card.label}</div>
          <div className="text-3xl font-semibold tracking-tight text-[#1d1d1f]">
            {card.value}
            <span className="text-base font-normal text-[rgba(0,0,0,0.48)] ml-1">
              {card.unit}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
