import { useState, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { TelegramSettings } from './TelegramSettings'
import { AuditLogTable } from './AuditLogTable'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { settingsService, type VerifyReport } from '@/services/settingsService'
import { debug } from '@/utils/debugLogger'
import { useDebugMount } from '@/hooks/useDebugLog'

export default function SettingsPage() {
  useDebugMount('SettingsPage')
  const [report, setReport] = useState<VerifyReport | null>(null)
  const [debugEnabled, setDebugEnabled] = useState(debug.isEnabled())

  const verifyMutation = useMutation({
    mutationFn: () => settingsService.verifySheets(),
    onSuccess: (data) => setReport(data),
    onError: (err) => toast.error('Verification failed', { description: err.message }),
  })

  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === 'telemed_debug_enabled') {
        setDebugEnabled(e.newValue === 'true')
      }
    }
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }, [])

  return (
    <PageWrapper>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">ตั้งค่าระบบ</h1>
          <p className="text-sm text-muted-foreground mt-1">
            ตั้งค่าการแจ้งเตือน Telegram และอื่นๆ
          </p>
        </div>

        <div className="rounded-lg border bg-white p-6">
          <h2 className="text-lg font-medium mb-4">Telegram Notification</h2>
          <TelegramSettings />
        </div>

        <div className="rounded-lg border bg-white p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium">ตรวจสอบโครงสร้าง Sheet</h2>
            <Button size="sm" variant="outline" onClick={() => verifyMutation.mutate()} disabled={verifyMutation.isPending}>
              {verifyMutation.isPending ? 'กำลังตรวจสอบ...' : 'ตรวจสอบ'}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            ตรวจสอบว่า header ของ Google Sheet ตรงกับโครงสร้างที่ระบบคาดหวัง — ช่วยป้องกันปัญหาข้อมูลเลื่อนคอลัมน์
          </p>

          {verifyMutation.isError && (
            <p className="text-sm text-destructive mb-3">{verifyMutation.error.message}</p>
          )}

          {report && (
            <div className="space-y-3">
              <div className={`rounded-md border p-3 text-sm font-medium ${
                report.ok
                  ? 'border-green-200 bg-green-50 text-green-800'
                  : 'border-red-200 bg-red-50 text-red-800'
              }`}>
                {report.ok ? 'ทุก Sheet ถูกต้อง' : 'พบความไม่ตรงกันในบาง Sheet — ดูรายละเอียดด้านล่าง'}
              </div>
              {Object.entries(report.sheets).map(([name, sheet]) => (
                <div key={name} className={`rounded-md border p-3 ${sheet.ok ? 'border-green-100' : 'border-red-200 bg-red-50/50'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`inline-block w-2 h-2 rounded-full ${sheet.ok ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className="font-medium text-sm">{name}</span>
                    <span className="text-xs text-muted-foreground">
                      ({sheet.ok ? `${sheet.expected.length} columns OK` : `${sheet.mismatches?.length ?? 0} mismatch(es)`})
                    </span>
                  </div>
                  {sheet.error && (
                    <p className="text-xs text-destructive ml-4">{sheet.error}</p>
                  )}
                  {sheet.mismatches && sheet.mismatches.length > 0 && (
                    <div className="ml-4 mt-1 space-y-1">
                      {sheet.mismatches.map((m, i) => (
                        <p key={i} className="text-xs text-red-700">
                          Column {m.index}: expected <code className="bg-white px-1 rounded">{m.expected}</code>{' '}
                          but got <code className="bg-white px-1 rounded">{m.actual || '(empty)'}</code>
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-lg border bg-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-medium">Debug Logging</h2>
              <p className="text-sm text-muted-foreground mt-1">
                เปิด/ปิด debug logging สำหรับ Browser Console — ใช้เฉพาะการพัฒนา
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="debug-toggle"
                checked={debugEnabled}
                onCheckedChange={(checked) => {
                  if (checked) debug.enable()
                  else debug.disable()
                  setDebugEnabled(checked)
                }}
              />
              <Label htmlFor="debug-toggle" className="text-sm">
                {debugEnabled ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
              </Label>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-white p-6">
          <h2 className="text-lg font-medium mb-4">Audit Log</h2>
          <AuditLogTable />
        </div>
      </div>
    </PageWrapper>
  )
}
