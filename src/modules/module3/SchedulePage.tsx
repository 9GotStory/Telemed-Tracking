import { useState, useMemo } from 'react'
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { QueryError } from '@/components/common/QueryError'
import { useAuthStore } from '@/stores/authStore'
import { useScheduleList } from './useSchedule'
import { ScheduleGrid } from './ScheduleGrid'
import { ScheduleForm } from './ScheduleForm'
import { CLINIC_TYPES } from '@/constants/clinicTypes'
import type { ClinicScheduleWithActual } from '@/types/schedule'
import type { ClinicType } from '@/constants/clinicTypes'
import { startOfWeek, addWeeks, addDays, format, subWeeks } from 'date-fns'
import { th } from 'date-fns/locale'
import { useDebugMount } from '@/hooks/useDebugLog'

export default function SchedulePage() {
  useDebugMount('SchedulePage')
  const { user } = useAuthStore()
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [clinicFilter, setClinicFilter] = useState<string>('all')
  const [formOpen, setFormOpen] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState<ClinicScheduleWithActual | null>(null)

  // Compute month filter — fetch both months when week spans a boundary
  const months = useMemo(() => {
    const m1 = format(weekStart, 'yyyy-MM')
    const m2 = format(addDays(weekStart, 6), 'yyyy-MM')
    return m1 === m2 ? [m1] : [m1, m2]
  }, [weekStart])

  // Use the first month for the query (schedules for second month will be fetched in a second query if needed)
  const filters = useMemo(() => {
    const f: { month: string; clinic_type?: ClinicType } = { month: months[0] }
    if (clinicFilter !== 'all') f.clinic_type = clinicFilter as ClinicType
    return f
  }, [months, clinicFilter])

  const filters2 = useMemo(() => {
    if (months.length < 2) return null
    const f: { month: string; clinic_type?: ClinicType } = { month: months[1] }
    if (clinicFilter !== 'all') f.clinic_type = clinicFilter as ClinicType
    return f
  }, [months, clinicFilter])

  const { data: schedules1 = [], isLoading: loading1, isError: error1, refetch: refetch1 } = useScheduleList(filters)
  const { data: schedules2 = [], isLoading: loading2, isError: error2, refetch: refetch2 } = useScheduleList(
    filters2 ?? {},
    { enabled: !!filters2 },
  )

  const schedules = useMemo(() => {
    if (months.length === 1) return schedules1
    // Deduplicate by schedule_id in case of overlap
    const seen = new Set<string>()
    const merged = [...schedules1, ...schedules2].filter((s) => {
      if (seen.has(s.schedule_id)) return false
      seen.add(s.schedule_id)
      return true
    })
    return merged
  }, [months.length, schedules1, schedules2])

  const isLoading = loading1 || (filters2 && loading2)

  const canCreate = user?.role === 'admin_hosp' || user?.role === 'super_admin'

  const handlePrevWeek = () => setWeekStart((prev) => subWeeks(prev, 1))
  const handleNextWeek = () => setWeekStart((prev) => addWeeks(prev, 1))
  const handleToday = () => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))

  const handleEdit = (schedule: ClinicScheduleWithActual) => {
    setEditingSchedule(schedule)
    setFormOpen(true)
  }

  const handleAdd = () => {
    setEditingSchedule(null)
    setFormOpen(true)
  }

  return (
    <PageWrapper>
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">ตารางคลินิก</h1>
          {canCreate && (
            <Button
              className="bg-apple-blue hover:bg-apple-blue/90"
              onClick={handleAdd}
            >
              <Plus className="h-4 w-4 mr-1" />
              เพิ่มตาราง
            </Button>
          )}
        </div>

        {/* Navigation & Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Week navigation */}
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={handlePrevWeek}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleToday} className="text-xs px-2">
              วันนี้
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleNextWeek}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium ml-1">
              {format(weekStart, 'd MMM yyyy', { locale: th })} — {format(addDays(weekStart, 6), 'd MMM yyyy', { locale: th })}
            </span>
          </div>

          {/* Clinic type filter */}
          <Select value={clinicFilter} onValueChange={(v) => { if (v) setClinicFilter(v) }} items={[{ label: 'ทุกประเภท', value: 'all' }, ...CLINIC_TYPES.map(ct => ({ label: ct.label, value: ct.value }))]}>
            <SelectTrigger className="w-44 ml-auto">
              <SelectValue placeholder="ทุกประเภท" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all">ทุกประเภท</SelectItem>
                {CLINIC_TYPES.map((ct) => (
                  <SelectItem key={ct.value} value={ct.value}>{ct.label}</SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        {/* Content */}
        {isLoading ? (
          <LoadingSpinner text="กำลังโหลดตาราง..." />
        ) : (error1 || error2) ? (
          <QueryError onRetry={() => { refetch1(); refetch2() }} />
        ) : (
          <ScheduleGrid
            data={schedules}
            weekStart={weekStart}
            onEdit={handleEdit}
          />
        )}
      </div>

      {/* Add/Edit Form Dialog */}
      <ScheduleForm
        open={formOpen}
        onOpenChange={setFormOpen}
        schedule={editingSchedule}
        defaultHospCode={user?.role === 'staff_hsc' ? user.hosp_code : undefined}
      />
    </PageWrapper>
  )
}
