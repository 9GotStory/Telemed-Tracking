import { cn } from '@/lib/utils'

type StatusVariant = 'active' | 'ready' | 'pending' | 'warning' | 'inactive' | 'error' | 'info'

interface StatusBadgeProps {
  variant: StatusVariant
  children: React.ReactNode
  className?: string
}

const VARIANT_STYLES: Record<StatusVariant, string> = {
  active: 'bg-apple-blue text-white',
  ready: 'bg-apple-blue text-white',
  pending: 'bg-btn-default-light text-primary',
  warning: 'bg-btn-default-light text-primary',
  inactive: 'bg-near-black text-white',
  error: 'bg-near-black text-white',
  info: 'bg-btn-default-light text-primary',
}

export function StatusBadge({ variant, children, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold tracking-tight',
        VARIANT_STYLES[variant],
        className,
      )}
    >
      {children}
    </span>
  )
}
