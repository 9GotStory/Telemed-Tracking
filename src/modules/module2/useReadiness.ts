import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { readinessService, type ReadinessFilters } from '@/services/readinessService'
import type { ReadinessFormValues } from '@/services/readinessService'

/** Query key factory for readiness */
const readinessKeys = {
  all: ['readiness'] as const,
  list: (filters: ReadinessFilters) => ['readiness', 'list', filters] as const,
}

/**
 * Fetch readiness logs with optional filters.
 */
export function useReadinessList(filters: ReadinessFilters = {}) {
  return useQuery({
    queryKey: readinessKeys.list(filters),
    queryFn: () => readinessService.list(filters),
  })
}

/**
 * Save readiness check (upsert). Invalidates list on success.
 */
export function useReadinessSave() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: ReadinessFormValues) => readinessService.save(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: readinessKeys.all })
    },
  })
}
