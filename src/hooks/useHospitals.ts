import { useQuery } from '@tanstack/react-query'
import { hospitalService } from '@/services/hospitalService'

const hospitalKeys = {
  all: ['hospitals'] as const,
  list: ['hospitals', 'list'] as const,
}

/**
 * Fetch active hospitals list for Login/Register dropdowns.
 * Public endpoint — no authentication required.
 */
export function useHospitalsList() {
  return useQuery({
    queryKey: hospitalKeys.list,
    queryFn: () => hospitalService.list(),
    staleTime: 5 * 60_000, // Hospitals rarely change — cache for 5 minutes
  })
}
