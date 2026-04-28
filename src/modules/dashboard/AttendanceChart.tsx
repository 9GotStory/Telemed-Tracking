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
    <div className="space-y-4">
      {data.map((row, i) => {
        const pct = Math.round(row.rate)
        return (
          <div key={i}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-medium text-[#1d1d1f]">{row.hosp_name}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[rgba(0,0,0,0.48)]">
                  มา {row.total_attended} / นัด {row.total_appointed}
                </span>
                <span className="text-sm font-semibold text-[#1d1d1f] w-12 text-right">
                  {pct}%
                </span>
              </div>
            </div>
            <div className="h-2 rounded-full bg-[#f5f5f7] overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${pct}%`,
                  backgroundColor: pct >= 80 ? '#0071e3' : pct >= 50 ? 'rgba(0, 113, 227, 0.45)' : 'rgba(0, 0, 0, 0.15)',
                }}
              />
            </div>
          </div>
        )
      })}
      <div className="flex items-center gap-4 pt-2 text-xs text-[rgba(0,0,0,0.48)]">
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-[#0071e3]" /> ตั้งแต่ 80%
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-[rgba(0,113,227,0.45)]" /> 50-79%
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-[rgba(0,0,0,0.15)]" /> ต่ำกว่า 50%
        </span>
      </div>
    </div>
  )
}
