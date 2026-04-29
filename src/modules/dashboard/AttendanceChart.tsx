import type { AttendanceRow } from '@/services/dashboardService'

interface AttendanceChartProps {
  data: AttendanceRow[]
}

export function AttendanceChart({ data }: AttendanceChartProps) {
  if (data.length === 0) {
    return (
      <div className="text-center py-10 text-[rgba(0,0,0,0.48)]">
        ยังไม่มีข้อมูลการเข้ารับบริการ
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {data.map((row, i) => {
        const pct = Math.round(row.rate)
        const color =
          pct >= 80 ? 'text-[#0071e3]' : pct >= 50 ? 'text-[rgba(0,113,227,0.7)]' : 'text-[rgba(0,0,0,0.35)]'
        const barColor =
          pct >= 80 ? '#0071e3' : pct >= 50 ? 'rgba(0,113,227,0.45)' : 'rgba(0,0,0,0.15)'
        return (
          <div
            key={i}
            className="rounded-xl bg-[#f5f5f7] p-4 flex flex-col gap-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-[#1d1d1f] truncate mr-2">{row.hosp_name}</span>
              <span className={`text-2xl font-semibold tabular-nums ${color}`}>
                {pct}%
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-white overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, backgroundColor: barColor }}
              />
            </div>
            <div className="text-xs text-[rgba(0,0,0,0.48)]">
              มา {row.total_attended} / นัด {row.total_appointed}
            </div>
          </div>
        )
      })}
    </div>
  )
}
