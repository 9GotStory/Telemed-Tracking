import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { followupService } from '@/services/followupService'
import type { FollowupFilters, FollowupFormValues, FollowupUpdateValues } from '@/services/followupService'

export const followupKeys = {
  all: ['followup'] as const,
  list: (filters: FollowupFilters) => [...followupKeys.all, 'list', filters] as const,
}

/** List visits with followup data — includes tel/hn (Module 6 only) */
export function useFollowupList(filters: FollowupFilters = {}) {
  return useQuery({
    queryKey: followupKeys.list(filters),
    queryFn: () => followupService.list(filters),
  })
}

/** Save a new followup record */
export function useFollowupSave() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: FollowupFormValues) => followupService.save(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: followupKeys.all })
      toast.success('บันทึกผลติดตามสำเร็จ')
    },
    onError: (err) => { toast.error('บันทึกผลติดตามไม่สำเร็จ', { description: err.message }) },
  })
}

/** Update an existing followup record */
export function useFollowupUpdate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: FollowupUpdateValues) => followupService.update(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: followupKeys.all })
      toast.success('แก้ไขผลติดตามสำเร็จ')
    },
    onError: (err) => { toast.error('แก้ไขผลติดตามไม่สำเร็จ', { description: err.message }) },
  })
}

/** Delete a followup record */
export function useFollowupDelete() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (followupId: string) => followupService.delete(followupId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: followupKeys.all })
      toast.success('ลบผลติดตามสำเร็จ')
    },
    onError: (err) => { toast.error('ลบผลติดตามไม่สำเร็จ', { description: err.message }) },
  })
}
