import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface QueryErrorProps {
  message?: string
  onRetry?: () => void
}

/**
 * Reusable error display for failed queries.
 * Shows Thai error message with optional retry button.
 */
export function QueryError({ message = 'ไม่สามารถโหลดข้อมูลได้', onRetry }: QueryErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
      <AlertCircle className="h-8 w-8 text-muted-foreground" />
      <p className="text-muted-foreground">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          ลองอีกครั้ง
        </Button>
      )}
    </div>
  )
}
