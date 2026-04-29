import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { settingsService } from '@/services/settingsService'
import type { SettingsSaveData } from '@/services/settingsService'

const settingsKeys = {
  all: ['settings'] as const,
} as const

export function useSettingsGet() {
  return useQuery({
    queryKey: settingsKeys.all,
    queryFn: () => settingsService.get(),
  })
}

export function useSettingsSave() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: SettingsSaveData) => settingsService.save(data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.all })
      if (variables.telegram_test) {
        // Test send — toast handled by caller via mutate() callbacks
      } else {
        toast.success('บันทึกตั้งค่าสำเร็จ')
      }
    },
    onError: (err) => { toast.error('บันทึกไม่สำเร็จ', { description: err.message }) },
  })
}
