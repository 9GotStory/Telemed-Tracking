import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { importService } from '@/services/importService'
import { HN_LENGTH } from '@/constants/validation'
import type { ImportPreviewRequest, ImportConfirmRequest } from '@/services/importService'

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
    onSuccess: (result) => {
      const skipped = result.invalid_hn_skipped ?? 0
      if (skipped > 0) {
        toast.warning(`นำเข้าข้อมูลสำเร็จ (${skipped} รายการถูกข้าม — HN ไม่ตรงรูปแบบ ${HN_LENGTH} หลัก)`)
      } else {
        toast.success('นำเข้าข้อมูลสำเร็จ')
      }
    },
    onError: (err) => { toast.error('นำเข้าข้อมูลไม่สำเร็จ', { description: err.message }) },
  })
}
