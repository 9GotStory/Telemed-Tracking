import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { useDashboardStats } from './useDashboard'
import { StatsCards } from './StatsCards'
import { EquipmentStatusGrid } from './EquipmentStatusGrid'
import { UpcomingAppointments } from './UpcomingAppointments'
import { AttendanceChart } from './AttendanceChart'
import { FollowupPipeline } from './FollowupPipeline'
import { useDebugMount } from '@/hooks/useDebugLog'
import { format, addDays } from 'date-fns'
import { Link } from 'react-router-dom'
import { Activity, LogIn } from 'lucide-react'

export default function DashboardPage() {
  useDebugMount('DashboardPage')
  const { data: stats, isLoading, error } = useDashboardStats()

  const appName = import.meta.env.VITE_APP_NAME || 'Telemed Tracking'

  if (isLoading) {
    return (
      <div className="min-h-svh flex items-center justify-center bg-[#f5f5f7]">
        <LoadingSpinner text="กำลังโหลดข้อมูล..." />
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="min-h-svh flex items-center justify-center bg-[#f5f5f7]">
        <div className="text-center">
          <p className="text-[#1d1d1f] text-lg font-semibold">ไม่สามารถโหลดข้อมูลได้</p>
          <p className="text-[rgba(0,0,0,0.48)] text-sm mt-2">{error?.message ?? 'Unknown error'}</p>
        </div>
      </div>
    )
  }

  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const tomorrowStr = format(addDays(new Date(), 1), 'yyyy-MM-dd')
  const todayAppts = stats.upcoming_appointments.filter((a) => a.service_date === todayStr)
  const tomorrowAppts = stats.upcoming_appointments.filter((a) => a.service_date === tomorrowStr)

  return (
    <div className="min-h-svh bg-[#f5f5f7]">
      {/* Hero — dark background */}
      <section className="bg-[#000000] text-white py-16">
        <div className="max-w-[980px] mx-auto px-4">
          <h1
            className="text-3xl md:text-5xl font-semibold tracking-tight leading-[1.07]"
            style={{ letterSpacing: '-0.28px' }}
          >
            {appName}
          </h1>
          <p className="text-white/70 mt-3 text-lg md:text-xl leading-relaxed">
            ระบบติดตามการดำเนินงาน Telemedicine — สสอ.สอง จังหวัดแพร่
          </p>
          {/* Quick summary pills */}
          <div className="flex flex-wrap gap-3 mt-6">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-2 text-sm">
              <Activity className="h-4 w-4 text-[#2997ff]" />
              วันนี้ {todayAppts.reduce((s, a) => s + a.appoint_count, 0)} นัด
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-2 text-sm">
              พรุ่งนี้ {tomorrowAppts.reduce((s, a) => s + a.appoint_count, 0)} นัด
            </span>
          </div>

          {/* Login button */}
          <div className="mt-8">
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white text-black hover:bg-white/90 px-6 py-2 text-sm font-medium transition-colors"
            >
              <LogIn className="h-4 w-4" />
              เข้าสู่ระบบ
            </Link>
          </div>
        </div>
      </section>

      <div className="max-w-[980px] mx-auto px-4 py-10 flex flex-col gap-12">
        {/* Key Metrics */}
        <section>
          <StatsCards stats={stats} />
        </section>

        {/* Equipment Readiness */}
        <section>
          <h2
            className="text-2xl font-semibold text-[#1d1d1f] mb-5 tracking-tight"
            style={{ letterSpacing: '-0.01em' }}
          >
            สถานะความพร้อมอุปกรณ์
          </h2>
          <EquipmentStatusGrid items={stats.equipment_status} />
        </section>

        {/* Upcoming Appointments */}
        <section className="rounded-lg bg-white p-6 shadow-[0_3px_15px_rgba(0,0,0,0.08)]">
          <h2
            className="text-2xl font-semibold text-[#1d1d1f] mb-5 tracking-tight"
            style={{ letterSpacing: '-0.01em' }}
          >
            นัดใน 7 วันข้างหน้า
          </h2>
          <UpcomingAppointments appointments={stats.upcoming_appointments} />
        </section>

        {/* Attendance by Facility */}
        <section className="rounded-lg bg-white p-6 shadow-[0_3px_15px_rgba(0,0,0,0.08)]">
          <h2
            className="text-2xl font-semibold text-[#1d1d1f] mb-5 tracking-tight"
            style={{ letterSpacing: '-0.01em' }}
          >
            อัตราการเข้ารับบริการ
          </h2>
          <AttendanceChart data={stats.attendance_by_facility} />
        </section>

        {/* Follow-up Status */}
        <section>
          <h2
            className="text-2xl font-semibold text-[#1d1d1f] mb-5 tracking-tight"
            style={{ letterSpacing: '-0.01em' }}
          >
            สถานะการติดตามผู้ป่วย
          </h2>
          <FollowupPipeline pipeline={stats.followup_pipeline} />
        </section>
      </div>

      {/* Footer */}
      <footer className="bg-[#f5f5f7] py-6">
        <div className="max-w-[980px] mx-auto px-4 text-center">
          <p className="text-xs text-[rgba(0,0,0,0.48)]">
            {appName} — สสอ.สอง จังหวัดแพร่ ·{' '}
            <Link to="/about" className="text-[#0066cc] hover:underline">
              เกี่ยวกับระบบ
            </Link>
          </p>
        </div>
      </footer>
    </div>
  )
}
