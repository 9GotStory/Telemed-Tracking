import { useState, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { StatusBadge } from '@/components/common/StatusBadge'
import { TelemedLinkInput } from './TelemedLinkInput'
import { useScheduleRecordIncident } from './useSchedule'
import { CLINIC_TYPES } from '@/constants/clinicTypes'
import type { ClinicScheduleWithActual } from '@/types/schedule'
import { useAuthStore } from '@/stores/authStore'
import { format, parseISO, addDays } from 'date-fns'
import { th } from 'date-fns/locale'
import { Pencil, Users, Video, Truck } from 'lucide-react'

interface ScheduleGridProps {
  data: ClinicScheduleWithActual[]
  weekStart: Date // Monday of the displayed week (or monthStart for staff_hsc)
  onEdit: (item: ClinicScheduleWithActual) => void
}

const THAI_DAYS = ['จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์', 'อาทิตย์']

/** Map JS Date.getDay() (0=Sun) to THAI_DAYS index (Mon=0, Sun=6) */
function getThaiDayIndex(date: Date): number {
  const day = date.getDay()
  return day === 0 ? 6 : day - 1
}

/** Format "2026-04-26" → "26 เมษายน 2026" with Thai locale fallback */
function formatThaiDate(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'd MMMM yyyy', { locale: th })
  } catch {
    return dateStr
  }
}

function getClinicLabel(clinicType: string): string {
  const found = CLINIC_TYPES.find((ct) => ct.value === clinicType)
  return found ? found.label : clinicType
}

export function ScheduleGrid({ data, weekStart, onEdit }: ScheduleGridProps) {
  const { user } = useAuthStore()
  const isStaffHsc = user?.role === 'staff_hsc'
  const [selectedSchedule, setSelectedSchedule] = useState<ClinicScheduleWithActual | null>(null)
  const [incidentNote, setIncidentNote] = useState('')
  const recordIncidentMutation = useScheduleRecordIncident()

  // Build 7-day columns starting from weekStart (only used for non-staff_hsc)
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  }, [weekStart])

  // Monthly grouped data for staff_hsc
  const monthlyDays = useMemo(() => {
    const grouped = new Map<string, ClinicScheduleWithActual[]>()
    for (const s of data) {
      const arr = grouped.get(s.service_date) ?? []
      arr.push(s)
      grouped.set(s.service_date, arr)
    }
    return Array.from(grouped.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, schedules]) => ({
        date,
        thaiDayIdx: getThaiDayIndex(parseISO(date)),
        schedules,
      }))
  }, [data])

  // Group schedules by hosp_code (only used for non-staff_hsc grid)
  const facilities = useMemo(() => {
    if (isStaffHsc) return []
    const map = new Map<string, string>()
    for (const s of data) {
      if (!map.has(s.hosp_code)) {
        map.set(s.hosp_code, s.hosp_name ?? s.hosp_code)
      }
    }
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1], 'th'))
  }, [data, isStaffHsc])

  // Build lookup: hosp_code + date string → schedules (only used for non-staff_hsc grid)
  const cellMap = useMemo(() => {
    if (isStaffHsc) return new Map<string, ClinicScheduleWithActual[]>()
    const map = new Map<string, ClinicScheduleWithActual[]>()
    for (const s of data) {
      const key = `${s.hosp_code}|${s.service_date}`
      const arr = map.get(key) ?? []
      arr.push(s)
      map.set(key, arr)
    }
    return map
  }, [data, isStaffHsc])

  const handleOpenDetail = (schedule: ClinicScheduleWithActual) => {
    setSelectedSchedule(schedule)
    setIncidentNote(schedule.incident_note ?? '')
  }

  const handleSaveIncident = () => {
    if (!selectedSchedule || recordIncidentMutation.isPending) return
    recordIncidentMutation.mutate(
      { scheduleId: selectedSchedule.schedule_id, incidentNote },
      {
        onSuccess: () => {
          setSelectedSchedule(null)
        },
      },
    )
  }

  // Format date to YYYY-MM-DD
  const dateStr = (d: Date) => format(d, 'yyyy-MM-dd')

  return (
    <>
      {/* Empty state */}
      {data.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          {isStaffHsc ? 'ไม่พบตารางคลินิกในเดือนนี้' : 'ไม่พบตารางคลินิกในสัปดาห์นี้'}
        </div>
      )}

      {data.length > 0 && isStaffHsc && (
        /* Monthly list view for staff_hsc — shows all scheduled days in the month */
        <div className="flex flex-col gap-3">
          {monthlyDays.map(({ date, thaiDayIdx, schedules: daySchedules }) => (
            <div key={date} className="rounded-md border">
              <div className="bg-btn-default-light/50 px-3 py-2 font-semibold text-sm">
                {THAI_DAYS[thaiDayIdx]} — {formatThaiDate(date)}
              </div>
              <div className="divide-y">
                {daySchedules.map((s) => (
                  <button
                    key={s.schedule_id}
                    type="button"
                    onClick={() => handleOpenDetail(s)}
                    className="w-full text-left px-3 py-2 hover:bg-btn-default-light/30 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <StatusBadge variant="info">{getClinicLabel(s.clinic_type)}</StatusBadge>
                      <span className="text-xs text-muted-foreground">{s.service_time}</span>
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-0.5">
                        <Users className="h-3 w-3" />
                        {s.actual_count ?? 0}/{s.appoint_count}
                      </span>
                      {s.telemed_link && (
                        <span className="inline-flex items-center gap-0.5 text-apple-blue">
                          <Video className="h-3 w-3" />
                          Telemed
                        </span>
                      )}
                      {s.drug_delivery_date && (
                        <span className="inline-flex items-center gap-0.5 text-emerald-500">
                          <Truck className="h-3 w-3" />
                          {formatThaiDate(s.drug_delivery_date)}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {data.length > 0 && !isStaffHsc && (
        <>
          {/* Desktop: Weekly grid table */}
          <div className="hidden md:block overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-btn-default-light/50">
                  <th className="sticky left-0 z-10 bg-btn-default-light/90 px-3 py-2 text-left font-semibold min-w-[120px]">
                    รพ.สต.
                  </th>
                  {weekDays.map((day, i) => (
                    <th key={dateStr(day)} className="px-2 py-2 text-center font-semibold min-w-[120px]">
                      <div className="text-xs text-muted-foreground">{THAI_DAYS[i]}</div>
                      <div className="text-sm">
                        {format(day, 'd MMM', { locale: th })}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {facilities.map(([hospCode, hospName]) => (
                  <tr key={hospCode} className="border-t hover:bg-btn-default-light/20">
                    <td className="sticky left-0 z-10 bg-background px-3 py-1.5 font-medium text-xs">
                      {hospName}
                    </td>
                    {weekDays.map((day) => {
                      const key = `${hospCode}|${dateStr(day)}`
                      const schedules = cellMap.get(key) ?? []
                      return (
                        <td key={key} className="px-1.5 py-1 align-top">
                          {schedules.map((s) => (
                            <button
                              key={s.schedule_id}
                              type="button"
                              onClick={() => handleOpenDetail(s)}
                              className="w-full text-left rounded-md px-2 py-1 mb-1 hover:bg-btn-default-light/50 transition-colors"
                            >
                              <div className="text-xs font-medium truncate">
                                {getClinicLabel(s.clinic_type)}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {s.service_time}
                              </div>
                              <div className="flex items-center gap-1.5 text-xs mt-0.5">
                                <span className="inline-flex items-center gap-0.5 text-muted-foreground" title="ผู้ป่วย">
                                  <Users className="h-3 w-3" />
                                  {s.actual_count ?? 0}/{s.appoint_count}
                                </span>
                                {s.telemed_link && (
                                  <span title="มีลิงก์ Telemed">
                                    <Video className="h-3 w-3 text-apple-blue" />
                                  </span>
                                )}
                                {s.drug_delivery_date && (
                                  <span title={`จัดส่งยา ${formatThaiDate(s.drug_delivery_date)}`}>
                                    <Truck className="h-3 w-3 text-emerald-500" />
                                  </span>
                                )}
                              </div>
                            </button>
                          ))}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile: Scrollable day-by-day list */}
          <div className="md:hidden flex flex-col gap-3">
            {weekDays.map((day, dayIdx) => {
              const daySchedules = data.filter((s) => s.service_date === dateStr(day))
              if (daySchedules.length === 0) return null
              return (
                <div key={dateStr(day)} className="rounded-md border">
                  <div className="bg-btn-default-light/50 px-3 py-2 font-semibold text-sm">
                    {THAI_DAYS[dayIdx]} — {format(day, 'd MMMM yyyy', { locale: th })}
                  </div>
                  <div className="divide-y">
                    {daySchedules.map((s) => (
                      <button
                        key={s.schedule_id}
                        type="button"
                        onClick={() => handleOpenDetail(s)}
                        className="w-full text-left px-3 py-2 hover:bg-btn-default-light/30 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{s.hosp_name ?? s.hosp_code}</span>
                          <StatusBadge variant="info">{getClinicLabel(s.clinic_type)}</StatusBadge>
                        </div>
                        <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{s.service_time}</span>
                          <span className="inline-flex items-center gap-0.5">
                            <Users className="h-3 w-3" />
                            {s.actual_count ?? 0}/{s.appoint_count}
                          </span>
                          {s.telemed_link && (
                            <Video className="h-3 w-3 text-apple-blue" />
                          )}
                          {s.drug_delivery_date && (
                            <Truck className="h-3 w-3 text-emerald-500" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!selectedSchedule} onOpenChange={(open) => { if (!open) setSelectedSchedule(null) }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedSchedule && (
                <>
                  {selectedSchedule.hosp_name ?? selectedSchedule.hosp_code}
                  <StatusBadge variant="info">
                    {getClinicLabel(selectedSchedule.clinic_type)}
                  </StatusBadge>
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          {selectedSchedule && (
            <div className="grid gap-4">
              {/* Schedule info */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">วันที่</span>
                  <div className="font-medium">
                    {formatThaiDate(selectedSchedule.service_date)}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">เวลา</span>
                  <div className="font-medium">{selectedSchedule.service_time}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">นัดหมาย</span>
                  <div className="font-medium">{selectedSchedule.appoint_count} คน</div>
                </div>
                <div>
                  <span className="text-muted-foreground">มารับบริการ</span>
                  <div className="font-medium">{selectedSchedule.actual_count ?? 0} คน</div>
                </div>
                {selectedSchedule.drug_delivery_date && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground">วันที่จัดส่งยา ไป รพ.สต.</span>
                    <div className="font-medium">{formatThaiDate(selectedSchedule.drug_delivery_date)}</div>
                  </div>
                )}
              </div>

              {/* Telemed Link */}
              <div className="grid gap-1.5">
                <span className="text-sm text-muted-foreground">ลิงก์ Telemed</span>
                <TelemedLinkInput
                  scheduleId={selectedSchedule.schedule_id}
                  currentLink={selectedSchedule.telemed_link}
                />
              </div>

              {/* Incident Note */}
              <div className="grid gap-1.5">
                <Label>บันทึกเหตุการณ์</Label>
                <Textarea
                  value={incidentNote}
                  onChange={(e) => setIncidentNote(e.target.value)}
                  rows={2}
                  placeholder="บันทึกปัญหาหรือเหตุการณ์ระหว่างให้บริการ..."
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleSaveIncident}
                  disabled={recordIncidentMutation.isPending || incidentNote === (selectedSchedule.incident_note ?? '')}
                  className="self-end"
                >
                  {recordIncidentMutation.isPending ? 'กำลังบันทึก...' : 'บันทึกเหตุการณ์'}
                </Button>
              </div>

              {/* Edit button — admin only */}
              {(user?.role === 'admin_hosp' || user?.role === 'super_admin') && (
                <div className="flex justify-end pt-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedSchedule(null)
                      onEdit(selectedSchedule)
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5 mr-1" />
                    แก้ไขตาราง
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
