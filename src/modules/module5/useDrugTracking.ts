import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { visitService } from '@/services/visitService'
import type { TrackDeliveryPayload } from '@/services/visitService'
import { visitKeys } from './visitKeys'
import { followupKeys } from '@/modules/module6/useFollowup'
import { updateSummaryByVn, rollbackSnapshot } from './optimisticHelpers'

const DELIVERY_LABELS: Record<string, string> = {
  drug_sent_date: 'จัดส่งจากรพ.',
  drug_received_date: 'รพ.สต.ได้รับ',
  drug_delivered_date: 'ส่งมอบให้คนไข้',
}

/** Update a single delivery date field — optimistic update */
export function useUpdateDeliveryDate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: TrackDeliveryPayload) => visitService.trackDelivery(payload),
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: visitKeys.all })
      await queryClient.cancelQueries({ queryKey: followupKeys.all })

      const snapshot = updateSummaryByVn(
        queryClient,
        payload.vn,
        (item) => ({ ...item, [payload.field]: payload.date }),
      )

      // Also optimistically update followup queries
      const fuSnapshot = queryClient.setQueriesData<unknown[]>(
        { queryKey: followupKeys.all },
        (oldData) => {
          if (!Array.isArray(oldData)) return oldData
          return oldData.map((item) => {
            const rec = item as Record<string, unknown>
            if (rec.vn === payload.vn) {
              return { ...rec, [payload.field]: payload.date }
            }
            return item
          })
        },
      )
      const fuEntries = fuSnapshot.map(([qk, data]) => ({ queryKey: qk, data })).filter((e) => e.data !== undefined)

      return { snapshot, fuSnapshot: fuEntries }
    },
    onError: (err, _variables, context) => {
      if (context?.snapshot) rollbackSnapshot(queryClient, context.snapshot)
      if (context?.fuSnapshot) {
        for (const { queryKey, data } of context.fuSnapshot) {
          if (data !== undefined) queryClient.setQueryData(queryKey, data)
        }
      }
      toast.error('อัปเดตสถานะการจัดส่งไม่สำเร็จ', { description: err.message })
    },
    onSuccess: (_data, variables) => {
      const label = DELIVERY_LABELS[variables.field] || variables.field
      toast.success(`อัปเดต "${label}" สำเร็จ`)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: visitKeys.all })
      queryClient.invalidateQueries({ queryKey: followupKeys.all })
    },
  })
}
