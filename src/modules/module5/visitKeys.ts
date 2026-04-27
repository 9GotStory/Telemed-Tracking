import type { VisitSummaryFilters } from '@/services/visitService'

export const visitKeys = {
  all: ['visits'] as const,
  summaries: (filters: VisitSummaryFilters) => [...visitKeys.all, 'summary', filters] as const,
  meds: (vn: string) => [...visitKeys.all, 'meds', vn] as const,
}
