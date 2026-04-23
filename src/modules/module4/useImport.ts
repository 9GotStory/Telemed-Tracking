import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { importService } from '@/services/importService'
import type { ImportPreviewRequest, ImportConfirmRequest } from '@/services/importService'

export const importKeys = {
  all: ['import'] as const,
}

/** Preview import — validates VN uniqueness + drug_name existence */
export function useImportPreview() {
  return useMutation({
    mutationFn: (data: ImportPreviewRequest) => importService.preview(data),
    onSuccess: () => {
      toast.success('ตรวจสอบข้อมูลสำเร็จ')
    },
    onError: (err) => { toast.error('ตรวจสอบข้อมูลไม่สำเร็จ', { description: err.message }) },
  })
}

/** Confirm import — inserts VISIT_SUMMARY + VISIT_MEDS */
export function useImportConfirm() {
  return useMutation({
    mutationFn: (data: ImportConfirmRequest) => importService.confirm(data),
    onSuccess: () => {
      toast.success('นำเข้าข้อมูลสำเร็จ')
    },
    onError: (err) => { toast.error('นำเข้าข้อมูลไม่สำเร็จ', { description: err.message }) },
  })
}
