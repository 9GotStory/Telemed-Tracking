import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { appointmentService } from '@/services/appointmentService'
import type { AppointmentRegisterRequest } from '@/services/appointmentService'

/** Register pre-appointment patients */
export function useAppointmentRegister() {
  return useMutation({
    mutationFn: (data: AppointmentRegisterRequest) => appointmentService.register(data),
    onSuccess: (result) => {
      const parts = [`ลงทะเบียนสำเร็จ ${result.registered} รายการ`]
      if (result.duplicates.length > 0) {
        parts.push(`HN ซ้ำ: ${result.duplicates.join(', ')}`)
      }
      if (result.errors.length > 0) {
        parts.push(`ข้อผิดพลาด: ${result.errors.map((e) => `${e.hn || '?'} — ${e.error}`).join('; ')}`)
      }
      toast[parts.length > 1 ? 'warning' : 'success'](parts.join(' | '))
    },
    onError: (err) => {
      toast.error('ลงทะเบียนไม่สำเร็จ', { description: err.message })
    },
  })
}
