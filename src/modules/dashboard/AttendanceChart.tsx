import { useState } from 'react'
import type { AttendanceRow } from '@/services/dashboardService'

interface AttendanceChartProps {
  byClinic: AttendanceRow[]
  byFacility: AttendanceRow[]
}

export function AttendanceChart({ byClinic, byFacility }: AttendanceChartProps) {
  const [view, setView] = useState<'clinic' | 'facility'>('clinic')
  const data = view === 'clinic' ? byClinic : byFacility

  return (
    <div>
      {/* Toggle */}
      <div className="flex gap-2 mb-4">
        <button
          type="button"
          onClick={() => setView('clinic')}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            view === 'clinic'
              ? 'bg-[#0071e3] text-white'
              : 'bg-[#fafafc] text-[#1d1d1f] hover:bg-[#ededf2]'
          }`}
        >
          ตามคลินิก
        </button>
        <button
          type="button"
          onClick={() => setView('facility')}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            view === 'facility'
              ? 'bg-[#0071e3] text-white'
              : 'bg-[#fafafc] text-[#1d1d1f] hover:bg-[#ededf2]'
          }`}
        >
          ตาม รพ.สต.
        </button>
      </div>

      {data.length === 0 ? (
        <div className="text-center py-8 text-[rgba(0,0,0,0.48)]">ยังไม่มีข้อมูล</div>
      ) : (
        <div className="space-y-3">
          {data.map((row, i) => {
            const label = row.clinic_type ?? row.hosp_name ?? ''
            const pct = Math.round(row.rate)
            return (
              <div key={i}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-[#1d1d1f]">{label}</span>
                  <span className="text-sm font-medium text-[#1d1d1f]">
                    {row.total_attended}/{row.total_appointed} ({pct}%)
                  </span>
                </div>
                <div className="h-2 rounded-full bg-[#fafafc] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#0071e3] transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
