import { useAuditLogList } from './useAuditLog'
import { QueryError } from '@/components/common/QueryError'
import { formatBuddhist } from '@/utils/dateUtils'

export function AuditLogTable() {
  const { data: logs = [], isLoading, isError, refetch } = useAuditLogList(200)

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
            <tr key={log.log_id} className="border-b hover:bg-btn-default-light/30">
              <td className="py-2 pr-3 text-muted-foreground whitespace-nowrap">
                {log.created_at
                  ? formatBuddhist(log.created_at.split('T')[0]) + ' ' + (log.created_at.split('T')[1] || '').substring(0, 5)
                  : '-'}
              </td>
              <td className="py-2 pr-3 font-mono text-xs">{log.user_id.substring(0, 8)}...</td>
              <td className="py-2 pr-3">
                <span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-semibold ${
                  log.action === 'CREATE' ? 'bg-green-100 text-green-800' :
                  log.action === 'DELETE' ? 'bg-red-100 text-red-800' :
                  log.action === 'IMPORT' ? 'bg-blue-100 text-blue-800' :
                  log.action === 'APPROVE' ? 'bg-amber-100 text-amber-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {log.action}
                </span>
              </td>
              <td className="py-2 pr-3 text-muted-foreground">{log.module}</td>
              <td className="py-2 pr-3 font-mono text-xs">{log.target_id ? (log.target_id.length > 12 ? log.target_id.substring(0, 12) + '...' : log.target_id) : '-'}</td>
              <td className="py-2 text-xs text-muted-foreground max-w-[200px] truncate">
                {log.old_value || log.new_value ? (
                  <details>
                    <summary className="cursor-pointer hover:text-foreground">ดู</summary>
                    <div className="mt-1 space-y-1">
                      {log.old_value && <div><span className="font-medium">เก่า:</span> {log.old_value}</div>}
                      {log.new_value && <div><span className="font-medium">ใหม่:</span> {log.new_value}</div>}
                    </div>
                  </details>
                ) : '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
