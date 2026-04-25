import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { debug } from '@/utils/debugLogger'

/**
 * Log component mount/unmount events.
 * Opt-in: only logs when debug mode is enabled.
 */
export function useDebugMount(componentName: string): void {
  useEffect(() => {
    debug.user(`[${componentName}] mounted`)
    return () => debug.user(`[${componentName}] unmounted`)
  }, [componentName])
}

/**
 * Log value changes (like useEffect but for observation).
 * Shows from → to diff. Opt-in: only logs when debug mode is enabled.
 */
export function useDebugChange(label: string, value: unknown): void {
  const prevRef = useRef<unknown>(value)
  useEffect(() => {
    if (prevRef.current !== value) {
      debug.state(`[${label}] changed`, { from: prevRef.current, to: value })
      prevRef.current = value
    }
  }, [label, value])
}

/**
 * Log navigation events — call once in a layout component.
 * Fires only when pathname changes.
 */
export function useDebugNav(): void {
  const location = useLocation()
  useEffect(() => {
    debug.nav(`navigated to ${location.pathname}`)
  }, [location.pathname])
}
