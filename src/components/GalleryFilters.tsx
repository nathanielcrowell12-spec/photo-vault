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

  useEffect(() => {
    onFiltersChange(filters)
  }, [filters, onFiltersChange])

  const updateFilter = (key: keyof GalleryFiltersState, value: string | number | null) => {
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

      {showFilters && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-4 bg-neutral-800/30 rounded-lg border border-white/10">
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
