import { useQuery } from '@tanstack/react-query'
import { dashboardService } from '@/services/dashboardService'

const dashboardKeys = {
  stats: ['dashboard', 'stats'] as const,
}

/** Fetch aggregate dashboard stats — public endpoint, no token needed */
export function useDashboardStats() {
  return useQuery({
    queryKey: dashboardKeys.stats,
    queryFn: () => dashboardService.getStats(),
    staleTime: 5 * 60 * 1000, // 5 min — aggregate data changes slowly
  })
}
