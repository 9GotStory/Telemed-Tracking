import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { visitImageService } from '@/services/visitImageService'

export const visitImageKeys = {
  all: ['visitImages'] as const,
  byVn: (vn: string) => [...visitImageKeys.all, vn] as const,
}

/** Fetch images for a VN (empty string = disabled) */
export function useVisitImagesList(vn: string) {
  return useQuery({
    queryKey: visitImageKeys.byVn(vn),
    queryFn: () => visitImageService.list(vn),
    enabled: !!vn,
  })
}

/** Upload a single image — invalidate list on success */
export function useVisitImagesUpload() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: ({ vn, file }: { vn: string; file: File }) =>
      visitImageService.upload(vn, file),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: visitImageKeys.byVn(variables.vn) })
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'อัปโหลดรูปภาพไม่สำเร็จ')
    },
  })
}

/** Delete an image */
export function useVisitImagesDelete() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: ({ imageId }: { imageId: string; vn: string }) =>
      visitImageService.delete(imageId),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: visitImageKeys.byVn(variables.vn) })
      toast.success('ลบรูปภาพสำเร็จ')
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'ลบรูปภาพไม่สำเร็จ')
    },
  })
}
