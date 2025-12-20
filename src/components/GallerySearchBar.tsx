'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface GallerySearchBarProps {
  onSearch: (query: string) => void
  placeholder?: string
  className?: string
  debounceMs?: number
}

export function GallerySearchBar({
  onSearch,
  placeholder = 'Search galleries by name, location, people, or notes...',
  className,
  debounceMs = 300
}: GallerySearchBarProps) {
  const [query, setQuery] = useState('')
  const isInitialMount = useRef(true)

  useEffect(() => {
    // Skip initial mount to prevent triggering parent API calls on load
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }

    const timer = setTimeout(() => {
      onSearch(query)
    }, debounceMs)

    return () => clearTimeout(timer)
    // onSearch is a stable setState function - excluding from deps to prevent HMR loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, debounceMs])

  const clearSearch = () => {
    setQuery('')
    onSearch('')
  }

  return (
    <div className={cn('relative', className)}>
      <Search className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
      <Input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="pl-10 pr-10 bg-background border-border text-foreground placeholder:text-muted-foreground"
      />
      {query && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearSearch}
          className="absolute right-1 top-1 h-7 w-7 p-0 hover:bg-accent/50"
          aria-label="Clear search"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </Button>
      )}
    </div>
  )
}
