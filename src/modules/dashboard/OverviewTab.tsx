import type { DashboardStats } from '@/services/dashboardService'
import { formatMonthShortThai } from '@/utils/dateUtils'

interface OverviewTabProps {
  stats: DashboardStats
}

export function OverviewTab({ stats }: OverviewTabProps) {
  const sessions = Object.entries(stats.monthly_sessions)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)

  const attendance = stats.monthly_attendance ?? []
  const followup = stats.monthly_followup ?? []

  const maxSessions = Math.max(...sessions.map(([, v]) => v), 1)

  return (
    <div className="flex flex-col gap-12">
      {/* A. Monthly session trend */}
      <section>
        <h2 className="text-2xl font-semibold text-[#1d1d1f] mb-5 tracking-tight" style={{ letterSpacing: '-0.01em' }}>
          แนวโน้มจำนวนนัดหมาย
        </h2>
        {sessions.length === 0 ? (
          <div className="text-center py-10 text-[rgba(0,0,0,0.48)]">ยังไม่มีข้อมูล</div>
        ) : (
          <div className="flex flex-col gap-3">
            {sessions.map(([month, count]) => (
              <div key={month} className="flex items-center gap-3">
                <span className="w-24 text-sm text-[rgba(0,0,0,0.48)] shrink-0">
                  {formatMonthShortThai(month)}
                </span>
                <div className="flex-1 h-8 rounded-full bg-[rgba(0,0,0,0.06)] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#0071e3] transition-all duration-500"
                    style={{ width: `${(count / maxSessions) * 100}%` }}
                  />
                </div>
                <span className="w-10 text-sm font-medium text-[#1d1d1f] text-right tabular-nums">
                  {count}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* B. Monthly attendance rate */}
      <section>
        <h2 className="text-2xl font-semibold text-[#1d1d1f] mb-5 tracking-tight" style={{ letterSpacing: '-0.01em' }}>
          อัตราเข้ารับบริการรายเดือน
        </h2>
        {attendance.length === 0 ? (
          <div className="text-center py-10 text-[rgba(0,0,0,0.48)]">ยังไม่มีข้อมูล</div>
        ) : (
          <div className="flex flex-col gap-3">
            {attendance.map((row) => {
              const pct = Math.round(row.rate)
              const barColor =
                pct >= 80 ? '#0071e3' : pct >= 50 ? 'rgba(0,113,227,0.45)' : 'rgba(0,0,0,0.15)'
              return (
                <div key={row.month} className="rounded-xl bg-[#f5f5f7] p-4 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-[#1d1d1f]">
                      {formatMonthShortThai(row.month)}
                    </span>
                    <span className="text-2xl font-semibold tabular-nums text-[#0071e3]">
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
        )}
      </section>

      {/* C. Monthly followup rate */}
      <section>
        <h2 className="text-2xl font-semibold text-[#1d1d1f] mb-5 tracking-tight" style={{ letterSpacing: '-0.01em' }}>
          อัตราการติดตามรายเดือน
        </h2>
        {followup.length === 0 ? (
          <div className="text-center py-10 text-[rgba(0,0,0,0.48)]">ยังไม่มีข้อมูล</div>
        ) : (
          <div className="flex flex-col gap-3">
            {followup.map((row) => {
              const total = row.followed + row.pending
              const followedPct = total > 0 ? Math.round((row.followed / total) * 100) : 0
              return (
                <div key={row.month} className="rounded-xl bg-[#f5f5f7] p-4 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-[#1d1d1f]">
                      {formatMonthShortThai(row.month)}
                    </span>
                    <span className="text-2xl font-semibold tabular-nums text-[#0071e3]">
                      {followedPct}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden flex">
                    <div
                      className="h-full bg-[#0071e3] transition-all duration-500"
                      style={{ width: `${followedPct}%` }}
                    />
                    <div
                      className="h-full bg-[rgba(0,0,0,0.08)]"
                      style={{ width: `${100 - followedPct}%` }}
                    />
                  </div>
                  <div className="text-xs text-[rgba(0,0,0,0.48)]">
                    ติดตามแล้ว {row.followed} / รอติดตาม {row.pending}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
