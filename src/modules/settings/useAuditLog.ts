import { useQuery } from '@tanstack/react-query'
import { auditLogService } from '@/services/auditLogService'

const auditLogKeys = {
  all: ['auditLog'] as const,
} as const

export function useAuditLogList(limit = 100) {
  return useQuery({
    queryKey: [...auditLogKeys.all, limit],
    queryFn: () => auditLogService.list(limit),
  })
}
