'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { LocationSearch } from './LocationSearch'
import { LocationGrid } from './LocationGrid'
import { ChevronDown, ChevronUp, X, Filter } from 'lucide-react'
import type { LocationWithDetails } from '@/types/directory'

interface LocationFiltersProps {
  locations: LocationWithDetails[]
  city: string
}

export function LocationFiltersAndGrid({ locations, city }: LocationFiltersProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [permitFilter, setPermitFilter] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)

  // Extract unique permit statuses from locations
  const permitStatuses = useMemo(() => {
    const statuses = new Set<string>()
    locations.forEach((loc) => {
      const status = loc.location_business_intelligence?.permit_status
      if (status) statuses.add(status)
    })
    return Array.from(statuses)
  }, [locations])

  // Filter locations
  const filteredLocations = useMemo(() => {
    return locations.filter((location) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesSearch =
          location.name.toLowerCase().includes(query) ||
          location.description?.toLowerCase().includes(query) ||
          location.location_attributes?.some((attr) =>
            attr.value.toLowerCase().includes(query)
          )
        if (!matchesSearch) return false
      }

      // Permit filter
      if (permitFilter.length > 0) {
        const status = location.location_business_intelligence?.permit_status
        if (!status || !permitFilter.includes(status)) return false
      }

      return true
    })
  }, [locations, searchQuery, permitFilter])

  const togglePermitFilter = (status: string) => {
    setPermitFilter((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status]
    )
  }

  const clearFilters = () => {
    setSearchQuery('')
    setPermitFilter([])
  }

  const hasActiveFilters = searchQuery || permitFilter.length > 0

  return (
    <div>
      {/* Search and Filter Controls */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="flex-1">
          <LocationSearch
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder={`Search ${city} locations...`}
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="default"
            onClick={() => setShowFilters(!showFilters)}
            className="border-border text-foreground hover:bg-card"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
            {permitFilter.length > 0 && (
              <span className="ml-2 bg-amber-500 text-black text-xs px-2 py-0.5 rounded-full">
                {permitFilter.length}
              </span>
            )}
            {showFilters ? (
              <ChevronUp className="w-4 h-4 ml-2" />
            ) : (
              <ChevronDown className="w-4 h-4 ml-2" />
            )}
          </Button>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="default"
              onClick={clearFilters}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-card/50 border border-border rounded-lg p-6 mb-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Permit Status Filter */}
            <div>
              <h3 className="text-foreground font-medium mb-3">Permit Status</h3>
              <div className="space-y-2">
                {permitStatuses.map((status) => (
                  <div key={status} className="flex items-center space-x-2">
                    <Checkbox
                      id={`permit-${status}`}
                      checked={permitFilter.includes(status)}
                      onCheckedChange={() => togglePermitFilter(status)}
                      className="border-border data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500"
                    />
                    <Label
                      htmlFor={`permit-${status}`}
                      className="text-foreground text-sm cursor-pointer"
                    >
                      {status === 'Yes' ? 'Permit Free' : status === 'No' ? 'Permit Required' : 'Permit Varies'}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results count */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-muted-foreground text-sm">
          Showing {filteredLocations.length} of {locations.length} locations
        </p>
      </div>

      {/* Location Grid */}
      <LocationGrid
        locations={filteredLocations}
        emptyMessage={hasActiveFilters ? 'No locations match your filters' : 'No locations found'}
      />
    </div>
  )
}
