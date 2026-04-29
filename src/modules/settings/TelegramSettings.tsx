import { useState } from 'react'
import { useForm } from 'react-hook-form'
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
  alert_time: z.string().min(1, 'กรุณาระบุเวลาแจ้งเตือน'),
  system_name: z.string().min(1, 'กรุณาระบุชื่อระบบ'),
  telegram_active: z.string(),
})

type TelegramFormValues = z.infer<typeof telegramSchema>

const DEFAULTS: TelegramFormValues = {
  bot_token: '',
  chat_id: '',
  alert_time: '07:00',
  system_name: 'Telemed Tracking คปสอ.สอง',
  telegram_active: 'N',
}

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
    alert_time: settingsMap.alert_time ?? DEFAULTS.alert_time,
    system_name: settingsMap.system_name ?? DEFAULTS.system_name,
    telegram_active: settingsMap.telegram_active ?? DEFAULTS.telegram_active,
  }

  const { register, handleSubmit, getValues, setValue, watch, formState: { errors } } = useForm<TelegramFormValues>({
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
            <p className="text-xs text-destructive">{errors.bot_token.message}</p>
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
            <p className="text-xs text-destructive">{errors.chat_id.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="alert_time">เวลาแจ้งเตือน</Label>
          <Input
            id="alert_time"
            type="time"
            {...register('alert_time')}
          />
          {errors.alert_time && (
            <p className="text-xs text-destructive">{errors.alert_time.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="system_name">ชื่อระบบ</Label>
          <Input
            id="system_name"
            {...register('system_name')}
          />
          {errors.system_name && (
            <p className="text-xs text-destructive">{errors.system_name.message}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Switch
          id="telegram_active"
          checked={watch('telegram_active') === 'Y'}
          onCheckedChange={(checked) => setValue('telegram_active', checked ? 'Y' : 'N', { shouldDirty: true })}
        />
        <Label htmlFor="telegram_active">เปิดใช้งานแจ้งเตือน Telegram</Label>
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
