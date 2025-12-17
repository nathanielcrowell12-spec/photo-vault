'use client'

import { ErrorBoundary } from './ErrorBoundary'

interface Props {
  children: React.ReactNode
}

/**
 * Route-level error boundary - preserves navigation on errors
 *
 * Use this to wrap page content. Errors will show a fallback UI
 * but the navigation bar and footer remain accessible.
 */
export function RouteErrorBoundary({ children }: Props) {
  return (
    <ErrorBoundary level="route">
      {children}
    </ErrorBoundary>
  )
}
