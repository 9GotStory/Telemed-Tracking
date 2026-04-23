import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { StatusBadge } from '@/components/common/StatusBadge'
import { useReadinessSave } from './useReadiness'
import type { ReadinessFormValues } from '@/services/readinessService'
import type { ReadinessLogWithHospName, OverallStatus } from '@/types/readiness'

const CHECKLIST_ITEMS = [
  { key: 'cam_ok' as const, label: 'กล้อง (Camera)' },
  { key: 'mic_ok' as const, label: 'ไมโครโฟน (Microphone)' },
  { key: 'pc_ok' as const, label: 'คอมพิวเตอร์ (Computer)' },
  { key: 'internet_ok' as const, label: 'อินเทอร์เน็ต (Internet)' },
  { key: 'software_ok' as const, label: 'ซอฟต์แวร์ (Software)' },
]

interface ReadinessChecklistProps {
  hospCode: string
  hospName: string
  checkDate: string
  existingLog?: ReadinessLogWithHospName | null
  onSuccess?: () => void
}

export function ReadinessChecklist({ hospCode, hospName, checkDate, existingLog, onSuccess }: ReadinessChecklistProps) {
  const saveMutation = useReadinessSave()

  const [checks, setChecks] = useState<Record<string, 'Y' | 'N'>>({
    cam_ok: 'N',
    mic_ok: 'N',
    pc_ok: 'N',
    internet_ok: 'N',
    software_ok: 'N',
  })
  const [note, setNote] = useState('')

  // Populate from existing log
  useEffect(() => {
    if (existingLog) {
      setChecks({
        cam_ok: existingLog.cam_ok,
        mic_ok: existingLog.mic_ok,
        pc_ok: existingLog.pc_ok,
        internet_ok: existingLog.internet_ok,
        software_ok: existingLog.software_ok,
      })
      setNote(existingLog.note ?? '')
    }
  }, [existingLog])

  // Compute overall status per data-model rules
  const overallStatus: OverallStatus = useMemo(() => {
    if (
      checks.cam_ok === 'Y' &&
      checks.mic_ok === 'Y' &&
      checks.pc_ok === 'Y' &&
      checks.internet_ok === 'Y' &&
      checks.software_ok === 'Y'
    ) {
      return 'ready'
    }
    if (checks.pc_ok === 'N' || checks.internet_ok === 'N') {
      return 'not_ready'
    }
    return 'need_fix'
  }, [checks])

  const statusLabel: Record<OverallStatus, string> = {
    ready: 'พร้อม',
    not_ready: 'ไม่พร้อม',
    need_fix: 'ต้องแก้ไข',
  }

  const statusVariant: Record<OverallStatus, 'active' | 'inactive' | 'pending'> = {
    ready: 'active',
    not_ready: 'inactive',
    need_fix: 'pending',
  }

  const toggleCheck = (key: string) => {
    setChecks((prev) => ({
      ...prev,
      [key]: prev[key] === 'Y' ? 'N' : 'Y',
    }))
  }

  const handleSubmit = () => {
    if (saveMutation.isPending) return

    const data: ReadinessFormValues = {
      hosp_code: hospCode,
      check_date: checkDate,
      cam_ok: checks.cam_ok,
      mic_ok: checks.mic_ok,
      pc_ok: checks.pc_ok,
      internet_ok: checks.internet_ok,
      software_ok: checks.software_ok,
      note,
    }
    if (existingLog?.log_id) {
      data.log_id = existingLog.log_id
    }

    saveMutation.mutate(data, {
      onSuccess: () => {
        onSuccess?.()
      },
    })
  }

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-sm">{hospName}</h3>
          <p className="text-xs text-muted-foreground">วันที่ตรวจ: {checkDate}</p>
        </div>
        <StatusBadge variant={statusVariant[overallStatus]}>
          {statusLabel[overallStatus]}
        </StatusBadge>
      </div>

      {/* Checklist */}
      <div className="grid gap-2">
        {CHECKLIST_ITEMS.map((item) => (
          <label
            key={item.key}
            className="flex items-center justify-between rounded-md border px-3 py-2 cursor-pointer hover:bg-btn-default-light/30 transition-colors"
          >
            <span className="text-sm">{item.label}</span>
            <button
              type="button"
              role="checkbox"
              aria-checked={checks[item.key] === 'Y'}
              onClick={() => toggleCheck(item.key)}
              className={`h-5 w-5 rounded border-2 flex items-center justify-center transition-colors ${
                checks[item.key] === 'Y'
                  ? 'bg-apple-blue border-apple-blue text-white'
                  : 'border-border bg-background'
              }`}
            >
              {checks[item.key] === 'Y' && (
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          </label>
        ))}
      </div>

      {/* Note */}
      <div className="grid gap-1.5">
        <Label>หมายเหตุ</Label>
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          placeholder="รายละเอียดเพิ่มเติม..."
        />
      </div>

      {/* Submit */}
      <Button
        className="bg-apple-blue hover:bg-apple-blue/90"
        onClick={handleSubmit}
        disabled={saveMutation.isPending}
      >
        {saveMutation.isPending ? 'กำลังบันทึก...' : existingLog ? 'อัปเดต' : 'บันทึกผลตรวจ'}
      </Button>
    </div>
  )
}
