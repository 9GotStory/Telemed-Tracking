import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface PageWrapperProps {
  children: ReactNode
  className?: string
}

export function PageWrapper({ children, className }: PageWrapperProps) {
  return (
    <main className={cn('flex-1 p-4 sm:p-6 lg:p-8', className)}>
      <div className="mx-auto max-w-[980px]">
        {children}
      </div>
    </main>
  )
}
