import { useState } from 'react'
import { useAuditLogList } from './useAuditLog'
import { QueryError } from '@/components/common/QueryError'
import { formatBuddhist } from '@/utils/dateUtils'
import { maskAuditValue } from '@/utils/sensitiveData'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import type { AuditLogItem } from '@/services/auditLogService'

function formatTimestamp(iso: string): string {
  if (!iso) return '-'
  const [date, time] = iso.split('T')
  return formatBuddhist(date) + ' ' + (time || '').substring(0, 5)
}

function actionColor(action: string): string {
  switch (action) {
    case 'CREATE': return 'bg-green-100 text-green-800'
    case 'DELETE': return 'bg-red-100 text-red-800'
    case 'IMPORT': case 'IMPORT_CONFIRM': return 'bg-blue-100 text-blue-800'
    case 'APPROVE': return 'bg-amber-100 text-amber-800'
    case 'REJECT': case 'SUSPEND': return 'bg-red-100 text-red-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

function ValueBlock({ label, value }: { label: string; value: string | null }) {
  if (!value) return null
  const masked = maskAuditValue(value)
  const isJson = masked.startsWith('{') && masked.endsWith('}')

  return (
    <div className="space-y-1">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {isJson ? (
        <pre className="rounded-md bg-muted p-3 text-xs leading-relaxed whitespace-pre-wrap break-all font-mono">
          {JSON.stringify(JSON.parse(masked), null, 2)}
        </pre>
      ) : (
        <div className="rounded-md bg-muted px-3 py-2 text-xs break-all font-mono">
          {masked}
        </div>
      )}
    </div>
  )
}

function DetailDialog({ log, open, onOpenChange }: {
  log: AuditLogItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  if (!log) return null

  const hasValues = !!(log.old_value || log.new_value)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Audit Log Detail</DialogTitle>
          <DialogDescription className="sr-only">
            รายละเอียดการกระทำของผู้ใช้ {log.user_id.substring(0, 8)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-xs text-muted-foreground">เวลา</span>
              <p className="font-mono text-xs mt-0.5">{formatTimestamp(log.created_at)}</p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">ผู้ใช้</span>
              <p className="font-mono text-xs mt-0.5">{log.user_id.substring(0, 8)}...</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-xs text-muted-foreground">การกระทำ</span>
              <div className="mt-0.5">
                <span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-semibold ${actionColor(log.action)}`}>
                  {log.action}
                </span>
              </div>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">โมดูล</span>
              <p className="text-xs mt-0.5">{log.module}</p>
            </div>
          </div>

          <div>
            <span className="text-xs text-muted-foreground">เป้าหมาย</span>
            <p className="font-mono text-xs mt-0.5 break-all">{log.target_id || '-'}</p>
          </div>

          {hasValues && (
            <div className="space-y-2 pt-1 border-t">
              <ValueBlock label="ค่าเดิม" value={log.old_value} />
              <ValueBlock label="ค่าใหม่" value={log.new_value} />
            </div>
          )}

          {!hasValues && (
            <p className="text-xs text-muted-foreground italic pt-1 border-t">ไม่มีรายละเอียดการเปลี่ยนแปลง</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function AuditLogTable() {
  const { data: logs = [], isLoading, isError, refetch } = useAuditLogList(200)
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null)

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">กำลังโหลด...</div>
  }

  if (isError) {
    return <QueryError onRetry={() => refetch()} />
  }

  if (logs.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">ไม่มีข้อมูล Audit Log</div>
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="pb-2 pr-3 font-medium">เวลา</th>
              <th className="pb-2 pr-3 font-medium">ผู้ใช้</th>
              <th className="pb-2 pr-3 font-medium">การกระทำ</th>
              <th className="pb-2 pr-3 font-medium">โมดูล</th>
              <th className="pb-2 pr-3 font-medium">เป้าหมาย</th>
              <th className="pb-2 font-medium">รายละเอียด</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr
                key={log.log_id}
                className="border-b hover:bg-muted/30 cursor-pointer"
                onClick={() => setSelectedLog(log)}
              >
                <td className="py-2 pr-3 text-muted-foreground whitespace-nowrap">
                  {formatTimestamp(log.created_at)}
                </td>
                <td className="py-2 pr-3 font-mono text-xs">{log.user_id.substring(0, 8)}...</td>
                <td className="py-2 pr-3">
                  <span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-semibold ${actionColor(log.action)}`}>
                    {log.action}
                  </span>
                </td>
                <td className="py-2 pr-3 text-muted-foreground">{log.module}</td>
                <td className="py-2 pr-3 font-mono text-xs">
                  {log.target_id ? (log.target_id.length > 12 ? log.target_id.substring(0, 12) + '...' : log.target_id) : '-'}
                </td>
                <td className="py-2 text-xs text-muted-foreground">
                  {log.old_value || log.new_value ? (
                    <span className="text-primary hover:underline">ดู</span>
                  ) : (
                    <span className="text-muted-foreground/50">-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <DetailDialog
        log={selectedLog}
        open={selectedLog !== null}
        onOpenChange={(open) => { if (!open) setSelectedLog(null) }}
      />
    </>
  )
}
