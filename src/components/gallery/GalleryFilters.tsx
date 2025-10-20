'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Grid3X3, List, Filter } from 'lucide-react'
import { Client } from '@/types/gallery'
import { 
  GALLERY_SORT_OPTIONS, 
  GALLERY_FILTER_OPTIONS, 
  VIEW_MODE_OPTIONS 
} from '@/lib/component-constants'

interface GalleryFiltersProps {
  sortBy: string
  setSortBy: (sort: 'date' | 'photographer' | 'platform' | 'name') => void
  filterBy: string
  setFilterBy: (filter: string) => void
  clientFilter: string
  setClientFilter: (client: string) => void
  searchTerm: string
  setSearchTerm: (term: string) => void
  viewMode: 'grid' | 'list'
  setViewMode: (mode: 'grid' | 'list') => void
  clients: Client[]
  isPhotographer: boolean
}

export function GalleryFilters({
  sortBy,
  setSortBy,
  filterBy,
  setFilterBy,
  clientFilter,
  setClientFilter,
  searchTerm,
  setSearchTerm,
  viewMode,
  setViewMode,
  clients,
  isPhotographer
}: GalleryFiltersProps) {
  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex items-center space-x-2">
        <Input
          placeholder="Search galleries..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
        <Filter className="h-4 w-4 text-gray-400" />
      </div>

      {/* Filters Row */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Sort By */}
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700">Sort by:</label>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={GALLERY_SORT_OPTIONS.DATE}>Date</SelectItem>
              <SelectItem value={GALLERY_SORT_OPTIONS.PHOTOGRAPHER}>Photographer</SelectItem>
              <SelectItem value={GALLERY_SORT_OPTIONS.PLATFORM}>Platform</SelectItem>
              <SelectItem value={GALLERY_SORT_OPTIONS.NAME}>Name</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Platform Filter */}
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700">Platform:</label>
          <Select value={filterBy} onValueChange={setFilterBy}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={GALLERY_FILTER_OPTIONS.ALL}>All</SelectItem>
              <SelectItem value={GALLERY_FILTER_OPTIONS.PIXIESET}>Pixieset</SelectItem>
              <SelectItem value={GALLERY_FILTER_OPTIONS.SHOOTPROOF}>ShootProof</SelectItem>
              <SelectItem value={GALLERY_FILTER_OPTIONS.SMUGMUG}>SmugMug</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Client Filter (for photographers) */}
        {isPhotographer && (
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Client:</label>
            <Select value={clientFilter} onValueChange={setClientFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Clients</SelectItem>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* View Mode Toggle */}
        <div className="flex items-center space-x-1 ml-auto">
          <Button
            variant={viewMode === VIEW_MODE_OPTIONS.GRID ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode(VIEW_MODE_OPTIONS.GRID)}
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === VIEW_MODE_OPTIONS.LIST ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode(VIEW_MODE_OPTIONS.LIST)}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
