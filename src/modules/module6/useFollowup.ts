import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { followupService } from '@/services/followupService'
import type { FollowupFilters, FollowupFormValues } from '@/services/followupService'

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
    },
  })
}
