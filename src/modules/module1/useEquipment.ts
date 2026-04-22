import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { equipmentService, type EquipmentFilters } from '@/services/equipmentService'
import type { EquipmentFormValues } from '@/services/equipmentService'

/** Query key factory for equipment */
const equipmentKeys = {
  all: ['equipment'] as const,
  list: (filters: EquipmentFilters) => ['equipment', 'list', filters] as const,
}

/**
 * Fetch equipment list with optional filters.
 * Automatically filtered by role on GAS side.
 */
export function useEquipmentList(filters: EquipmentFilters = {}) {
  return useQuery({
    queryKey: equipmentKeys.list(filters),
    queryFn: () => equipmentService.list(filters),
  })
}

/**
 * Create or update equipment. Invalidates list on success.
 */
export function useEquipmentSave() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: EquipmentFormValues) => equipmentService.save(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: equipmentKeys.all })
    },
  })
}

/**
 * Soft-delete equipment (sets status=inactive). Invalidates list on success.
 */
export function useEquipmentDelete() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (equipId: string) => equipmentService.delete(equipId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: equipmentKeys.all })
    },
  })
}
