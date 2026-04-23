import { useMutation } from '@tanstack/react-query'
import { importService } from '@/services/importService'
import type { ImportPreviewRequest, ImportConfirmRequest } from '@/services/importService'

export const importKeys = {
  all: ['import'] as const,
}

/** Preview import — validates VN uniqueness + drug_name existence */
export function useImportPreview() {
  return useMutation({
    mutationFn: (data: ImportPreviewRequest) => importService.preview(data),
  })
}

/** Confirm import — inserts VISIT_SUMMARY + VISIT_MEDS */
export function useImportConfirm() {
  return useMutation({
    mutationFn: (data: ImportConfirmRequest) => importService.confirm(data),
  })
}
