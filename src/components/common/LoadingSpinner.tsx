import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  text?: string
  className?: string
}

export function LoadingSpinner({ text = 'กำลังโหลด...', className }: LoadingSpinnerProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 py-12', className)}>
      <Loader2 className="h-8 w-8 animate-spin text-apple-blue" />
      {text && <p className="text-sm text-muted-foreground">{text}</p>}
    </div>
  )
}
