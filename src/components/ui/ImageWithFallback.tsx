'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Camera } from 'lucide-react'
import { UI_CONSTANTS } from '@/lib/component-constants'
import { cn } from '@/lib/utils'

interface ImageWithFallbackProps {
  src?: string
  alt: string
  className?: string
  fallbackIcon?: React.ReactNode
  onError?: () => void
  /** Load immediately with high priority (for above-fold images) */
  priority?: boolean
  /** Callback when image finishes loading */
  onLoad?: () => void
}

export function ImageWithFallback({
  src,
  alt,
  className = '',
  fallbackIcon,
  onError,
  priority = false,
  onLoad
}: ImageWithFallbackProps) {
  const [hasError, setHasError] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [shouldLoad, setShouldLoad] = useState(priority)
  const containerRef = useRef<HTMLDivElement>(null)

  // Intersection Observer for lazy loading non-priority images
  useEffect(() => {
    // Priority images load immediately, skip observer
    if (priority) {
      setShouldLoad(true)
      return
    }

    // No src means nothing to observe
    if (!src || !containerRef.current) return

    // Check if IntersectionObserver is available (SSR safety)
    if (typeof IntersectionObserver === 'undefined') {
      setShouldLoad(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoad(true)
          observer.disconnect()
        }
      },
      { rootMargin: '0px', threshold: 0.01 } // Load only when image enters viewport
    )

    observer.observe(containerRef.current)

    return () => observer.disconnect()
  }, [priority, src])

  const handleError = () => {
    setHasError(true)
    onError?.()
  }

  const handleLoad = () => {
    setIsLoaded(true)
    onLoad?.()
  }

  // Show fallback if no src or error occurred
  if (!src || hasError) {
    return (
      <div className={cn('w-full h-full flex items-center justify-center', className)}>
        {fallbackIcon || <Camera className={cn(UI_CONSTANTS.ICON_SIZE_LARGE, 'text-muted-foreground')} />}
      </div>
    )
  }

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Placeholder shown while loading */}
      {!isLoaded && (
        <div
          className="absolute inset-0 bg-muted animate-pulse"
          aria-hidden="true"
        />
      )}

      {/* Only render img when shouldLoad is true */}
      {shouldLoad && (
        <img
          src={src}
          alt={alt}
          className={cn(
            'w-full h-full object-cover transition-opacity duration-300',
            isLoaded ? 'opacity-100' : 'opacity-0'
          )}
          onError={handleError}
          onLoad={handleLoad}
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : 'auto'}
        />
      )}
    </div>
  )
}
