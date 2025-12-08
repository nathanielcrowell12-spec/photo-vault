# Gallery Metadata Entry and Search UI - Implementation Plan

**Date:** December 7, 2025
**Author:** Shadcn/UI Expert Agent
**Project:** PhotoVault Hub
**Feature:** Gallery Metadata Entry & Search System

---

## 1. Summary

This plan implements a comprehensive metadata entry and search system for PhotoVault galleries. The goal is to enable photographers to add rich metadata when creating galleries (event type, location, people, photographer name, notes) and provide clients/photographers with powerful search capabilities to find galleries quickly.

**Key User Story:** "Where is that picture with Mike? I think it was summer time at the park."

**Components to Build:**
- Enhanced metadata entry form (integrated into `/photographer/galleries/create`)
- People tag input component (multi-select with autocomplete)
- Location autocomplete component (learns from past entries)
- Search bar with filters on galleries list page
- Filter chips for event type, year, location, people

**Design System:**
- Dark theme: `bg-neutral-900`, `bg-neutral-800/50`
- Cards: `rounded-2xl border-white/10`
- Accent: `#f59e0b` (amber-500)
- Text: `text-neutral-100`, `text-neutral-400`

---

## 2. Database Schema Changes

### Add Metadata Columns to `photo_galleries` Table

```sql
-- Add metadata columns for searchable gallery information
ALTER TABLE photo_galleries ADD COLUMN IF NOT EXISTS event_date DATE;
ALTER TABLE photo_galleries ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE photo_galleries ADD COLUMN IF NOT EXISTS people TEXT[]; -- Array of names
ALTER TABLE photo_galleries ADD COLUMN IF NOT EXISTS event_type TEXT CHECK (event_type IN ('wedding', 'birthday', 'family', 'portrait', 'graduation', 'other'));
ALTER TABLE photo_galleries ADD COLUMN IF NOT EXISTS photographer_name TEXT;
ALTER TABLE photo_galleries ADD COLUMN IF NOT EXISTS notes TEXT;

-- Create index for full-text search on notes
CREATE INDEX IF NOT EXISTS idx_photo_galleries_notes_fts ON photo_galleries USING gin(to_tsvector('english', notes));

-- Create index for people array search
CREATE INDEX IF NOT EXISTS idx_photo_galleries_people ON photo_galleries USING gin(people);

-- Create index for location search
CREATE INDEX IF NOT EXISTS idx_photo_galleries_location ON photo_galleries(location);

-- Create index for event_type filter
CREATE INDEX IF NOT EXISTS idx_photo_galleries_event_type ON photo_galleries(event_type);

-- Create index for event_date (year extraction for filters)
CREATE INDEX IF NOT EXISTS idx_photo_galleries_event_date ON photo_galleries(event_date);
```

**Migration File:** `database/add-gallery-metadata.sql`

---

## 3. Metadata Entry Form Design

### Integration Point
The metadata form will be integrated into the **existing gallery creation page**:
- File: `src/app/photographer/galleries/create/page.tsx`
- Insert new metadata card between "Gallery Details" and "Billing Mode" sections

### Component Structure

```tsx
{/* Metadata Card - NEW - Insert after Gallery Details */}
<Card className="bg-neutral-800/50 border-white/10">
  <CardHeader>
    <CardTitle className="flex items-center gap-2 text-neutral-100">
      <Tag className="h-5 w-5" />
      Gallery Metadata
    </CardTitle>
    <CardDescription className="text-neutral-400">
      Add details to make this gallery easier to find later
    </CardDescription>
  </CardHeader>
  <CardContent className="space-y-4">
    {/* Event Date */}
    <div>
      <Label htmlFor="eventDate" className="text-neutral-300">Event Date</Label>
      <DatePicker
        id="eventDate"
        value={eventDate}
        onChange={setEventDate}
        className="bg-neutral-900 border-white/10 text-white"
      />
      <p className="text-xs text-neutral-500 mt-1">
        When did this photo session take place?
      </p>
    </div>

    {/* Location - with autocomplete */}
    <div>
      <Label htmlFor="location" className="text-neutral-300">Location</Label>
      <LocationAutocomplete
        value={location}
        onChange={setLocation}
        placeholder="e.g., Central Park, Madison"
        className="bg-neutral-900 border-white/10 text-white"
      />
      <p className="text-xs text-neutral-500 mt-1">
        Where was this session held?
      </p>
    </div>

    {/* People - tag input */}
    <div>
      <Label htmlFor="people" className="text-neutral-300">People in Photos</Label>
      <PeopleTagInput
        value={people}
        onChange={setPeople}
        placeholder="Add names..."
        className="bg-neutral-900 border-white/10 text-white"
      />
      <p className="text-xs text-neutral-500 mt-1">
        Add names of people featured in this gallery
      </p>
    </div>

    {/* Event Type - dropdown */}
    <div>
      <Label htmlFor="eventType" className="text-neutral-300">Event Type</Label>
      <Select value={eventType} onValueChange={setEventType}>
        <SelectTrigger className="bg-neutral-900 border-white/10 text-white">
          <SelectValue placeholder="Select event type..." />
        </SelectTrigger>
        <SelectContent className="bg-neutral-800 border-white/10">
          <SelectItem value="wedding" className="text-white hover:bg-white/5">
            Wedding
          </SelectItem>
          <SelectItem value="birthday" className="text-white hover:bg-white/5">
            Birthday
          </SelectItem>
          <SelectItem value="family" className="text-white hover:bg-white/5">
            Family Session
          </SelectItem>
          <SelectItem value="portrait" className="text-white hover:bg-white/5">
            Portrait
          </SelectItem>
          <SelectItem value="graduation" className="text-white hover:bg-white/5">
            Graduation
          </SelectItem>
          <SelectItem value="other" className="text-white hover:bg-white/5">
            Other
          </SelectItem>
        </SelectContent>
      </Select>
    </div>

    {/* Photographer Name - auto-fill from profile */}
    <div>
      <Label htmlFor="photographerName" className="text-neutral-300">
        Photographer Name (optional)
      </Label>
      <Input
        id="photographerName"
        value={photographerName}
        onChange={(e) => setPhotographerName(e.target.value)}
        placeholder="Will auto-fill from your profile"
        className="bg-neutral-900 border-white/10 text-white placeholder:text-neutral-500"
      />
      <p className="text-xs text-neutral-500 mt-1">
        Leave blank to use your profile name
      </p>
    </div>

    {/* Notes - textarea */}
    <div>
      <Label htmlFor="notes" className="text-neutral-300">Notes</Label>
      <Textarea
        id="notes"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Add any additional details about this session..."
        rows={4}
        className="bg-neutral-900 border-white/10 text-white placeholder:text-neutral-500"
      />
      <p className="text-xs text-neutral-500 mt-1">
        These notes are searchable and help you find this gallery later
      </p>
    </div>
  </CardContent>
</Card>
```

---

## 4. People Tag Input Component

**File:** `src/components/ui/people-tag-input.tsx`

This component allows photographers to add multiple people names with a tag-style interface (add/remove with X button).

```tsx
'use client'

import React, { useState, KeyboardEvent } from 'react'
import { X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface PeopleTagInputProps {
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  className?: string
  maxTags?: number
}

export function PeopleTagInput({
  value = [],
  onChange,
  placeholder = 'Add a name...',
  className,
  maxTags = 20
}: PeopleTagInputProps) {
  const [inputValue, setInputValue] = useState('')

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault()
      addTag(inputValue.trim())
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      // Remove last tag when backspace is pressed on empty input
      removeTag(value.length - 1)
    }
  }

  const addTag = (tag: string) => {
    if (!tag) return
    if (value.includes(tag)) return // Prevent duplicates
    if (value.length >= maxTags) return

    onChange([...value, tag])
    setInputValue('')
  }

  const removeTag = (index: number) => {
    onChange(value.filter((_, i) => i !== index))
  }

  return (
    <div
      className={cn(
        'flex min-h-[42px] w-full flex-wrap gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background',
        'focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
        className
      )}
    >
      {/* Render existing tags */}
      {value.map((tag, index) => (
        <Badge
          key={index}
          variant="secondary"
          className="gap-1 bg-amber-500/20 text-amber-400 border-amber-500/30 hover:bg-amber-500/30"
        >
          {tag}
          <button
            type="button"
            onClick={() => removeTag(index)}
            className="ml-1 rounded-full hover:bg-amber-500/40 p-0.5 transition-colors"
            aria-label={`Remove ${tag}`}
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}

      {/* Input for adding new tags */}
      {value.length < maxTags && (
        <Input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={value.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[120px] border-0 bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground"
        />
      )}
    </div>
  )
}
```

**Usage Example:**
```tsx
const [people, setPeople] = useState<string[]>([])

<PeopleTagInput
  value={people}
  onChange={setPeople}
  placeholder="Add names..."
  className="bg-neutral-900 border-white/10 text-white"
/>
```

---

## 5. Location Autocomplete Component

**File:** `src/components/ui/location-autocomplete.tsx`

This component provides autocomplete suggestions based on previously entered locations.

```tsx
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

  // Fetch location suggestions from API
  useEffect(() => {
    if (!value || value.length < 2) {
      setSuggestions([])
      return
    }

    const fetchSuggestions = async () => {
      try {
        const response = await fetch(
          `/api/galleries/locations/autocomplete?q=${encodeURIComponent(value)}`
        )
        if (response.ok) {
          const data = await response.json()
          setSuggestions(data.locations || [])
        }
      } catch (error) {
        console.error('Error fetching location suggestions:', error)
      }
    }

    const debounce = setTimeout(fetchSuggestions, 300)
    return () => clearTimeout(debounce)
  }, [value])

  // Handle click outside
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
          className={cn('pl-9', className)}
        />
      </div>

      {/* Suggestions dropdown */}
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
```

**API Endpoint Required:** `src/app/api/galleries/locations/autocomplete/route.ts`

```tsx
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q')

    if (!query || query.length < 2) {
      return NextResponse.json({ locations: [] })
    }

    const supabase = createServerSupabaseClient()

    // Get unique locations that match the query
    const { data, error } = await supabase
      .from('photo_galleries')
      .select('location')
      .ilike('location', `%${query}%`)
      .not('location', 'is', null)
      .order('location')
      .limit(10)

    if (error) throw error

    // Extract unique locations
    const locations = [...new Set(data.map((g) => g.location).filter(Boolean))]

    return NextResponse.json({ locations })
  } catch (error) {
    console.error('Error fetching location autocomplete:', error)
    return NextResponse.json({ error: 'Failed to fetch locations' }, { status: 500 })
  }
}
```

---

## 6. Date Picker Component

**Required Shadcn Component:** Calendar + Popover

```bash
npx shadcn-ui@latest add calendar
npx shadcn-ui@latest add popover
```

**File:** `src/components/ui/date-picker.tsx`

```tsx
'use client'

import * as React from 'react'
import { format } from 'date-fns'
import { Calendar as CalendarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface DatePickerProps {
  value?: Date | null
  onChange: (date: Date | undefined) => void
  placeholder?: string
  className?: string
  id?: string
}

export function DatePicker({
  value,
  onChange,
  placeholder = 'Select date',
  className,
  id,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          className={cn(
            'w-full justify-start text-left font-normal',
            !value && 'text-muted-foreground',
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? format(value, 'PPP') : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 bg-neutral-800 border-white/10">
        <Calendar
          mode="single"
          selected={value || undefined}
          onSelect={(date) => {
            onChange(date)
            setOpen(false)
          }}
          initialFocus
          className="text-neutral-100"
        />
      </PopoverContent>
    </Popover>
  )
}
```

**Note:** You'll need to install `date-fns`:
```bash
npm install date-fns
```

---

## 7. Search Bar Component

**File:** `src/components/GallerySearchBar.tsx`

This component provides the search input with real-time filtering.

```tsx
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
  placeholder = 'Search your galleries...',
  className,
  debounceMs = 300
}: GallerySearchBarProps) {
  const [query, setQuery] = useState('')

  // Debounced search
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
```

---

## 8. Filter UI Component

**File:** `src/components/GalleryFilters.tsx`

Provides filter chips for event type, year, location, and people.

```tsx
'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { X, Filter, Calendar, MapPin, Users, Tag } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface GalleryFiltersState {
  eventType: string | null
  year: number | null
  location: string | null
  person: string | null
}

interface GalleryFiltersProps {
  onFiltersChange: (filters: GalleryFiltersState) => void
  availableYears: number[]
  availableLocations: string[]
  availablePeople: string[]
  className?: string
}

export function GalleryFilters({
  onFiltersChange,
  availableYears,
  availableLocations,
  availablePeople,
  className
}: GalleryFiltersProps) {
  const [filters, setFilters] = useState<GalleryFiltersState>({
    eventType: null,
    year: null,
    location: null,
    person: null
  })

  const [showFilters, setShowFilters] = useState(false)

  // Notify parent when filters change
  useEffect(() => {
    onFiltersChange(filters)
  }, [filters, onFiltersChange])

  const updateFilter = (key: keyof GalleryFiltersState, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const clearFilter = (key: keyof GalleryFiltersState) => {
    setFilters((prev) => ({ ...prev, [key]: null }))
  }

  const clearAllFilters = () => {
    setFilters({
      eventType: null,
      year: null,
      location: null,
      person: null
    })
  }

  const activeFilterCount = Object.values(filters).filter(Boolean).length

  return (
    <div className={cn('space-y-3', className)}>
      {/* Filter Toggle Button */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="border-white/10 text-neutral-300 hover:bg-white/5"
        >
          <Filter className="h-4 w-4 mr-2" />
          Filters
          {activeFilterCount > 0 && (
            <Badge
              variant="secondary"
              className="ml-2 bg-amber-500/20 text-amber-400 border-amber-500/30"
            >
              {activeFilterCount}
            </Badge>
          )}
        </Button>

        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="text-neutral-400 hover:text-white"
          >
            Clear all
          </Button>
        )}
      </div>

      {/* Filter Chips (Active Filters) */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.eventType && (
            <Badge
              variant="secondary"
              className="gap-2 bg-blue-500/20 text-blue-400 border-blue-500/30"
            >
              <Tag className="h-3 w-3" />
              {filters.eventType}
              <button
                onClick={() => clearFilter('eventType')}
                className="hover:bg-blue-500/30 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {filters.year && (
            <Badge
              variant="secondary"
              className="gap-2 bg-green-500/20 text-green-400 border-green-500/30"
            >
              <Calendar className="h-3 w-3" />
              {filters.year}
              <button
                onClick={() => clearFilter('year')}
                className="hover:bg-green-500/30 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {filters.location && (
            <Badge
              variant="secondary"
              className="gap-2 bg-purple-500/20 text-purple-400 border-purple-500/30"
            >
              <MapPin className="h-3 w-3" />
              {filters.location}
              <button
                onClick={() => clearFilter('location')}
                className="hover:bg-purple-500/30 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {filters.person && (
            <Badge
              variant="secondary"
              className="gap-2 bg-pink-500/20 text-pink-400 border-pink-500/30"
            >
              <Users className="h-3 w-3" />
              {filters.person}
              <button
                onClick={() => clearFilter('person')}
                className="hover:bg-pink-500/30 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}

      {/* Filter Dropdowns (Show when expanded) */}
      {showFilters && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-4 bg-neutral-800/30 rounded-lg border border-white/10">
          {/* Event Type */}
          <div>
            <label className="text-xs text-neutral-400 mb-1 block">Event Type</label>
            <Select
              value={filters.eventType || undefined}
              onValueChange={(value) => updateFilter('eventType', value)}
            >
              <SelectTrigger className="bg-neutral-900 border-white/10 text-white">
                <SelectValue placeholder="All events" />
              </SelectTrigger>
              <SelectContent className="bg-neutral-800 border-white/10">
                <SelectItem value="wedding" className="text-white hover:bg-white/5">
                  Wedding
                </SelectItem>
                <SelectItem value="birthday" className="text-white hover:bg-white/5">
                  Birthday
                </SelectItem>
                <SelectItem value="family" className="text-white hover:bg-white/5">
                  Family Session
                </SelectItem>
                <SelectItem value="portrait" className="text-white hover:bg-white/5">
                  Portrait
                </SelectItem>
                <SelectItem value="graduation" className="text-white hover:bg-white/5">
                  Graduation
                </SelectItem>
                <SelectItem value="other" className="text-white hover:bg-white/5">
                  Other
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Year */}
          <div>
            <label className="text-xs text-neutral-400 mb-1 block">Year</label>
            <Select
              value={filters.year?.toString() || undefined}
              onValueChange={(value) => updateFilter('year', parseInt(value))}
            >
              <SelectTrigger className="bg-neutral-900 border-white/10 text-white">
                <SelectValue placeholder="All years" />
              </SelectTrigger>
              <SelectContent className="bg-neutral-800 border-white/10">
                {availableYears.map((year) => (
                  <SelectItem
                    key={year}
                    value={year.toString()}
                    className="text-white hover:bg-white/5"
                  >
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Location */}
          <div>
            <label className="text-xs text-neutral-400 mb-1 block">Location</label>
            <Select
              value={filters.location || undefined}
              onValueChange={(value) => updateFilter('location', value)}
            >
              <SelectTrigger className="bg-neutral-900 border-white/10 text-white">
                <SelectValue placeholder="All locations" />
              </SelectTrigger>
              <SelectContent className="bg-neutral-800 border-white/10">
                {availableLocations.map((location) => (
                  <SelectItem
                    key={location}
                    value={location}
                    className="text-white hover:bg-white/5"
                  >
                    {location}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Person */}
          <div>
            <label className="text-xs text-neutral-400 mb-1 block">Person</label>
            <Select
              value={filters.person || undefined}
              onValueChange={(value) => updateFilter('person', value)}
            >
              <SelectTrigger className="bg-neutral-900 border-white/10 text-white">
                <SelectValue placeholder="All people" />
              </SelectTrigger>
              <SelectContent className="bg-neutral-800 border-white/10">
                {availablePeople.map((person) => (
                  <SelectItem
                    key={person}
                    value={person}
                    className="text-white hover:bg-white/5"
                  >
                    {person}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </div>
  )
}
```

---

## 9. Search & Filter API Endpoint

**File:** `src/app/api/galleries/search/route.ts`

This API handles the actual gallery search with metadata filtering.

```ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const searchParams = request.nextUrl.searchParams

    // Get query params
    const query = searchParams.get('q') || ''
    const eventType = searchParams.get('eventType')
    const year = searchParams.get('year')
    const location = searchParams.get('location')
    const person = searchParams.get('person')

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Build query
    let queryBuilder = supabase
      .from('photo_galleries')
      .select('*')
      .eq('photographer_id', user.id)

    // Apply text search
    if (query) {
      queryBuilder = queryBuilder.or(
        `gallery_name.ilike.%${query}%,notes.ilike.%${query}%,photographer_name.ilike.%${query}%,location.ilike.%${query}%`
      )
    }

    // Apply filters
    if (eventType) {
      queryBuilder = queryBuilder.eq('event_type', eventType)
    }

    if (year) {
      const startDate = `${year}-01-01`
      const endDate = `${year}-12-31`
      queryBuilder = queryBuilder
        .gte('event_date', startDate)
        .lte('event_date', endDate)
    }

    if (location) {
      queryBuilder = queryBuilder.eq('location', location)
    }

    if (person) {
      // Search in people array
      queryBuilder = queryBuilder.contains('people', [person])
    }

    // Order by event date (most recent first)
    queryBuilder = queryBuilder.order('event_date', { ascending: false, nullsFirst: false })

    const { data, error } = await queryBuilder

    if (error) throw error

    return NextResponse.json({ galleries: data || [] })
  } catch (error) {
    console.error('Error searching galleries:', error)
    return NextResponse.json(
      { error: 'Failed to search galleries' },
      { status: 500 }
    )
  }
}
```

**Additional API:** Get filter options (years, locations, people)

**File:** `src/app/api/galleries/filter-options/route.ts`

```ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch all galleries for this photographer to extract unique values
    const { data: galleries, error } = await supabase
      .from('photo_galleries')
      .select('event_date, location, people')
      .eq('photographer_id', user.id)

    if (error) throw error

    // Extract unique years
    const years = new Set<number>()
    galleries?.forEach((g) => {
      if (g.event_date) {
        const year = new Date(g.event_date).getFullYear()
        years.add(year)
      }
    })

    // Extract unique locations
    const locations = new Set<string>()
    galleries?.forEach((g) => {
      if (g.location) locations.add(g.location)
    })

    // Extract unique people
    const people = new Set<string>()
    galleries?.forEach((g) => {
      if (g.people && Array.isArray(g.people)) {
        g.people.forEach((p) => people.add(p))
      }
    })

    return NextResponse.json({
      years: Array.from(years).sort((a, b) => b - a),
      locations: Array.from(locations).sort(),
      people: Array.from(people).sort(),
    })
  } catch (error) {
    console.error('Error fetching filter options:', error)
    return NextResponse.json(
      { error: 'Failed to fetch filter options' },
      { status: 500 }
    )
  }
}
```

---

## 10. Integration with Gallery List Page

**File:** `src/components/GalleryGrid.tsx` (modifications)

Add search and filter integration to the existing GalleryGrid component:

```tsx
// Add these imports
import { GallerySearchBar } from '@/components/GallerySearchBar'
import { GalleryFilters, GalleryFiltersState } from '@/components/GalleryFilters'

// Add state
const [searchQuery, setSearchQuery] = useState('')
const [filters, setFilters] = useState<GalleryFiltersState>({
  eventType: null,
  year: null,
  location: null,
  person: null
})
const [filterOptions, setFilterOptions] = useState({
  years: [],
  locations: [],
  people: []
})

// Fetch filter options on mount
useEffect(() => {
  const fetchFilterOptions = async () => {
    try {
      const response = await fetch('/api/galleries/filter-options')
      if (response.ok) {
        const data = await response.json()
        setFilterOptions(data)
      }
    } catch (error) {
      console.error('Error fetching filter options:', error)
    }
  }

  if (user?.id) {
    fetchFilterOptions()
  }
}, [user?.id])

// Update fetchGalleries to use search API
const fetchGalleries = useCallback(async () => {
  try {
    setLoading(true)

    // Build query params
    const params = new URLSearchParams()
    if (searchQuery) params.set('q', searchQuery)
    if (filters.eventType) params.set('eventType', filters.eventType)
    if (filters.year) params.set('year', filters.year.toString())
    if (filters.location) params.set('location', filters.location)
    if (filters.person) params.set('person', filters.person)

    const response = await fetch(`/api/galleries/search?${params}`)
    if (!response.ok) throw new Error('Failed to fetch galleries')

    const data = await response.json()
    setGalleries(data.galleries || [])
    setLoading(false)
  } catch (error) {
    console.error('Error fetching galleries:', error)
    setGalleries([])
    setLoading(false)
  }
}, [searchQuery, filters])

// Trigger search when query or filters change
useEffect(() => {
  fetchGalleries()
}, [fetchGalleries])
```

**UI Integration (add before existing filters):**

```tsx
{/* Search and Filters - NEW */}
<div className="space-y-4">
  <GallerySearchBar
    onSearch={setSearchQuery}
    placeholder="Search galleries by name, location, people, or notes..."
  />

  <GalleryFilters
    onFiltersChange={setFilters}
    availableYears={filterOptions.years}
    availableLocations={filterOptions.locations}
    availablePeople={filterOptions.people}
  />
</div>
```

---

## 11. Required Shadcn Components to Install

Run these commands to add missing shadcn components:

```bash
# Calendar component (for date picker)
npx shadcn-ui@latest add calendar

# Popover component (for date picker dropdown)
npx shadcn-ui@latest add popover

# Command component (alternative for autocomplete, optional)
npx shadcn-ui@latest add command
```

**Already installed (no action needed):**
- Button
- Input
- Label
- Select
- Textarea
- Badge
- Card
- Dialog

---

## 12. Tailwind Classes Reference

All components use PhotoVault's dark theme design system:

### Backgrounds
- `bg-neutral-900` - Main background
- `bg-neutral-800/50` - Card backgrounds
- `bg-neutral-800/30` - Secondary backgrounds
- `bg-white/5` - Hover states
- `bg-white/10` - Active/focused states

### Borders
- `border-white/10` - Standard borders
- `border-white/20` - Emphasized borders

### Text Colors
- `text-neutral-100` - Primary text
- `text-neutral-300` - Secondary text
- `text-neutral-400` - Muted text
- `text-neutral-500` - Placeholder text

### Accent Colors (Filters & Tags)
- `bg-amber-500/20 text-amber-400 border-amber-500/30` - Primary accent (people tags)
- `bg-blue-500/20 text-blue-400 border-blue-500/30` - Event type
- `bg-green-500/20 text-green-400 border-green-500/30` - Year
- `bg-purple-500/20 text-purple-400 border-purple-500/30` - Location
- `bg-pink-500/20 text-pink-400 border-pink-500/30` - Person

### Rounded Corners
- `rounded-md` - Inputs, dropdowns (6px)
- `rounded-lg` - Cards (8px)
- `rounded-2xl` - Hero cards (16px)

---

## 13. Accessibility Considerations

### Keyboard Navigation
- **People Tag Input:**
  - `Enter` adds tag
  - `Backspace` on empty input removes last tag
  - Focus visible indicators

- **Location Autocomplete:**
  - Arrow keys navigate suggestions
  - `Enter` selects focused suggestion
  - `Escape` closes dropdown

- **Date Picker:**
  - Calendar keyboard navigation built-in (Radix UI)
  - `Space` or `Enter` to select date

- **Search Bar:**
  - Clear button has `aria-label`

- **Filter Chips:**
  - Remove buttons have hover states
  - Focus visible on X buttons

### Screen Readers
- All form inputs have associated `<Label>` elements
- Helper text provides context
- Badge counters announced
- Icon buttons have `aria-label` attributes

### Focus Management
- Focus visible with ring utilities
- Logical tab order
- Autocomplete dropdown closes on outside click
- Popover traps focus

---

## 14. Responsive Design Notes

### Mobile (< 640px)
- Filter dropdowns stack vertically
- Search bar full width
- Filter chips wrap
- Date picker adapts to viewport

### Tablet (640px - 1024px)
- Filters in 2 columns
- Search and filter toggle side-by-side

### Desktop (> 1024px)
- Filters in 4 columns
- All controls visible
- Optimal spacing

**Key Classes:**
- `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` - Responsive grid
- `flex-col sm:flex-row` - Stack on mobile, row on larger screens
- `max-w-7xl` - Constrain width on large screens

---

## 15. Files to Create/Modify

### New Files to Create

| File | Purpose |
|------|---------|
| `database/add-gallery-metadata.sql` | Database migration for new columns |
| `src/components/ui/people-tag-input.tsx` | Multi-select tag input for people |
| `src/components/ui/location-autocomplete.tsx` | Location input with suggestions |
| `src/components/ui/date-picker.tsx` | Date picker wrapper |
| `src/components/ui/calendar.tsx` | Calendar component (shadcn) |
| `src/components/ui/popover.tsx` | Popover component (shadcn) |
| `src/components/GallerySearchBar.tsx` | Search input with debounce |
| `src/components/GalleryFilters.tsx` | Filter UI with chips |
| `src/app/api/galleries/search/route.ts` | Search API endpoint |
| `src/app/api/galleries/filter-options/route.ts` | Get available filter values |
| `src/app/api/galleries/locations/autocomplete/route.ts` | Location autocomplete API |

### Files to Modify

| File | Changes |
|------|---------|
| `src/app/photographer/galleries/create/page.tsx` | Add metadata card with new fields |
| `src/components/GalleryGrid.tsx` | Integrate search bar and filters |
| `package.json` | Add `date-fns` dependency |

---

## 16. Implementation Order

1. **Database First**
   - Run `database/add-gallery-metadata.sql` migration
   - Verify columns exist in Supabase

2. **Install Dependencies**
   ```bash
   npm install date-fns
   npx shadcn-ui@latest add calendar
   npx shadcn-ui@latest add popover
   ```

3. **Build UI Components (Bottom-Up)**
   - Create `DatePicker` component
   - Create `PeopleTagInput` component
   - Create `LocationAutocomplete` component
   - Create `GallerySearchBar` component
   - Create `GalleryFilters` component

4. **Build API Endpoints**
   - `/api/galleries/locations/autocomplete`
   - `/api/galleries/filter-options`
   - `/api/galleries/search`

5. **Integrate into Gallery Creation**
   - Modify `create/page.tsx`
   - Add metadata fields to form state
   - Update form submission to save metadata

6. **Integrate into Gallery List**
   - Modify `GalleryGrid.tsx`
   - Add search bar above filters
   - Add filter chips
   - Connect to search API

7. **Test End-to-End**
   - Create gallery with metadata
   - Search by name, location, people
   - Filter by event type, year
   - Verify autocomplete suggestions

---

## 17. Testing Checklist

### Metadata Entry
- [ ] Date picker opens and selects dates
- [ ] Location autocomplete suggests previous entries
- [ ] People tag input allows adding/removing names
- [ ] Event type dropdown shows all options
- [ ] Photographer name auto-fills from profile
- [ ] Notes textarea allows 1000+ characters
- [ ] All fields save to database on gallery creation
- [ ] Fields are optional (form submits without them)

### Search
- [ ] Search updates as user types (debounced)
- [ ] Search matches gallery name
- [ ] Search matches location
- [ ] Search matches people names
- [ ] Search matches notes content
- [ ] Empty search shows all galleries
- [ ] Clear button removes search query

### Filters
- [ ] Event type filter works
- [ ] Year filter shows available years
- [ ] Location filter shows available locations
- [ ] Person filter shows all people from galleries
- [ ] Multiple filters combine (AND logic)
- [ ] Filter chips display active filters
- [ ] Removing chip updates results
- [ ] Clear all button resets filters

### Responsive
- [ ] Works on mobile (< 640px)
- [ ] Works on tablet (640px - 1024px)
- [ ] Works on desktop (> 1024px)
- [ ] Touch targets are 44px minimum
- [ ] No horizontal scrolling

### Accessibility
- [ ] All inputs have labels
- [ ] Keyboard navigation works
- [ ] Focus visible on all interactive elements
- [ ] Screen reader announces changes
- [ ] Color contrast meets WCAG AA

---

## 18. Future Enhancements (Out of Scope)

These are potential improvements for later iterations:

1. **Advanced Search Operators**
   - Boolean operators (AND, OR, NOT)
   - Exact phrase matching
   - Date range filters

2. **Saved Searches**
   - Save frequently used search/filter combos
   - Quick access to saved searches

3. **Bulk Tagging**
   - Select multiple galleries
   - Add metadata to all at once

4. **AI-Powered Suggestions**
   - Auto-suggest event type from gallery name
   - Extract location from EXIF data
   - Detect faces and suggest names

5. **Smart Collections**
   - Auto-create collections based on metadata
   - "All Summer 2024 Weddings"
   - "All galleries with John"

---

## 19. Summary

This implementation provides a complete metadata entry and search system for PhotoVault galleries. Photographers can add rich metadata during gallery creation, and both photographers and clients can quickly find galleries using natural language search and filters.

**Key Benefits:**
- **Better Organization:** Structured metadata makes galleries easier to manage
- **Faster Discovery:** Search by name, location, people, or event type
- **Improved UX:** Autocomplete and tag inputs reduce typing
- **Future-Proof:** Extensible for AI features and smart collections

**User Story Solved:** "Where is that picture with Mike? I think it was summer time at the park."
- Search: "Mike park"
- OR Filter: Person = Mike, Location = park
- OR Filter: Event Date = Summer months

The system returns all matching galleries instantly.

---

**Next Steps:** Run database migration, install dependencies, create components in order listed in Section 16.
