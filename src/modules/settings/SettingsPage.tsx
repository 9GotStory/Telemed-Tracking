import { PageWrapper } from '@/components/layout/PageWrapper'
import { TelegramSettings } from './TelegramSettings'
import { AuditLogTable } from './AuditLogTable'

export default function SettingsPage() {
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
          <h2 className="text-lg font-medium mb-4">Audit Log</h2>
          <AuditLogTable />
        </div>
      </div>
    </PageWrapper>
  )
}
