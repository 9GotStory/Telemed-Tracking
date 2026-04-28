import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { visitService } from '@/services/visitService'
import type { UpdateTelPayload } from '@/services/visitService'
import type { FollowupItem } from '@/services/followupService'
import { visitKeys } from '@/modules/module5/visitKeys'
import { followupKeys } from '@/modules/module6/useFollowup'
import { updateSummaryByVn, rollbackSnapshot } from '@/modules/module5/optimisticHelpers'

/** Update patient phone number — optimistic update for Module 5 & 6 */
export function useUpdateTel() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: UpdateTelPayload) => visitService.updateTel(payload),
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: visitKeys.all })
      await queryClient.cancelQueries({ queryKey: followupKeys.all })

      // Optimistically update summary queries (Module 5)
      const snapshot = updateSummaryByVn(
        queryClient,
        payload.vn,
        (item) => ({ ...item, tel: payload.tel }),
      )

      // Optimistically update followup queries (Module 6)
      const fuSnapshot = queryClient.setQueriesData<FollowupItem[]>(
        { queryKey: followupKeys.all },
        (oldData) => {
          if (!oldData) return oldData
          return oldData.map((item) =>
            item.vn === payload.vn ? { ...item, tel: payload.tel } : item,
          )
        },
      )
      const fuEntries = fuSnapshot
        .map(([qk, data]) => ({ queryKey: qk, data }))
        .filter((e) => e.data !== undefined)

      return { snapshot, fuSnapshot: fuEntries }
    },
    onError: (err, _variables, context) => {
      if (context?.snapshot) rollbackSnapshot(queryClient, context.snapshot)
      if (context?.fuSnapshot) {
        for (const { queryKey, data } of context.fuSnapshot) {
          if (data !== undefined) queryClient.setQueryData(queryKey, data)
        }
      }
      toast.error('อัปเดตเบอร์โทรไม่สำเร็จ', { description: err.message })
    },
    onSuccess: () => {
      toast.success('อัปเดตเบอร์โทรสำเร็จ')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: visitKeys.all })
      queryClient.invalidateQueries({ queryKey: followupKeys.all })
    },
  })
}
