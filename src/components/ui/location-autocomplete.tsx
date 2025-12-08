'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LocationAutocompleteProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function LocationAutocomplete({
  value,
  onChange,
  placeholder = 'Enter location...',
  className
}: LocationAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!value || value.length < 2) {
      setSuggestions([])
      return
    }

    const fetchSuggestions = async () => {
      try {
        const response = await fetch(
          `/api/photographer/galleries/suggest?field=location&query=${encodeURIComponent(value)}`
        )
        if (response.ok) {
          const data = await response.json()
          setSuggestions(data.suggestions?.map((s: { value: string }) => s.value) || [])
        }
      } catch (error) {
        console.error('Error fetching location suggestions:', error)
      }
    }

    const debounce = setTimeout(fetchSuggestions, 300)
    return () => clearTimeout(debounce)
  }, [value])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setFocusedIndex((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : prev
      )
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setFocusedIndex((prev) => (prev > 0 ? prev - 1 : -1))
    } else if (e.key === 'Enter' && focusedIndex >= 0) {
      e.preventDefault()
      selectSuggestion(suggestions[focusedIndex])
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
    }
  }

  const selectSuggestion = (location: string) => {
    onChange(location)
    setShowSuggestions(false)
    setFocusedIndex(-1)
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-neutral-500" />
        <Input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value)
            setShowSuggestions(true)
          }}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={cn('pl-9 bg-neutral-900 border-white/10 text-white placeholder:text-neutral-500', className)}
        />
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-neutral-800 border border-white/10 rounded-md shadow-lg max-h-60 overflow-auto">
          {suggestions.map((location, index) => (
            <button
              key={index}
              type="button"
              onClick={() => selectSuggestion(location)}
              className={cn(
                'w-full text-left px-4 py-2 text-sm transition-colors',
                'hover:bg-white/5 text-neutral-100',
                focusedIndex === index && 'bg-white/10'
              )}
            >
              <div className="flex items-center gap-2">
                <MapPin className="h-3 w-3 text-neutral-400" />
                {location}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
