'use client'

import React, { useState } from 'react'
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

  // Call parent callback directly when user changes a filter - no useEffect needed
  // This prevents the infinite loop caused by object reference changes in useEffect
  const updateFilter = (key: keyof GalleryFiltersState, value: string | number | null) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const clearFilter = (key: keyof GalleryFiltersState) => {
    const newFilters = { ...filters, [key]: null }
    setFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const clearAllFilters = () => {
    const newFilters = {
      eventType: null,
      year: null,
      location: null,
      person: null
    }
    setFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const activeFilterCount = Object.values(filters).filter(Boolean).length

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="border-border text-muted-foreground hover:bg-accent/50"
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
            className="text-muted-foreground hover:text-foreground"
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-4 bg-card/30 rounded-lg border border-border">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Event Type</label>
            <Select
              value={filters.eventType || undefined}
              onValueChange={(value) => updateFilter('eventType', value)}
            >
              <SelectTrigger className="bg-background border-border text-foreground">
                <SelectValue placeholder="All events" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="wedding" className="text-foreground hover:bg-accent/50">
                  Wedding
                </SelectItem>
                <SelectItem value="birthday" className="text-foreground hover:bg-accent/50">
                  Birthday
                </SelectItem>
                <SelectItem value="family" className="text-foreground hover:bg-accent/50">
                  Family Session
                </SelectItem>
                <SelectItem value="portrait" className="text-foreground hover:bg-accent/50">
                  Portrait
                </SelectItem>
                <SelectItem value="graduation" className="text-foreground hover:bg-accent/50">
                  Graduation
                </SelectItem>
                <SelectItem value="other" className="text-foreground hover:bg-accent/50">
                  Other
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Year</label>
            <Select
              value={filters.year?.toString() || undefined}
              onValueChange={(value) => updateFilter('year', parseInt(value))}
            >
              <SelectTrigger className="bg-background border-border text-foreground">
                <SelectValue placeholder="All years" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {availableYears.map((year) => (
                  <SelectItem
                    key={year}
                    value={year.toString()}
                    className="text-foreground hover:bg-accent/50"
                  >
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Location</label>
            <Select
              value={filters.location || undefined}
              onValueChange={(value) => updateFilter('location', value)}
            >
              <SelectTrigger className="bg-background border-border text-foreground">
                <SelectValue placeholder="All locations" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {availableLocations.map((location) => (
                  <SelectItem
                    key={location}
                    value={location}
                    className="text-foreground hover:bg-accent/50"
                  >
                    {location}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Person</label>
            <Select
              value={filters.person || undefined}
              onValueChange={(value) => updateFilter('person', value)}
            >
              <SelectTrigger className="bg-background border-border text-foreground">
                <SelectValue placeholder="All people" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {availablePeople.map((person) => (
                  <SelectItem
                    key={person}
                    value={person}
                    className="text-foreground hover:bg-accent/50"
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
