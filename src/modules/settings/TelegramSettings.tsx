import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useSettingsGet, useSettingsSave } from './useSettings'

const telegramSchema = z.object({
  bot_token: z.string().min(1, 'กรุณาระบุ Bot Token'),
  chat_id: z.string().min(1, 'กรุณาระบุ Chat ID'),
  system_name: z.string().min(1, 'กรุณาระบุชื่อระบบ'),
  notify_clinic_ready: z.string(),
  notify_followup: z.string(),
  notify_new_user: z.string(),
})

type TelegramFormValues = z.infer<typeof telegramSchema>

const DEFAULTS: TelegramFormValues = {
  bot_token: '',
  chat_id: '',
  system_name: 'Telemed Tracking คปสอ.สอง',
  notify_clinic_ready: 'Y',
  notify_followup: 'Y',
  notify_new_user: 'Y',
}

const NOTIFICATION_TYPES: { key: keyof TelegramFormValues; label: string; description: string }[] = [
  {
    key: 'notify_clinic_ready',
    label: 'แจ้งเตือนคลินิกวันพรุ่งนี้',
    description: 'ส่งสรุปนัดคลินิกและสถานะอุปกรณ์ (ทุกวัน 07:00)',
  },
  {
    key: 'notify_followup',
    label: 'แจ้งเตือน Follow-up ค้างอยู่',
    description: 'ส่งรายการผู้ป่วยที่จ่ายยาแล้วแต่ยังไม่มีการติดตาม (ทุกวัน 07:00)',
  },
  {
    key: 'notify_new_user',
    label: 'แจ้งเตือนผู้ใช้ใหม่ลงทะเบียน',
    description: 'ส่งทันทีเมื่อมีผู้ใช้ใหม่ลงทะเบียน',
  },
]

export function TelegramSettings() {
  const { data: settingsData, isLoading } = useSettingsGet()
  const saveMutation = useSettingsSave()
  const [testResult, setTestResult] = useState<string | null>(null)

  // Build form defaults from settings
  const settingsMap: Record<string, string> = {}
  if (settingsData?.settings) {
    for (const entry of settingsData.settings) {
      settingsMap[entry.key] = entry.value
    }
  }

  const formValues: TelegramFormValues = {
    bot_token: settingsMap.bot_token ?? DEFAULTS.bot_token,
    chat_id: settingsMap.chat_id ?? DEFAULTS.chat_id,
    system_name: settingsMap.system_name ?? DEFAULTS.system_name,
    notify_clinic_ready: settingsMap.notify_clinic_ready ?? DEFAULTS.notify_clinic_ready,
    notify_followup: settingsMap.notify_followup ?? DEFAULTS.notify_followup,
    notify_new_user: settingsMap.notify_new_user ?? DEFAULTS.notify_new_user,
  }

  const { register, handleSubmit, getValues, control, formState: { errors } } = useForm<TelegramFormValues>({
    resolver: zodResolver(telegramSchema),
    defaultValues: formValues,
    values: formValues,
  })

  const onSubmit = (values: TelegramFormValues) => {
    setTestResult(null)
    const settings = Object.entries(values).map(([key, value]) => ({ key, value }))
    saveMutation.mutate({ settings })
  }

  const handleTestSend = handleSubmit(() => {
    setTestResult(null)
    const values = getValues()
    const settings = Object.entries(values).map(([key, value]) => ({ key, value }))

    saveMutation.mutate(
      { settings, telegram_test: true },
      {
        onSuccess: (data) => {
          setTestResult(`ส่งสำเร็จ: ${data.message}`)
        },
        onError: (err) => {
          setTestResult(`ส่งล้มเหลว: ${err.message}`)
        },
      },
    )
  })

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">กำลังโหลด...</div>
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="bot_token">Bot Token</Label>
          <Input
            id="bot_token"
            type="password"
            placeholder="123456:ABC-DEF..."
            {...register('bot_token')}
          />
          {errors.bot_token && (
            <p role="alert" className="text-xs text-destructive">{errors.bot_token.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="chat_id">Chat ID</Label>
          <Input
            id="chat_id"
            placeholder="-1001234567890"
            {...register('chat_id')}
          />
          {errors.chat_id && (
            <p role="alert" className="text-xs text-destructive">{errors.chat_id.message}</p>
          )}
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="system_name">ชื่อระบบ</Label>
          <Input
            id="system_name"
            {...register('system_name')}
          />
          {errors.system_name && (
            <p role="alert" className="text-xs text-destructive">{errors.system_name.message}</p>
          )}
        </div>
      </div>

      {/* Notification type toggles */}
      <div className="rounded-md border p-4 space-y-4">
        <h3 className="text-sm font-medium">ประเภทการแจ้งเตือน</h3>
        {NOTIFICATION_TYPES.map((type) => (
          <div key={type.key} className="flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <Label htmlFor={type.key} className="text-sm font-normal cursor-pointer">
                {type.label}
              </Label>
              <p className="text-xs text-muted-foreground">{type.description}</p>
            </div>
            <Controller
              name={type.key}
              control={control}
              render={({ field }) => (
                <Switch
                  id={type.key}
                  checked={field.value === 'Y'}
                  onCheckedChange={(checked) => field.onChange(checked ? 'Y' : 'N')}
                />
              )}
            />
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 pt-2">
        <Button
          type="submit"
          disabled={saveMutation.isPending}
          className="bg-apple-blue hover:bg-apple-blue/90"
        >
          {saveMutation.isPending ? 'กำลังบันทึก...' : 'บันทึกตั้งค่า'}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={saveMutation.isPending}
          onClick={handleTestSend}
        >
          ทดสอบส่ง
        </Button>
      </div>

      {testResult && (
        <p className={`text-sm ${testResult.startsWith('ส่งสำเร็จ') ? 'text-green-600' : 'text-destructive'}`}>
          {testResult}
        </p>
      )}
    </form>
  )
}
