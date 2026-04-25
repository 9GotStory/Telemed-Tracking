import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { useDashboardStats } from './useDashboard'
import { StatsCards } from './StatsCards'
import { EquipmentStatusGrid } from './EquipmentStatusGrid'
import { UpcomingAppointments } from './UpcomingAppointments'
import { AttendanceChart } from './AttendanceChart'
import { FollowupPipeline } from './FollowupPipeline'
import { useDebugMount } from '@/hooks/useDebugLog'

export default function DashboardPage() {
  useDebugMount('DashboardPage')
  const { data: stats, isLoading, error } = useDashboardStats()

  const appName = import.meta.env.VITE_APP_NAME || 'Telemed Tracking'

  if (isLoading) {
    return (
      <div className="min-h-svh flex items-center justify-center bg-light-gray">
        <LoadingSpinner text="กำลังโหลดข้อมูล..." />
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="min-h-svh flex items-center justify-center bg-light-gray">
        <div className="text-center">
          <p className="text-near-black text-lg font-medium">ไม่สามารถโหลดข้อมูลได้</p>
          <p className="text-muted-foreground text-sm mt-1">{error?.message ?? 'Unknown error'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-svh bg-light-gray">
      {/* Hero — dark background */}
      <section className="bg-near-black text-white py-12">
        <div className="max-w-[980px] mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight leading-tight">
            {appName}
          </h1>
          <p className="text-white/70 mt-2 text-lg">
            ระบบติดตามการดำเนินงาน Telemedicine — สสอ.สอง จังหวัดแพร่
          </p>
        </div>
      </section>

      <div className="max-w-[980px] mx-auto px-4 py-8 flex flex-col gap-10">
        {/* Stats Cards */}
        <section>
          <StatsCards stats={stats} />
        </section>

        {/* Equipment Readiness */}
        <section>
          <h2 className="text-xl font-semibold text-near-black mb-4">สถานะความพร้อมอุปกรณ์</h2>
          <EquipmentStatusGrid items={stats.equipment_status} />
        </section>

        {/* Upcoming Appointments */}
        <section className="rounded-lg bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
          <h2 className="text-xl font-semibold text-near-black mb-4">นัดใน 7 วันข้างหน้า</h2>
          <UpcomingAppointments appointments={stats.upcoming_appointments} />
        </section>

        {/* Attendance */}
        <section className="rounded-lg bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
          <h2 className="text-xl font-semibold text-near-black mb-4">อัตราการเข้ารับบริการ</h2>
          <AttendanceChart byClinic={stats.attendance_by_clinic} byFacility={stats.attendance_by_facility} />
        </section>

        {/* Follow-up Pipeline */}
        <section>
          <h2 className="text-xl font-semibold text-near-black mb-4">สถานะการติดตาม</h2>
          <FollowupPipeline pipeline={stats.followup_pipeline} />
        </section>
      </div>
    </div>
  )
}
