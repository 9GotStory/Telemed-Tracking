import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { scheduleService, type ScheduleFilters } from '@/services/scheduleService'
import type { ScheduleFormValues } from '@/services/scheduleService'

/** Query key factory for schedule */
const scheduleKeys = {
  all: ['schedule'] as const,
  list: (filters: ScheduleFilters) => ['schedule', 'list', filters] as const,
}

/**
 * Fetch schedule list with optional filters.
 * Automatically filtered by role on GAS side.
 */
export function useScheduleList(filters: ScheduleFilters = {}) {
  return useQuery({
    queryKey: scheduleKeys.list(filters),
    queryFn: () => scheduleService.list(filters),
  })
}

/**
 * Create or update schedule. Invalidates list on success.
 */
export function useScheduleSave() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: ScheduleFormValues) => scheduleService.save(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: scheduleKeys.all })
    },
  })
}

/**
 * Set telemed link for a schedule. Invalidates list on success.
 */
export function useScheduleSetLink() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ scheduleId, telemedLink }: { scheduleId: string; telemedLink: string }) =>
      scheduleService.setLink(scheduleId, telemedLink),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: scheduleKeys.all })
    },
  })
}

/**
 * Record incident note for a schedule. Invalidates list on success.
 */
export function useScheduleRecordIncident() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ scheduleId, incidentNote }: { scheduleId: string; incidentNote: string }) =>
      scheduleService.recordIncident(scheduleId, incidentNote),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: scheduleKeys.all })
    },
  })
}
