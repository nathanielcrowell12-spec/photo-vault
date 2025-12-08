'use client'

import React, { useState, useEffect } from 'react'
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

  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(query)
    }, debounceMs)

    return () => clearTimeout(timer)
  }, [query, debounceMs, onSearch])

  const clearSearch = () => {
    setQuery('')
    onSearch('')
  }

  return (
    <div className={cn('relative', className)}>
      <Search className="absolute left-3 top-2.5 h-5 w-5 text-neutral-400" />
      <Input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="pl-10 pr-10 bg-neutral-900 border-white/10 text-white placeholder:text-neutral-500"
      />
      {query && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearSearch}
          className="absolute right-1 top-1 h-7 w-7 p-0 hover:bg-white/5"
          aria-label="Clear search"
        >
          <X className="h-4 w-4 text-neutral-400" />
        </Button>
      )}
    </div>
  )
}
