import { useQuery } from '@tanstack/react-query'
import { facilityService } from '@/services/facilityService'

const facilityKeys = {
  all: ['facilities'] as const,
  list: ['facilities', 'list'] as const,
}

/**
 * Fetch active facilities list for dropdown selects.
 * Replaces deriving facility list from equipment data.
 */
export function useFacilitiesList() {
  return useQuery({
    queryKey: facilityKeys.list,
    queryFn: () => facilityService.list(),
    staleTime: 60_000, // Facilities rarely change — cache for 1 minute
  })
}
