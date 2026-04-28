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
  pending: 'bg-amber-100 text-amber-800',
  warning: 'bg-orange-100 text-orange-700',
  inactive: 'bg-zinc-600 text-white',
  error: 'bg-red-100 text-red-800',
  info: 'bg-zinc-100 text-zinc-700',
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
