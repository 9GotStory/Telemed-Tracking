import { useState, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { QueryError } from '@/components/common/QueryError'
import { StatusBadge } from '@/components/common/StatusBadge'
import { DatePicker } from '@/components/common/DatePicker'
import { useScheduleList } from '@/modules/module3/useSchedule'
import { useReadinessList } from './useReadiness'
import { ReadinessChecklist } from './ReadinessChecklist'
import { ReadinessHistory } from './ReadinessHistory'
import { format, addDays } from 'date-fns'
import { th } from 'date-fns/locale'
import { ClipboardCheck, History, RotateCcw } from 'lucide-react'
import { useDebugMount } from '@/hooks/useDebugLog'
import { READINESS_STATUS_VARIANT, READINESS_STATUS_LABEL } from '@/types/readiness'
import type { OverallStatus } from '@/types/readiness'

interface ChecklistDialogState {
  hospCode: string
  hospName: string
  open: boolean
}

interface HistoryDialogState {
  hospCode: string
  hospName: string
  open: boolean
}

function getTomorrow(): Date {
  const d = addDays(new Date(), 1)
  d.setHours(0, 0, 0, 0)
  return d
}

export default function ReadinessPage() {
  useDebugMount('ReadinessPage')
  const [selectedDate, setSelectedDate] = useState<Date>(getTomorrow)
  const [uncheckedOnly, setUncheckedOnly] = useState(false)
  const [checklistDialog, setChecklistDialog] = useState<ChecklistDialogState>({ hospCode: '', hospName: '', open: false })
  const [historyDialog, setHistoryDialog] = useState<HistoryDialogState>({ hospCode: '', hospName: '', open: false })

  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd')
  const selectedMonth = format(selectedDate, 'yyyy-MM')

  // Get schedules for the selected date's month
  const { data: schedules = [], isLoading: schedulesLoading, isError: schedulesError, refetch: refetchSchedules } = useScheduleList({ month: selectedMonth })

  // Get readiness logs for the selected date
  const { data: readinessLogs = [], isLoading: readinessLoading, isError: readinessError, refetch: refetchReadiness } = useReadinessList({ check_date: selectedDateStr })

  // Build facility list from schedules on selected date
  const facilitiesWithClinics = useMemo(() => {
    const map = new Map<string, string>()
    for (const s of schedules) {
      if (s.service_date === selectedDateStr) {
        if (!map.has(s.hosp_code)) {
          map.set(s.hosp_code, s.hosp_name ?? s.hosp_code)
        }
      }
    }
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1], 'th'))
  }, [schedules, selectedDateStr])

  // Build readiness lookup by hosp_code for selected date
  const readinessByHosp = useMemo(() => {
    const map = new Map<string, typeof readinessLogs[number]>()
    for (const log of readinessLogs) {
      map.set(log.hosp_code, log)
    }
    return map
  }, [readinessLogs])

  // Filter to show only unchecked if toggle is on
  const displayedFacilities = useMemo(() => {
    if (!uncheckedOnly) return facilitiesWithClinics
    return facilitiesWithClinics.filter(([code]) => !readinessByHosp.has(code))
  }, [facilitiesWithClinics, uncheckedOnly, readinessByHosp])

  // Get history for selected facility — only fetch when dialog is open
  const { data: historyLogs = [] } = useReadinessList(
    { hosp_code: historyDialog.hospCode },
    { enabled: historyDialog.open },
  )

  const isLoading = schedulesLoading || readinessLoading
  const tomorrowStr = useMemo(() => format(addDays(new Date(), 1), 'yyyy-MM-dd'), [])
  const isTomorrow = selectedDateStr === tomorrowStr

  return (
    <PageWrapper>
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">ตรวจสอบความพร้อม</h1>
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={uncheckedOnly}
              onChange={(e) => setUncheckedOnly(e.target.checked)}
              className="h-4 w-4 rounded border-border"
            />
            แสดงเฉพาะที่ยังไม่ตรวจ
          </label>
        </div>

        {/* Date Picker */}
        <div className="flex items-center gap-3">
          <DatePicker
            value={selectedDate}
            onChange={(date) => {
              if (date) {
                const d = new Date(date)
                d.setHours(0, 0, 0, 0)
                setSelectedDate(d)
              }
            }}
            placeholder="เลือกวันที่บริการ"
            className="w-[260px]"
          />
          {!isTomorrow && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedDate(getTomorrow())}
              title="กลับไปพรุ่งนี้"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1" />
              พรุ่งนี้
            </Button>
          )}
          <span className="text-sm text-muted-foreground">
            รพ.สต. ที่มีคลินิกวันที่ {format(selectedDate, 'd MMMM yyyy', { locale: th })}
            {' '}({facilitiesWithClinics.length} แห่ง)
          </span>
        </div>

        {/* Content */}
        {isLoading ? (
          <LoadingSpinner text="กำลังโหลดข้อมูล..." />
        ) : (schedulesError || readinessError) ? (
          <QueryError onRetry={() => { refetchSchedules(); refetchReadiness() }} />
        ) : displayedFacilities.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            ไม่มีคลินิกในวันที่ {format(selectedDate, 'd MMMM yyyy', { locale: th })}
          </div>
        ) : (
          <div className="grid gap-3">
            {displayedFacilities.map(([hospCode, hospName]) => {
              const log = readinessByHosp.get(hospCode)
              const isChecked = !!log

              return (
                <div
                  key={hospCode}
                  className="rounded-md border px-4 py-3 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-sm">{hospName}</span>
                    {isChecked ? (
                      <StatusBadge variant={READINESS_STATUS_VARIANT[log.overall_status as OverallStatus] ?? 'pending'}>
                        {READINESS_STATUS_LABEL[log.overall_status as OverallStatus] ?? log.overall_status}
                      </StatusBadge>
                    ) : (
                      <StatusBadge variant="pending">ยังไม่ตรวจ</StatusBadge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant={isChecked ? 'outline' : 'default'}
                      className={!isChecked ? 'bg-apple-blue hover:bg-apple-blue/90' : ''}
                      onClick={() => setChecklistDialog({ hospCode, hospName, open: true })}
                    >
                      <ClipboardCheck className="h-3.5 w-3.5 mr-1" />
                      {isChecked ? 'ตรวจใหม่' : 'ตรวจสอบ'}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setHistoryDialog({ hospCode, hospName, open: true })}
                    >
                      <History className="h-3.5 w-3.5 mr-1" />
                      ประวัติ
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Checklist Dialog */}
      <Dialog
        open={checklistDialog.open}
        onOpenChange={(open) => setChecklistDialog((prev) => ({ ...prev, open }))}
      >
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>ตรวจสอบความพร้อม</DialogTitle>
          </DialogHeader>
          <ReadinessChecklist
            hospCode={checklistDialog.hospCode}
            hospName={checklistDialog.hospName}
            checkDate={selectedDateStr}
            existingLog={readinessByHosp.get(checklistDialog.hospCode) ?? null}
            onSuccess={() => setChecklistDialog((prev) => ({ ...prev, open: false }))}
          />
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog
        open={historyDialog.open}
        onOpenChange={(open) => setHistoryDialog((prev) => ({ ...prev, open }))}
      >
        <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>ประวัติการตรวจสอบ — {historyDialog.hospName}</DialogTitle>
          </DialogHeader>
          <ReadinessHistory data={historyLogs} />
        </DialogContent>
      </Dialog>
    </PageWrapper>
  )
}
