import type { QueryClient } from '@tanstack/react-query'
import type { VisitSummaryItem, MedActionType } from '@/services/visitService'
import { visitKeys } from './visitKeys'

type SummaryData = VisitSummaryItem[]

export interface SnapshotEntry {
  queryKey: readonly unknown[]
  data: SummaryData
}

/**
 * Optimistically update a single VN's summary row across ALL cached summary queries.
 * Uses setQueriesData to atomically update and return previous data for rollback.
 */
export function updateSummaryByVn(
  queryClient: QueryClient,
  vn: string,
  updater: (item: VisitSummaryItem) => VisitSummaryItem,
): SnapshotEntry[] {
  const previous = queryClient.setQueriesData<SummaryData>(
    { queryKey: visitKeys.all },
    (oldData) => {
      if (!oldData) return oldData
      // Only update summary queries (VisitSummaryItem[]), skip meds queries (VisitMedItem[])
      const firstItem = oldData[0] as Record<string, unknown> | undefined
      if (!firstItem || !('dispensing_confirmed' in firstItem)) return oldData

      return oldData.map((item) =>
        item.vn === vn ? updater(item) : item,
      )
    },
  )
  return previous.map(([queryKey, data]) => ({ queryKey, data: data! }))
}

/**
 * Optimistically update multiple VNs across ALL cached summary queries.
 * Used by batch operations.
 */
export function updateSummaryByVns(
  queryClient: QueryClient,
  vns: string[],
  updater: (item: VisitSummaryItem) => VisitSummaryItem,
): SnapshotEntry[] {
  const vnSet = new Set(vns)
  const previous = queryClient.setQueriesData<SummaryData>(
    { queryKey: visitKeys.all },
    (oldData) => {
      if (!oldData) return oldData
      const firstItem = oldData[0] as Record<string, unknown> | undefined
      if (!firstItem || !('dispensing_confirmed' in firstItem)) return oldData

      return oldData.map((item) =>
        vnSet.has(item.vn) ? updater(item) : item,
      )
    },
  )
  return previous.map(([queryKey, data]) => ({ queryKey, data: data! }))
}

/**
 * Roll back optimistic updates using a snapshot.
 */
export function rollbackSnapshot(
  queryClient: QueryClient,
  snapshot: SnapshotEntry[],
): void {
  for (const { queryKey, data } of snapshot) {
    queryClient.setQueryData(queryKey, data)
  }
}

/**
 * Maps action_type to the summary fields that change optimistically.
 */
export function getActionPatch(actionType: MedActionType): Partial<VisitSummaryItem> {
  switch (actionType) {
    case 'confirm_all':
    case 'edit':
      return { attended: 'Y', dispensing_confirmed: 'Y' }
    case 'absent':
      return { attended: 'N', dispensing_confirmed: 'N' }
    case 'undo_absent':
      return { attended: '', dispensing_confirmed: 'N' }
    case 'undo_confirm':
      return { attended: '', dispensing_confirmed: 'N' }
  }
}
