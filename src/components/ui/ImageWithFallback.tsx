'use client'

import React, { useState } from 'react'
import { Camera } from 'lucide-react'
import { UI_CONSTANTS } from '@/lib/component-constants'

interface ImageWithFallbackProps {
  src?: string
  alt: string
  className?: string
  fallbackIcon?: React.ReactNode
  onError?: () => void
}

export function ImageWithFallback({ 
  src, 
  alt, 
  className = '', 
  fallbackIcon,
  onError 
}: ImageWithFallbackProps) {
  const [hasError, setHasError] = useState(false)

  const handleError = () => {
    setHasError(true)
    onError?.()
  }

  if (!src || hasError) {
    return (
      <div className={`w-full h-full flex items-center justify-center ${className}`}>
        {fallbackIcon || <Camera className={`${UI_CONSTANTS.ICON_SIZE_LARGE} text-gray-400`} />}
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={handleError}
      loading="lazy"
    />
  )
}
