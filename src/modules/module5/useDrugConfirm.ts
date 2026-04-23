import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { visitService } from '@/services/visitService'
import type { VisitSummaryFilters, VisitMedsSavePayload } from '@/services/visitService'

export const visitKeys = {
  all: ['visits'] as const,
  summaries: (filters: VisitSummaryFilters) => [...visitKeys.all, 'summary', filters] as const,
  meds: (vn: string) => [...visitKeys.all, 'meds', vn] as const,
}

/** List visit summaries — excludes tel/hn/dob */
export function useVisitSummaryList(filters: VisitSummaryFilters) {
  return useQuery({
    queryKey: visitKeys.summaries(filters),
    queryFn: () => visitService.listSummary(filters),
  })
}

/** List meds for a specific VN */
export function useVisitMedsList(vn: string) {
  return useQuery({
    queryKey: visitKeys.meds(vn),
    queryFn: () => visitService.listMeds(vn),
    enabled: !!vn,
  })
}

/** Save meds — handles confirm_all, edit, absent */
export function useVisitMedsSave() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: VisitMedsSavePayload) => visitService.saveMeds(payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: visitKeys.all })
      queryClient.invalidateQueries({ queryKey: visitKeys.meds(variables.vn) })
      toast.success('บันทึกยาสำเร็จ')
    },
    onError: (err) => { toast.error('บันทึกยาไม่สำเร็จ', { description: err.message }) },
  })
}
