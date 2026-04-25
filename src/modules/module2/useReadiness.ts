import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { readinessService, type ReadinessFilters } from '@/services/readinessService'
import type { ReadinessFormValues } from '@/services/readinessService'

/** Query key factory for readiness */
const readinessKeys = {
  all: ['readiness'] as const,
  list: (filters: ReadinessFilters) => ['readiness', 'list', filters] as const,
}

/**
 * Fetch readiness logs with optional filters.
 * Pass `enabled: false` to skip the query (e.g. when dialog is closed).
 */
export function useReadinessList(filters: ReadinessFilters = {}, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: readinessKeys.list(filters),
    queryFn: () => readinessService.list(filters),
    enabled: options?.enabled !== false,
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
      toast.success('บันทึกผลตรวจสอบสำเร็จ')
    },
    onError: (err) => { toast.error('บันทึกไม่สำเร็จ', { description: err.message }) },
  })
}
