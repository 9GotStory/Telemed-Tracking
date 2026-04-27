import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { visitService } from '@/services/visitService'
import type { TrackDeliveryPayload } from '@/services/visitService'
import { visitKeys } from './visitKeys'
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

      const snapshot = updateSummaryByVn(
        queryClient,
        payload.vn,
        (item) => ({ ...item, [payload.field]: payload.date }),
      )

      return { snapshot }
    },
    onError: (err, _variables, context) => {
      if (context?.snapshot) rollbackSnapshot(queryClient, context.snapshot)
      toast.error('อัปเดตสถานะการจัดส่งไม่สำเร็จ', { description: err.message })
    },
    onSuccess: (_data, variables) => {
      const label = DELIVERY_LABELS[variables.field] || variables.field
      toast.success(`อัปเดต "${label}" สำเร็จ`)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: visitKeys.all })
    },
  })
}
