'use client'

import React from 'react'
import { trackEvent } from '@/lib/analytics/client'
import { EVENTS } from '@/types/analytics'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle } from 'lucide-react'

interface Props {
  children: React.ReactNode
  fallback?: React.ReactNode
  level?: 'root' | 'route' | 'component'
}

interface State {
  hasError: boolean
  error?: Error
}

/**
 * Multi-level error boundary with analytics tracking
 *
 * Levels:
 * - root: Full-page fallback for catastrophic errors
 * - route: Preserves navigation, shows error card in content area
 * - component: Minimal fallback for component-level errors
 */
export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Track error to PostHog
    trackEvent(EVENTS.ERROR_ENCOUNTERED, {
      error_type: error.name || 'React Error',
      error_message: error.message,
      page: typeof window !== 'undefined' ? window.location.pathname : 'unknown',
      stack_trace: error.stack,
    })

    // Log to Supabase as fallback (for ad-blocker cases)
    this.logErrorToSupabase(error, errorInfo)

    console.error('Error caught by boundary:', error, errorInfo)
  }

  async logErrorToSupabase(error: Error, errorInfo: React.ErrorInfo) {
    try {
      await fetch('/api/analytics/error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error_type: error.name || 'React Error',
          error_message: error.message,
          page: typeof window !== 'undefined' ? window.location.pathname : 'unknown',
          stack_trace: error.stack,
          component_stack: errorInfo.componentStack,
        }),
      })
    } catch (fallbackError) {
      console.error('Failed to log error to Supabase:', fallbackError)
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Root-level error - show full page with minimal UI
      if (this.props.level === 'root') {
        return (
          <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <Card className="max-w-md w-full">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                  <CardTitle>Something went wrong</CardTitle>
                </div>
                <CardDescription>
                  We&apos;ve been notified and are looking into it.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Error: {this.state.error?.message || 'Unknown error'}
                </p>
                <Button
                  onClick={() => window.location.reload()}
                  className="w-full"
                >
                  Reload Page
                </Button>
              </CardContent>
            </Card>
          </div>
        )
      }

      // Route/component-level error - show error card (navigation still works)
      return (
        <div className="container py-8">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
                <CardTitle>Something went wrong</CardTitle>
              </div>
              <CardDescription>
                We&apos;ve been notified and are looking into it.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Error: {this.state.error?.message || 'Unknown error'}
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    this.setState({ hasError: false, error: undefined })
                    window.location.reload()
                  }}
                  className="flex-1"
                >
                  Reload
                </Button>
                <Button
                  onClick={() => window.location.href = '/'}
                  variant="outline"
                  className="flex-1"
                >
                  Go Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}
