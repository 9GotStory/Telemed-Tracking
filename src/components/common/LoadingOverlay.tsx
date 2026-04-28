import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { cn } from '@/lib/utils'

interface LoadingOverlayProps {
  loading: boolean
  text?: string
  className?: string
  children: React.ReactNode
}

/**
 * Wraps content with a frosted-glass loading overlay.
 * Parent must have `relative` positioning (or this component adds it).
 *
 * Usage:
 *   <LoadingOverlay loading={mutation.isPending} text="กำลังบันทึก...">
 *     <form>...</form>
 *   </LoadingOverlay>
 */
export function LoadingOverlay({ loading, text, className, children }: LoadingOverlayProps) {
  return (
    <div className={cn('relative', className)}>
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-md bg-background/60 backdrop-blur-[2px]">
          <LoadingSpinner text={text} className="py-0" />
        </div>
      )}
      {children}
    </div>
  )
}
