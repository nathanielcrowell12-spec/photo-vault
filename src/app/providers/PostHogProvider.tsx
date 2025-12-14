/**
 * PostHog Provider Component
 *
 * Initializes PostHog client-side tracking.
 * Add this to your root layout.
 */
'use client'

import { useEffect } from 'react'
import { initPostHog } from '@/lib/analytics/client'

interface PostHogProviderProps {
  children: React.ReactNode
}

export function PostHogProvider({ children }: PostHogProviderProps) {
  useEffect(() => {
    initPostHog()
  }, [])

  return <>{children}</>
}
