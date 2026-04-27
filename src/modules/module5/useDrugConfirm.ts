import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { visitService } from '@/services/visitService'
import type { VisitSummaryFilters, VisitMedsSavePayload, BatchConfirmPayload, VisitMedItem } from '@/services/visitService'
import { visitKeys } from './visitKeys'
import { updateSummaryByVn, updateSummaryByVns, rollbackSnapshot, getActionPatch } from './optimisticHelpers'

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

/** Save meds — optimistic update for instant UI feedback */
export function useVisitMedsSave() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: VisitMedsSavePayload) => visitService.saveMeds(payload),
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: visitKeys.all })

      const patch = getActionPatch(payload.action_type)
      const snapshot = updateSummaryByVn(queryClient, payload.vn, (item) => ({
        ...item,
        ...patch,
      }))

      let previousMeds: VisitMedItem[] | undefined
      if (payload.action_type === 'edit') {
        previousMeds = queryClient.getQueryData<VisitMedItem[]>(visitKeys.meds(payload.vn))
        if (previousMeds) {
          queryClient.setQueryData<VisitMedItem[]>(visitKeys.meds(payload.vn), (old) => {
            if (!old) return old
            return old.map((med) => {
              // Existing drugs: match by med_id; new drugs: match by drug_name
              const saved = med.med_id
                ? payload.meds.find((m) => m.med_id === med.med_id)
                : payload.meds.find((m) => !m.med_id && m.drug_name === med.drug_name)
              if (saved?.status === 'cancelled') return { ...med, status: 'cancelled' }
              if (med.status !== 'cancelled') return { ...med, status: 'confirmed' }
              return med
            })
          })
        }
      }

      return { snapshot, vn: payload.vn, previousMeds }
    },
    onError: (err, _payload, context) => {
      if (context?.snapshot) rollbackSnapshot(queryClient, context.snapshot)
      if (context?.previousMeds && context?.vn) {
        queryClient.setQueryData(visitKeys.meds(context.vn), context.previousMeds)
      }
      toast.error('บันทึกยาไม่สำเร็จ', { description: err.message })
    },
    onSuccess: () => {
      toast.success('บันทึกยาสำเร็จ')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: visitKeys.all })
    },
  })
}

/** Batch confirm or absent multiple VNs — optimistic update */
export function useBatchConfirm() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: BatchConfirmPayload) => visitService.batchConfirm(payload),
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: visitKeys.all })

      const patch = payload.action === 'confirm'
        ? getActionPatch('confirm_all')
        : getActionPatch('absent')

      const snapshot = updateSummaryByVns(queryClient, payload.vns, (item) => ({
        ...item,
        ...patch,
      }))

      return { snapshot }
    },
    onError: (err, _payload, context) => {
      if (context?.snapshot) rollbackSnapshot(queryClient, context.snapshot)
      toast.error('ดำเนินการไม่สำเร็จ', { description: err.message })
    },
    onSuccess: (data) => {
      toast.success(data.message)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: visitKeys.all })
    },
  })
}
