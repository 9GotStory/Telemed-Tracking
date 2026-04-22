import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { drugService, type DrugFilters } from '@/services/drugService'
import type { DrugFormValues } from '@/services/drugService'

/** Query key factory for master drugs */
const drugKeys = {
  all: ['drugs'] as const,
  list: (filters: DrugFilters) => ['drugs', 'list', filters] as const,
}

/**
 * Fetch drug list with optional active/search filters.
 */
export function useDrugList(filters: DrugFilters = {}) {
  return useQuery({
    queryKey: drugKeys.list(filters),
    queryFn: () => drugService.list(filters),
  })
}

/**
 * Create or update drug. Invalidates list on success.
 */
export function useDrugSave() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: DrugFormValues) => drugService.save(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: drugKeys.all })
    },
  })
}

/**
 * Soft-delete drug (sets active=N). Invalidates list on success.
 */
export function useDrugDelete() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (drugId: string) => drugService.delete(drugId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: drugKeys.all })
    },
  })
}

/**
 * Import batch of drugs. Invalidates list on success.
 */
export function useDrugImport() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (drugs: Array<{ drug_name: string; strength: string; unit: string; active: 'Y' | 'N' }>) =>
      drugService.importDrugs(drugs),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: drugKeys.all })
    },
  })
}
